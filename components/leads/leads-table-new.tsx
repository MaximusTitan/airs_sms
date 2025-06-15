"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lead, LeadStatus } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Mail, Check } from "lucide-react";
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

interface LeadsTableProps {
  leads: (Lead & { forms?: { name: string } })[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    setIsUpdating(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating lead status:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const updateBulkStatus = async (newStatus: LeadStatus) => {
    setIsUpdating('bulk');
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
      setIsUpdating(null);
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

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  return (
    <Card className="overflow-hidden bg-card border-border shadow-sm">
      <Table>
        <TableHeader className="bg-accent/50">
          <TableRow>
            <TableHead className="px-6 py-4">
              <Checkbox 
                checked={selectedLeads.length === leads.length && leads.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Email</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Phone</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Status</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Source</TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider">Created</TableHead>
            <TableHead className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="px-6 py-12 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm">Create a form to start collecting leads</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-accent/30 transition-colors">
                <TableCell className="px-6 py-4">
                  <Checkbox 
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm font-medium text-foreground">
                    {lead.name}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {lead.email}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {lead.phone || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
                    disabled={isUpdating === lead.id}
                  >
                    <SelectTrigger className="w-32 border-border">
                      <SelectValue>
                        <Badge className={`${getStatusColor(lead.status)} border`}>
                          {lead.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unqualified">
                        <Badge className={`${getStatusColor('unqualified')} border`}>
                          unqualified
                        </Badge>
                      </SelectItem>
                      <SelectItem value="qualified">
                        <Badge className={`${getStatusColor('qualified')} border`}>
                          qualified
                        </Badge>
                      </SelectItem>
                      <SelectItem value="trash">
                        <Badge className={`${getStatusColor('trash')} border`}>
                          trash
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {lead.forms?.name || lead.source || 'Direct'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem className="hover:bg-accent">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-accent">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateLeadStatus(lead.id, lead.status === 'qualified' ? 'unqualified' : 'qualified')}
                        disabled={isUpdating === lead.id}
                        className="hover:bg-accent"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {lead.status === 'qualified' ? 'Mark Unqualified' : 'Mark Qualified'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {selectedLeads.length > 0 && (
        <div className="px-6 py-4 bg-primary/10 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary font-medium">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3 items-center">
              <Button size="sm" variant="outline" className="border-border hover:bg-accent">
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
              <Select onValueChange={(value) => updateBulkStatus(value as LeadStatus)} disabled={isUpdating === 'bulk'}>
                <SelectTrigger className="w-40 border-border">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="unqualified">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor('unqualified')} border`}>
                        unqualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="qualified">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor('qualified')} border`}>
                        qualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="trash">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor('trash')} border`}>
                        trash
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
