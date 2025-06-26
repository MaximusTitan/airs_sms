"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface TableSortHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (sortConfig: SortConfig) => void;
  className?: string;
}

export function TableSortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className = "",
}: TableSortHeaderProps) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleSort = () => {
    let newDirection: SortDirection = "asc";
    
    if (isActive) {
      if (direction === "asc") {
        newDirection = "desc";
      } else if (direction === "desc") {
        newDirection = null;
      } else {
        newDirection = "asc";
      }
    }

    onSort({
      key: newDirection ? sortKey : "",
      direction: newDirection,
    });
  };

  const getSortIcon = () => {
    if (!isActive || direction === null) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (direction === "asc") {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  return (
    <Button
      variant="ghost"
      className={`h-auto p-0 font-medium justify-start hover:bg-transparent ${className}`}
      onClick={handleSort}
    >
      <span className="mr-2">{label}</span>
      <span className={`transition-colors ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}>
        {getSortIcon()}
      </span>
    </Button>
  );
}

// Utility function to sort data
export function sortData<T>(
  data: T[],
  sortConfig: SortConfig,
  getSortValue: (item: T, key: string) => unknown
): T[] {
  if (!sortConfig.key || !sortConfig.direction) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
    if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

    // Handle different data types
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      const comparison = aValue - bValue;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Default string comparison
    const comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
}
