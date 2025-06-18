"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, LeadStatus, FormField } from "@/lib/types/database";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";

interface LeadsTableProps {
  leads: (Lead & { 
    forms?: { name: string; fields: FormField[] };
    group_memberships?: { lead_groups: { id: string; name: string } }[];
  })[];
  selectedLeads?: string[];
  onSelectedLeadsChange?: (leads: string[]) => void;
}

export function LeadsTable({ leads, selectedLeads: externalSelectedLeads, onSelectedLeadsChange }: LeadsTableProps) {
  const router = useRouter();
  const [internalSelectedLeads, setInternalSelectedLeads] = useState<string[]>([]);
  
  // Use external selectedLeads if provided, otherwise use internal state
  const selectedLeads = externalSelectedLeads ?? internalSelectedLeads;
  const setSelectedLeads = onSelectedLeadsChange ?? setInternalSelectedLeads;

  // Process leads to transform group_memberships into groups array
  const processedLeads = leads.map(lead => ({
    ...lead,
    groups: lead.group_memberships?.map(membership => membership.lead_groups) || []
  }));  const [expandedLeads, setExpandedLeads] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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
    } finally {      setIsUpdating(null);
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
      setSelectedLeads(processedLeads.map(lead => lead.id));
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
  };  return (
    <Card className="overflow-hidden shadow-sm border border-border/40">
      <Table>
        <TableHeader className="bg-accent/50 border-b border-border/40">
          <TableRow className="border-b border-border/40 hover:bg-transparent">
            <TableHead className="px-3 py-3 w-10">
              <Checkbox 
                checked={selectedLeads.length === processedLeads.length && processedLeads.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Email</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Phone</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Status</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Groups</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Source</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="px-6 py-16 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No leads found</p>
                  <p className="text-sm">Create a form to start collecting leads</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            processedLeads.flatMap((lead) => {
              const rows = [
                <TableRow
                  key={lead.id} 
                  className="hover:bg-accent/30 transition-colors border-b border-border/40 cursor-pointer"
                  onClick={() => toggleExpandLead(lead.id)}
                >
                  <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {expandedLeads.includes(lead.id) ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <div className="text-sm font-medium text-foreground truncate max-w-[150px]" title={lead.name}>
                        {lead.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={lead.email}>
                      {lead.email}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="text-sm text-muted-foreground">
                      {lead.phone || <span className="text-xs italic">N/A</span>}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
                      disabled={isUpdating === lead.id}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue>
                          <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unqualified">
                          <Badge className={`text-xs ${getStatusColor('unqualified')}`}>
                            unqualified
                          </Badge>
                        </SelectItem>
                        <SelectItem value="qualified">
                          <Badge className={`text-xs ${getStatusColor('qualified')}`}>
                            qualified
                          </Badge>
                        </SelectItem>
                        <SelectItem value="trash">
                          <Badge className={`text-xs ${getStatusColor('trash')}`}>
                            trash
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {lead.groups && lead.groups.length > 0 ? (
                        lead.groups.map((group) => (
                          <Badge
                            key={group.id}
                            variant="secondary"
                            className="text-xs px-2 py-0.5"
                            title={group.name}
                          >
                            {group.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No groups</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="text-sm text-muted-foreground truncate max-w-[100px]" title={lead.forms?.name || lead.source || 'Direct'}>
                      {lead.forms?.name || lead.source || 'Direct'}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="text-xs text-muted-foreground" title={format(new Date(lead.created_at), 'PPpp')}>
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                </TableRow>
              ];

              if (expandedLeads.includes(lead.id)) {
                rows.push(                  <TableRow key={`${lead.id}-expanded`}>
                    <TableCell colSpan={8} className="px-6 py-4 bg-accent/20 border-t border-accent/30">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Lead Information */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Lead Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Full Name:</span>
                                <span className="text-muted-foreground">{lead.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Email:</span>
                                <span className="text-muted-foreground break-all">{lead.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Phone:</span>
                                <span className="text-muted-foreground">{lead.phone || 'Not provided'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Source:</span>
                                <span className="text-muted-foreground">{lead.forms?.name || lead.source || 'Direct'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-foreground">Status:</span>
                                <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                                  {lead.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Timeline</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-foreground block">Created:</span>
                                <div className="text-muted-foreground text-xs mt-1">
                                  {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                                  <br />
                                  <span className="italic">
                                    ({formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })})
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-foreground block">Last Updated:</span>
                                <div className="text-muted-foreground text-xs mt-1">
                                  {format(new Date(lead.updated_at), 'MMM dd, yyyy HH:mm')}
                                  <br />
                                  <span className="italic">
                                    ({formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Groups & Tags */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Groups & Tags</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium text-foreground block mb-2">Groups:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lead.groups && lead.groups.length > 0 ? (
                                    lead.groups.map((group) => (
                                      <Badge key={group.id} variant="secondary" className="text-xs">
                                        {group.name}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">No groups</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-foreground block mb-2">Tags:</span>
                                {renderTags(lead.tags)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {lead.notes && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Notes</h4>
                            <div className="p-3 bg-background rounded-md border text-sm">
                              <p className="text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Form Data */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Form Submission Data</h4>
                          <div className="p-3 bg-background rounded-md border">
                            {renderFormData(lead.form_data, lead.forms?.fields)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }              return rows;
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
