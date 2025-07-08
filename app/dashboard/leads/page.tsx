import { Suspense } from "react";
import { LeadsPageContent } from "@/components/leads/leads-page-content";
import { getUser, getLeadsWithGroups } from "@/lib/cache";
import { redirect } from "next/navigation";

// Reduce revalidation time for better performance with new API optimizations
export const revalidate = 60;

function LeadsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2 p-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function LeadsContent() {
  try {
    // Uses the optimized cache implementation that calls the optimized API
    const leadsWithGroups = await getLeadsWithGroups();
    return <LeadsPageContent leads={leadsWithGroups} />;
  } catch (error) {
    console.error('Error loading leads:', error);
    return (
      <div className="p-8 text-center">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg inline-block">
          <p className="text-destructive">Failed to load leads. Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default async function LeadsPage() {
  // Authenticate user first
  const user = await getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <Suspense fallback={<LeadsPageSkeleton />}>
        <LeadsContent />
      </Suspense>
    </div>
  );
}
