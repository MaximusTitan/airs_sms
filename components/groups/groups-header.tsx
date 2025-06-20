"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface GroupsHeaderProps {
  selectedGroups?: string[];
}

export function GroupsHeader({ selectedGroups = [] }: GroupsHeaderProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSendBulkEmail = () => {
    if (selectedGroups.length > 0) {
      const groupIds = selectedGroups.join(',');
      router.push(`/dashboard/emails/compose?groups=${groupIds}`);
    } else {
      router.push('/dashboard/emails/compose');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Groups
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your lead groups and send targeted communications
          </p>
        </div>
          <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-border hover:bg-accent"
            onClick={handleSendBulkEmail}
          >
            <Mail className="h-4 w-4" />
            Send Bulk Email
            {selectedGroups.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {selectedGroups.length}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
