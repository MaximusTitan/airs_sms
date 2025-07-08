"use client";

import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus } from '@/lib/types/database';

export interface LeadsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface LeadsFilters {
  search?: string;
  status?: LeadStatus | 'all';
  source?: string;
  group?: string;
  form?: string;
  tags?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseLeadsReturn {
  leads: Lead[];
  pagination: LeadsPagination;
  loading: boolean;
  error: string | null;
  filters: LeadsFilters;
  sortConfig: SortConfig;
  setFilters: (filters: Partial<LeadsFilters>) => void;
  setSortConfig: (config: SortConfig) => void;
  setPage: (page: number) => void;
  refresh: () => void;
}

const defaultFilters: LeadsFilters = {};

const defaultSortConfig: SortConfig = {
  key: 'created_at',
  direction: 'desc'
};

const defaultPagination: LeadsPagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
};

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination>(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<LeadsFilters>(defaultFilters);
  const [sortConfig, setSortConfigState] = useState<SortConfig>(defaultSortConfig);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Pagination
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    
    // Filters
    if (filters.search) params.set('search', filters.search);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.source && filters.source !== 'all') params.set('source', filters.source);
    if (filters.group && filters.group !== 'all') params.set('group', filters.group);
    if (filters.form && filters.form !== 'all') params.set('form', filters.form);
    if (filters.tags) params.set('tags', filters.tags);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    
    // Sorting
    params.set('sortBy', sortConfig.key);
    params.set('sortOrder', sortConfig.direction);
    
    return params.toString();
  }, [pagination.page, pagination.limit, filters, sortConfig]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start performance monitoring
      const startTime = performance.now();
      
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/leads?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLeads(data.leads || []);
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }));

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        const loadTime = performance.now() - startTime;
        console.log(`📊 Leads API Performance: ${loadTime.toFixed(2)}ms | ${data.leads?.length || 0} leads | Total: ${data.pagination?.total || 0}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leads';
      setError(errorMessage);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  // Fetch leads when dependencies change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const setFilters = useCallback((newFilters: Partial<LeadsFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setSortConfig = useCallback((config: SortConfig) => {
    setSortConfigState(config);
    // Reset to first page when sorting changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    pagination,
    loading,
    error,
    filters,
    sortConfig,
    setFilters,
    setSortConfig,
    setPage,
    refresh
  };
}
