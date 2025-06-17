import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

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

export async function POST(request: NextRequest) {
  try {
    const { subject, content, recipientEmails, leadIds, templateId } = await request.json();
    
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    }    // Filter out invalid emails and ensure proper format
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
    }    // Handle email sending with proper batching and rate limiting
    const fromEmail = process.env.FROM_EMAIL || 'AIRS@aireadyschool.com';
    let successfulSends = 0;
    let failedSends = 0;
    const sendResults: EmailSendResult[] = [];
    
    try {      if (validEmails.length <= 50) {
        // Single email with BCC to hide recipients from each other
        const idempotencyKey = uuidv4();
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: fromEmail, // Send to self
          bcc: validEmails, // BCC all recipients to hide them from each other
          subject,
          html: content,
          headers: {
            'X-Idempotency-Key': idempotencyKey,
          },
        });
          if (error) {
          throw error;
        }
        
        if (data) {
          sendResults.push(data as EmailSendResult);
        }
        successfulSends = validEmails.length;
      } else {
        // Use batch endpoint for large recipient lists
        // Split into chunks of 50 recipients per email (Resend's limit per email)
        const emailChunks = chunkArray(validEmails, 50);
        
        // Further group into batches of up to 100 emails per API request
        const batchSize = Math.min(100, emailChunks.length);
        const batches = chunkArray(emailChunks, batchSize);
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
            // Prepare batch emails with BCC to hide recipients
          const batchEmails = batch.map((chunk, chunkIndex) => ({
            from: fromEmail,
            to: fromEmail, // Send to self
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
              if (error) {
              console.error(`Batch ${batchIndex + 1} failed:`, error);
              failedSends += batch.reduce((acc, chunk) => acc + chunk.length, 0);            } else {
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
          
          // Rate limiting: Wait 500ms between batches to stay under 2 requests/second
          if (batchIndex < batches.length - 1) {
            await delay(500);
          }
        }
      }
    } catch (error) {
      console.error('Email sending error:', error);
      failedSends = validEmails.length;
    }

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
        },
      ]);

    if (dbError) {
      console.error('Database error:', dbError);
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
        totalRecipients: validEmails.length
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: `Email sent successfully to ${successfulSends} recipient${successfulSends !== 1 ? 's' : ''}`,
        successfulSends,
        totalRecipients: validEmails.length,
        batches: sendResults.length
      });
    }  } catch (error) {
    console.error('Email sending error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
