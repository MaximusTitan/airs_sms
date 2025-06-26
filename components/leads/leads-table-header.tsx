"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableRow } from "@/components/ui/table";
import { TableSortHeader, SortConfig } from "../groups/table-sort-header";

interface LeadsTableHeaderProps {
  selectedLeads: string[];
  totalLeads: number;
  sortConfig: SortConfig;
  onSort: (sortConfig: SortConfig) => void;
  onSelectAll: (checked: boolean) => void;
}

export function LeadsTableHeader({
  selectedLeads,
  totalLeads,
  sortConfig,
  onSort,
  onSelectAll,
}: LeadsTableHeaderProps) {
  return (
    <TableRow className="border-b border-border/40 hover:bg-transparent">
      <TableHead className="px-3 py-3 w-10">
        <Checkbox 
          checked={selectedLeads.length === totalLeads && totalLeads > 0}
          onCheckedChange={onSelectAll}
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Name"
          sortKey="name"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Email"
          sortKey="email"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Phone"
          sortKey="phone"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Role"
          sortKey="role"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Status"
          sortKey="status"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Groups"
          sortKey="groups"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Source"
          sortKey="source"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Notes"
          sortKey="notes"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3">
        <TableSortHeader
          label="Created"
          sortKey="created_at"
          currentSort={sortConfig}
          onSort={onSort}
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        />
      </TableHead>
      <TableHead className="px-3 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
        Actions
      </TableHead>
    </TableRow>
  );
}
