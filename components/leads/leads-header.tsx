"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { LeadStatus } from "@/lib/types/database";

interface LeadsHeaderProps {
  selectedLeads?: string[];
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function LeadsHeader({ selectedLeads = [], searchTerm = "", onSearchChange }: LeadsHeaderProps) {
  const router = useRouter();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSendEmail = () => {
    if (selectedLeads.length > 0) {
      const leadIds = selectedLeads.join(',');
      router.push(`/dashboard/emails/compose?leads=${leadIds}`);
    } else {
      router.push('/dashboard/emails/compose');
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
      setIsCreateGroupOpen(false);
      
      // Optionally show success message or redirect
      alert('Group created successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const updateBulkStatus = async (newStatus: LeadStatus) => {
    setIsUpdating(true);
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
      setIsUpdating(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Leads
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and track your leads
          </p>
        </div>          <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-border hover:bg-accent"
            onClick={handleSendEmail}
          >
            <Mail className="h-4 w-4" />
            Send Email
            {selectedLeads.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {selectedLeads.length}
              </span>
            )}
          </Button>
          
          {selectedLeads.length > 0 && (
            <>
              <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 rounded-md border border-primary/20">
                <span className="text-sm text-primary font-medium">
                  {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
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
              
              <Select onValueChange={(value) => updateBulkStatus(value as LeadStatus)} disabled={isUpdating}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unqualified">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor('unqualified')}`}>
                        unqualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="qualified">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor('qualified')}`}>
                        qualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="trash">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor('trash')}`}>
                        trash
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
