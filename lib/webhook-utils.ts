import { createClient } from '@/lib/supabase/server';

/**
 * Utility functions for integrating webhook events with the database
 * These functions can be used in the webhook handlers
 */

export interface EmailEvent {
  id?: string;
  email_id: string;
  event_type: string;
  created_at: string;
  data: Record<string, unknown>;
}

export interface EmailStatusUpdate {
  status: string;
  sent_at?: string;
  delivered_at?: string;
  bounced_at?: string;
  complained_at?: string;
  failed_at?: string;
  bounce_type?: string;
  complaint_type?: string;
  failure_reason?: string;
}

/**
 * Update email status in the database based on webhook events
 */
export async function updateEmailStatus(
  resendId: string, 
  statusUpdate: EmailStatusUpdate
): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('emails')
    .update(statusUpdate)
    .eq('resend_id', resendId);
    
  if (error) {
    console.error('Error updating email status:', error);
    throw error;
  }
}

/**
 * Record email events for analytics and tracking
 */
export async function recordEmailEvent(event: EmailEvent): Promise<void> {
  const supabase = await createClient();
  
  // First, check if this event already exists (for idempotency)
  const { data: existingEvent } = await supabase
    .from('email_events')
    .select('id')
    .eq('email_id', event.email_id)
    .eq('event_type', event.event_type)
    .eq('created_at', event.created_at)
    .single();
    
  if (existingEvent) {
    console.log(`Event already exists: ${event.event_type} for ${event.email_id}`);
    return;
  }
  
  const { error } = await supabase
    .from('email_events')
    .insert({
      email_id: event.email_id,
      event_type: event.event_type,
      created_at: event.created_at,
      data: event.data
    });
    
  if (error) {
    console.error('Error recording email event:', error);
    throw error;
  }
}

/**
 * Update lead engagement score based on email interactions
 */
export async function updateLeadEngagement(
  email: string, 
  eventType: string
): Promise<void> {
  const supabase = await createClient();
  
  // Define engagement scores for different event types
  const engagementScores: Record<string, number> = {
    'email_opened': 1,
    'email_clicked': 3,
    'email_bounced': -2,
    'email_complained': -5
  };
  
  const scoreChange = engagementScores[eventType] || 0;
  
  if (scoreChange !== 0) {
    // First, find the lead by email
    const { data: lead } = await supabase
      .from('leads')
      .select('id, engagement_score')
      .eq('email', email)
      .single();
      
    if (lead) {
      const newScore = (lead.engagement_score || 0) + scoreChange;
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          engagement_score: Math.max(0, newScore), // Don't go below 0
          last_engagement_at: new Date().toISOString()
        })
        .eq('id', lead.id);
        
      if (error) {
        console.error('Error updating lead engagement:', error);
        throw error;
      }
    }
  }
}

/**
 * Mark email as invalid based on hard bounces
 */
export async function markEmailAsInvalid(email: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('leads')
    .update({ 
      email_valid: false,
      status: 'unqualified',
      notes: 'Email marked as invalid due to hard bounce'
    })
    .eq('email', email);
    
  if (error) {
    console.error('Error marking email as invalid:', error);
    throw error;
  }
}

/**
 * Unsubscribe user due to spam complaints
 */
export async function unsubscribeUser(email: string, reason: string): Promise<void> {
  const supabase = await createClient();
  
  // Update lead status
  const { error: leadError } = await supabase
    .from('leads')
    .update({ 
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason
    })
    .eq('email', email);
    
  if (leadError) {
    console.error('Error unsubscribing user:', leadError);
    throw leadError;
  }
  
  // Add to unsubscribe list if you have one
  const { error: unsubError } = await supabase
    .from('unsubscribes')
    .upsert({
      email: email,
      reason: reason,
      created_at: new Date().toISOString()
    });
    
  if (unsubError) {
    console.error('Error adding to unsubscribe list:', unsubError);
    // Don't throw here as the main unsubscribe was successful
  }
}

/**
 * Track email analytics metrics
 */
export async function trackEmailMetrics(
  eventType: string
): Promise<void> {
  const supabase = await createClient();
  
  // Update daily metrics
  const today = new Date().toISOString().split('T')[0];
  
  // First try to increment existing record
  const { data: existingMetric } = await supabase
    .from('email_metrics')
    .select('count')
    .eq('date', today)
    .eq('event_type', eventType)
    .single();
    
  if (existingMetric) {
    // Update existing record
    const { error } = await supabase
      .from('email_metrics')
      .update({ 
        count: existingMetric.count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('date', today)
      .eq('event_type', eventType);
      
    if (error) {
      console.error('Error updating email metrics:', error);
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('email_metrics')
      .insert({
        date: today,
        event_type: eventType,
        count: 1
      });
      
    if (error) {
      console.error('Error inserting email metrics:', error);
    }
  }
}

/**
 * Check if bounce rate exceeds threshold and send alerts
 */
export async function checkBounceRateThreshold(): Promise<void> {
  const supabase = await createClient();
  
  // Get bounce rate for the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: metrics } = await supabase
    .from('email_events')
    .select('event_type')
    .gte('created_at', twentyFourHoursAgo);
    
  if (metrics && metrics.length > 0) {
    const bounces = metrics.filter(m => m.event_type === 'bounced').length;
    const total = metrics.length;
    const bounceRate = (bounces / total) * 100;
    
    // Alert if bounce rate exceeds 4% (Resend's threshold)
    if (bounceRate > 4) {
      console.warn(`High bounce rate detected: ${bounceRate.toFixed(2)}%`);
      // TODO: Send alert to administrators
      // await sendAlert('high_bounce_rate', { bounceRate, bounces, total });
    }
  }
}

/**
 * Check if complaint rate exceeds threshold and send alerts
 */
export async function checkComplaintRateThreshold(): Promise<void> {
  const supabase = await createClient();
  
  // Get complaint rate for the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: metrics } = await supabase
    .from('email_events')
    .select('event_type')
    .gte('created_at', twentyFourHoursAgo);
    
  if (metrics && metrics.length > 0) {
    const complaints = metrics.filter(m => m.event_type === 'complained').length;
    const total = metrics.length;
    const complaintRate = (complaints / total) * 100;
    
    // Alert if complaint rate exceeds 0.08% (Resend's threshold)
    if (complaintRate > 0.08) {
      console.warn(`High complaint rate detected: ${complaintRate.toFixed(4)}%`);
      // TODO: Send alert to administrators
      // await sendAlert('high_complaint_rate', { complaintRate, complaints, total });
    }
  }
}
