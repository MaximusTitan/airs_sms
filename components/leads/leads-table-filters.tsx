"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Filter,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";

export interface LeadsFilterOptions {
  searchQuery: string;
  statusFilter: string;
  sourceFilter: string;
  groupFilter: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  tagsFilter: string[];
  formFilter: string;
}

interface LeadsTableFiltersProps {
  filters: LeadsFilterOptions;
  onFiltersChange: (filters: LeadsFilterOptions) => void;
  availableSources: string[];
  availableGroups: Array<{ id: string; name: string }>;
  availableTags: string[];
  availableForms: Array<{ id: string; name: string }>;
  totalLeads: number;
  filteredCount: number;
}

export function LeadsTableFilters({
  filters,
  onFiltersChange,
  availableSources,
  availableGroups,
  availableTags,
  availableForms,
  totalLeads,
  filteredCount,
}: LeadsTableFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFilters = (updates: Partial<LeadsFilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: "",
      statusFilter: "all",
      sourceFilter: "all",
      groupFilter: "all",
      dateRange: { from: null, to: null },
      tagsFilter: [],
      formFilter: "all",
    });
  };

  const hasActiveFilters = 
    filters.searchQuery ||
    filters.statusFilter !== "all" ||
    filters.sourceFilter !== "all" ||
    filters.groupFilter !== "all" ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.tagsFilter.length > 0 ||
    filters.formFilter !== "all";

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.statusFilter !== "all") count++;
    if (filters.sourceFilter !== "all") count++;
    if (filters.groupFilter !== "all") count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.tagsFilter.length > 0) count++;
    if (filters.formFilter !== "all") count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.statusFilter}
          onValueChange={(value) => updateFilters({ statusFilter: value })}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new_lead">New Lead</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="pilot_ready">Pilot Ready</SelectItem>
            <SelectItem value="running_pilot">Running Pilot</SelectItem>
            <SelectItem value="pilot_done">Pilot Done</SelectItem>
            <SelectItem value="sale_done">Sale Done</SelectItem>
            <SelectItem value="implementation">Implementation</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
          </SelectContent>
        </Select>

        {/* Group Filter */}
        <Select
          value={filters.groupFilter}
          onValueChange={(value) => updateFilters({ groupFilter: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            <SelectItem value="none">No Group</SelectItem>
            {availableGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          More Filters
          {getActiveFilterCount() > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isAdvancedOpen && (
        <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Source Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Source</Label>
              <Select
                value={filters.sourceFilter}
                onValueChange={(value) => updateFilters({ sourceFilter: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {availableSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Form Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Form</Label>
              <Select
                value={filters.formFilter}
                onValueChange={(value) => updateFilters({ formFilter: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="none">No Form</SelectItem>
                  {availableForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Created</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    updateFilters({
                      dateRange: { 
                        ...filters.dateRange, 
                        from: e.target.value ? new Date(e.target.value) : null 
                      },
                    })
                  }
                  className="flex-1"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    updateFilters({
                      dateRange: { 
                        ...filters.dateRange, 
                        to: e.target.value ? new Date(e.target.value) : null 
                      },
                    })
                  }
                  className="flex-1"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = filters.tagsFilter.includes(tag);
                  return (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({
                              tagsFilter: [...filters.tagsFilter, tag],
                            });
                          } else {
                            updateFilters({
                              tagsFilter: filters.tagsFilter.filter((t) => t !== tag),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalLeads} leads
        </span>
        {hasActiveFilters && (
          <span className="text-primary font-medium">
            {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? "s" : ""} active
          </span>
        )}
      </div>
    </div>
  );
}
