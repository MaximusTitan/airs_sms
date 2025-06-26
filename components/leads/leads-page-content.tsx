"use client";

import { useState } from "react";
import { LeadsHeader } from "./leads-header";
import { LeadsTable } from "./leads-table";
import { Lead, FormField } from "@/lib/types/database";

interface LeadsPageContentProps {
  leads: (Lead & { 
    forms?: { name: string; fields: FormField[] };
    group_memberships?: { lead_groups: { id: string; name: string } }[];
  })[];
}

export function LeadsPageContent({ leads }: LeadsPageContentProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  return (
    <>
      <LeadsHeader 
        selectedLeads={selectedLeads} 
      />
      <LeadsTable 
        leads={leads} 
        selectedLeads={selectedLeads}
        onSelectedLeadsChange={setSelectedLeads}
      />
    </>
  );
}
