"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Lead, LeadStatus, FormField } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Trash2,
  Mail,
  Check,
  ChevronDown,
  ChevronRight,
  Edit,
  Edit3,
  Save,
} from "lucide-react";

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

interface LeadWithForm extends Lead {
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

interface GroupMemberRowProps {
  member: GroupMember;
  isSelected: boolean;
  isExpanded: boolean;
  isUpdating: string | null;
  onSelectLead: (leadId: string, checked: boolean) => void;
  onToggleExpand: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onRemoveFromGroup: (membershipId: string) => void;
  onEditLead: (leadId: string) => void;
  onUpdateNotes?: (leadId: string, notes: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  getRegisteredAsValue: (lead: LeadWithForm) => string | null;
}

export function GroupMemberRow({
  member,
  isSelected,
  isExpanded,
  isUpdating,
  onSelectLead,
  onToggleExpand,
  onUpdateStatus,
  onRemoveFromGroup,
  onEditLead,
  onUpdateNotes,
  getStatusColor,
  getRegisteredAsValue,
}: GroupMemberRowProps) {
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  const handleUpdateNotes = async (notes: string) => {
    if (!onUpdateNotes) return;
    
    setIsUpdatingNotes(true);
    try {
      await onUpdateNotes(member.leads.id, notes);
    } catch (error) {
      console.error('Error updating notes:', error);
    } finally {
      setIsUpdatingNotes(false);
    }
  };
  
  return (
    <>
      <TableRow
        className="hover:bg-accent/30 transition-colors cursor-pointer"
        onClick={() => onToggleExpand(member.leads.id)}
      >
      <TableCell 
        className="px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectLead(member.leads.id, checked as boolean)
          }
        />
      </TableCell>
      <TableCell className="px-6 py-4">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="text-sm font-medium text-foreground">
          {member.leads.name}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {member.leads.email}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {member.leads.phone || "N/A"}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {getRegisteredAsValue(member.leads) || "N/A"}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={member.leads.status}
            onValueChange={(value) =>
              onUpdateStatus(member.leads.id, value as LeadStatus)
            }
            disabled={isUpdating === member.leads.id}
          >
            <SelectTrigger className="w-32">
              <SelectValue>
                <Badge className={getStatusColor(member.leads.status)}>
                  {member.leads.status}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unqualified">
                <Badge className={getStatusColor("unqualified")}>
                  unqualified
                </Badge>
              </SelectItem>
              <SelectItem value="qualified">
                <Badge className={getStatusColor("qualified")}>
                  qualified
                </Badge>
              </SelectItem>
              <SelectItem value="trash">
                <Badge className={getStatusColor("trash")}>
                  trash
                </Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {member.leads.forms?.name || member.leads.source || "N/A"}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <div 
          className="flex items-center gap-2 cursor-pointer hover:bg-accent/20 rounded p-1 -m-1 transition-colors group"
          onClick={() => setIsNotesDialogOpen(true)}
          title="Click to edit notes"
        >
          <div className="text-sm text-muted-foreground truncate max-w-[120px]">
            {member.leads.notes ? (
              <span className="line-clamp-2">{member.leads.notes}</span>
            ) : (
              <span className="text-xs italic">Click to add notes</span>
            )}
          </div>
          <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(member.created_at), {
            addSuffix: true,
          })}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4 text-right">
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditLead(member.leads.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Lead
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onUpdateStatus(
                    member.leads.id,
                    member.leads.status === "qualified"
                      ? "unqualified"
                      : "qualified"
                  )
                }
                disabled={isUpdating === member.leads.id}
              >
                <Check className="mr-2 h-4 w-4" />
                {member.leads.status === "qualified"
                  ? "Mark Unqualified"
                  : "Mark Qualified"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onRemoveFromGroup(member.id)}
                disabled={isUpdating === member.id}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
      </TableRow>
      
      <NotesDialog
        isOpen={isNotesDialogOpen}
        onClose={() => setIsNotesDialogOpen(false)}
        leadName={member.leads.name}
        currentNotes={member.leads.notes}
        onSave={handleUpdateNotes}
        isUpdating={isUpdatingNotes}
      />
    </>
  );
}
