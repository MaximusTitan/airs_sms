import { lazy, Suspense, ComponentType, ReactNode } from 'react';

// Generic lazy loading wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Loading skeletons for different components
export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted rounded animate-pulse"></div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-8 bg-muted rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
      <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
      ))}
      <div className="h-10 bg-primary/20 rounded w-32 animate-pulse"></div>
    </div>
  );
}

// Lazy loaded components for heavy features
export const LazyEmailComposer = createLazyComponent(
  () => import('@/components/emails/email-composer').then(m => ({ default: m.EmailComposer })),
  <FormSkeleton />
);

export const LazyFormBuilder = createLazyComponent(
  () => import('@/components/forms/form-builder').then(m => ({ default: m.FormBuilder })),
  <FormSkeleton />
);

export const LazyAnalyticsCharts = createLazyComponent(
  () => import('@/components/analytics/analytics-charts').then(m => ({ default: m.AnalyticsCharts })),
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <ChartSkeleton />
    <ChartSkeleton />
  </div>
);

export const LazyLeadsTable = createLazyComponent(
  () => import('@/components/leads/leads-table').then(m => ({ default: m.LeadsTable })),
  <TableSkeleton />
);

export const LazyGroupDetailView = createLazyComponent(
  () => import('@/components/groups/group-detail-view').then(m => ({ default: m.GroupDetailView })),
  <div className="space-y-6">
    <CardSkeleton />
    <TableSkeleton />
  </div>
);

// Intersection Observer based lazy loading
interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyLoad({ 
  children, 
  fallback, 
  threshold = 0.1, 
  rootMargin = '100px',
  className 
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, inView] = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <div>Loading...</div>)}
    </div>
  );
}

// Custom hook for intersection observer
function useIntersectionObserver(options: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  const [ref, setRef] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        
        if (entry.isIntersecting && options.triggerOnce) {
          observer.disconnect();
        }
      },
      {
        threshold: options.threshold,
        rootMargin: options.rootMargin
      }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options.threshold, options.rootMargin, options.triggerOnce]);

  return [setRef, inView] as const;
}

// React imports for hooks
import { useState, useEffect } from 'react';
