"use client";

import { useState, useMemo } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");

  // Filter leads based on search term
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    
    const searchLower = searchTerm.toLowerCase();
    return leads.filter(lead => {
      // Search in basic lead information
      const matchesBasic = 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchLower)) ||
        lead.status.toLowerCase().includes(searchLower) ||
        (lead.source && lead.source.toLowerCase().includes(searchLower)) ||
        (lead.notes && lead.notes.toLowerCase().includes(searchLower));

      // Search in group names
      const matchesGroup = lead.group_memberships?.some(membership => 
        membership.lead_groups.name.toLowerCase().includes(searchLower)
      );

      // Search in form name
      const matchesForm = lead.forms?.name.toLowerCase().includes(searchLower);

      // Search in form data values
      const matchesFormData = lead.form_data && Object.values(lead.form_data).some(value => 
        String(value).toLowerCase().includes(searchLower)
      );

      // Search in tags
      const matchesTags = lead.tags && lead.tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      );

      return matchesBasic || matchesGroup || matchesForm || matchesFormData || matchesTags;
    });
  }, [leads, searchTerm]);

  return (
    <>
      <LeadsHeader 
        selectedLeads={selectedLeads} 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <LeadsTable 
        leads={filteredLeads} 
        selectedLeads={selectedLeads}
        onSelectedLeadsChange={setSelectedLeads}
      />
    </>
  );
}
