"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { LeadStatus, FormField } from "@/lib/types/database";
import { formatDistanceToNow, format } from "date-fns";
import {
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  Save,
} from "lucide-react";
import { TableSortHeader, SortConfig } from "./table-sort-header";
import { useState } from "react";

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  currentNotes: string | null;
  onSave: (notes: string) => Promise<void>;
  isUpdating: boolean;
}

function NotesDialog({ isOpen, onClose, leadName, currentNotes, onSave, isUpdating }: NotesDialogProps) {
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
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
          >
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

interface LeadWithForm {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  source: string;
  notes: string | null;
  tags: string[] | null;
  form_data: Record<string, unknown> | null;
  forms?: {
    name: string;
    fields: FormField[];
  };
}

interface GroupMember {
  id: string;
  created_at: string;
  leads: LeadWithForm;
}

interface GroupTableHeaderProps {
  selectedLeads: string[];
  members: GroupMember[];
  sortConfig: SortConfig;
  onSort: (sortConfig: SortConfig) => void;
  onSelectAll: (checked: boolean) => void;
}

interface GroupTableRowProps {
  member: GroupMember;
  isSelected: boolean;
  isExpanded: boolean;
  isUpdating: string | null;
  onSelect: (leadId: string, checked: boolean) => void;
  onToggleExpand: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onRemoveFromGroup: (membershipId: string) => void;
  onUpdateNotes?: (leadId: string, notes: string) => Promise<void>;
}

export function GroupTableHeader({
  selectedLeads,
  members,
  sortConfig,
  onSort,
  onSelectAll,
}: GroupTableHeaderProps) {
  return (
    <TableRow className="border-b border-border/40 hover:bg-transparent">
      <TableHead className="px-3 py-3 w-10">
        <Checkbox 
          checked={selectedLeads.length === members.length && members.length > 0}
          onCheckedChange={onSelectAll}
        />
      </TableHead>
      <TableHead className="px-6 py-3 w-10"></TableHead>
      <TableHead className="px-6 py-3 min-w-48">
        <TableSortHeader
          label="Name"
          sortKey="name"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3 min-w-48">
        <TableSortHeader
          label="Email"
          sortKey="email"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3">
        <TableSortHeader
          label="Phone"
          sortKey="phone"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3">
        <TableSortHeader
          label="Status"
          sortKey="status"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3">
        <TableSortHeader
          label="Source"
          sortKey="source"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3">
        <TableSortHeader
          label="Role"
          sortKey="role"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3">
        <TableSortHeader
          label="Notes"
          sortKey="notes"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3">
        <TableSortHeader
          label="Added"
          sortKey="created_at"
          currentSort={sortConfig}
          onSort={onSort}
        />
      </TableHead>
      <TableHead className="px-6 py-3 text-right">Actions</TableHead>
    </TableRow>
  );
}

export function GroupTableRow({
  member,
  isSelected,
  isExpanded,
  isUpdating,
  onSelect,
  onToggleExpand,
  onUpdateStatus,
  onRemoveFromGroup,
  onUpdateNotes,
}: GroupTableRowProps) {
  const lead = member.leads;
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  const handleUpdateNotes = async (notes: string) => {
    if (!onUpdateNotes) return;
    
    setIsUpdatingNotes(true);
    try {
      await onUpdateNotes(lead.id, notes);
    } catch (error) {
      console.error('Error updating notes:', error);
    } finally {
      setIsUpdatingNotes(false);
    }
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
    const headerMapping = (lead.form_data._csv_header_mapping as Record<string, string>) || {};
    
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

  const renderFormData = (formData: Record<string, unknown>, formFields?: FormField[]) => {
    if (!formData || Object.keys(formData).length === 0) {
      return <span className="text-muted-foreground text-sm">No additional data</span>;
    }

    const fieldLabelMap = formFields?.reduce((acc, field) => {
      if (field.id && field.label) {
        acc[field.id] = field.label;
      }
      return acc;
    }, {} as Record<string, string>) || {};

    const headerMapping = (formData._csv_header_mapping as Record<string, string>) || {};
    
    let actualHeaderMapping: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (key !== '_csv_header_mapping' && typeof value === 'object' && value !== null) {
        const nestedValue = value as Record<string, string>;
        const hasFieldIds = Object.keys(nestedValue).some(k => k.startsWith('field_') || (k.length === 36 && k.includes('-')));
        if (hasFieldIds) {
          actualHeaderMapping = nestedValue;
          break;
        }
      }
    }

    const excludeFields = new Set(['name', 'email', 'phone', 'full_name', 'fullname']);
    
    const processedEntries = Object.entries(formData)
      .filter(([key]) => {
        return key !== '_csv_header_mapping' && 
               typeof formData[key] !== 'object';
      })
      .map(([key, value]) => {
        let displayLabel = '';
        
        if (fieldLabelMap[key]) {
          displayLabel = fieldLabelMap[key];
        } else if (actualHeaderMapping[key]) {
          displayLabel = actualHeaderMapping[key];
        } else if (headerMapping[key]) {
          const fieldId = headerMapping[key];
          if (actualHeaderMapping[fieldId]) {
            displayLabel = actualHeaderMapping[fieldId];
          } else {
            displayLabel = String(fieldId)
              .replace(/[_-]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
        } else if (key.length === 36 && key.includes('-')) {
          const fieldId = headerMapping[key];
          if (fieldId && actualHeaderMapping[fieldId]) {
            displayLabel = actualHeaderMapping[fieldId];
          } else {
            displayLabel = `Additional Field ${Object.keys(formData).filter(k => k !== '_csv_header_mapping' && typeof formData[k] !== 'object').indexOf(key) + 1}`;
          }
        } else {
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
      
      const isBasicField = excludeFields.has(lowerLabel) ||
                          excludeFields.has(lowerKey) ||
                          lowerLabel.includes('name') ||
                          lowerLabel.includes('email') ||
                          lowerLabel.includes('phone') ||
                          lowerLabel.includes('full name');
      
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
        {filteredEntries.map(({ key, value, displayLabel }) => (
          <div key={String(key)} className="space-y-1">
            <div className="text-sm font-medium text-foreground capitalize">
              {displayLabel}:
            </div>
            <div className="text-sm text-muted-foreground break-words pl-2">
              {String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const registeredAsValue = getRegisteredAsValue(lead);

  return (
    <>
      <TableRow className="hover:bg-accent/30 transition-colors">
        <TableCell className="px-3 py-4">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(lead.id, checked as boolean)}
          />
        </TableCell>
        <TableCell className="px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpand(lead.id)}
            className="p-1 h-auto"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="px-6 py-4">
          <div className="font-medium">{lead.name}</div>
        </TableCell>
        <TableCell className="px-6 py-4">
          <div className="text-muted-foreground">{lead.email}</div>
        </TableCell>
        <TableCell className="px-6 py-4">
          <div className="text-muted-foreground">
            {lead.phone || "-"}
          </div>
        </TableCell>
        <TableCell className="px-6 py-4">
          <Badge
            variant="outline"
            className={`${getStatusColor(lead.status)} border`}
          >
            {lead.status}
          </Badge>
        </TableCell>
        <TableCell className="px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {lead.source}
          </span>
        </TableCell>
        <TableCell className="px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {registeredAsValue || "-"}
          </span>
        </TableCell>
        <TableCell className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/20 rounded p-1 -m-1 transition-colors group"
            onClick={() => setIsNotesDialogOpen(true)}
            title="Click to edit notes"
          >
            <div className="text-sm text-muted-foreground truncate max-w-[120px]">
              {lead.notes ? (
                <span className="line-clamp-2">{lead.notes}</span>
              ) : (
                <span className="text-xs italic">Click to add notes</span>
              )}
            </div>
            <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </TableCell>
        <TableCell className="px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(member.created_at))} ago
          </div>
        </TableCell>
        <TableCell className="px-6 py-4 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isUpdating === member.id}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateStatus(lead.id, "qualified")}
                disabled={lead.status === "qualified"}
              >
                Mark as Qualified
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateStatus(lead.id, "unqualified")}
                disabled={lead.status === "unqualified"}
              >
                Mark as Unqualified
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateStatus(lead.id, "trash")}
                disabled={lead.status === "trash"}
              >
                Move to Trash
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRemoveFromGroup(member.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={11} className="px-6 py-6 bg-accent/20">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">
                  Lead Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Created:</span>
                    <span className="ml-2 text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Last Updated:</span>
                    <span className="ml-2 text-muted-foreground">
                      {format(new Date(lead.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Source:</span>
                    <span className="ml-2 text-muted-foreground">{lead.source}</span>
                  </div>
                  {lead.tags && lead.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {lead.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground">
                    Notes
                  </h4>
                  <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                    {lead.notes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">
                  Form Data
                </h4>
                {renderFormData(lead.form_data || {}, lead.forms?.fields)}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}

      <NotesDialog
        isOpen={isNotesDialogOpen}
        onClose={() => setIsNotesDialogOpen(false)}
        leadName={lead.name}
        currentNotes={lead.notes}
        onSave={handleUpdateNotes}
        isUpdating={isUpdatingNotes}
      />
    </>
  );
}
