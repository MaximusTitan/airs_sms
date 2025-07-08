import { Suspense } from "react";
import { AnalyticsHeader } from "@/components/analytics/analytics-header";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { AnalyticsStats } from "@/components/analytics/analytics-stats";
import { fetchAnalyticsData, getUser } from "@/lib/cache";

// Enable ISR with 10-minute revalidation for analytics data
export const revalidate = 600;

function AnalyticsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
            <div className="h-12 w-12 bg-muted rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );
}

async function AnalyticsStatsContent() {
  try {
    const { leads, forms, emails } = await fetchAnalyticsData();
    return <AnalyticsStats leads={leads} forms={forms} emails={emails} />;
  } catch (error) {
    console.error('Error loading analytics stats:', error);
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Failed to load analytics statistics. Please try again later.</p>
      </div>
    );
  }
}

async function AnalyticsChartsContent() {
  try {
    const { leads } = await fetchAnalyticsData();
    return <AnalyticsCharts leads={leads} />;
  } catch (error) {
    console.error('Error loading analytics charts:', error);
    return <AnalyticsChartsSkeleton />;
  }
}

export default async function AnalyticsPage() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <AnalyticsHeader />
      
      <Suspense fallback={<AnalyticsStatsSkeleton />}>
        <AnalyticsStatsContent />
      </Suspense>
      
      <Suspense fallback={<AnalyticsChartsSkeleton />}>
        <AnalyticsChartsContent />
      </Suspense>
    </div>
  );
}
