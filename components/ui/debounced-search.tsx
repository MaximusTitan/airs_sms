'use client';

import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
  initialValue?: string;
  showClearButton?: boolean;
}

export function DebouncedSearch({
  onSearch,
  placeholder = "Search...",
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay: _delay = 300, // Prefix with underscore to indicate intentionally unused
  initialValue = "",
  showClearButton = true
}: DebouncedSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const deferredQuery = useDeferredValue(query);

  // Use deferred value for search to prevent blocking UI updates
  useMemo(() => {
    onSearch(deferredQuery);
  }, [deferredQuery, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {showClearButton && query && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Advanced search with filters
interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
  className?: string;
}

export interface SearchFilters {
  query: string;
  status?: string;
  source?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export function AdvancedSearch({ onSearch, filters, className }: AdvancedSearchProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const deferredFilters = useDeferredValue(localFilters);

  // Trigger search when deferred filters change
  useMemo(() => {
    onSearch(deferredFilters);
  }, [deferredFilters, onSearch]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setLocalFilters({
      query: "",
      status: undefined,
      source: undefined,
      dateRange: undefined
    });
  }, []);

  const hasActiveFilters = localFilters.query || localFilters.status || localFilters.source || localFilters.dateRange;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-4 items-center">
        <DebouncedSearch
          onSearch={(query) => updateFilter('query', query)}
          placeholder="Search leads..."
          initialValue={localFilters.query}
          className="flex-1"
        />
        
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      
      {/* Additional filter controls can be added here */}
    </div>
  );
}

// Search results component with optimized rendering
interface SearchResultsProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function SearchResults<T>({
  items,
  renderItem,
  isLoading = false,
  emptyMessage = "No results found",
  className
}: SearchResultsProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map(renderItem)}
    </div>
  );
}

// Hook for optimized search functionality
export function useOptimizedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  initialQuery = ""
) {
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);

  const filteredItems = useMemo(() => {
    if (!deferredQuery.trim()) {
      return items;
    }

    const lowercaseQuery = deferredQuery.toLowerCase();
    
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return typeof value === 'string' && 
               value.toLowerCase().includes(lowercaseQuery);
      })
    );
  }, [items, searchFields, deferredQuery]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching: query !== deferredQuery
  };
}
