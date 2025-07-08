"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, LeadStatus, FormField } from "@/lib/types/database";
import { X } from "lucide-react";
import { EditableFormData } from "../groups/editable-form-data";

interface LeadWithForm extends Omit<Lead, 'groups'> {
  forms?: {
    name: string;
    fields: FormField[];
  };
  groups?: { id: string; name: string }[];
}

interface EditLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithForm | null;
  onSave: (leadId: string, updatedLead: Partial<LeadWithForm>) => Promise<void>;
  isUpdating: boolean;
}

export function EditLeadDialog({
  isOpen,
  onClose,
  lead,
  onSave,
  isUpdating,
}: EditLeadDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    status: "new_lead" as LeadStatus,
    tags: [] as string[],
  });
  const [submissionData, setSubmissionData] = useState<Record<string, string | boolean | number>>({});
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "-",
        email: lead.email || "-",
        phone: lead.phone || "-",
        notes: lead.notes || "-",
        status: lead.status,
        tags: lead.tags || [],
      });
      setSubmissionData(lead.form_data || {});
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead) return;
    
    await onSave(lead.id, {
      name: formData.name === "-" ? undefined : formData.name,
      email: formData.email === "-" ? undefined : formData.email,
      phone: formData.phone === "-" ? undefined : formData.phone,
      notes: formData.notes === "-" ? undefined : formData.notes,
      status: formData.status,
      tags: formData.tags,
      form_data: submissionData,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new_lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case "qualified":
        return "bg-green-100 text-green-800 border-green-200";
      case 'pilot_ready':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'running_pilot':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'pilot_done':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'sale_done':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'implementation':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'not_interested':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case "unqualified":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "trash":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead Details</DialogTitle>
          <DialogDescription>
            Update the lead information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name or '-' for no data"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address or '-' for no data"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number or '-' for no data"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as LeadStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <Badge className={getStatusColor(formData.status)}>
                        {formData.status === 'new_lead' ? 'New Lead' :
                         formData.status === 'pilot_ready' ? 'Pilot Ready' :
                         formData.status === 'running_pilot' ? 'Running Pilot' :
                         formData.status === 'pilot_done' ? 'Pilot Done' :
                         formData.status === 'sale_done' ? 'Sale Done' :
                         formData.status === 'not_interested' ? 'Not Interested' :
                         formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_lead">
                      <Badge className={getStatusColor("new_lead")}>
                        New Lead
                      </Badge>
                    </SelectItem>
                    <SelectItem value="qualified">
                      <Badge className={getStatusColor("qualified")}>
                        Qualified
                      </Badge>
                    </SelectItem>
                    <SelectItem value="pilot_ready">
                      <Badge className={getStatusColor("pilot_ready")}>
                        Pilot Ready
                      </Badge>
                    </SelectItem>
                    <SelectItem value="running_pilot">
                      <Badge className={getStatusColor("running_pilot")}>
                        Running Pilot
                      </Badge>
                    </SelectItem>
                    <SelectItem value="pilot_done">
                      <Badge className={getStatusColor("pilot_done")}>
                        Pilot Done
                      </Badge>
                    </SelectItem>
                    <SelectItem value="sale_done">
                      <Badge className={getStatusColor("sale_done")}>
                        Sale Done
                      </Badge>
                    </SelectItem>
                    <SelectItem value="implementation">
                      <Badge className={getStatusColor("implementation")}>
                        Implementation
                      </Badge>
                    </SelectItem>
                    <SelectItem value="not_interested">
                      <Badge className={getStatusColor("not_interested")}>
                        Not Interested
                      </Badge>
                    </SelectItem>
                    <SelectItem value="unqualified">
                      <Badge className={getStatusColor("unqualified")}>
                        Unqualified
                      </Badge>
                    </SelectItem>
                    <SelectItem value="trash">
                      <Badge className={getStatusColor("trash")}>
                        Trash
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Tags
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Notes
            </h4>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes about this lead or '-' for no data..."
              rows={4}
            />
          </div>

          {/* Form Submission Data */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Form Submission Data
            </h4>
            <div className="p-3 bg-background rounded-md border">
              <EditableFormData
                formData={submissionData}
                formFields={lead.forms?.fields}
                onDataChange={setSubmissionData}
                isReadOnly={false}
              />
            </div>
          </div>

          {/* Read-only Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Additional Information (Read-only)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Source:</span>
                <span className="ml-2 text-muted-foreground">
                  {lead.forms?.name || lead.source || "Direct"}
                </span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
