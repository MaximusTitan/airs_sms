import { createClient } from '@/lib/supabase/server';

/**
 * Comprehensive email analytics tracking system
 */

export interface EmailAnalytics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
}

export interface EmailMetricsByDate {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  unsubscribed: number;
}

export interface EmailEngagementTrend {
  date: string;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface TopPerformingCampaign {
  id: string;
  subject: string;
  sent_at: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  engagementScore: number;
}

export interface TemplatePerformance {
  id: string;
  name: string;
  subject: string;
  totalCampaigns: number;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface LeadEngagementAnalytics {
  totalLeads: number;
  engagedLeads: number;
  highEngagement: number;
  mediumEngagement: number;
  lowEngagement: number;
  noEngagement: number;
  validEmails: number;
  unsubscribed: number;
  recentlyEngaged: number;
  engagementRate: number;
  emailValidityRate: number;
  unsubscribeRate: number;
  engagementDistribution: Array<{ score: number; count: number }>;

}

/**
 * Get comprehensive email analytics for a date range
 */
export async function getEmailAnalytics(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<EmailAnalytics> {
  const supabase = await createClient();
  
  // Base query for email events - use proper datetime ranges
  let eventsQuery = supabase
    .from('email_events')
    .select('event_type, created_at')
    .gte('created_at', startDate + 'T00:00:00Z')
    .lte('created_at', endDate + 'T23:59:59Z');
  
  // If userId is provided, filter by user's emails
  if (userId) {
    const { data: userEmails } = await supabase
      .from('emails')
      .select('resend_id')
      .eq('user_id', userId)
      .not('resend_id', 'is', null);
    
    const emailIds = userEmails?.map(email => email.resend_id) || [];
    if (emailIds.length > 0) {
      eventsQuery = eventsQuery.in('email_id', emailIds);
    } else {
      // No emails found for user, return empty results
      return {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
        unsubscribed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        complaintRate: 0,
        unsubscribeRate: 0
      };
    }
  }
  
  const { data: events, error } = await eventsQuery;
  
  if (error) {
    console.error('Error fetching email analytics:', error);
    throw error;
  }
  
  // Count events by type
  const eventCounts = events?.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  const totalSent = eventCounts['sent'] || 0;
  const delivered = eventCounts['delivered'] || 0;
  const opened = eventCounts['opened'] || 0;
  const clicked = eventCounts['clicked'] || 0;
  const bounced = eventCounts['bounced'] || 0;
  const complained = eventCounts['complained'] || 0;
  const failed = eventCounts['failed'] || 0;
  const unsubscribed = eventCounts['unsubscribed'] || 0;
  
  // Calculate rates
  const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
  const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
  const complaintRate = totalSent > 0 ? (complained / totalSent) * 100 : 0;
  const unsubscribeRate = totalSent > 0 ? (unsubscribed / totalSent) * 100 : 0;
  
  return {
    totalSent,
    delivered,
    opened,
    clicked,
    bounced,
    complained,
    failed,
    unsubscribed,
    deliveryRate,
    openRate,
    clickRate,
    bounceRate,
    complaintRate,
    unsubscribeRate
  };
}

/**
 * Get daily email metrics for charting
 */
export async function getDailyEmailMetrics(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<EmailMetricsByDate[]> {
  const supabase = await createClient();
  
  // Base query for email events - use proper datetime ranges
  let eventsQuery = supabase
    .from('email_events')
    .select('event_type, created_at')
    .gte('created_at', startDate + 'T00:00:00Z')
    .lte('created_at', endDate + 'T23:59:59Z');
  
  // If userId is provided, filter by user's emails
  if (userId) {
    const { data: userEmails } = await supabase
      .from('emails')
      .select('resend_id')
      .eq('user_id', userId)
      .not('resend_id', 'is', null);
    
    const emailIds = userEmails?.map(email => email.resend_id) || [];
    if (emailIds.length > 0) {
      eventsQuery = eventsQuery.in('email_id', emailIds);
    } else {
      // No emails found for user, return empty results
      return [];
    }
  }
  
  const { data: events, error } = await eventsQuery;
  
  if (error) {
    console.error('Error fetching daily metrics:', error);
    throw error;
  }
  
  // Group events by date and type
  const eventsByDate = events?.reduce((acc, event) => {
    const date = event.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
        unsubscribed: 0
      };
    }
    
    switch (event.event_type) {
      case 'sent':
        acc[date].sent++;
        break;
      case 'delivered':
        acc[date].delivered++;
        break;
      case 'opened':
        acc[date].opened++;
        break;
      case 'clicked':
        acc[date].clicked++;
        break;
      case 'bounced':
        acc[date].bounced++;
        break;
      case 'complained':
        acc[date].complained++;
        break;
      case 'failed':
        acc[date].failed++;
        break;
      case 'unsubscribed':
        acc[date].unsubscribed++;
        break;
    }
    
    return acc;
  }, {} as Record<string, EmailMetricsByDate>) || {};
  
  // Convert to array and sort by date
  return Object.values(eventsByDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get email engagement trends over time
 */
export async function getEmailEngagementTrends(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<EmailEngagementTrend[]> {
  // Get daily metrics and calculate engagement rates
  const dailyMetrics = await getDailyEmailMetrics(startDate, endDate, userId);
  
  return dailyMetrics.map(metric => ({
    date: metric.date,
    openRate: metric.delivered > 0 ? (metric.opened / metric.delivered) * 100 : 0,
    clickRate: metric.opened > 0 ? (metric.clicked / metric.opened) * 100 : 0,
    bounceRate: metric.sent > 0 ? (metric.bounced / metric.sent) * 100 : 0
  }));
}

/**
 * Get top performing email campaigns
 */
export async function getTopPerformingCampaigns(
  startDate: string,
  endDate: string,
  userId?: string,
  limit: number = 10
): Promise<TopPerformingCampaign[]> {
  const supabase = await createClient();
  
  let campaignsQuery = supabase
    .from('emails')
    .select(`
      id,
      subject,
      sent_at,
      template_id,
      personalized,
      recipient_emails,
      email_events!inner(event_type)
    `)
    .gte('sent_at', startDate)
    .lte('sent_at', endDate)
    .order('sent_at', { ascending: false });
  
  if (userId) {
    campaignsQuery = campaignsQuery.eq('user_id', userId);
  }
  
  const { data: campaigns, error } = await campaignsQuery;
  
  if (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
  
  // Calculate performance metrics for each campaign
  const campaignMetrics = campaigns?.map(campaign => {
    const events = campaign.email_events || [];
    const totalSent = Array.isArray(campaign.recipient_emails) ? campaign.recipient_emails.length : 0;
    
    const eventCounts = events.reduce((acc: Record<string, number>, event: { event_type: string }) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});
    
    const delivered = eventCounts['delivered'] || 0;
    const opened = eventCounts['opened'] || 0;
    const clicked = eventCounts['clicked'] || 0;
    
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    
    return {
      id: campaign.id,
      subject: campaign.subject,
      sent_at: campaign.sent_at,
      totalSent,
      delivered,
      opened,
      clicked,
      deliveryRate,
      openRate,
      clickRate,
      engagementScore: openRate + (clickRate * 2) // Weighted engagement score
    };
  }) || [];
  
  // Sort by engagement score and return top performers
  return campaignMetrics
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

/**
 * Get email performance by template
 */
export async function getTemplatePerformance(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<TemplatePerformance[]> {
  const supabase = await createClient();
  
  let templatesQuery = supabase
    .from('email_templates')
    .select(`
      id,
      name,
      subject,
      emails!inner(
        id,
        sent_at,
        recipient_emails,
        email_events(event_type)
      )
    `);
  
  if (userId) {
    templatesQuery = templatesQuery.eq('emails.user_id', userId);
  }
  
  const { data: templates, error } = await templatesQuery;
  
  if (error) {
    console.error('Error fetching template performance:', error);
    throw error;
  }
  
  // Calculate performance metrics for each template
  return templates?.map(template => {
    const emails = template.emails?.filter(email => 
      email.sent_at >= startDate && email.sent_at <= endDate
    ) || [];
    
    const totalCampaigns = emails.length;
    const totalSent = emails.reduce((sum, email) => 
      sum + (Array.isArray(email.recipient_emails) ? email.recipient_emails.length : 0), 0
    );
    
    const allEvents = emails.flatMap(email => email.email_events || []);
    const eventCounts = allEvents.reduce((acc: Record<string, number>, event: { event_type: string }) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});
    
    const delivered = eventCounts['delivered'] || 0;
    const opened = eventCounts['opened'] || 0;
    const clicked = eventCounts['clicked'] || 0;
    
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      totalCampaigns,
      totalSent,
      delivered,
      opened,
      clicked,
      deliveryRate,
      openRate,
      clickRate
    };
  }) || [];
}

/**
 * Get lead engagement analytics
 */
export async function getLeadEngagementAnalytics(
  userId?: string
): Promise<LeadEngagementAnalytics> {
  const supabase = await createClient();
  
  let leadsQuery = supabase
    .from('leads')
    .select('engagement_score, email_valid, unsubscribed, last_engagement_at');
  
  if (userId) {
    leadsQuery = leadsQuery.eq('user_id', userId);
  }
  
  const { data: leads, error } = await leadsQuery;
  
  if (error) {
    console.error('Error fetching lead engagement:', error);
    throw error;
  }
  
  const totalLeads = leads?.length || 0;
  const engagedLeads = leads?.filter(lead => (lead.engagement_score || 0) > 0).length || 0;
  const validEmails = leads?.filter(lead => lead.email_valid !== false).length || 0;
  const unsubscribed = leads?.filter(lead => lead.unsubscribed === true).length || 0;
  const recentlyEngaged = leads?.filter(lead => {
    if (!lead.last_engagement_at) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lead.last_engagement_at) > thirtyDaysAgo;
  }).length || 0;
  
  // Engagement score distribution
  const engagementDistribution = leads?.reduce((acc, lead) => {
    const score = lead.engagement_score || 0;
    if (score === 0) acc.none++;
    else if (score <= 5) acc.low++;
    else if (score <= 15) acc.medium++;
    else acc.high++;
    return acc;
  }, { none: 0, low: 0, medium: 0, high: 0 }) || { none: 0, low: 0, medium: 0, high: 0 };
  
  return {
    totalLeads,
    engagedLeads,
    highEngagement: engagementDistribution.high,
    mediumEngagement: engagementDistribution.medium,
    lowEngagement: engagementDistribution.low,
    noEngagement: engagementDistribution.none,
    validEmails,
    unsubscribed,
    recentlyEngaged,
    engagementRate: totalLeads > 0 ? (engagedLeads / totalLeads) * 100 : 0,
    emailValidityRate: totalLeads > 0 ? (validEmails / totalLeads) * 100 : 0,
    unsubscribeRate: totalLeads > 0 ? (unsubscribed / totalLeads) * 100 : 0,
    engagementDistribution: Object.entries(engagementDistribution).map(([score, count]) => ({
      score: Number(score),
      count
    }))
  };
}

/**
 * Track custom email event for analytics
 */
export async function trackCustomEmailEvent(
  eventType: string,
  emailId: string,
  additionalData?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('email_events')
    .insert({
      email_id: emailId,
      event_type: eventType,
      created_at: new Date().toISOString(),
      data: additionalData
    });
  
  if (error) {
    console.error('Error tracking custom email event:', error);
    throw error;
  }
  
  // Also update daily metrics
  await updateDailyMetrics(eventType);
}

/**
 * Update daily metrics (called by webhook handlers)
 */
export async function updateDailyMetrics(eventType: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase.rpc('upsert_email_metrics', {
    p_date: today,
    p_event_type: eventType
  });
  
  if (error) {
    console.error('Error updating daily metrics:', error);
    // Don't throw here as this is non-critical
  }
}
