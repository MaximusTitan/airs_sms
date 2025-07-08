import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentLeads } from "@/components/dashboard/recent-leads";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { fetchDashboardData, getUser } from "@/lib/cache";
import { redirect } from "next/navigation";

// Enable ISR with 5-minute revalidation for dashboard data
export const revalidate = 300;

// Dashboard Loading Components
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
      <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>
  );
}

function RecentLeadsSkeleton() {
  return (
    <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Optimized Dashboard Components with error boundaries
async function DashboardStats() {
  try {
    const { stats } = await fetchDashboardData();
    return <StatsCards stats={stats} />;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Failed to load statistics. Please try again later.</p>
      </div>
    );
  }
}

async function DashboardCharts() {
  try {
    const { leads } = await fetchDashboardData();
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeadsChart leads={leads} />
        <RecentLeads leads={leads?.slice(0, 5) || []} />
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard charts:', error);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartSkeleton />
        <RecentLeadsSkeleton />
      </div>
    );
  }
}

export default async function DashboardPage() {
  // Authenticate user first
  const user = await getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <DashboardHeader />
      
      {/* Stats Cards with Suspense */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      {/* Charts and Recent Leads with Suspense */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartSkeleton />
          <RecentLeadsSkeleton />
        </div>
      }>
        <DashboardCharts />
      </Suspense>
    </div>
  );
}
