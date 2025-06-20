"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadGroup, Lead, LeadStatus, FormField } from "@/lib/types/database";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Users,
  UserPlus,
  Filter,
} from "lucide-react";

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
  const [isUpdating, setIsUpdating] = useState<string | null>(null);  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<LeadWithForm[]>([]);  const [selectedNewLeads, setSelectedNewLeads] = useState<string[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(
    group.description || ""
  );
  const members = group.group_memberships || [];
  const filteredMembers =
    statusFilter === "all"
      ? members
      : members.filter((member) => member.leads.status === statusFilter);

  // Filter available leads based on search query
  const filteredAvailableLeads = availableLeads.filter((lead) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
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
      setSelectedLeads(filteredMembers.map((member) => member.leads.id));
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

    const fieldLabelMap =
      formFields?.reduce((acc, field) => {
        acc[field.id] = field.label;
        return acc;
      }, {} as Record<string, string>) || {};

    return (
      <div className="space-y-2">
        {Object.entries(formData).map(([key, value]) => {
          const displayLabel = fieldLabelMap[key] || key.replace(/[_-]/g, " ");

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center gap-1"
            >
              <span className="text-sm font-medium text-foreground min-w-0 capitalize">
                {displayLabel}:
              </span>
              <span className="text-sm text-muted-foreground break-words">
                {typeof value === "boolean"
                  ? value
                    ? "Yes"
                    : "No"
                  : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const statusCounts = getStatusCounts();

  // Helper function to get the "Registered as" value from form data
  const getRegisteredAsValue = (lead: LeadWithForm) => {
    if (!lead.form_data || !lead.forms?.fields) {
      return null;
    }

    // Find the Role field in the form definition
    const roleField = lead.forms.fields.find(field => 
      field.label.toLowerCase() === 'role' || 
      field.label.toLowerCase() === 'registered as'
    );

    if (!roleField) {
      return null;
    }

    // Get the value from form_data using the field ID
    const roleValue = lead.form_data[roleField.id];
    return roleValue ? String(roleValue) : null;
  };

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

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
                <SelectItem value="trash">Trash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Showing {filteredMembers.length} of {members.length} members
          </span>
        </div>        <Button variant="outline" onClick={handleOpenAddMembers}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Members
        </Button>
      </div>

      {/* Members Table */}
      <Card className="overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow>
              <TableHead className="px-6 py-4 w-12">
                <Checkbox
                  checked={
                    selectedLeads.length === filteredMembers.length &&
                    filteredMembers.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="px-6 py-4 w-12"></TableHead>              <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                Phone
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                Role
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                Added
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-6 py-12 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm">
                      {statusFilter === "all"
                        ? "This group doesn't have any members yet"
                        : `No members with status "${statusFilter}"`}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.flatMap((member) => [
                <TableRow
                  key={member.id}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <Checkbox
                      checked={selectedLeads.includes(member.leads.id)}
                      onCheckedChange={(checked) =>
                        handleSelectLead(member.leads.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandLead(member.leads.id)}
                      className="p-1"
                    >
                      {expandedLeads.includes(member.leads.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
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
                  </TableCell>                  <TableCell className="px-6 py-4">
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
                    <Select
                      value={member.leads.status}
                      onValueChange={(value) =>
                        updateLeadStatus(member.leads.id, value as LeadStatus)
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
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(member.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleExpandLead(member.leads.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {expandedLeads.includes(member.leads.id) ? 'Hide Details' : 'View Details'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateLeadStatus(
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
                          onClick={() => removeFromGroup(member.id)}
                          disabled={isUpdating === member.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>,
                ...(expandedLeads.includes(member.leads.id)
                  ? [                      <TableRow key={`${member.leads.id}-expanded`}>
                        <TableCell colSpan={9} className="px-6 py-6 bg-accent/20">
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Lead Information */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                  Lead Information
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Full Name:
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {member.leads.name}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Email:
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {member.leads.email}
                                    </span>
                                  </div>                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Phone:
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {member.leads.phone || "Not provided"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Registered as:
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {getRegisteredAsValue(member.leads) || "Not provided"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Source:
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {member.leads.forms?.name ||
                                        member.leads.source ||
                                        "Direct"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Timestamps */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                  Timeline
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Lead Created:
                                    </span>
                                    <div className="text-sm text-muted-foreground ml-2">
                                      {format(new Date(member.leads.created_at), "PPpp")}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-foreground">
                                      Added to Group:
                                    </span>
                                    <div className="text-sm text-muted-foreground ml-2">
                                      {format(new Date(member.created_at), "PPpp")}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tags */}
                            {member.leads.tags && member.leads.tags.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                  Tags
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {member.leads.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {member.leads.notes && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                  Notes
                                </h4>
                                <div className="p-3 bg-background rounded-md border">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {member.leads.notes}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Form Data */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                Form Submission Data
                              </h4>
                              <div className="p-3 bg-background rounded-md border">
                                {renderFormData(
                                  member.leads.form_data,
                                  member.leads.forms?.fields
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
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
    </div>
  );
}
