"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'unqualified':
        return 'bg-yellow-100 text-yellow-800';
      case 'trash':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Leads
        </h3>
        <Link 
          href="/dashboard/leads"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          View all
        </Link>
      </div>
      
      <div className="space-y-4">
        {leads.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No leads yet. Create a form to start collecting leads.
          </p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lead.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lead.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge className={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
