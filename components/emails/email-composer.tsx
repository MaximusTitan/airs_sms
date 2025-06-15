"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Lead, EmailTemplate } from "@/lib/types/database";
import { Send, Users, FileText } from "lucide-react";

interface EmailComposerProps {
  leads: Pick<Lead, 'id' | 'name' | 'email' | 'status'>[];
  templates: EmailTemplate[];
}

export function EmailComposer({ leads, templates }: EmailComposerProps) {
  const router = useRouter();
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

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
      return;
    }

    setIsSending(true);

    try {
      const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id));
      const recipientEmails = selectedLeadData.map(lead => lead.email);

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
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      router.push('/dashboard/emails');
    } catch (error) {
      console.error('Error sending email:', error);
      // You could add a toast notification here
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.subject}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composition */}
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
                />
              </div>
              
              <div>
                <Label htmlFor="content">Message</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your message here..."
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  rows={12}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Use <code>{"{{name}}"}</code> and <code>{"{{email}}"}</code> for personalization
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedLeads.length} selected
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Checkbox
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="font-medium">Select All</Label>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lead.email}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Send Button */}
          <Card className="p-6">
            <Button 
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !content.trim() || selectedLeads.length === 0}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : `Send to ${selectedLeads.length} recipient${selectedLeads.length !== 1 ? 's' : ''}`}
            </Button>
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Preview:</p>
              <p className="font-medium">Subject: {subject || 'No subject'}</p>
              <p>Recipients: {selectedLeads.length} selected</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
