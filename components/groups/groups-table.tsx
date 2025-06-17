"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadGroup, Lead } from "@/lib/types/database";
import { formatDistanceToNow, format } from "date-fns";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Users,
  Phone,
  Calendar
} from "lucide-react";

interface GroupWithMembers extends LeadGroup {
  group_memberships: {
    id: string;
    leads: Lead;
  }[];
}

interface GroupsTableProps {
  groups: GroupWithMembers[];
}

export function GroupsTable({ groups }: GroupsTableProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

  const getStatusCounts = (members: { leads: Lead }[]) => {
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

  const handleSelectGroup = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups([...selectedGroups, groupId]);
    } else {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGroups(groups.map(group => group.id));
    } else {
      setSelectedGroups([]);
    }
  };

  const toggleExpandGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const sendBulkEmail = async (groupId: string) => {
    setIsUpdating(groupId);
    try {
      // TODO: Implement bulk email functionality
      alert('Bulk email functionality will be implemented');
    } catch (error) {
      console.error('Error sending bulk email:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(groupId);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-accent/50">
          <TableRow>
            <TableHead className="px-6 py-4 w-12">
              <Checkbox 
                checked={selectedGroups.length === groups.length && groups.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="px-6 py-4 w-12"></TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Description</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Members</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Status Distribution</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Created</TableHead>
            <TableHead className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="px-6 py-12 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">No groups found</p>
                  <p className="text-sm">Create groups from your leads to organize them better</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            groups.flatMap((group) => {
              const statusCounts = getStatusCounts(group.group_memberships);
              
              return [
                <TableRow key={group.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell className="px-6 py-4">
                    <Checkbox 
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={(checked) => handleSelectGroup(group.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandGroup(group.id)}
                      className="p-1"
                    >
                      {expandedGroups.includes(group.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {group.name}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      {group.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {group.group_memberships.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex gap-2">
                      {statusCounts.qualified > 0 && (
                        <Badge className={getStatusColor('qualified')} variant="outline">
                          {statusCounts.qualified} qualified
                        </Badge>
                      )}
                      {statusCounts.unqualified > 0 && (
                        <Badge className={getStatusColor('unqualified')} variant="outline">
                          {statusCounts.unqualified} unqualified
                        </Badge>
                      )}
                      {statusCounts.trash > 0 && (
                        <Badge className={getStatusColor('trash')} variant="outline">
                          {statusCounts.trash} trash
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
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
                        <DropdownMenuItem onClick={() => toggleExpandGroup(group.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {expandedGroups.includes(group.id) ? 'Hide Members' : 'View Members'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => sendBulkEmail(group.id)}
                          disabled={isUpdating === group.id}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Bulk Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => deleteGroup(group.id)}
                          disabled={isUpdating === group.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>,
                ...(expandedGroups.includes(group.id) ? [
                  <TableRow key={`${group.id}-expanded`}>
                    <TableCell colSpan={8} className="px-6 py-6 bg-accent/20">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                          Group Members ({group.group_memberships.length})
                        </h4>
                        
                        {group.group_memberships.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No members in this group</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {group.group_memberships.map((membership) => (
                              <div
                                key={membership.id}
                                className="flex items-center justify-between p-4 bg-background rounded-lg border"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-medium text-foreground">
                                        {membership.leads.name}
                                      </h5>
                                      <Badge className={getStatusColor(membership.leads.status)}>
                                        {membership.leads.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                      <span>{membership.leads.email}</span>
                                      {membership.leads.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {membership.leads.phone}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(membership.leads.created_at), 'MMM d, yyyy')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ] : [])
              ];
            })
          )}
        </TableBody>
      </Table>
      {selectedGroups.length > 0 && (
        <div className="px-6 py-4 bg-primary/10 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary font-medium">
              {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3 items-center">
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
