"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead, LeadStatus, FormField } from "@/lib/types/database";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, ChevronRight, MoreHorizontal, Edit, Mail } from "lucide-react";

// Import new components
import { LeadsTableFilters, LeadsFilterOptions } from "./leads-table-filters";
import { LeadsTableActions } from "./leads-table-actions";
import { LeadsTableHeader } from "./leads-table-header";
import { sortData, SortConfig } from "../groups/table-sort-header";
import { EditLeadDialog } from "./edit-lead-dialog";

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
  }));

  const [expandedLeads, setExpandedLeads] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<typeof processedLeads[0] | null>(null);

  // New state for filtering and sorting
  const [filters, setFilters] = useState<LeadsFilterOptions>({
    searchQuery: "",
    statusFilter: "all",
    sourceFilter: "all",
    groupFilter: "all",
    dateRange: { from: null, to: null },
    tagsFilter: [],
    formFilter: "all",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: null,
  });

  // Get unique values for filter options
  const availableSources = useMemo(() => {
    const sources = processedLeads
      .map(lead => lead.forms?.name || lead.source)
      .filter((source): source is string => Boolean(source));
    return Array.from(new Set(sources));
  }, [processedLeads]);

  const availableGroups = useMemo(() => {
    const allGroups = processedLeads.flatMap(lead => lead.groups);
    return Array.from(
      new Map(allGroups.map(group => [group.id, group])).values()
    );
  }, [processedLeads]);

  const availableTags = useMemo(() => {
    const allTags = processedLeads.flatMap(lead => lead.tags || []);
    return Array.from(new Set(allTags)).filter(Boolean);
  }, [processedLeads]);

  const availableForms = useMemo(() => {
    const forms = processedLeads
      .map(lead => lead.forms)
      .filter(Boolean)
      .map(form => ({ id: form!.name, name: form!.name }));
    return Array.from(
      new Map(forms.map(form => [form.id, form])).values()
    );
  }, [processedLeads]);

  // Helper function to get the "Registered as" value from form data
  const getRegisteredAsValue = useCallback((lead: typeof processedLeads[0]) => {
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
  }, []);

  // Apply filters and sorting
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = processedLeads.filter((lead) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchMatch = 
          (lead.name && lead.name.toLowerCase().includes(query)) ||
          (lead.email && lead.email.toLowerCase().includes(query)) ||
          (lead.phone && lead.phone.toLowerCase().includes(query));
        if (!searchMatch) return false;
      }

      // Status filter
      if (filters.statusFilter !== "all" && lead.status !== filters.statusFilter) {
        return false;
      }

      // Source filter
      if (filters.sourceFilter !== "all") {
        const leadSource = lead.forms?.name || lead.source;
        if (leadSource !== filters.sourceFilter) {
          return false;
        }
      }

      // Group filter
      if (filters.groupFilter !== "all") {
        if (filters.groupFilter === "none" && lead.groups.length > 0) {
          return false;
        }
        if (filters.groupFilter !== "none" && !lead.groups.some(group => group.id === filters.groupFilter)) {
          return false;
        }
      }

      // Form filter
      if (filters.formFilter !== "all") {
        if (filters.formFilter === "none" && lead.forms) {
          return false;
        }
        if (filters.formFilter !== "none" && (!lead.forms || lead.forms.name !== filters.formFilter)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const leadDate = new Date(lead.created_at);
        if (filters.dateRange.from && leadDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && leadDate > filters.dateRange.to) {
          return false;
        }
      }

      // Tags filter
      if (filters.tagsFilter.length > 0) {
        const leadTags = lead.tags || [];
        const hasMatchingTag = filters.tagsFilter.some(tag => leadTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      filtered = sortData(filtered, sortConfig, (lead, key) => {
        switch (key) {
          case "name":
            return lead.name || "";
          case "email":
            return lead.email || "";
          case "phone":
            return lead.phone || "";
          case "status":
            return lead.status;
          case "source":
            return lead.forms?.name || lead.source || "";
          case "role":
            return getRegisteredAsValue(lead) || "";
          case "groups":
            return lead.groups.length > 0 ? lead.groups[0].name : "";
          case "created_at":
            return new Date(lead.created_at);
          default:
            return "";
        }
      });
    }

    return filtered;
  }, [processedLeads, filters, sortConfig, getRegisteredAsValue]);

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
      setSelectedLeads(filteredAndSortedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Bulk action handlers
  const handleSendEmail = () => {
    if (selectedLeads.length > 0) {
      const leadIds = selectedLeads.join(',');
      // Navigate to email compose page with selected leads
      // This would be handled by the parent component typically
      console.log('Send email to leads:', leadIds);
    }
  };

  const handleCreateGroup = () => {
    if (selectedLeads.length > 0) {
      // Open create group dialog with selected leads
      // This would be handled by the parent component typically
      console.log('Create group with leads:', selectedLeads);
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
  const toggleExpandLead = (leadId: string) => {
    setExpandedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleEditLead = (leadId: string) => {
    const lead = processedLeads.find(l => l.id === leadId);
    if (lead) {
      setEditingLead(lead);
      setIsEditLeadOpen(true);
    }
  };

  const handleSaveLead = async (leadId: string, updatedLead: Partial<typeof processedLeads[0]>) => {
    setIsUpdating(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedLead),
      });

      if (!response.ok) {
        throw new Error("Failed to update lead");
      }

      setIsEditLeadOpen(false);
      setEditingLead(null);
      window.location.reload();
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead");
    } finally {
      setIsUpdating(null);
    }
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
    <div className="space-y-4">
      {/* Filters */}
      <LeadsTableFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableSources={availableSources}
        availableGroups={availableGroups}
        availableTags={availableTags}
        availableForms={availableForms}
        totalLeads={processedLeads.length}
        filteredCount={filteredAndSortedLeads.length}
      />

      {/* Table */}
      <Card className="overflow-hidden shadow-sm border border-border/40">
        <Table>
          <TableHeader className="bg-accent/50 border-b border-border/40">
            <LeadsTableHeader
              selectedLeads={selectedLeads}
              totalLeads={filteredAndSortedLeads.length}
              sortConfig={sortConfig}
              onSort={setSortConfig}
              onSelectAll={handleSelectAll}
            />
          </TableHeader>
          <TableBody>
            {filteredAndSortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="px-6 py-16 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No leads found</p>
                    <p className="text-sm">
                      {processedLeads.length === 0 
                        ? "Create a form to start collecting leads"
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedLeads.flatMap((lead) => {
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
                  <TableCell className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditLead(lead.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ];
              if (expandedLeads.includes(lead.id)) {
                rows.push(
                  <TableRow key={`${lead.id}-expanded`}>
                    <TableCell colSpan={10} className="px-6 py-4 bg-accent/20 border-t border-accent/30">
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
              }
              return rows;
            })}
        </TableBody>
      </Table>

      {/* Bulk Actions */}
      <LeadsTableActions
        selectedLeads={selectedLeads}
        isUpdating={isUpdating}
        onSendEmail={handleSendEmail}
        onUpdateStatus={updateBulkStatus}
        onCreateGroup={handleCreateGroup}
        onExportSelected={() => {
          // TODO: Implement export functionality
          console.log('Export selected leads');
        }}
        onCopySelected={() => {
          // TODO: Implement copy functionality
          const selectedData = filteredAndSortedLeads
            .filter(lead => selectedLeads.includes(lead.id))
            .map(lead => `${lead.name}\t${lead.email}\t${lead.phone || ''}`)
            .join('\n');
          navigator.clipboard.writeText(selectedData);
        }}
      />
    </Card>

    {/* Edit Lead Dialog */}
    <EditLeadDialog
      isOpen={isEditLeadOpen}
      onClose={() => {
        setIsEditLeadOpen(false);
        setEditingLead(null);
      }}
      lead={editingLead}
      onSave={handleSaveLead}
      isUpdating={isUpdating === editingLead?.id}
    />
    </div>
  );
}
