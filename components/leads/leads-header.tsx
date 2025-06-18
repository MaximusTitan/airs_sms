"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeadsHeaderProps {
  selectedLeads?: string[];
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function LeadsHeader({ selectedLeads = [], searchTerm = "", onSearchChange }: LeadsHeaderProps) {
  const router = useRouter();

  const handleSendEmail = () => {
    if (selectedLeads.length > 0) {
      const leadIds = selectedLeads.join(',');
      router.push(`/dashboard/emails/compose?leads=${leadIds}`);
    } else {
      router.push('/dashboard/emails/compose');
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
        </div>
          <div className="flex gap-3">
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
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
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
