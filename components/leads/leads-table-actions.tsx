"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadStatus } from "@/lib/types/database";
import {
  Mail,
  Trash2,
  MoreHorizontal,
  FileDown,
  Copy,
  Users,
} from "lucide-react";

interface LeadsTableActionsProps {
  selectedLeads: string[];
  isUpdating: string | null;
  onSendEmail: () => void;
  onUpdateStatus: (status: LeadStatus) => void;
  onCreateGroup: () => void;
  onExportSelected?: () => void;
  onCopySelected?: () => void;
}

export function LeadsTableActions({
  selectedLeads,
  isUpdating,
  onSendEmail,
  onUpdateStatus,
  onCreateGroup,
  onExportSelected,
  onCopySelected,
}: LeadsTableActionsProps) {
  if (selectedLeads.length === 0) {
    return null;
  }

  const isDisabled = isUpdating === 'bulk';

  return (
    <div className="px-6 py-4 bg-primary/10 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {selectedLeads.length} selected
          </Badge>
          <span className="text-sm text-muted-foreground">
            lead{selectedLeads.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {/* Email Action */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onSendEmail}
            disabled={isDisabled}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>

          {/* Create Group */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCreateGroup}
            disabled={isDisabled}
          >
            <Users className="h-4 w-4 mr-2" />
            Create Group
          </Button>

          {/* Status Update */}
          <Select 
            onValueChange={(value) => onUpdateStatus(value as LeadStatus)} 
            disabled={isDisabled}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unqualified">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Unqualified
                </div>
              </SelectItem>
              <SelectItem value="qualified">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Qualified
                </div>
              </SelectItem>
              <SelectItem value="trash">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Trash
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDisabled}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportSelected && (
                <DropdownMenuItem onClick={onExportSelected}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
              )}
              {onCopySelected && (
                <DropdownMenuItem onClick={onCopySelected}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onUpdateStatus('trash')}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
