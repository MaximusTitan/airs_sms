"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lead, LeadStatus, FormField } from "@/lib/types/database";
import { formatDistanceToNow, format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Mail, Check, ChevronDown, ChevronRight, Eye, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadsTableProps {
  leads: (Lead & { forms?: { name: string; fields: FormField[] } })[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [expandedLeads, setExpandedLeads] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    setIsUpdating(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating lead status:', error);
    } finally {
      setIsUpdating(null);
    }
  };
  const updateBulkStatus = async (newStatus: LeadStatus) => {
    setIsUpdating('bulk');
    try {
      const response = await fetch('/api/leads/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadIds: selectedLeads, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update statuses');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating lead statuses:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedLeads.length === 0) return;

    setIsCreatingGroup(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          leadIds: selectedLeads,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      // Reset form and close dialog
      setGroupName("");
      setGroupDescription("");
      setSelectedLeads([]);
      setIsCreateGroupOpen(false);
      
      // Optionally show success message or redirect
      alert('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const handleSelectLead = (leadId: string, checked: boolean) => {
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

  const toggleExpandLead = (leadId: string) => {
    setExpandedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };
  const renderFormData = (formData: Record<string, string | boolean | number>, formFields?: FormField[]) => {
    if (!formData || Object.keys(formData).length === 0) {
      return <span className="text-muted-foreground text-sm">No additional data</span>;
    }

    // Create a map of field IDs to field labels for quick lookup
    const fieldLabelMap = formFields?.reduce((acc, field) => {
      acc[field.id] = field.label;
      return acc;
    }, {} as Record<string, string>) || {};

    return (
      <div className="space-y-2">
        {Object.entries(formData).map(([key, value]) => {
          // Use the field label if available, otherwise format the key
          const displayLabel = fieldLabelMap[key] || key.replace(/[_-]/g, ' ');
          
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="text-sm font-medium text-foreground min-w-0 capitalize">
                {displayLabel}:
              </span>
              <span className="text-sm text-muted-foreground break-words">
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) {
      return <span className="text-muted-foreground text-sm">No tags</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-accent/50">
          <TableRow>
            <TableHead className="px-6 py-4 w-12">
              <Checkbox 
                checked={selectedLeads.length === leads.length && leads.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="px-6 py-4 w-12"></TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Email</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Phone</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Status</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Source</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Created</TableHead>
            <TableHead className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="px-6 py-12 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm">Create a form to start collecting leads</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (            leads.flatMap((lead) => [
              <TableRow key={lead.id} className="hover:bg-accent/30 transition-colors">
                <TableCell className="px-6 py-4">
                  <Checkbox 
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpandLead(lead.id)}
                    className="p-1"
                  >
                    {expandedLeads.includes(lead.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm font-medium text-foreground">
                    {lead.name}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {lead.email}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {lead.phone || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
                    disabled={isUpdating === lead.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unqualified">
                        <Badge className={getStatusColor('unqualified')}>
                          unqualified
                        </Badge>
                      </SelectItem>
                      <SelectItem value="qualified">
                        <Badge className={getStatusColor('qualified')}>
                          qualified
                        </Badge>
                      </SelectItem>
                      <SelectItem value="trash">
                        <Badge className={getStatusColor('trash')}>
                          trash
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {lead.forms?.name || lead.source || 'Direct'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleExpandLead(lead.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {expandedLeads.includes(lead.id) ? 'Hide Details' : 'View Details'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateLeadStatus(lead.id, lead.status === 'qualified' ? 'unqualified' : 'qualified')}
                        disabled={isUpdating === lead.id}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {lead.status === 'qualified' ? 'Mark Unqualified' : 'Mark Qualified'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>,
              ...(expandedLeads.includes(lead.id) ? [
                <TableRow key={`${lead.id}-expanded`}>
                  <TableCell colSpan={9} className="px-6 py-6 bg-accent/20">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lead Information */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Lead Information</h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-foreground">Full Name:</span>
                              <span className="text-sm text-muted-foreground ml-2">{lead.name}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">Email:</span>
                              <span className="text-sm text-muted-foreground ml-2">{lead.email}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">Phone:</span>
                              <span className="text-sm text-muted-foreground ml-2">{lead.phone || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">Source:</span>
                              <span className="text-sm text-muted-foreground ml-2">{lead.forms?.name || lead.source || 'Direct'}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">Status:</span>
                              <Badge className={`ml-2 ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Timeline</h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-foreground">Created:</span>
                              <div className="text-sm text-muted-foreground ml-2">
                                {format(new Date(lead.created_at), 'PPpp')}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  ({formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })})
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">Last Updated:</span>
                              <div className="text-sm text-muted-foreground ml-2">
                                {format(new Date(lead.updated_at), 'PPpp')}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  ({formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tags</h4>
                        {renderTags(lead.tags)}
                      </div>

                      {/* Notes */}
                      {lead.notes && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Notes</h4>
                          <div className="p-3 bg-background rounded-md border">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                          </div>
                        </div>
                      )}                      {/* Form Data */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Form Submission Data</h4>
                        <div className="p-3 bg-background rounded-md border">
                          {renderFormData(lead.form_data, lead.forms?.fields)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ] : [])
            ])
          )}
        </TableBody>
      </Table>
      {selectedLeads.length > 0 && (
        <div className="px-6 py-4 bg-primary/10 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary font-medium">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </span>            <div className="flex gap-3 items-center">
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
              <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Create a new group with the selected {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter group name"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter group description (optional)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateGroupOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={createGroup}
                      disabled={!groupName.trim() || isCreatingGroup}
                    >
                      {isCreatingGroup ? 'Creating...' : 'Create Group'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Select onValueChange={(value) => updateBulkStatus(value as LeadStatus)} disabled={isUpdating === 'bulk'}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unqualified">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('unqualified')}>
                        unqualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="qualified">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('qualified')}>
                        qualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="trash">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('trash')}>
                        trash
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
