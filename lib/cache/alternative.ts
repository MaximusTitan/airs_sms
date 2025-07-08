import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Alternative caching implementation for stable Next.js versions
// This provides manual cache management with time-based invalidation

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const simpleCache = new SimpleCache();

// Helper function for cached data fetching with manual cache management
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  getCacheKey: (...args: T) => string,
  ttl: number = 300000 // 5 minutes default
) {
  return cache(async (...args: T): Promise<R> => {
    const cacheKey = getCacheKey(...args);
    
    // Try to get from cache first
    const cached = simpleCache.get<R>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch and store
    const result = await fn(...args);
    simpleCache.set(cacheKey, result, ttl);
    
    return result;
  });
}

// Cached functions using the alternative approach
export const getUserCached = createCachedFunction(
  async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    
    return user;
  },
  () => 'user',
  60000 // 1 minute cache for user data
);

export const getLeadsCached = createCachedFunction(
  async () => {
    const supabase = await createClient();
    
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        *,
        forms (
          name,
          fields
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }
    
    return leads || [];
  },
  () => 'leads',
  120000 // 2 minutes cache for leads
);

export const getFormsCached = createCachedFunction(
  async () => {
    const supabase = await createClient();
    
    const { data: forms, error } = await supabase
      .from('forms')
      .select(`
        *,
        leads (count)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(`Failed to fetch forms: ${error.message}`);
    }
    
    return forms || [];
  },
  () => 'forms',
  300000 // 5 minutes cache for forms
);

// Cache invalidation helpers
export function invalidateUserCache() {
  simpleCache.delete('user');
}

export function invalidateLeadsCache() {
  simpleCache.delete('leads');
}

export function invalidateFormsCache() {
  simpleCache.delete('forms');
}

export function clearAllCache() {
  simpleCache.clear();
}

// Export the cache instance for advanced usage
export { simpleCache };
