'use client';

import { useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  inp?: number;
  fcp?: number;
  ttfb?: number;
}

interface UsePerformanceMonitorOptions {
  enableLogging?: boolean;
  onMetric?: (metric: { name: string; value: number; delta: number }) => void;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { enableLogging = false, onMetric } = options;
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let supported = false;

    // Check if web vitals are supported
    if ('PerformanceObserver' in window) {
      supported = true;
    }

    if (!supported) {
      if (enableLogging) {
        console.warn('Performance monitoring not supported in this browser');
      }
      return;
    }

    const handleMetric = (name: string, value: number, delta: number) => {
      metricsRef.current = { ...metricsRef.current, [name]: value };
      
      if (enableLogging) {
        console.log(`[Performance] ${name}:`, value);
      }
      
      onMetric?.({ name, value, delta });
    };

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      handleMetric('lcp', lastEntry.startTime, lastEntry.startTime);
    });
    
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // Type not supported
    }

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          handleMetric('fcp', entry.startTime, entry.startTime);
        }
      });
    });
    
    try {
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      // Type not supported
    }

    // Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((list) => {
      let cls = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      handleMetric('cls', cls, cls);
    });
    
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // Type not supported
    }

    // First Input Delay (FID) and Interaction to Next Paint (INP)
    const interactionObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-input') {
          const fid = entry.processingStart - entry.startTime;
          handleMetric('fid', fid, fid);
        }
        
        // INP is still experimental
        if (entry.interactionId) {
          const inp = entry.processingEnd - entry.startTime;
          handleMetric('inp', inp, inp);
        }
      });
    });
    
    try {
      interactionObserver.observe({ type: 'first-input', buffered: true });
      // For INP (experimental)
      interactionObserver.observe({ type: 'event', buffered: true });
    } catch (e) {
      // Type not supported
    }

    // Navigation timing for TTFB
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const navigation = navigationEntries[0];
      const ttfb = navigation.responseStart - navigation.requestStart;
      handleMetric('ttfb', ttfb, ttfb);
    }

    // Cleanup function
    return () => {
      lcpObserver.disconnect();
      fcpObserver.disconnect();
      clsObserver.disconnect();
      interactionObserver.disconnect();
    };
  }, [enableLogging, onMetric]);

  return metricsRef.current;
}

// Hook for monitoring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number | undefined>(undefined);
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    renderCountRef.current += 1;
  });

  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current;
      console.log(`[Render Performance] ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`);
    }
  });

  return {
    renderCount: renderCountRef.current,
    markRenderStart: () => {
      renderStartRef.current = performance.now();
    }
  };
}

// Hook for measuring user interactions
export function useInteractionTracking() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50)
      };
      
      console.log('[Interaction] Click:', elementInfo);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        console.log('[Interaction] Keyboard activation:', {
          key: event.key,
          element: target.tagName
        });
      }
    };

    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('keydown', handleKeydown, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);
}
