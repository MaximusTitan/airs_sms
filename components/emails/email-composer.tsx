"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Lead, EmailTemplate } from "@/lib/types/database";
import { Send, Users, FileText } from "lucide-react";

interface EmailComposerProps {
  leads: Pick<Lead, 'id' | 'name' | 'email' | 'status'>[];
  templates: EmailTemplate[];
  preSelectedLeads?: string[];
}

export function EmailComposer({ leads, templates, preSelectedLeads = [] }: EmailComposerProps) {
  const router = useRouter();
    const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>(preSelectedLeads);  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLeadSelection = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
      setSelectedTemplate(templateId);
    }
  };
  const handleSend = async () => {
    if (!subject.trim() || !content.trim() || selectedLeads.length === 0) {
      setSendMessage({ type: 'error', text: 'Please fill in all fields and select at least one recipient.' });
      return;
    }

    setIsSending(true);
    setSendMessage(null);

    try {
      const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id));
      const recipientEmails = selectedLeadData
        .map(lead => lead.email)
        .filter(email => email && email.trim()); // Filter out empty emails

      if (recipientEmails.length === 0) {
        setSendMessage({ type: 'error', text: 'No valid email addresses found for selected recipients.' });
        setIsSending(false);
        return;
      }

      // For bulk emails, we'll send a single email with all recipients
      // For personalized emails, we'd send individual emails
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          content,
          recipientEmails,
          leadIds: selectedLeads,
          templateId: selectedTemplate || null,
        }),
      });      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Handle different response types
      if (result.warning) {
        setSendMessage({ 
          type: 'error', 
          text: `${result.message} - ${result.successfulSends} successful, ${result.failedSends} failed` 
        });
      } else {
        setSendMessage({ 
          type: 'success', 
          text: result.message || `Email sent successfully to ${result.successfulSends || result.totalRecipients || recipientEmails.length} recipient${recipientEmails.length !== 1 ? 's' : ''}!${result.batches ? ` (Sent in ${result.batches} batch${result.batches !== 1 ? 'es' : ''})` : ''}` 
        });
        
        // Only redirect on full success
        setTimeout(() => {
          router.push('/dashboard/emails');
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send email. Please try again.' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'unqualified':
        return 'bg-yellow-100 text-yellow-800';
      case 'trash':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="space-y-6">
      {/* Email Templates */}
      {templates.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <h3 className="font-medium text-foreground mb-1 text-sm">
                  {template.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {template.subject}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                  {template.variables.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.variables.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}      {/* Main Compose Area - Full Width Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composition - Takes most space */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Compose Email</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="text-base"
                />
              </div>
              <div>
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={16}
                  className="text-base resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground">
                    Use <code>{"{{name}}"}</code> and <code>{"{{email}}"}</code> for personalization
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                </div>
                
                {showPreview && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Email Preview:</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Subject:</strong> {subject || "No subject"}</p>
                      <div className="p-3 bg-background border rounded">
                        <div className="whitespace-pre-wrap">
                          {content || "No content"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>        {/* Recipients Panel - Larger width now */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recipients Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Recipients
              </h3>
              <Badge variant="secondary" className="text-xs">
                {selectedLeads.length}
              </Badge>
            </div>
              {/* Selected Recipients Preview */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All ({leads.length})</Label>
              </div>
              
              {/* Compact Selected Recipients List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {leads
                  .filter(lead => selectedLeads.includes(lead.id))
                  .map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                        <Badge className={getStatusColor(lead.status) + " text-xs mt-1"}>
                          {lead.status}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleLeadSelection(lead.id, false)}
                        className="ml-2 text-muted-foreground hover:text-destructive text-lg font-medium"
                      >
                        ×
                      </button>
                    </div>
                  ))
                }
              </div>
              
              {selectedLeads.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No recipients selected
                </p>
              )}
            </div>            {/* Add More Recipients */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-primary hover:text-primary/80 mb-3 font-medium">
                Add Recipients ({leads.length - selectedLeads.length} available)
              </summary>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                {leads
                  .filter(lead => !selectedLeads.includes(lead.id))
                  .map((lead) => (
                    <div 
                      key={lead.id} 
                      className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer text-sm transition-colors"
                      onClick={() => handleLeadSelection(lead.id, true)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                      </div>
                      <Badge className={getStatusColor(lead.status) + " text-xs"}>
                        {lead.status}
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </details>
          </Card>          {/* Send Button */}
          <Card className="p-4">
            {sendMessage && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                sendMessage.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {sendMessage.text}
              </div>
            )}
            
            <Button 
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !content.trim() || selectedLeads.length === 0}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
            
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Subject:</span> {subject || 'No subject'}</p>
              <p><span className="font-medium">Recipients:</span> {selectedLeads.length}</p>
              {selectedLeads.length > 0 && (
                <p><span className="font-medium">To:</span> {leads.filter(l => selectedLeads.includes(l.id)).map(l => l.name).slice(0, 3).join(', ')}{selectedLeads.length > 3 ? ` +${selectedLeads.length - 3} more` : ''}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
