import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import {
  updateEmailStatus,
  recordEmailEvent,
  updateLeadEngagement,
  markEmailAsInvalid,
  unsubscribeUser,
  trackEmailMetrics,
  checkBounceRateThreshold,
  checkComplaintRateThreshold
} from '@/lib/webhook-utils';

// Type definitions for webhook payloads
type WebhookPayload = {
  type: string;
  data: Record<string, unknown>;
  created_at: string;
};

// Specific event data types for better type safety
type EmailEventData = {
  email_id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  // Additional fields may vary by event type
  bounce_type?: 'hard' | 'soft';
  complaint_type?: string;
  click_url?: string;
  user_agent?: string;
  ip_address?: string;
  tags?: string[];
};

/**
 * Central webhook event handler
 * Switches over all Resend event types and delegates to specific handlers
 */
async function handleWebhookEvent(payload: WebhookPayload): Promise<void> {
  const { type, data, created_at } = payload;
  
  console.log(`Processing webhook event: ${type} at ${created_at}`);
  
  switch (type) {
    // Email delivery events
    case 'email.sent':
      await handleEmailSent(data as EmailEventData);
      break;
    case 'email.delivered':
      await handleEmailDelivered(data as EmailEventData);
      break;
    case 'email.delivery_delayed':
      await handleEmailDeliveryDelayed(data as EmailEventData);
      break;
    case 'email.failed':
      await handleEmailFailed(data as EmailEventData);
      break;
    
    // Email engagement events
    case 'email.opened':
      await handleEmailOpened(data as EmailEventData);
      break;
    case 'email.clicked':
      await handleEmailClicked(data as EmailEventData);
      break;
    
    // Email reputation events
    case 'email.bounced':
      await handleEmailBounced(data as EmailEventData);
      break;
    case 'email.complained':
      await handleEmailComplained(data as EmailEventData);
      break;
    case 'email.unsubscribed':
      await handleEmailUnsubscribed(data as EmailEventData);
      break;
    
    default:
      console.warn(`Unhandled webhook event type: ${type}`);
      // TODO: Add monitoring/alerting for unknown event types
      break;
  }
}

/**
 * Handle email.sent event
 * Triggered when an email is successfully sent from Resend
 */
async function handleEmailSent(data: EmailEventData): Promise<void> {
  console.log(`Email sent: ${data.email_id} to ${data.to.join(', ')}`);
  
  try {
    // Update database with sent status
    await updateEmailStatus(data.email_id, {
      status: 'sent',
      sent_at: data.created_at
    });
    
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'sent',
      created_at: data.created_at,
      data: data
    });
    
    // Track metrics
    await trackEmailMetrics('sent');
    
  } catch (error) {
    console.error('Error handling email.sent event:', error);
    // Don't re-throw as we want to acknowledge the webhook
  }
  
  // TODO: Send real-time notifications to admin dashboard
  // await notifyDashboard('email_sent', data);
}

/**
 * Handle email.delivered event
 * Triggered when an email is successfully delivered to the recipient's mailbox
 */
async function handleEmailDelivered(data: EmailEventData): Promise<void> {
  console.log(`Email delivered: ${data.email_id} to ${data.to.join(', ')}`);
  
  try {
    // Update database with delivered status
    await updateEmailStatus(data.email_id, {
      status: 'delivered',
      delivered_at: new Date().toISOString()
    });
    
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'delivered',
      created_at: data.created_at,
      data: data
    });
    
    // Track metrics
    await trackEmailMetrics('delivered');
    
  } catch (error) {
    console.error('Error handling email.delivered event:', error);
  }
  
  // TODO: Trigger follow-up sequences if applicable
  // await triggerFollowUpSequence(data.email_id);
}

/**
 * Handle email.delivery_delayed event
 * Triggered when email delivery is delayed by the receiving server
 */
async function handleEmailDeliveryDelayed(data: EmailEventData): Promise<void> {
  console.log(`Email delivery delayed: ${data.email_id} to ${data.to.join(', ')}`);
  
  // TODO: Update database with delayed status
  // const supabase = await createClient();
  // await supabase
  //   .from('emails')
  //   .update({ 
  //     status: 'delayed',
  //     last_attempt_at: new Date().toISOString()
  //   })
  //   .eq('resend_id', data.email_id);
  
  // TODO: Set up retry monitoring
  // await scheduleRetryMonitoring(data.email_id);
  
  // TODO: Alert if delay exceeds threshold
  // await checkDelayThreshold(data);
}

/**
 * Handle email.failed event
 * Triggered when an email permanently fails to be delivered
 */
async function handleEmailFailed(data: EmailEventData): Promise<void> {
  console.log(`Email failed: ${data.email_id} to ${data.to.join(', ')}`);
  
  // TODO: Update database with failed status
  // const supabase = await createClient();
  // await supabase
  //   .from('emails')
  //   .update({ 
  //     status: 'failed',
  //     failed_at: new Date().toISOString(),
  //     failure_reason: data.reason || 'Unknown'
  //   })
  //   .eq('resend_id', data.email_id);
  
  // TODO: Alert administrators of failure
  // await alertAdministrators('email_failed', data);
  
  // TODO: Mark lead as having invalid email if hard failure
  // await handleEmailFailure(data);
  
  // TODO: Track failure analytics for sender reputation
  // await trackEmailEvent('failed', data);
}

/**
 * Handle email.opened event
 * Triggered when a recipient opens an email
 */
async function handleEmailOpened(data: EmailEventData): Promise<void> {
  console.log(`Email opened: ${data.email_id} by ${data.to.join(', ')}`);
  
  try {
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'opened',
      created_at: data.created_at,
      data: data
    });
    
    // Update lead engagement score
    for (const email of data.to) {
      await updateLeadEngagement(email, 'email_opened');
    }
    
    // Track metrics
    await trackEmailMetrics('opened');
    
  } catch (error) {
    console.error('Error handling email.opened event:', error);
  }
  
  // TODO: Trigger engagement-based follow-ups
  // await triggerEngagementFollowUp(data.email_id, 'opened');
}

/**
 * Handle email.clicked event
 * Triggered when a recipient clicks a link in an email
 */
async function handleEmailClicked(data: EmailEventData): Promise<void> {
  console.log(`Email clicked: ${data.email_id} by ${data.to.join(', ')}, URL: ${data.click_url}`);
  
  try {
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'clicked',
      created_at: data.created_at,
      data: data
    });
    
    // Update lead engagement score (higher weight for clicks)
    for (const email of data.to) {
      await updateLeadEngagement(email, 'email_clicked');
    }
    
    // Track metrics
    await trackEmailMetrics('clicked');
    
  } catch (error) {
    console.error('Error handling email.clicked event:', error);
  }
  
  // TODO: Track click analytics and conversion funnel
  // await trackConversionFunnel(data.click_url, data.email_id);
  
  // TODO: Trigger high-engagement follow-ups
  // await triggerEngagementFollowUp(data.email_id, 'clicked');
}

/**
 * Handle email.bounced event
 * Triggered when an email bounces (hard or soft bounce)
 */
async function handleEmailBounced(data: EmailEventData): Promise<void> {
  console.log(`Email bounced: ${data.email_id} to ${data.to.join(', ')}, type: ${data.bounce_type}`);
  
  try {
    // Update database with bounce information
    await updateEmailStatus(data.email_id, {
      status: 'bounced',
      bounced_at: new Date().toISOString(),
      bounce_type: data.bounce_type
    });
    
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'bounced',
      created_at: data.created_at,
      data: data
    });
    
    // Handle hard bounces (mark email as invalid)
    if (data.bounce_type === 'hard') {
      for (const email of data.to) {
        await markEmailAsInvalid(email);
        await updateLeadEngagement(email, 'email_bounced');
      }
    }
    
    // Track metrics
    await trackEmailMetrics('bounced');
    
    // Check if bounce rate exceeds threshold
    await checkBounceRateThreshold();
    
  } catch (error) {
    console.error('Error handling email.bounced event:', error);
  }
}

/**
 * Handle email.complained event
 * Triggered when a recipient marks an email as spam
 */
async function handleEmailComplained(data: EmailEventData): Promise<void> {
  console.log(`Email complained: ${data.email_id} by ${data.to.join(', ')}, type: ${data.complaint_type}`);
  
  try {
    // Update database with complaint information
    await updateEmailStatus(data.email_id, {
      status: 'complained',
      complained_at: new Date().toISOString(),
      complaint_type: data.complaint_type
    });
    
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'complained',
      created_at: data.created_at,
      data: data
    });
    
    // Immediately unsubscribe the user
    for (const email of data.to) {
      await unsubscribeUser(email, 'spam_complaint');
      await updateLeadEngagement(email, 'email_complained');
    }
    
    // Track metrics
    await trackEmailMetrics('complained');
    
    // Check if complaint rate exceeds threshold
    await checkComplaintRateThreshold();
    
  } catch (error) {
    console.error('Error handling email.complained event:', error);
  }
  
  // TODO: Alert administrators of spam complaint
  // await alertAdministrators('spam_complaint', data);
  
  // TODO: Review email content and sending practices
  // await triggerContentReview(data.email_id);
}

/**
 * Handle email.unsubscribed event
 * Triggered when a recipient unsubscribes from emails
 */
async function handleEmailUnsubscribed(data: EmailEventData): Promise<void> {
  console.log(`Email unsubscribed: ${data.email_id} by ${data.to.join(', ')}`);
  
  try {
    // Record the event for analytics
    await recordEmailEvent({
      email_id: data.email_id,
      event_type: 'unsubscribed',
      created_at: data.created_at,
      data: data
    });
    
    // Unsubscribe each recipient
    for (const email of data.to) {
      await unsubscribeUser(email, 'user_unsubscribed');
    }
    
    // Track metrics
    await trackEmailMetrics('unsubscribed');
    
  } catch (error) {
    console.error('Error handling email.unsubscribed event:', error);
  }
  
  // TODO: Send confirmation email to user
  // TODO: Add to suppression list for future campaigns
}

/**
 * Main webhook endpoint handler
 * Verifies the webhook signature and processes the event
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the webhook signing secret from environment variables
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Read the raw request body
    const body = await request.text();
    
    // Extract Svix headers for signature verification
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    // Validate that all required headers are present
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing required Svix headers');
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      );
    }

    // Initialize Svix webhook verifier
    const wh = new Webhook(webhookSecret);
    
    let payload: WebhookPayload;
    
    try {
      // Verify the webhook payload using Svix
      payload = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookPayload;
      
      console.log('Webhook signature verified successfully');
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Process the verified webhook event
    try {
      await handleWebhookEvent(payload);
      
      console.log(`Successfully processed webhook event: ${payload.type}`);
      
      // Return success response
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully',
        eventType: payload.type 
      });
      
    } catch (eventError) {
      console.error('Error processing webhook event:', eventError);
      
      // TODO: Consider whether to return 200 or 500 here based on your retry strategy
      // Returning 500 will cause Resend to retry the webhook
      // Returning 200 will acknowledge receipt even if processing failed
      return NextResponse.json(
        { error: 'Error processing webhook event' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/*
 * TESTING NOTES:
 * 
 * 1. Test webhook signature verification:
 *    - Use Resend's webhook testing tools or ngrok for local testing
 *    - Verify that invalid signatures return 401
 *    - Test with missing headers
 * 
 * 2. Test event processing:
 *    - Mock different event types and verify correct handler is called
 *    - Test error handling within event processors
 *    - Verify idempotency (processing same event multiple times)
 * 
 * 3. Integration testing:
 *    - Send actual emails through your system
 *    - Verify webhook events are received and processed
 *    - Check database updates and analytics tracking
 * 
 * 4. Production considerations:
 *    - Set up monitoring and alerting for webhook failures
 *    - Implement proper logging and error tracking
 *    - Consider rate limiting if needed
 *    - Set up dead letter queues for failed events
 */

/*
 * EXTENSION POINTS:
 * 
 * 1. Database Integration:
 *    - Uncomment and implement database update logic
 *    - Add proper error handling for database operations
 *    - Consider using transactions for multiple updates
 * 
 * 2. Analytics and Metrics:
 *    - Implement trackEmailEvent function
 *    - Set up dashboards for email performance
 *    - Track conversion funnels and engagement metrics
 * 
 * 3. Automation and Follow-ups:
 *    - Implement trigger functions for automated sequences
 *    - Set up lead scoring based on email engagement
 *    - Create automated unsubscribe workflows
 * 
 * 4. Alerting and Monitoring:
 *    - Set up alerts for high bounce/complaint rates
 *    - Monitor webhook processing performance
 *    - Alert on unusual patterns or failures
 * 
 * 5. Queue Processing:
 *    - Consider moving heavy processing to background queues
 *    - Implement retry logic for failed operations
 *    - Use job queues for time-intensive operations
 */
