"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail } from "lucide-react";
import { useState } from "react";

export function GroupsHeader() {
  const [searchTerm, setSearchTerm] = useState("");

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
          <Button variant="outline" className="flex items-center gap-2 border-border hover:bg-accent">
            <Mail className="h-4 w-4" />
            Send Bulk Email
          </Button>
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Group
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
