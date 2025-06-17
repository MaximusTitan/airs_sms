"use client";

import { useState } from "react";
import { GroupsHeader } from "./groups-header";
import { GroupsGrid } from "./groups-grid";
import { LeadGroup, Lead } from "@/lib/types/database";

interface GroupWithMembers extends LeadGroup {
  group_memberships: {
    id: string;
    leads: Lead;
  }[];
}

interface GroupsPageContentProps {
  groups: GroupWithMembers[];
}

export function GroupsPageContent({ groups }: GroupsPageContentProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  return (
    <>
      <GroupsHeader selectedGroups={selectedGroups} />
      <GroupsGrid 
        groups={groups} 
        selectedGroups={selectedGroups}
        onSelectedGroupsChange={setSelectedGroups}
      />
    </>
  );
}
