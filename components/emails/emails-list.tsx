"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Email, Lead } from "@/lib/types/database";
import { EmailCampaignAnalytics } from "@/lib/email-analytics";
import { safeFormatDate } from "@/lib/utils/date-utils";
import { 
  Mail, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChevronDown,
  ChevronRight,
  Eye,
  MousePointer,
  AlertTriangle
} from "lucide-react";

interface EmailWithRecipients extends Email {
  recipients?: Pick<Lead, 'id' | 'name' | 'email' | 'status'>[];
  analytics?: EmailCampaignAnalytics;
}

interface EmailsListProps {
  emails: EmailWithRecipients[];
  fromEmail?: string;
  initialAnalytics?: Record<string, EmailCampaignAnalytics>;
}

export function EmailsList({ emails, fromEmail = 'AIRS@aireadyschool.com', initialAnalytics = {} }: EmailsListProps) {
  const [expandedEmails, setExpandedEmails] = useState<string[]>([]);
  const [emailAnalytics, setEmailAnalytics] = useState<Record<string, EmailCampaignAnalytics>>(initialAnalytics);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load analytics for sent emails
  useEffect(() => {
    const sentEmails = emails.filter(email => email.status === 'sent');
    if (sentEmails.length > 0) {
      loadEmailAnalytics(sentEmails.map(email => email.id));
    }
  }, [emails]);

  const loadEmailAnalytics = async (emailIds: string[]) => {
    if (emailIds.length === 0) return;
    
    setLoadingAnalytics(true);
    try {
      const response = await fetch('/api/analytics/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        const analyticsMap = data.analytics.reduce((acc: Record<string, EmailCampaignAnalytics>, analytics: EmailCampaignAnalytics) => {
          acc[analytics.id] = analytics;
          return acc;
        }, {});
        setEmailAnalytics(analyticsMap);
      }
    } catch (error) {
      console.error('Failed to load email analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const toggleExpanded = (emailId: string) => {
    setExpandedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partially_sent':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partially_sent':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unqualified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'trash':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const renderAnalyticsMetrics = (emailId: string) => {
    const analytics = emailAnalytics[emailId];
    if (!analytics || analytics.totalSent === 0) return null;
    
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span>{analytics.deliveryRate.toFixed(1)}% delivered</span>
        </div>
        {analytics.delivered > 0 && (
          <>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-blue-600" />
              <span>{analytics.openRate.toFixed(1)}% opened</span>
            </div>
            {analytics.clicked > 0 && (
              <div className="flex items-center gap-1">
                <MousePointer className="h-3 w-3 text-purple-600" />
                <span>{analytics.clickRate.toFixed(1)}% clicked</span>
              </div>
            )}
          </>
        )}
        {(analytics.bounced > 0 || analytics.complained > 0) && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            <span>{(analytics.bounceRate + analytics.complaintRate).toFixed(1)}% issues</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Emails</p>
              <p className="text-lg font-semibold">{emails.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-lg font-semibold">
                {emails.filter(e => e.status === 'sent').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Open Rate</p>
              <p className="text-lg font-semibold">
                {Object.values(emailAnalytics).length > 0 
                  ? `${(Object.values(emailAnalytics).reduce((sum, a) => sum + a.openRate, 0) / Object.values(emailAnalytics).length).toFixed(1)}%`
                  : '--'
                }
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MousePointer className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Click Rate</p>
              <p className="text-lg font-semibold">
                {Object.values(emailAnalytics).length > 0 
                  ? `${(Object.values(emailAnalytics).reduce((sum, a) => sum + a.clickRate, 0) / Object.values(emailAnalytics).length).toFixed(1)}%`
                  : '--'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>      {/* Emails List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Email History (All Attempts)</h2>
          {emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No emails yet
              </h3>
              <p className="text-muted-foreground">
                Start by composing your first email campaign
              </p>
            </div>
          ) : (
            <div className="space-y-3">              {emails.map((email) => {
                const isExpanded = expandedEmails.includes(email.id);
                const recipients = email.recipients || [];
                const recipientEmails = email.recipient_emails || [];
                
                // Add border color based on status
                const getBorderClass = (status: string) => {
                  switch (status) {
                    case 'sent':
                      return 'border-green-200 hover:border-green-300';
                    case 'failed':
                      return 'border-red-200 hover:border-red-300';
                    case 'partially_sent':
                      return 'border-orange-200 hover:border-orange-300';
                    case 'draft':
                      return 'border-yellow-200 hover:border-yellow-300';
                    default:
                      return 'border-gray-200 hover:border-gray-300';
                  }
                };
                
                return (
                  <div
                    key={email.id}
                    className={`border rounded-lg hover:shadow-sm transition-shadow ${getBorderClass(email.status)}`}
                  >
                    {/* Email Header - Make it clickable */}
                    <Dialog>                      <DialogTrigger asChild>
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(email.status)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground truncate">
                                  {email.subject}
                                </h3>
                                <Badge className={getStatusColor(email.status)}>
                                  {email.status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  To: {recipientEmails.length} recipient{recipientEmails.length !== 1 ? 's' : ''} (BCC)
                                </span>                                <span className="text-xs">
                                  From: {fromEmail}
                                </span>
                                <span>
                                  {email.sent_at 
                                    ? safeFormatDate(email.sent_at, 'PPpp')
                                    : safeFormatDate(email.created_at, 'PPpp')}
                                </span>
                              </div>
                              
                              {/* Show analytics for sent emails */}
                              {email.status === 'sent' && (
                                loadingAnalytics ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                                    <span>Loading analytics...</span>
                                  </div>
                                ) : (
                                  renderAnalyticsMetrics(email.id)
                                )
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {recipients.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(email.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{email.subject}</DialogTitle>
                        </DialogHeader>                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted rounded border text-sm">                            <div>
                              <span className="font-medium">From:</span>
                              <span className="ml-2">{fromEmail}</span>
                            </div>                            <div>
                              <span className="font-medium">To:</span>
                              <span className="ml-2">{recipientEmails.length} recipient{recipientEmails.length !== 1 ? 's' : ''} (BCC)</span>
                            </div>                            <div>
                              <span className="font-medium">Status:</span>
                              <span className="ml-2 capitalize">{email.status}</span>
                            </div>
                            <div>
                              <span className="font-medium">
                                {email.sent_at ? 'Sent:' : 'Created:'}
                              </span>
                              <span className="ml-2">
                                {safeFormatDate(email.sent_at || email.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Email Analytics Section */}
                          {email.status === 'sent' && emailAnalytics[email.id] && (
                            <div>
                              <h4 className="font-medium mb-2">Email Performance:</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded border">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-600">{emailAnalytics[email.id].deliveryRate.toFixed(1)}%</div>
                                  <div className="text-xs text-muted-foreground">Delivered</div>
                                  <div className="text-xs text-muted-foreground">({emailAnalytics[email.id].delivered}/{emailAnalytics[email.id].totalSent})</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-blue-600">{emailAnalytics[email.id].openRate.toFixed(1)}%</div>
                                  <div className="text-xs text-muted-foreground">Opened</div>
                                  <div className="text-xs text-muted-foreground">({emailAnalytics[email.id].opened})</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-purple-600">{emailAnalytics[email.id].clickRate.toFixed(1)}%</div>
                                  <div className="text-xs text-muted-foreground">Clicked</div>
                                  <div className="text-xs text-muted-foreground">({emailAnalytics[email.id].clicked})</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-orange-600">{(emailAnalytics[email.id].bounceRate + emailAnalytics[email.id].complaintRate).toFixed(1)}%</div>
                                  <div className="text-xs text-muted-foreground">Issues</div>
                                  <div className="text-xs text-muted-foreground">({emailAnalytics[email.id].bounced + emailAnalytics[email.id].complained})</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-2">Email Content:</h4>
                            <div className="p-3 bg-muted rounded border text-sm whitespace-pre-wrap">
                              {email.content}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Recipients ({recipientEmails.length}):</h4>
                            <div className="max-h-48 overflow-y-auto">
                              {recipients.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {recipients.map((recipient) => (
                                    <div key={recipient.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                      <div>
                                        <p className="font-medium">{recipient.name}</p>
                                        <p className="text-muted-foreground">{recipient.email}</p>
                                      </div>
                                      <Badge className={getLeadStatusColor(recipient.status)}>
                                        {recipient.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {recipientEmails.map((email, idx) => (
                                    <p key={idx} className="text-sm p-2 bg-muted rounded">{email}</p>
                                  ))}
                                </div>                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Expanded Recipients List */}
                    {isExpanded && recipients.length > 0 && (
                      <div className="border-t bg-muted/50 p-4">
                        <h4 className="font-medium mb-3 text-sm">Recipients ({recipients.length}):</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recipients.map((recipient) => (
                            <div key={recipient.id} className="flex items-center justify-between p-2 bg-background rounded border">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{recipient.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                              </div>
                              <Badge className={getLeadStatusColor(recipient.status)} variant="outline">
                                {recipient.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
