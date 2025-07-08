import { Suspense } from "react";
import { GroupsPageContent } from "@/components/groups/groups-page-content";
import { getUser, getGroups } from "@/lib/cache";
import { redirect } from "next/navigation";

// Enable ISR with 3-minute revalidation for groups
export const revalidate = 180;

function GroupsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
      </div>
      
      {/* Groups grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
            <div className="space-y-4">
              <div className="h-5 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="flex justify-between">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-8 bg-muted rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function GroupsContent() {
  try {
    const groups = await getGroups();
    return <GroupsPageContent groups={groups} />;
  } catch (error) {
    console.error('Error loading groups:', error);
    return (
      <div className="p-8 text-center">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg inline-block">
          <p className="text-destructive">Failed to load groups. Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default async function GroupsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <Suspense fallback={<GroupsPageSkeleton />}>
        <GroupsContent />
      </Suspense>
    </div>
  );
}
