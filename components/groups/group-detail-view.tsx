"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadGroup, Lead, LeadStatus, FormField } from "@/lib/types/database";

import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Users,
} from "lucide-react";

// Import new components
import { GroupTableFilters, FilterOptions } from "./group-table-filters";
import { sortData, SortConfig, TableSortHeader } from "./table-sort-header";
import { GroupMemberRow } from "./group-member-row";
import { LeadDetailsRow } from "./lead-details-row";
import { EditLeadDialog } from "./edit-lead-dialog";

interface LeadWithForm extends Lead {
  forms?: {
    name: string;
    fields: FormField[];
  };
}

interface GroupWithDetailedMembers extends LeadGroup {
  group_memberships: {
    id: string;
    created_at: string;
    leads: LeadWithForm;
  }[];
}

interface GroupDetailViewProps {
  group: GroupWithDetailedMembers;
}

export function GroupDetailView({ group }: GroupDetailViewProps) {
  const router = useRouter();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [expandedLeads, setExpandedLeads] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<LeadWithForm[]>([]);
  const [selectedNewLeads, setSelectedNewLeads] = useState<string[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(
    group.description || ""
  );
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadWithForm | null>(null);

  // New state for advanced filtering and sorting
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
    statusFilter: "all",
    sourceFilter: "all",
    dateRange: { from: null, to: null },
    tagsFilter: [],
    formFilter: "all",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: null,
  });

  const members = useMemo(() => group.group_memberships || [], [group.group_memberships]);

  // Get unique values for filter options
  const availableSources = useMemo(() => {
    const sources = members
      .map(member => member.leads.source)
      .filter((source): source is string => Boolean(source));
    return Array.from(new Set(sources));
  }, [members]);

  const availableTags = useMemo(() => {
    const allTags = members.flatMap(member => member.leads.tags || []);
    return Array.from(new Set(allTags)).filter(Boolean);
  }, [members]);

  const availableForms = useMemo(() => {
    const forms = members
      .map(member => member.leads.forms)
      .filter(Boolean)
      .map(form => ({ id: form!.name, name: form!.name }));
    return Array.from(
      new Map(forms.map(form => [form.id, form])).values()
    );
  }, [members]);

  // Helper function to get the "Registered as" value from form data
  const getRegisteredAsValue = (lead: LeadWithForm) => {
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
    
    // Look for nested header mapping
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

  // Apply filters and sorting
  const processedMembers = useMemo(() => {
    let filtered = members.filter((member) => {
      const lead = member.leads;
      
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
        const memberDate = new Date(member.created_at);
        if (filters.dateRange.from && memberDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && memberDate > filters.dateRange.to) {
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
      filtered = sortData(filtered, sortConfig, (member, key) => {
        const lead = member.leads;
        
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
          case "created_at":
            return new Date(member.created_at);
          case "lead_created_at":
            return new Date(lead.created_at);
          case "updated_at":
            return new Date(lead.updated_at);
          case "tags":
            return (lead.tags || []).join(", ");
          case "tag_count":
            return (lead.tags || []).length;
          default:
            return "";
        }
      });
    }

    return filtered;
  }, [members, filters, sortConfig]);

  // Filter available leads based on search query
  const filteredAvailableLeads = availableLeads.filter((lead) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (lead.name && lead.name.toLowerCase().includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.phone && lead.phone.toLowerCase().includes(query))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified":
        return "bg-green-100 text-green-800 border-green-200";
      case "unqualified":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "trash":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusCounts = () => {
    const counts = {
      qualified: 0,
      unqualified: 0,
      trash: 0,
    };

    members.forEach((member) => {
      counts[member.leads.status as keyof typeof counts]++;
    });

    return counts;
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    setIsUpdating(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error updating lead status:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle bulk email for the entire group
  const handleSendGroupEmail = () => {
    router.push(`/dashboard/emails/compose?groups=${group.id}`);
  };

  // Handle bulk email for selected leads in this group
  const handleSendSelectedEmail = () => {
    if (selectedLeads.length > 0) {
      const leadIds = selectedLeads.join(",");
      router.push(`/dashboard/emails/compose?leads=${leadIds}`);
    }
  };

  const updateBulkStatus = async (newStatus: LeadStatus) => {
    setIsUpdating("bulk");
    try {
      const response = await fetch("/api/leads/bulk-update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadIds: selectedLeads, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update statuses");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error updating lead statuses:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const updateGroup = async () => {
    if (!groupName.trim()) return;

    setIsUpdating("group");
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update group");
      }

      setIsEditGroupOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group");
    } finally {
      setIsUpdating(null);
    }
  };

  const removeFromGroup = async (membershipId: string) => {
    if (!confirm("Are you sure you want to remove this lead from the group?")) {
      return;
    }

    setIsUpdating(membershipId);
    try {
      const response = await fetch(
        `/api/groups/memberships/${membershipId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove from group");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error removing from group:", error);
      alert("Failed to remove from group");
    } finally {
      setIsUpdating(null);
    }  };

  const fetchAvailableLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const leads = await response.json();
      
      // Filter out leads that are already members of this group
      const currentMemberIds = members.map(member => member.leads.id);
      const available = leads.filter((lead: LeadWithForm) => !currentMemberIds.includes(lead.id));
      
      setAvailableLeads(available);
    } catch (error) {
      console.error('Error fetching available leads:', error);
      alert('Failed to fetch available leads');
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const addMembersToGroup = async () => {
    if (selectedNewLeads.length === 0) return;

    setIsAddingMembers(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadIds: selectedNewLeads }),
      });

      if (!response.ok) {
        throw new Error('Failed to add members');
      }

      const result = await response.json();
      alert(`Successfully added ${result.addedCount} members to the group`);
        // Reset and close dialog
      setSelectedNewLeads([]);
      setSearchQuery("");
      setIsAddMembersOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleOpenAddMembers = () => {
    setIsAddMembersOpen(true);
    fetchAvailableLeads();
  };

  const handleSelectNewLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedNewLeads([...selectedNewLeads, leadId]);
    } else {
      setSelectedNewLeads(selectedNewLeads.filter(id => id !== leadId));
    }
  };
  const handleSelectAllNewLeads = (checked: boolean) => {
    if (checked) {
      // Add all filtered leads to selection, keeping existing selections from other searches
      const newSelections = filteredAvailableLeads.map(lead => lead.id);
      const uniqueSelections = [...new Set([...selectedNewLeads, ...newSelections])];
      setSelectedNewLeads(uniqueSelections);
    } else {
      // Remove all filtered leads from selection
      const filteredIds = filteredAvailableLeads.map(lead => lead.id);
      setSelectedNewLeads(selectedNewLeads.filter(id => !filteredIds.includes(id)));
    }  };

  const bulkRemoveFromGroup = async () => {
    if (selectedLeads.length === 0) return;
    
    if (!confirm(`Are you sure you want to remove ${selectedLeads.length} member${selectedLeads.length !== 1 ? 's' : ''} from this group?`)) {
      return;
    }

    setIsUpdating('bulk-remove');
    try {
      // Get the membership IDs for the selected leads
      const membershipIds = members
        .filter(member => selectedLeads.includes(member.leads.id))
        .map(member => member.id);

      // Remove each membership
      const removePromises = membershipIds.map(membershipId =>
        fetch(`/api/groups/memberships/${membershipId}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(removePromises);
      
      // Check if all removals were successful
      const failedRemovals = responses.filter(response => !response.ok);
      
      if (failedRemovals.length > 0) {
        throw new Error(`Failed to remove ${failedRemovals.length} member${failedRemovals.length !== 1 ? 's' : ''}`);
      }

      alert(`Successfully removed ${selectedLeads.length} member${selectedLeads.length !== 1 ? 's' : ''} from the group`);
      setSelectedLeads([]);
      window.location.reload();
    } catch (error) {
      console.error('Error removing members from group:', error);
      alert('Failed to remove some members from the group');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(processedMembers.map((member) => member.leads.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const toggleExpandLead = (leadId: string) => {
    setExpandedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleEditLead = (leadId: string) => {
    const member = members.find(m => m.leads.id === leadId);
    if (member) {
      setEditingLead(member.leads);
      setIsEditLeadOpen(true);
    }
  };

  const handleSaveLead = async (leadId: string, updatedLead: Partial<LeadWithForm>) => {
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

  const renderFormData = (
    formData: Record<string, string | boolean | number>,
    formFields?: FormField[]
  ) => {
    if (!formData || Object.keys(formData).length === 0) {
      return (
        <span className="text-muted-foreground text-sm">
          No additional data
        </span>
      );
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
    }

    return (
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
    );
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-muted-foreground text-lg mt-1">
                {group.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Group</DialogTitle>
                <DialogDescription>
                  Update the group name and description.
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
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditGroupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={updateGroup}
                  disabled={!groupName.trim() || isUpdating === "group"}
                >
                  {isUpdating === "group" ? "Updating..." : "Update Group"}
                </Button>
              </DialogFooter>
            </DialogContent>          </Dialog>

          <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Members to Group</DialogTitle>                <DialogDescription>
                  Select leads to add to &quot;{group.name}&quot;. Only leads not already in this group are shown.
                </DialogDescription>
              </DialogHeader>              <div className="py-4">
                {isLoadingLeads ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading available leads...</p>
                  </div>
                ) : availableLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No available leads to add to this group.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search Input */}
                    <div className="space-y-2">
                      <Label htmlFor="search-leads">Search Leads</Label>
                      <Input
                        id="search-leads"
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-new"
                          checked={
                            filteredAvailableLeads.length > 0 && 
                            filteredAvailableLeads.every(lead => selectedNewLeads.includes(lead.id))
                          }
                          onCheckedChange={handleSelectAllNewLeads}
                        />
                        <Label htmlFor="select-all-new" className="text-sm font-medium">
                          Select all visible ({filteredAvailableLeads.length} leads)
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? `${filteredAvailableLeads.length} of ${availableLeads.length} leads shown` : `${availableLeads.length} leads available`}
                      </p>
                    </div>
                    
                    {filteredAvailableLeads.length === 0 && searchQuery ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No leads found matching &quot;{searchQuery}&quot;</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAvailableLeads.map((lead) => (
                              <TableRow key={lead.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedNewLeads.includes(lead.id)}
                                    onCheckedChange={(checked) => 
                                      handleSelectNewLead(lead.id, checked as boolean)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{lead.name}</TableCell>
                                <TableCell>{lead.email}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(lead.status)}>
                                    {lead.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      {selectedNewLeads.length} of {availableLeads.length} leads selected
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddMembersOpen(false);
                    setSelectedNewLeads([]);
                    setSearchQuery("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={addMembersToGroup}
                  disabled={selectedNewLeads.length === 0 || isAddingMembers}
                >
                  {isAddingMembers ? "Adding..." : `Add ${selectedNewLeads.length} Members`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSendGroupEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email to All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{members.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.qualified}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unqualified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.unqualified}
            </div>
          </CardContent>
        </Card>        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.trash}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Filters Component */}
      <GroupTableFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableSources={availableSources}
        availableTags={availableTags}
        availableForms={availableForms}
        totalMembers={members.length}
        filteredCount={processedMembers.length}
        onAddMembers={handleOpenAddMembers}
      />

      {/* Members Table */}
      <Card className="overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow>
              <TableHead className="px-6 py-4 w-12">
                <Checkbox
                  checked={
                    selectedLeads.length === processedMembers.length &&
                    processedMembers.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="px-6 py-4 w-12"></TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Name"
                  sortKey="name"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Email"
                  sortKey="email"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Phone"
                  sortKey="phone"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Role"
                  sortKey="role"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Source"
                  sortKey="source"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4">
                <TableSortHeader
                  label="Added"
                  sortKey="created_at"
                  currentSort={sortConfig}
                  onSort={setSortConfig}
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                />
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>            {processedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="px-6 py-12 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm">
                      {members.length === 0
                        ? "This group doesn't have any members yet"
                        : "No members match the current filters"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              processedMembers.flatMap((member) => [
                <GroupMemberRow
                  key={member.id}
                  member={member}
                  isSelected={selectedLeads.includes(member.leads.id)}
                  isExpanded={expandedLeads.includes(member.leads.id)}
                  isUpdating={isUpdating}
                  onSelectLead={handleSelectLead}
                  onToggleExpand={toggleExpandLead}
                  onUpdateStatus={updateLeadStatus}
                  onRemoveFromGroup={removeFromGroup}
                  onEditLead={handleEditLead}
                  getStatusColor={getStatusColor}
                  getRegisteredAsValue={getRegisteredAsValue}
                />,
                ...(expandedLeads.includes(member.leads.id)
                  ? [
                      <LeadDetailsRow
                        key={`${member.leads.id}-expanded`}
                        member={member}
                        getRegisteredAsValue={getRegisteredAsValue}
                        renderFormData={renderFormData}
                      />
                    ]
                  : [])
              ])
            )}
          </TableBody>
        </Table>

        {selectedLeads.length > 0 && (
          <div className="px-6 py-4 bg-primary/10 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary font-medium">
                {selectedLeads.length} member{selectedLeads.length !== 1 ? 's' : ''} selected
              </span>              <div className="flex gap-3 items-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSendSelectedEmail}
                  disabled={isUpdating === 'bulk-remove'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Bulk Email
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={bulkRemoveFromGroup}
                  disabled={isUpdating === 'bulk-remove'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isUpdating === 'bulk-remove' ? 'Removing...' : 'Remove from Group'}
                </Button>
                <Select 
                  onValueChange={(value) => updateBulkStatus(value as LeadStatus)} 
                  disabled={isUpdating === 'bulk' || isUpdating === 'bulk-remove'}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Update Status" />
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
              </div>
            </div>
          </div>
        )}
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
