"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { safeFormatDate, safeFormatDistanceToNow } from "@/lib/utils/date-utils";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Mail,
  Edit3,
  Save,
} from "lucide-react";

// Import new components
import { LeadsTableFilters, LeadsFilterOptions } from "./leads-table-filters";
import { LeadsTableActions } from "./leads-table-actions";
import { LeadsTableHeader } from "./leads-table-header";
import { sortData, SortConfig } from "../groups/table-sort-header";
import { EditLeadDialog } from "./edit-lead-dialog";
import { Pagination } from "@/components/ui/pagination";

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  currentNotes: string | null;
  onSave: (notes: string) => Promise<void>;
  isUpdating: boolean;
}

function NotesDialog({
  isOpen,
  onClose,
  leadName,
  currentNotes,
  onSave,
  isUpdating,
}: NotesDialogProps) {
  const [notes, setNotes] = useState(currentNotes || "");

  const handleSave = async () => {
    await onSave(notes);
    onClose();
  };

  const handleClose = () => {
    setNotes(currentNotes || "");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Notes</DialogTitle>
          <DialogDescription>
            Update notes for <strong>{leadName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Notes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LeadsTableProps {
  leads: (Lead & {
    forms?: { name: string; fields: FormField[] };
    group_memberships?: { lead_groups: { id: string; name: string } }[];
  })[];
  selectedLeads?: string[];
  onSelectedLeadsChange?: (leads: string[]) => void;
}

export function LeadsTable({
  leads,
  selectedLeads: externalSelectedLeads,
  onSelectedLeadsChange,
}: LeadsTableProps) {
  const [internalSelectedLeads, setInternalSelectedLeads] = useState<string[]>(
    [],
  );

  // Use external selectedLeads if provided, otherwise use internal state
  const selectedLeads = externalSelectedLeads ?? internalSelectedLeads;
  const setSelectedLeads = onSelectedLeadsChange ?? setInternalSelectedLeads;

  // Process leads to transform group_memberships into groups array
  const processedLeads = leads.map((lead) => ({
    ...lead,
    groups:
      lead.group_memberships?.map((membership) => membership.lead_groups) || [],
  }));

  const [expandedLeads, setExpandedLeads] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<
    (typeof processedLeads)[0] | null
  >(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notesEditingLead, setNotesEditingLead] = useState<
    (typeof processedLeads)[0] | null
  >(null);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Get unique values for filter options
  const availableSources = useMemo(() => {
    const sources = processedLeads
      .map((lead) => lead.forms?.name || lead.source)
      .filter((source): source is string => Boolean(source));
    return Array.from(new Set(sources));
  }, [processedLeads]);

  const availableGroups = useMemo(() => {
    const allGroups = processedLeads.flatMap((lead) => lead.groups);
    return Array.from(
      new Map(allGroups.map((group) => [group.id, group])).values(),
    );
  }, [processedLeads]);

  const availableTags = useMemo(() => {
    const allTags = processedLeads.flatMap((lead) => lead.tags || []);
    return Array.from(new Set(allTags)).filter(Boolean);
  }, [processedLeads]);

  const availableForms = useMemo(() => {
    const forms = processedLeads
      .map((lead) => lead.forms)
      .filter(Boolean)
      .map((form) => ({ id: form!.name, name: form!.name }));
    return Array.from(new Map(forms.map((form) => [form.id, form])).values());
  }, [processedLeads]);

  // Helper function to get the "Registered as" value from form data
  const getRegisteredAsValue = useCallback(
    (lead: (typeof processedLeads)[0]) => {
      if (!lead.form_data) {
        return null;
      }

      // For form-based leads, try to find the Role field in the form definition
      if (lead.forms?.fields) {
        const roleField = lead.forms.fields.find(
          (field) =>
            field.label.toLowerCase() === "role" ||
            field.label.toLowerCase() === "registered as",
        );

        if (roleField) {
          const roleValue = lead.form_data[roleField.id];
          if (roleValue && String(roleValue).trim() && roleValue !== "-") {
            return String(roleValue);
          }
        }
      }

      // For CSV imports, check for role-related fields
      const headerMapping =
        (lead.form_data._csv_header_mapping as unknown as Record<
          string,
          string
        >) || {};

      // Look for nested header mapping (actual field ID to header name mapping)
      let actualHeaderMapping: Record<string, string> = {};
      for (const [key, value] of Object.entries(lead.form_data)) {
        if (
          key !== "_csv_header_mapping" &&
          typeof value === "object" &&
          value !== null
        ) {
          const nestedValue = value as Record<string, string>;
          const hasFieldIds = Object.keys(nestedValue).some(
            (k) =>
              k.startsWith("field_") || (k.length === 36 && k.includes("-")),
          );
          if (hasFieldIds) {
            actualHeaderMapping = nestedValue;
            break;
          }
        }
      }

      // Look for role-related entries
      for (const [key, value] of Object.entries(lead.form_data)) {
        if (key === "_csv_header_mapping" || typeof value === "object")
          continue;

        const keyLower = key.toLowerCase();
        const headerName = (
          headerMapping[key] ||
          actualHeaderMapping[key] ||
          ""
        ).toLowerCase();

        // Check if this field represents a role
        if (
          (keyLower.includes("role") ||
            keyLower.includes("registered") ||
            headerName.includes("role") ||
            headerName.includes("registered")) &&
          value &&
          String(value).trim() &&
          value !== "-"
        ) {
          return String(value);
        }
      }

      return null;
    },
    [],
  );

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
      if (
        filters.statusFilter !== "all" &&
        lead.status !== filters.statusFilter
      ) {
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
        if (
          filters.groupFilter !== "none" &&
          !lead.groups.some((group) => group.id === filters.groupFilter)
        ) {
          return false;
        }
      }

      // Form filter
      if (filters.formFilter !== "all") {
        if (filters.formFilter === "none" && lead.forms) {
          return false;
        }
        if (
          filters.formFilter !== "none" &&
          (!lead.forms || lead.forms.name !== filters.formFilter)
        ) {
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
        const hasMatchingTag = filters.tagsFilter.some((tag) =>
          leadTags.includes(tag),
        );
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
          case "notes":
            return lead.notes || "";
          case "role":
            return getRegisteredAsValue(lead) || "";
          case "groups":
            return lead.groups.length > 0 ? lead.groups[0].name : "";
          case "created_at":
            try {
              const date = new Date(lead.created_at);
              return isNaN(date.getTime()) ? new Date(0) : date;
            } catch {
              return new Date(0);
            }
          default:
            return "";
        }
      });
    }

    return filtered;
  }, [processedLeads, filters, sortConfig, getRegisteredAsValue]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredAndSortedLeads.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new_lead":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "qualified":
        return "bg-green-100 text-green-800 border-green-200";
      case "pilot_ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "running_pilot":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "pilot_done":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "sale_done":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "implementation":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "not_interested":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "unqualified":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "trash":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-border";
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
      setSelectedLeads(filteredAndSortedLeads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Bulk action handlers
  const handleSendEmail = () => {
    if (selectedLeads.length > 0) {
      const leadIds = selectedLeads.join(",");
      // Navigate to email compose page with selected leads
      // This would be handled by the parent component typically
      // Send email to leads: leadIds
    }
  };

  const handleCreateGroup = () => {
    if (selectedLeads.length > 0) {
      // Open create group dialog with selected leads
      // This would be handled by the parent component typically
      // Create group with leads: selectedLeads
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
  const toggleExpandLead = (leadId: string) => {
    setExpandedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    );
  };

  const handleEditLead = (leadId: string) => {
    const lead = processedLeads.find((l) => l.id === leadId);
    if (lead) {
      setEditingLead(lead);
      setIsEditLeadOpen(true);
    }
  };

  const handleSaveLead = async (
    leadId: string,
    updatedLead: Partial<(typeof processedLeads)[0]>,
  ) => {
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

  const handleNotesEdit = (leadId: string) => {
    const lead = processedLeads.find((l) => l.id === leadId);
    if (lead) {
      setNotesEditingLead(lead);
      setIsNotesDialogOpen(true);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!notesEditingLead) return;

    setIsUpdatingNotes(true);
    try {
      const response = await fetch(`/api/leads/${notesEditingLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notes");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error updating notes:", error);
      throw error;
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const renderFormData = (
    formData: Record<string, string | boolean | number>,
    formFields?: FormField[],
  ) => {
    if (!formData || Object.keys(formData).length === 0) {
      return (
        <span className="text-muted-foreground text-sm">
          No additional data
        </span>
      );
    }

    // Create a map of field IDs to field labels for quick lookup
    const fieldLabelMap =
      formFields?.reduce(
        (acc, field) => {
          if (field.id && field.label) {
            acc[field.id] = field.label;
          }
          return acc;
        },
        {} as Record<string, string>,
      ) || {};

    // Get the CSV header mapping if it exists
    const headerMapping =
      (formData._csv_header_mapping as unknown as Record<string, string>) || {};

    // Look for nested header mapping (which contains the actual field ID to header name mapping)
    let actualHeaderMapping: Record<string, string> = {};

    // Find the nested mapping object that contains field_* keys
    for (const [key, value] of Object.entries(formData)) {
      if (
        key !== "_csv_header_mapping" &&
        typeof value === "object" &&
        value !== null
      ) {
        const nestedValue = value as Record<string, string>;
        // Check if this object contains field IDs as keys
        const hasFieldIds = Object.keys(nestedValue).some(
          (k) => k.startsWith("field_") || (k.length === 36 && k.includes("-")),
        );
        if (hasFieldIds) {
          actualHeaderMapping = nestedValue;
          break;
        }
      }
    }

    // Fields to exclude from form data display (already shown in Lead Information)
    const excludeFields = new Set([
      "name",
      "email",
      "phone",
      "full_name",
      "fullname",
    ]);

    // Create better display labels for all keys
    const processedEntries = Object.entries(formData)
      .filter(([key]) => {
        // Exclude metadata and nested mapping objects
        return (
          key !== "_csv_header_mapping" && typeof formData[key] !== "object"
        );
      })
      .map(([key, value]) => {
        let displayLabel = "";

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
              .replace(/[_-]/g, " ")
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(" ");
          }
        }
        // Fourth priority: Check if it looks like a UUID (UUID keys from CSV import)
        else if (key.length === 36 && key.includes("-")) {
          // Try to find this UUID in the header mapping first
          const fieldId = headerMapping[key];
          if (fieldId && actualHeaderMapping[fieldId]) {
            displayLabel = actualHeaderMapping[fieldId];
          } else {
            // Fallback for orphaned UUID keys
            displayLabel = `Additional Field ${
              Object.keys(formData)
                .filter(
                  (k) =>
                    k !== "_csv_header_mapping" &&
                    typeof formData[k] !== "object",
                )
                .indexOf(key) + 1
            }`;
          }
        }
        // Fifth priority: Use the key as is and format it nicely
        else {
          displayLabel = key
            .replace(/[_-]/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        }

        return { key, value, displayLabel };
      });

    const filteredEntries = processedEntries.filter(({ displayLabel, key }) => {
      const lowerLabel = String(displayLabel).toLowerCase();
      const lowerKey = String(key).toLowerCase();

      // Exclude basic fields that are already shown in Lead Information
      const isBasicField =
        excludeFields.has(lowerLabel) ||
        excludeFields.has(lowerKey) ||
        lowerLabel.includes("name") ||
        lowerLabel.includes("email") ||
        lowerLabel.includes("phone") ||
        lowerLabel.includes("full name");

      // Also exclude role/registered as field since it's shown in the Role column
      const isRoleField =
        lowerLabel.includes("role") ||
        lowerLabel.includes("registered as") ||
        lowerKey.includes("role");

      return !isBasicField && !isRoleField;
    });

    if (filteredEntries.length === 0) {
      return (
        <span className="text-muted-foreground text-sm">
          No additional data
        </span>
      );
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
                {typeof value === "boolean" ? (
                  value ? (
                    "Yes"
                  ) : (
                    "No"
                  )
                ) : value === "-" ? (
                  <span className="italic text-xs">No data</span>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {String(value)
                      .split("\n")
                      .map((line, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          {line.trim() || (
                            <span className="italic text-xs">Empty line</span>
                          )}
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

  // Memoized lead row component for better performance
  const LeadRowMemo = React.memo<{
    lead: Lead & {
      forms?: { name: string; fields: FormField[] };
      group_memberships?: { lead_groups: { id: string; name: string } }[];
      groups: { id: string; name: string }[];
    };
    isSelected: boolean;
    isExpanded: boolean;
    isUpdating: boolean;
    onToggleExpand: (id: string) => void;
    onSelectLead: (id: string, checked: boolean) => void;
    onUpdateStatus: (id: string, status: LeadStatus) => void;
    onEditLead: (leadId: string) => void;
    onEditNotes: (leadId: string) => void;
    getRegisteredAsValue: (lead: (typeof processedLeads)[0]) => string | null;
    getStatusColor: (status: LeadStatus) => string;
  }>(
    ({
      lead,
      isSelected,
      isExpanded,
      isUpdating,
      onToggleExpand,
      onSelectLead,
      onUpdateStatus,
      onEditLead,
      onEditNotes,
      getRegisteredAsValue,
      getStatusColor,
    }) => {
      return (
        <>
          <TableRow
            key={lead.id}
            className="hover:bg-accent/30 transition-colors border-b border-border/40 cursor-pointer"
            onClick={() => onToggleExpand(lead.id)}
          >
            <TableCell
              className="px-3 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelectLead(lead.id, checked as boolean)
                }
              />
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <div
                  className="text-sm font-medium text-foreground truncate max-w-[150px]"
                  title={lead.name}
                >
                  {lead.name}
                </div>
              </div>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div
                className="text-sm text-muted-foreground truncate max-w-[200px]"
                title={lead.email}
              >
                {lead.email && lead.email !== "-" ? (
                  lead.email
                ) : (
                  <span className="text-xs italic">No email</span>
                )}
              </div>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="text-sm text-muted-foreground">
                {lead.phone && lead.phone !== "-" ? (
                  lead.phone
                ) : (
                  <span className="text-xs italic">No phone</span>
                )}
              </div>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="text-sm text-muted-foreground">
                {getRegisteredAsValue(lead) || (
                  <span className="text-xs italic">N/A</span>
                )}
              </div>
            </TableCell>
            <TableCell
              className="px-3 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Select
                value={lead.status}
                onValueChange={(value) =>
                  onUpdateStatus(lead.id, value as LeadStatus)
                }
                disabled={isUpdating}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue>
                    <Badge
                      className={`text-xs ${getStatusColor(lead.status)}`}
                    >
                      {lead.status === "new_lead"
                        ? "New Lead"
                        : lead.status === "pilot_ready"
                          ? "Pilot Ready"
                          : lead.status === "running_pilot"
                            ? "Running Pilot"
                            : lead.status === "pilot_done"
                              ? "Pilot Done"
                              : lead.status === "sale_done"
                                ? "Sale Done"
                                : lead.status === "not_interested"
                                  ? "Not Interested"
                                  : lead.status}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="pilot_ready">Pilot Ready</SelectItem>
                  <SelectItem value="running_pilot">Running Pilot</SelectItem>
                  <SelectItem value="pilot_done">Pilot Done</SelectItem>
                  <SelectItem value="sale_done">Sale Done</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                  <SelectItem value="trash">Trash</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="text-sm text-muted-foreground">
                {lead.forms?.name || lead.source || (
                  <span className="text-xs italic">Unknown</span>
                )}
              </div>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="flex flex-wrap gap-1">
                {lead.groups && lead.groups.length > 0 ? (
                  lead.groups.map((group, index) => (
                    <Badge key={`${lead.id}-${index}`} variant="outline" className="text-xs">
                      {group.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    No groups
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="text-xs text-muted-foreground">
                {(() => {
                  return safeFormatDistanceToNow(lead.created_at, { addSuffix: true });
                })()}
              </div>
            </TableCell>
            <TableCell className="px-3 py-3">
              <div className="flex flex-wrap gap-1 max-w-[100px]">
                {lead.tags && lead.tags.length > 0 ? (
                  lead.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={`${lead.id}-tag-${index}`} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    No tags
                  </span>
                )}
                {lead.tags && lead.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{lead.tags.length - 2}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell
              className="px-3 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-accent"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onEditLead(lead.id)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEditNotes(lead.id)}
                    className="cursor-pointer"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(`mailto:${lead.email}`, "_blank")
                    }
                    className="cursor-pointer"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </>
      );
    },
  );

  LeadRowMemo.displayName = "LeadRowMemo";

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
                <TableCell colSpan={11} className="px-6 py-16 text-center">
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
            ) : (
              paginatedLeads.flatMap((lead) => {
                const rows = [
                  <LeadRowMemo
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLeads.includes(lead.id)}
                    isExpanded={expandedLeads.includes(lead.id)}
                    isUpdating={isUpdating === lead.id}
                    onToggleExpand={toggleExpandLead}
                    onSelectLead={handleSelectLead}
                    onUpdateStatus={updateLeadStatus}
                    onEditLead={handleEditLead}
                    onEditNotes={handleNotesEdit}
                    getRegisteredAsValue={getRegisteredAsValue}
                    getStatusColor={getStatusColor}
                  />,
                ];
                if (expandedLeads.includes(lead.id)) {
                  rows.push(
                    <TableRow key={`${lead.id}-expanded`}>
                      <TableCell
                        colSpan={11}
                        className="px-6 py-4 bg-accent/20 border-t border-accent/30"
                      >
                        <div className="space-y-4">
                          {" "}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Lead Information */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
                                Lead Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium text-foreground">
                                    Full Name:
                                  </span>
                                  <span className="text-muted-foreground">
                                    {lead.name}
                                  </span>
                                </div>{" "}
                                <div className="flex justify-between">
                                  <span className="font-medium text-foreground">
                                    Email:
                                  </span>
                                  <span className="text-muted-foreground break-all">
                                    {lead.email && lead.email !== "-"
                                      ? lead.email
                                      : "Not provided"}
                                  </span>
                                </div>{" "}
                                <div className="flex justify-between">
                                  <span className="font-medium text-foreground">
                                    Phone:
                                  </span>
                                  <span className="text-muted-foreground">
                                    {lead.phone && lead.phone !== "-"
                                      ? lead.phone
                                      : "Not provided"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium text-foreground">
                                    Source:
                                  </span>
                                  <span className="text-muted-foreground">
                                    {lead.forms?.name ||
                                      lead.source ||
                                      "Direct"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-foreground">
                                    Status:
                                  </span>
                                  <Badge
                                    className={`text-xs ${getStatusColor(lead.status)}`}
                                  >
                                    {lead.status === "new_lead"
                                      ? "New Lead"
                                      : lead.status === "pilot_ready"
                                        ? "Pilot Ready"
                                        : lead.status === "running_pilot"
                                          ? "Running Pilot"
                                          : lead.status === "pilot_done"
                                            ? "Pilot Done"
                                            : lead.status === "sale_done"
                                              ? "Sale Done"
                                              : lead.status === "not_interested"
                                                ? "Not Interested"
                                                : lead.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                  lead.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
                                Timeline
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-foreground block">
                                    Created:
                                  </span>
                                  <div className="text-muted-foreground text-xs mt-1">
                                    {(() => {
                                      try {
                                        const date = new Date(lead.created_at);
                                        if (isNaN(date.getTime())) {
                                          return "Invalid date";
                                        }
                                        return (
                                          <>
                                            {safeFormatDate(date, "MMM dd, yyyy HH:mm")}
                                            <br />
                                            <span className="italic">
                                              ({safeFormatDistanceToNow(date, { addSuffix: true })})
                                            </span>
                                          </>
                                        );
                                      } catch {
                                        return "Invalid date";
                                      }
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground block">
                                    Last Updated:
                                  </span>
                                  <div className="text-muted-foreground text-xs mt-1">
                                    {(() => {
                                      try {
                                        const date = new Date(lead.updated_at);
                                        if (isNaN(date.getTime())) {
                                          return "Invalid date";
                                        }
                                        return (
                                          <>
                                            {safeFormatDate(date, "MMM dd, yyyy HH:mm")}
                                            <br />
                                            <span className="italic">
                                              ({safeFormatDistanceToNow(date, { addSuffix: true })})
                                            </span>
                                          </>
                                        );
                                      } catch {
                                        return "Invalid date";
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Notes */}
                          {lead.notes && lead.notes !== "-" && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
                                Notes
                              </h4>
                              <div className="p-3 bg-background rounded-md border text-sm">
                                <div className="text-muted-foreground whitespace-pre-wrap">
                                  {lead.notes.split("\n").map((line, index) => (
                                    <div key={index} className="mb-1 last:mb-0">
                                      {line.trim() || (
                                        <span className="text-xs italic">
                                          Empty line
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Form Data */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-1">
                              Form Submission Data
                            </h4>
                            <div className="p-3 bg-background rounded-md border">
                              {renderFormData(
                                lead.form_data,
                                lead.forms?.fields,
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>,
                  );
                }
                return rows;
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredAndSortedLeads.length > 0 && (
          <div className="border-t border-border/40">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedLeads.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              className="py-4"
            />
          </div>
        )}

        {/* Bulk Actions */}
        <LeadsTableActions
          selectedLeads={selectedLeads}
          isUpdating={isUpdating}
          onSendEmail={handleSendEmail}
          onUpdateStatus={updateBulkStatus}
          onCreateGroup={handleCreateGroup}
          onExportSelected={() => {
            // TODO: Implement export functionality
            // Export selected leads
          }}
          onCopySelected={() => {
            // TODO: Implement copy functionality
            const selectedData = filteredAndSortedLeads
              .filter((lead) => selectedLeads.includes(lead.id))
              .map((lead) => `${lead.name}\t${lead.email}\t${lead.phone || ""}`)
              .join("\n");
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

      {/* Notes Dialog */}
      <NotesDialog
        isOpen={isNotesDialogOpen}
        onClose={() => {
          setIsNotesDialogOpen(false);
          setNotesEditingLead(null);
        }}
        leadName={notesEditingLead?.name || ""}
        currentNotes={notesEditingLead?.notes || null}
        onSave={handleUpdateNotes}
        isUpdating={isUpdatingNotes}
      />
    </div>
  );
}
