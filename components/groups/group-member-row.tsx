"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";

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
  getStatusColor,
  getRegisteredAsValue,
}: GroupMemberRowProps) {
  return (
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
  );
}
