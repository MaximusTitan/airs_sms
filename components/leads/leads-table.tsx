"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  // Helper function to get the "Registered as" value from form data
  const getRegisteredAsValue = (lead: typeof processedLeads[0]) => {
    if (!lead.form_data) {
      return null;
    }

    // For form-based leads, try to find the Role field in the form definition
    if (lead.forms?.fields) {
      const roleField = lead.forms.fields.find(field => 
        field.label.toLowerCase() === 'role' || 
        field.label.toLowerCase() === 'registered as'
      );

      if (roleField) {
        const roleValue = lead.form_data[roleField.id];
        if (roleValue && String(roleValue).trim() && roleValue !== '-') {
          return String(roleValue);
        }
      }
    }

    // For CSV imports, check for role-related fields
    const headerMapping = (lead.form_data._csv_header_mapping as unknown as Record<string, string>) || {};
    
    // Look for nested header mapping (actual field ID to header name mapping)
    let actualHeaderMapping: Record<string, string> = {};
    for (const [key, value] of Object.entries(lead.form_data)) {
      if (key !== '_csv_header_mapping' && typeof value === 'object' && value !== null) {
        const nestedValue = value as Record<string, string>;
        const hasFieldIds = Object.keys(nestedValue).some(k => k.startsWith('field_') || (k.length === 36 && k.includes('-')));
        if (hasFieldIds) {
          actualHeaderMapping = nestedValue;
          break;
        }
      }
    }
    
    // Look for role-related entries
    for (const [key, value] of Object.entries(lead.form_data)) {
      if (key === '_csv_header_mapping' || typeof value === 'object') continue;
      
      const keyLower = key.toLowerCase();
      const headerName = (headerMapping[key] || actualHeaderMapping[key] || '').toLowerCase();
      
      // Check if this field represents a role
      if ((keyLower.includes('role') || 
           keyLower.includes('registered') ||
           headerName.includes('role') ||
           headerName.includes('registered')) &&
          value && String(value).trim() && value !== '-') {
        return String(value);
      }
    }

    return null;
  };
  const renderFormData = (formData: Record<string, string | boolean | number>, formFields?: FormField[]) => {
    if (!formData || Object.keys(formData).length === 0) {
      return <span className="text-muted-foreground text-sm">No additional data</span>;
    }

    // Create a map of field IDs to field labels for quick lookup
    const fieldLabelMap = formFields?.reduce((acc, field) => {
      if (field.id && field.label) {
        acc[field.id] = field.label;
      }
      return acc;
    }, {} as Record<string, string>) || {};

    // Get the CSV header mapping if it exists
    const headerMapping = (formData._csv_header_mapping as unknown as Record<string, string>) || {};
    
    // Look for nested header mapping (which contains the actual field ID to header name mapping)
    let actualHeaderMapping: Record<string, string> = {};
    
    // Find the nested mapping object that contains field_* keys
    for (const [key, value] of Object.entries(formData)) {
      if (key !== '_csv_header_mapping' && typeof value === 'object' && value !== null) {
        const nestedValue = value as Record<string, string>;
        // Check if this object contains field IDs as keys
        const hasFieldIds = Object.keys(nestedValue).some(k => k.startsWith('field_') || (k.length === 36 && k.includes('-')));
        if (hasFieldIds) {
          actualHeaderMapping = nestedValue;
          break;
        }
      }
    }



    // Fields to exclude from form data display (already shown in Lead Information)
    const excludeFields = new Set(['name', 'email', 'phone', 'full_name', 'fullname']);
    
    // Create better display labels for all keys
    const processedEntries = Object.entries(formData)
      .filter(([key]) => {
        // Exclude metadata and nested mapping objects
        return key !== '_csv_header_mapping' && 
               typeof formData[key] !== 'object';
      })
      .map(([key, value]) => {
        let displayLabel = '';
        
        // First priority: Check if this key is a form field ID and we have the form fields
        if (fieldLabelMap[key]) {
          displayLabel = fieldLabelMap[key];
        }
        // Second priority: Check the actual header mapping (nested object)
        else if (actualHeaderMapping[key]) {
          displayLabel = actualHeaderMapping[key];
        }
        // Third priority: Check the main CSV header mapping (UUID to field ID mapping)
        else if (headerMapping[key]) {
          // This maps UUID to field ID, so now look up that field ID in actualHeaderMapping
          const fieldId = headerMapping[key];
          if (actualHeaderMapping[fieldId]) {
            displayLabel = actualHeaderMapping[fieldId];
          } else {
            // Fallback to formatting the field ID
            displayLabel = String(fieldId)
              .replace(/[_-]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
        }
        // Fourth priority: Check if it looks like a UUID (UUID keys from CSV import)
        else if (key.length === 36 && key.includes('-')) {
          // Try to find this UUID in the header mapping first
          const fieldId = headerMapping[key];
          if (fieldId && actualHeaderMapping[fieldId]) {
            displayLabel = actualHeaderMapping[fieldId];
          } else {
            // Fallback for orphaned UUID keys
            displayLabel = `Additional Field ${Object.keys(formData).filter(k => k !== '_csv_header_mapping' && typeof formData[k] !== 'object').indexOf(key) + 1}`;
          }
        }
        // Fifth priority: Use the key as is and format it nicely
        else {
          displayLabel = key
            .replace(/[_-]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        return { key, value, displayLabel };
      });

    const filteredEntries = processedEntries.filter(({ displayLabel, key }) => {
      const lowerLabel = String(displayLabel).toLowerCase();
      const lowerKey = String(key).toLowerCase();
      
      // Exclude basic fields that are already shown in Lead Information
      const isBasicField = excludeFields.has(lowerLabel) ||
                          excludeFields.has(lowerKey) ||
                          lowerLabel.includes('name') ||
                          lowerLabel.includes('email') ||
                          lowerLabel.includes('phone') ||
                          lowerLabel.includes('full name');
      
      // Also exclude role/registered as field since it's shown in the Role column
      const isRoleField = lowerLabel.includes('role') || 
                         lowerLabel.includes('registered as') ||
                         lowerKey.includes('role');
      
      return !isBasicField && !isRoleField;
    });

    if (filteredEntries.length === 0) {
      return <span className="text-muted-foreground text-sm">No additional data</span>;
    }    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        {filteredEntries.map(({ key, value, displayLabel }) => {
          return (
            <div key={String(key)} className="space-y-1">
              <div className="text-sm font-medium text-foreground capitalize">
                {displayLabel}:
              </div>
              <div className="text-sm text-muted-foreground break-words pl-2">
                {typeof value === 'boolean' 
                  ? (value ? 'Yes' : 'No') 
                  : value === '-' 
                    ? <span className="italic text-xs">No data</span>
                    : (
                      <div className="whitespace-pre-wrap">
                        {String(value).split('\n').map((line, index) => (
                          <div key={index} className="mb-1 last:mb-0">
                            {line.trim() || <span className="italic text-xs">Empty line</span>}
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </div>
          );
        })}
      </div>
    );};

  return (
    <Card className="overflow-hidden shadow-sm border border-border/40">
      <Table>
        <TableHeader className="bg-accent/50 border-b border-border/40">
          <TableRow className="border-b border-border/40 hover:bg-transparent">
            <TableHead className="px-3 py-3 w-10">
              <Checkbox 
                checked={selectedLeads.length === processedLeads.length && processedLeads.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Email</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Phone</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Role</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Status</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Groups</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Source</TableHead>
            <TableHead className="px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>          {processedLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="px-6 py-16 text-center">
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
                  </TableCell>                  <TableCell className="px-3 py-3">
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={lead.email}>
                      {lead.email && lead.email !== '-' ? lead.email : <span className="text-xs italic">No email</span>}
                    </div>
                  </TableCell>                  <TableCell className="px-3 py-3">
                    <div className="text-sm text-muted-foreground">
                      {lead.phone && lead.phone !== '-' ? lead.phone : <span className="text-xs italic">No phone</span>}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="text-sm text-muted-foreground">
                      {getRegisteredAsValue(lead) || <span className="text-xs italic">N/A</span>}
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

              if (expandedLeads.includes(lead.id)) {                rows.push(                  <TableRow key={`${lead.id}-expanded`}>
                    <TableCell colSpan={9} className="px-6 py-4 bg-accent/20 border-t border-accent/30">
                      <div className="space-y-4">                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Lead Information */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Lead Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Full Name:</span>
                                <span className="text-muted-foreground">{lead.name}</span>
                              </div>                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Email:</span>
                                <span className="text-muted-foreground break-all">{lead.email && lead.email !== '-' ? lead.email : 'Not provided'}</span>
                              </div>                              <div className="flex justify-between">
                                <span className="font-medium text-foreground">Phone:</span>
                                <span className="text-muted-foreground">{lead.phone && lead.phone !== '-' ? lead.phone : 'Not provided'}</span>
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
                        </div>

                        {/* Notes */}
                        {lead.notes && lead.notes !== '-' && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">Notes</h4>
                            <div className="p-3 bg-background rounded-md border text-sm">
                              <div className="text-muted-foreground whitespace-pre-wrap">
                                {lead.notes.split('\n').map((line, index) => (
                                  <div key={index} className="mb-1 last:mb-0">
                                    {line.trim() || <span className="text-xs italic">Empty line</span>}
                                  </div>
                                ))}
                              </div>
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
