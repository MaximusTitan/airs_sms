import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { recordEmailEvent, trackEmailMetrics } from '@/lib/webhook-utils';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Type definitions for email send results
interface EmailSendResult {
  id?: string;
  [key: string]: unknown;
}

// Helper function to chunk array into smaller arrays
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Helper function to create delay for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Resend API rate limits
const RESEND_RATE_LIMITS = {
  REQUESTS_PER_SECOND: 2,             // 2 requests per second per account
  RECIPIENTS_PER_EMAIL: 50,           // Maximum recipients per email
  SAFE_DELAY_MS: 500,                 // 500ms between requests (2 req/sec)
  PERSONALIZED_BATCH_SIZE: 10,        // Batch size for personalized emails
  PERSONALIZED_DELAY_MS: 1500,        // Conservative delay for personalized emails
};

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { subject, content, recipientEmails, leadIds, templateId } = requestData;
    // Make personalized mutable so we can update it if we detect personalization placeholders
    let personalized = requestData.personalized || false;
    
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user email for personalized emails
    const userEmail = user.email;

    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Validate and format recipient emails
    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipient emails provided' },
        { status: 400 }
      );
    }
    
    // Filter out invalid emails and ensure proper format
    const validEmails = recipientEmails
      .filter((email: unknown) => email && typeof email === 'string' && email.includes('@'))
      .map((email: string) => email.trim())
      .filter((email: string) => {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      });

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses found' },
        { status: 400 }
      );
    }
    
    // If personalized is true, fetch lead data for personalization
    let leadData: { email: string; name: string; id: string }[] = [];
    if (personalized && leadIds && leadIds.length > 0) {
      const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, name, email')
        .in('id', leadIds);
      
      if (leadError) {
        console.error('Error fetching lead data:', leadError);
      } else if (leads) {
        leadData = leads;
      }
    }    // Handle email sending with proper batching and rate limiting
    const fromEmail = process.env.FROM_EMAIL || 'AIRS@aireadyschool.com';
    let successfulSends = 0;
    let failedSends = 0;
    let apiRequestsMade = 0;
    const sendResults: EmailSendResult[] = [];
    
    // Helper function for personalizing content
    function personalizeContent(baseContent: string, leadName: string): string {
      return baseContent
        .replace(/{{name}}/gi, leadName)
        .replace(/{{recipient_name}}/gi, leadName)
        .replace(/{{lead_name}}/gi, leadName);
    }
    
    // Helper function for personalizing subject
    function personalizeSubject(baseSubject: string, leadName: string): string {
      return baseSubject
        .replace(/{{name}}/gi, leadName)
        .replace(/{{recipient_name}}/gi, leadName)
        .replace(/{{lead_name}}/gi, leadName);
    }
    
    // Helper function to send individual emails without personalization
    // (used when personalization tags are detected but we don't have matching lead data)
    async function sendIndividualEmails() {
      if (!resend) {
        throw new Error('Email service not configured');
      }
      
      // Use a more conservative batch size for individual emails
      const MAX_BATCH_SIZE = RESEND_RATE_LIMITS.PERSONALIZED_BATCH_SIZE;
      const RATE_LIMIT_DELAY = RESEND_RATE_LIMITS.PERSONALIZED_DELAY_MS;
      
      // Split emails into manageable batches
      const emailBatches = chunkArray(validEmails, MAX_BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < emailBatches.length; batchIndex++) {
        const batch = emailBatches[batchIndex];
        const batchEmails = [];
        
        // Create individual email for each recipient
        for (const email of batch) {
          batchEmails.push({
            from: fromEmail,
            to: email,
            replyTo: userEmail || fromEmail,
            subject,
            html: content,
            headers: {
              'X-Idempotency-Key': `${uuidv4()}-${email}`,
            },
          });
        }
        
        if (batchEmails.length > 0) {
          try {
            // Use batch endpoint for the emails
            const { data, error } = await resend.batch.send(batchEmails);
            
            // Count this as an API request
            apiRequestsMade++;
              
            if (error) {
              console.error(`Individual emails batch ${batchIndex + 1} failed:`, error);
              failedSends += batchEmails.length;
            } else {
              if (Array.isArray(data)) {
                sendResults.push(...(data as unknown as EmailSendResult[]));
              } else if (data) {
                sendResults.push(data as unknown as EmailSendResult);
              }
              successfulSends += batchEmails.length;
            }
          } catch (batchError) {
            console.error(`Individual emails batch ${batchIndex + 1} error:`, batchError);
            failedSends += batchEmails.length;
          }
        }
        
        // Apply rate limiting between batches
        if (batchIndex < emailBatches.length - 1) {
          await delay(RATE_LIMIT_DELAY);
        }
      }
    }
    
    try {
      // Email sending strategy:
      // 1. If personalization mode is explicitly enabled, send personalized emails to leads
      // 2. If personalization markers ({{name}}) are detected in content, attempt personalization
      // 3. Otherwise, use efficient BCC approach for bulk emails
      
      // Handle personalized emails differently than bulk emails
      if (personalized && leadData.length > 0) {
        // For personalized emails:
        // - Each email is sent individually to the lead with their personalized content
        // - The reply-to address is set to the user's email so responses come back to them
        // - Emails are truly personalized with recipient's name in the content
        // - Rate limiting is stricter to respect Resend's limits
        
        // Using a more conservative approach for personalized emails
        // to ensure we stay well under Resend's rate limits of 2 requests/sec
        const MAX_BATCH_SIZE = RESEND_RATE_LIMITS.PERSONALIZED_BATCH_SIZE;
        const RATE_LIMIT_DELAY = RESEND_RATE_LIMITS.PERSONALIZED_DELAY_MS;
        
        // Create personalized email batches
        const personalizedLeads = leadData.filter(lead => 
          validEmails.includes(lead.email));
        
        if (personalizedLeads.length === 0) {
          return NextResponse.json(
            { error: 'No valid recipient data found for personalization' },
            { status: 400 }
          );
        }
        
        // Split into manageable batches
        const leadBatches = chunkArray(personalizedLeads, MAX_BATCH_SIZE);
        
        for (let batchIndex = 0; batchIndex < leadBatches.length; batchIndex++) {
          const batch = leadBatches[batchIndex];
          const batchEmails = [];
          
          // Create personalized email for each lead
          for (const lead of batch) {
            try {
              const personalizedSubject = personalizeSubject(subject, lead.name);
              const personalizedHtml = personalizeContent(content, lead.name);
              
              batchEmails.push({
                from: fromEmail,
                to: lead.email,  // Send directly to lead for truly personalized emails
                replyTo: userEmail || fromEmail, // Set reply-to as the user's email
                subject: personalizedSubject,
                html: personalizedHtml,
                headers: {
                  'X-Idempotency-Key': `${uuidv4()}-${lead.id}`,
                },
              });
            } catch (personalizationError) {
              console.error(`Personalization error for lead ${lead.id}:`, personalizationError);
            }
          }
          
          if (batchEmails.length > 0) {
            try {
              // Use batch endpoint for personalized emails
              const { data, error } = await resend.batch.send(batchEmails);
              
              // Count this as an API request
              apiRequestsMade++;
                
              if (error) {
                console.error(`Personalized batch ${batchIndex + 1} failed:`, error);
                failedSends += batchEmails.length;
              } else {
                if (Array.isArray(data)) {
                  sendResults.push(...(data as unknown as EmailSendResult[]));
                } else if (data) {
                  sendResults.push(data as unknown as EmailSendResult);
                }
                successfulSends += batchEmails.length;
              }
            } catch (batchError) {
              console.error(`Personalized batch ${batchIndex + 1} error:`, batchError);
              failedSends += batchEmails.length;
            }
          }
          
          // Apply rate limiting between batches
          if (batchIndex < leadBatches.length - 1) {
            await delay(RATE_LIMIT_DELAY);
          }
        }
      } else {
        // When not using explicit personalization mode, we still need to decide:
        // 1. If content contains personalization placeholders like {{name}}, use individual emails
        // 2. Otherwise, use efficient BCC approach for bulk sending
        
        // Check if content contains personalization placeholders
        const hasPersonalizationPlaceholders = subject.includes("{{") || content.includes("{{");
        
        if (hasPersonalizationPlaceholders) {
          // If personalization placeholders are detected, we need to send individual emails
          console.log("Personalization placeholders detected in content. Switching to individual emails mode.");
          
          // Use the same approach as explicit personalization, but we need lead data
          if (leadData.length === 0 && leadIds && leadIds.length > 0) {
            // Try to fetch lead data if we haven't already
            const { data: leads, error: leadError } = await supabase
              .from('leads')
              .select('id, name, email')
              .in('id', leadIds);
            
            if (leadError) {
              console.error('Error fetching lead data:', leadError);
            } else if (leads) {
              leadData = leads;
            }
          }
          
          // If we have lead data, use it for personalization
          if (leadData.length > 0) {
            const personalizedLeads = leadData.filter(lead => 
              validEmails.includes(lead.email));
              
            if (personalizedLeads.length > 0) {
              // Split into manageable batches
              const MAX_BATCH_SIZE = RESEND_RATE_LIMITS.PERSONALIZED_BATCH_SIZE;
              const RATE_LIMIT_DELAY = RESEND_RATE_LIMITS.PERSONALIZED_DELAY_MS;
              const leadBatches = chunkArray(personalizedLeads, MAX_BATCH_SIZE);
              
              for (let batchIndex = 0; batchIndex < leadBatches.length; batchIndex++) {
                const batch = leadBatches[batchIndex];
                const batchEmails = [];
                
                // Create personalized email for each lead
                for (const lead of batch) {
                  try {
                    const personalizedSubject = personalizeSubject(subject, lead.name);
                    const personalizedHtml = personalizeContent(content, lead.name);
                    
                    batchEmails.push({
                      from: fromEmail,
                      to: lead.email,
                      replyTo: userEmail || fromEmail,
                      subject: personalizedSubject,
                      html: personalizedHtml,
                      headers: {
                        'X-Idempotency-Key': `${uuidv4()}-${lead.id}`,
                      },
                    });
                  } catch (personalizationError) {
                    console.error(`Personalization error for lead ${lead.id}:`, personalizationError);
                  }
                }
                
                if (batchEmails.length > 0) {
                  try {
                    // Use batch endpoint for personalized emails
                    const { data, error } = await resend.batch.send(batchEmails);
                    
                    // Count this as an API request
                    apiRequestsMade++;
                      
                    if (error) {
                      console.error(`Implicit personalized batch ${batchIndex + 1} failed:`, error);
                      failedSends += batchEmails.length;
                    } else {
                      if (Array.isArray(data)) {
                        sendResults.push(...(data as unknown as EmailSendResult[]));
                      } else if (data) {
                        sendResults.push(data as unknown as EmailSendResult);
                      }
                      successfulSends += batchEmails.length;
                    }
                  } catch (batchError) {
                    console.error(`Implicit personalized batch ${batchIndex + 1} error:`, batchError);
                    failedSends += batchEmails.length;
                  }
                }
                
                // Apply rate limiting between batches
                if (batchIndex < leadBatches.length - 1) {
                  await delay(RATE_LIMIT_DELAY);
                }
              }
              
              // Mark as personalized since we used personalization
              personalized = true;
            } else {
              console.log("No matching lead data found for emails. Falling back to individual emails without personalization.");
              await sendIndividualEmails();
            }
          } else {
            console.log("No lead data available for personalization. Falling back to individual emails without personalization.");
            await sendIndividualEmails();
          }
        } else {
          // No personalization needed, use efficient BCC approach
          if (validEmails.length <= RESEND_RATE_LIMITS.RECIPIENTS_PER_EMAIL) {
            // Single email with BCC to hide recipients from each other (within Resend's limit of recipients per email)
            const idempotencyKey = uuidv4();
            const { data, error } = await resend.emails.send({
              from: fromEmail,
              to: userEmail || fromEmail, // Send to user's email
              replyTo: userEmail || fromEmail,
              bcc: validEmails, // BCC all recipients to hide them from each other
              subject,
              html: content,
              headers: {
                'X-Idempotency-Key': idempotencyKey,
              },
            });
            
            // Count this as an API request
            apiRequestsMade++;
              
            if (error) {
              throw error;
            }
            
            if (data) {
              sendResults.push(data as EmailSendResult);
            }
            successfulSends = validEmails.length;
          } else {
            // Use batch endpoint for large recipient lists
            // Split into chunks based on Resend's limit of recipients per email
            const emailChunks = chunkArray(validEmails, RESEND_RATE_LIMITS.RECIPIENTS_PER_EMAIL);
            
            // Further group into batches of up to 100 emails per API request
            const batchSize = Math.min(100, emailChunks.length);
            const batches = chunkArray(emailChunks, batchSize);
            
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
              const batch = batches[batchIndex];
                // Prepare batch emails with BCC to hide recipients
              const batchEmails = batch.map((chunk, chunkIndex) => ({
                from: fromEmail,
                to: userEmail || fromEmail, // Send to user's email
                replyTo: userEmail || fromEmail,
                bcc: chunk, // BCC all recipients in this chunk
                subject,
                html: content,
                headers: {
                  'X-Idempotency-Key': `${uuidv4()}-${batchIndex}-${chunkIndex}`,
                },
              }));
              
              try {
                // Use batch endpoint
                const { data, error } = await resend.batch.send(batchEmails);
                
                // Count this as an API request
                apiRequestsMade++;
                  
                if (error) {
                  console.error(`Batch ${batchIndex + 1} failed:`, error);
                  failedSends += batch.reduce((acc, chunk) => acc + chunk.length, 0);
                } else {
                  if (Array.isArray(data)) {
                    sendResults.push(...(data as unknown as EmailSendResult[]));
                  } else if (data) {
                    sendResults.push(data as unknown as EmailSendResult);
                  }
                  successfulSends += batch.reduce((acc, chunk) => acc + chunk.length, 0);
                }
              } catch (batchError) {
                console.error(`Batch ${batchIndex + 1} error:`, batchError);
                failedSends += batch.reduce((acc, chunk) => acc + chunk.length, 0);
              }
              
              // Rate limiting: Wait between batches to respect Resend's limit of 2 requests/second
              if (batchIndex < batches.length - 1) {
                await delay(RESEND_RATE_LIMITS.SAFE_DELAY_MS);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Email sending error:', error);
      failedSends = validEmails.length;
    }
    
    // Log rate limit usage information
    console.log(`Email sending complete. API requests made: ${apiRequestsMade}. Rate limit: ${RESEND_RATE_LIMITS.REQUESTS_PER_SECOND}/sec.`);

    // Save email record to database
    const emailStatus = failedSends === 0 ? 'sent' : (successfulSends === 0 ? 'failed' : 'partially_sent');
    const { error: dbError } = await supabase
      .from('emails')
      .insert([
        {
          subject,
          content,
          template_id: templateId,
          sent_at: successfulSends > 0 ? new Date().toISOString() : null,
          status: emailStatus,
          recipient_emails: validEmails,
          lead_ids: leadIds,
          user_id: user.id,
          resend_id: sendResults.length > 0 ? sendResults[0]?.id : null,
          personalized: personalized,
        },
      ]);

    if (dbError) {
      console.error('Database error:', dbError);
    } else {
      // Manually record email events for analytics (fallback for webhook events)
      const currentTime = new Date().toISOString();
      
      try {
        // Record events for successful sends
        for (const result of sendResults) {
          if (result.id) {
            // Record "sent" event
            await recordEmailEvent({
              email_id: result.id,
              event_type: 'sent',
              created_at: currentTime,
              data: {
                email_id: result.id,
                to: validEmails,
                subject: subject,
                created_at: currentTime
              }
            });
            
            // Track metrics
            await trackEmailMetrics('sent');
          }
        }
        
        console.log(`Recorded ${sendResults.length} email events for analytics`);
      } catch (eventError) {
        console.error('Error recording email events:', eventError);
        // Don't fail the email send if event recording fails
      }
    }

    // Return appropriate response
    if (successfulSends === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to send emails',
          details: `${failedSends} emails failed to send`
        },
        { status: 500 }
      );
    } else if (failedSends > 0) {
      return NextResponse.json({ 
        success: true,
        warning: true,
        message: `Partially sent: ${successfulSends} succeeded, ${failedSends} failed`,
        successfulSends,
        failedSends,
        totalRecipients: validEmails.length,
        apiRequestsMade,
        personalized: personalized
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: `${personalized ? 'Personalized email' : 'Email'} sent successfully to ${successfulSends} recipient${successfulSends !== 1 ? 's' : ''}`,
        successfulSends,
        totalRecipients: validEmails.length,
        batches: sendResults.length,
        apiRequestsMade,
        personalized: personalized
      });
    }  } catch (error) {
    console.error('Email sending error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
