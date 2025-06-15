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
    <Card className="p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          Recent Leads
        </h3>
        <Link 
          href="/dashboard/leads"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View all →
        </Link>
      </div>
      
      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No leads yet. Create a form to start collecting leads.
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border hover:bg-accent/70 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {lead.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge className={`${getStatusColor(lead.status)} border`}>
                {lead.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
