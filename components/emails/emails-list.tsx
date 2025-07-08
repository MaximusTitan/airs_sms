"use client";

import { useState } from "react";
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
import { Email, EmailTemplate, Lead } from "@/lib/types/database";
import { safeFormatDate } from "@/lib/utils/date-utils";
import { 
  Mail, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface EmailWithRecipients extends Email {
  recipients?: Pick<Lead, 'id' | 'name' | 'email' | 'status'>[];
}

interface EmailsListProps {
  emails: EmailWithRecipients[];
  templates: EmailTemplate[];
  fromEmail?: string;
}

export function EmailsList({ emails, templates, fromEmail = 'AIRS@aireadyschool.com' }: EmailsListProps) {
  const [expandedEmails, setExpandedEmails] = useState<string[]>([]);

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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-lg font-semibold">
                {emails.filter(e => e.status === 'draft').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Partial</p>
              <p className="text-lg font-semibold">
                {emails.filter(e => e.status === 'partially_sent').length}
              </p>
            </div>
          </div>
        </Card>
          <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold">
                {emails.filter(e => e.status === 'failed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates</p>
              <p className="text-lg font-semibold">{templates.length}</p>
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
