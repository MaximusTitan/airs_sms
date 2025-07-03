"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmailTemplate } from "@/lib/types/database";
import { Plus, Edit, Trash2, FileText, Bold, Italic, Link, List, Hash, Code } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TemplatesPageContentProps {
  templates: EmailTemplate[];
}

export function TemplatesPageContent({ templates }: TemplatesPageContentProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contentPreview, setContentPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'general', // UI only - for better organization
    priority: 'normal' // UI only - for template prioritization
  });
  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      category: 'general',
      priority: 'normal'
    });
    setEditingTemplate(null);
  };
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubjectChange = (subject: string) => {
    setFormData(prev => ({ ...prev, subject }));
  };

  // Formatting helpers
  const insertFormatting = (format: string, textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'link':
        replacement = `[${selectedText || 'link text'}](https://example.com)`;
        break;
      case 'list':
        replacement = selectedText ? selectedText.split('\n').map(line => `• ${line}`).join('\n') : '• List item 1\n• List item 2';
        break;
      case 'heading':
        replacement = `# ${selectedText || 'Heading'}`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        break;
    }
    
    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = editingTemplate 
        ? `/api/emails/templates/${editingTemplate.id}`
        : '/api/emails/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          variables: [] // Variables not functional, always empty
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template');
      }

      setMessage({ 
        type: 'success', 
        text: editingTemplate ? 'Template updated successfully!' : 'Template created successfully!' 
      });

      resetForm();
      setIsCreateDialogOpen(false);
      router.refresh();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save template' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: 'general', // Default since not in database yet
      priority: 'normal' // Default since not in database yet
    });
    setEditingTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/emails/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete template');
      }

      setMessage({ type: 'success', text: 'Template deleted successfully!' });
      router.refresh();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete template' 
      });
    }  };

  const handleUseTemplate = (template: EmailTemplate) => {
    const params = new URLSearchParams();
    params.set('template', template.id);
    router.push(`/dashboard/emails/compose?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    placeholder="Email subject"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Content Editor with Formatting Tools */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">Content</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Preview:</span>
                    <Checkbox 
                      checked={contentPreview} 
                      onCheckedChange={(checked) => setContentPreview(checked === true)}
                    />
                  </div>
                </div>
                
                {/* Formatting Toolbar */}
                <div className="border rounded-t-md p-2 bg-muted/50 flex flex-wrap gap-1 mb-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('content') as HTMLTextAreaElement;
                      insertFormatting('bold', textarea);
                    }}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('content') as HTMLTextAreaElement;
                      insertFormatting('italic', textarea);
                    }}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('content') as HTMLTextAreaElement;
                      insertFormatting('link', textarea);
                    }}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('content') as HTMLTextAreaElement;
                      insertFormatting('list', textarea);
                    }}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('content') as HTMLTextAreaElement;
                      insertFormatting('heading', textarea);
                    }}
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('content') as HTMLTextAreaElement;
                      insertFormatting('code', textarea);
                    }}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>
                
                {contentPreview ? (
                  <div className="border border-t-0 rounded-b-md p-4 min-h-[300px] bg-white">
                    <div className="prose prose-sm max-w-none">
                      {formData.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">
                          <span dangerouslySetInnerHTML={{ 
                            __html: line
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
                              .replace(/^# (.*)/g, '<h1 class="text-xl font-bold">$1</h1>')
                              .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
                          }} />
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Email content... Use the formatting buttons above or type Markdown-style formatting"
                    rows={16}
                    className="border-t-0 rounded-t-none"
                    required
                  />
                )}
                
                <p className="text-sm text-muted-foreground mt-2">
                  {contentPreview ? (
                    'Preview mode - Toggle off to edit'
                  ) : (
                    <>
                      Use formatting buttons or Markdown syntax. 
                      Character count: {formData.content.length}
                    </>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first email template to save time when composing emails
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        General
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(new Date(template.created_at))} ago
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm bg-muted p-2 rounded line-clamp-2">{template.subject}</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    Use Template
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(template)}
                    title="Edit template"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
