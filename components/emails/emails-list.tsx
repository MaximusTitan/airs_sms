"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Email, EmailTemplate } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { Mail, Users, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface EmailsListProps {
  emails: Email[];
  templates: EmailTemplate[];
}

export function EmailsList({ emails, templates }: EmailsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
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
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Templates</p>
              <p className="text-lg font-semibold">{templates.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Emails List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Emails</h2>
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
            <div className="space-y-4">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(email.status)}
                    </div>
                      <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {email.subject}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {email.recipient_emails.length} recipient{email.recipient_emails.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                        </span>
                        {email.sent_at && (
                          <span>
                            Sent {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(email.status)}>
                    {email.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
