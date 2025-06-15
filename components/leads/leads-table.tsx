"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

      // Refresh the page to show updated data
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

      // Refresh the page to show updated data
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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unqualified':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'trash':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox 
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium">No leads found</p>
                    <p className="text-sm">Create a form to start collecting leads</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {lead.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {lead.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {lead.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      value={lead.status}
                      onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
                      disabled={isUpdating === lead.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </SelectValue>
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {lead.forms?.name || lead.source || 'Direct'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateLeadStatus(lead.id, lead.status === 'qualified' ? 'unqualified' : 'qualified')}
                          disabled={isUpdating === lead.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {lead.status === 'qualified' ? 'Mark Unqualified' : 'Mark Qualified'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {selectedLeads.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2 items-center">
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
              <Select onValueChange={(value) => updateBulkStatus(value as LeadStatus)} disabled={isUpdating === 'bulk'}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unqualified">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('unqualified')}>
                        unqualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="qualified">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('qualified')}>
                        qualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="trash">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('trash')}>
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
