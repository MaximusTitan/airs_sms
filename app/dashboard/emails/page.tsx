'use client';

import { useState, useEffect } from "react";
import { EmailsHeader } from "@/components/emails/emails-header-with-tabs";
import { EmailsList } from "@/components/emails/emails-list";
import { EmailAnalyticsDashboard } from "@/components/emails/email-analytics-dashboard";
import { EmailAnalytics, EmailMetricsByDate, EmailEngagementTrend, EmailCampaignAnalytics } from "@/lib/email-analytics";
import { Email, EmailTemplate } from "@/lib/types/database";

interface EmailWithRecipients extends Email {
  recipients?: string[];
}

function EmailsPageContent() {
  const [currentTab, setCurrentTab] = useState<'emails' | 'analytics'>('emails');
  const [emailsData, setEmailsData] = useState<{
    emailsWithLeads: EmailWithRecipients[];
    templates: EmailTemplate[];
    emailAnalytics?: Record<string, EmailCampaignAnalytics>;
  } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    analytics: EmailAnalytics;
    dailyMetrics: EmailMetricsByDate[];
    engagementTrends: EmailEngagementTrend[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmailsData();
  }, []);

  const loadEmailsData = async () => {
    try {
      setLoading(true);
      
      // Fetch emails and templates in parallel
      const [emailsResponse, templatesResponse] = await Promise.all([
        fetch('/api/emails'),
        fetch('/api/emails/templates')
      ]);

      if (!emailsResponse.ok) {
        throw new Error('Failed to fetch emails');
      }
      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch templates');
      }

      const emailsData = await emailsResponse.json();
      const templatesData = await templatesResponse.json();

      // Load analytics for sent emails
      const sentEmails = (emailsData.emails || []).filter((email: EmailWithRecipients) => email.status === 'sent');
      let emailAnalytics = {};
      
      if (sentEmails.length > 0) {
        try {
          const analyticsResponse = await fetch('/api/analytics/email/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailIds: sentEmails.map((email: EmailWithRecipients) => email.id) })
          });
          
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            emailAnalytics = analyticsData.analytics.reduce((acc: Record<string, EmailCampaignAnalytics>, analytics: EmailCampaignAnalytics) => {
              acc[analytics.id] = analytics;
              return acc;
            }, {});
          }
        } catch (error) {
          console.error('Failed to load email analytics:', error);
        }
      }

      setEmailsData({
        emailsWithLeads: emailsData.emails || [],
        templates: templatesData || [],
        emailAnalytics
      });
    } catch (error) {
      console.error('Error loading emails data:', error);
      // Set empty data on error
      setEmailsData({
        emailsWithLeads: [],
        templates: [],
        emailAnalytics: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch('/api/analytics/email?range=7d');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to mock data
      setAnalyticsData({
        analytics: {
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
        },
        dailyMetrics: [],
        engagementTrends: []
      });
    }
  };

  const handleTabChange = async (tab: 'emails' | 'analytics') => {
    setCurrentTab(tab);
    
    if (tab === 'analytics' && !analyticsData) {
      await loadAnalyticsData();
    }
  };

  const totalEmails = emailsData?.emailsWithLeads?.length || 0;
  const sentEmails = emailsData?.emailsWithLeads?.filter((email: EmailWithRecipients) => email.status === 'sent').length || 0;
  const totalLeads = emailsData?.emailsWithLeads?.reduce((acc: number, email: EmailWithRecipients) => acc + (email.recipients?.length || 0), 0) || 0;
  const conversionRate = totalLeads > 0 ? (sentEmails / totalLeads) * 100 : 0;
  
  // Calculate average analytics from email analytics
  const emailAnalytics = emailsData?.emailAnalytics || {};
  const analyticsValues = Object.values(emailAnalytics);
  const avgOpenRate = analyticsValues.length > 0 
    ? analyticsValues.reduce((sum: number, a: EmailCampaignAnalytics) => sum + a.openRate, 0) / analyticsValues.length 
    : undefined;
  const avgClickRate = analyticsValues.length > 0 
    ? analyticsValues.reduce((sum: number, a: EmailCampaignAnalytics) => sum + a.clickRate, 0) / analyticsValues.length 
    : undefined;

  if (loading) {
    return (
      <div className="p-8 space-y-8 bg-background min-h-full">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-72 animate-pulse"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-48"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <EmailsHeader
        totalEmails={totalEmails}
        totalLeads={totalLeads}
        conversionRate={conversionRate}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onRefresh={loadEmailsData}
        isRefreshing={loading}
        avgOpenRate={avgOpenRate}
        avgClickRate={avgClickRate}
      />

      {currentTab === 'emails' && (
        <EmailsList 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emails={(emailsData?.emailsWithLeads || []) as any}
          fromEmail={process.env.NEXT_PUBLIC_FROM_EMAIL || 'AIRS@aireadyschool.com'}
          initialAnalytics={emailAnalytics}
        />
      )}

      {currentTab === 'analytics' && (
        <div>
          {analyticsData ? (
            <EmailAnalyticsDashboard initialData={analyticsData} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading analytics...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  return <EmailsPageContent />;
}
