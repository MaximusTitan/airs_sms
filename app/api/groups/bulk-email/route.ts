import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY);

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

const bulkEmailSchema = z.object({
  groupIds: z.array(z.string()).min(1, "At least one group is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groupIds, subject, content } = bulkEmailSchema.parse(body);

    // Get all leads from the selected groups
    const { data: memberships, error: membershipError } = await supabase
      .from("group_memberships")
      .select(`
        leads (
          id,
          name,
          email
        ),
        lead_groups!inner (
          id,
          user_id
        )
      `)
      .in("group_id", groupIds)
      .eq("lead_groups.user_id", user.id);

    if (membershipError) {
      console.error("Error fetching group memberships:", membershipError);
      return NextResponse.json(
        { error: "Failed to fetch group members" },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        { error: "No leads found in selected groups" },
        { status: 400 }
      );
    }    // Extract unique email addresses
    const recipients = Array.from(
      new Set(
        memberships
          .filter((m) => m.leads && typeof m.leads === 'object' && 'email' in m.leads)
          .map((m) => (m.leads as unknown as { email: string }).email)
          .filter((email): email is string => Boolean(email))
      )
    );

    // Validate and filter emails
    const validEmails = recipients
      .filter(email => email && typeof email === 'string' && email.includes('@'))
      .map(email => email.trim())
      .filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      });

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses found" },
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
          tags: [
            {
              name: 'category',
              value: 'bulk-email'
            }
          ]
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

    // Store email record in database
    const emailStatus = failedSends === 0 ? 'sent' : (successfulSends === 0 ? 'failed' : 'partially_sent');
    const { data: emailRecord, error: emailError } = await supabase
      .from("emails")
      .insert({
        subject,
        content,
        recipient_emails: validEmails,
        lead_ids: memberships
          .filter((m) => m.leads && typeof m.leads === 'object' && 'id' in m.leads)
          .map((m) => (m.leads as unknown as { id: string }).id)
          .filter(Boolean),
        status: emailStatus,
        sent_at: successfulSends > 0 ? new Date().toISOString() : null,
        user_id: user.id,
        resend_id: sendResults.length > 0 ? sendResults[0]?.id : null,
      })
      .select()
      .single();

    if (emailError) {
      console.error("Error storing email record:", emailError);
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
        emailId: emailRecord?.id,
        successfulSends,
        failedSends,
        totalRecipients: validEmails.length
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${successfulSends} recipients`,
        emailId: emailRecord?.id,
        successfulSends,
        totalRecipients: validEmails.length,
        batches: sendResults.length
      });
    }
  } catch (error) {
    console.error("Error in bulk email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
