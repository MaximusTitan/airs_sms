"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadGroup, Lead } from "@/lib/types/database";
import { safeFormatDistanceToNow } from "@/lib/utils/date-utils";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Eye, 
  Users,
  Calendar
} from "lucide-react";

interface GroupWithMembers extends LeadGroup {
  group_memberships: {
    id: string;
    leads: Lead;
  }[];
}

interface GroupsGridProps {
  groups: GroupWithMembers[];
  selectedGroups?: string[];
  onSelectedGroupsChange?: (groups: string[]) => void;
}

export function GroupsGrid({ groups, selectedGroups: externalSelectedGroups, onSelectedGroupsChange }: GroupsGridProps) {
  const router = useRouter();
  const [internalSelectedGroups, setInternalSelectedGroups] = useState<string[]>([]);
  
  // Use external selectedGroups if provided, otherwise use internal state
  const selectedGroups = externalSelectedGroups ?? internalSelectedGroups;
  const setSelectedGroups = onSelectedGroupsChange ?? setInternalSelectedGroups;
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Handle bulk email for selected groups
  const handleSendBulkEmail = () => {
    if (selectedGroups.length > 0) {
      const groupIds = selectedGroups.join(',');
      router.push(`/dashboard/emails/compose?groups=${groupIds}`);
    }
  };

  // Handle individual group email
  const sendBulkEmail = async (groupId: string) => {
    router.push(`/dashboard/emails/compose?groups=${groupId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new_lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'qualified':
        return 'bg-green-100 text-green-800 border-green-200';
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
      new_lead: 0,
      qualified: 0,
      pilot_ready: 0,
      running_pilot: 0,
      pilot_done: 0,
      sale_done: 0,
      implementation: 0,
      not_interested: 0,
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

  const deleteBulkGroups = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedGroups.length} group(s)? This action cannot be undone.`)) {
      return;
    }

    setIsUpdating('bulk');
    try {
      await Promise.all(
        selectedGroups.map(groupId => 
          fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
        )
      );
      
      setSelectedGroups([]);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting groups:', error);
      alert('Failed to delete some groups');
    } finally {
      setIsUpdating(null);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No groups found</h3>
          <p className="text-muted-foreground mb-6">
            Create groups from your leads to organize them better and send targeted communications.
          </p>
          <Link href="/dashboard/leads">
            <Button>
              Go to Leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedGroups.length > 0 && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedGroups.length === groups.length}
                  onCheckedChange={handleSelectAll}
                  className="border-primary"
                />
                <span className="text-sm font-medium text-primary">
                  {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={deleteBulkGroups}
                  disabled={isUpdating === 'bulk'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isUpdating === 'bulk' ? 'Deleting...' : 'Delete Selected'}
                </Button>
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={handleSendBulkEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Bulk Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const statusCounts = getStatusCounts(group.group_memberships);
          const memberCount = group.group_memberships.length;
            return (
            <Link key={group.id} href={`/dashboard/groups/${group.id}`} className="block">
              <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => handleSelectGroup(group.id, checked as boolean)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-foreground truncate">
                          {group.name}
                        </CardTitle>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/groups/${group.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
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
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteGroup(group.id)}
                            disabled={isUpdating === group.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Member Count */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Status Distribution */}
                  {memberCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status Distribution
                      </p>
                      <div className="flex flex-wrap gap-1">
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
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {safeFormatDistanceToNow(group.created_at, { addSuffix: true })}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
