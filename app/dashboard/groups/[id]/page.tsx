import { Suspense } from "react";
import { GroupDetailView } from "@/components/groups/group-detail-view";
import { getUser, getGroup } from "@/lib/cache";
import { redirect, notFound } from "next/navigation";

// Enable ISR with 2-minute revalidation for group details
export const revalidate = 120;

function GroupDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        </div>
      </div>
      
      {/* Group info skeleton */}
      <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
      
      {/* Members table skeleton */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="space-y-2 p-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface GroupDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function GroupDetailContent({ groupId }: { groupId: string }) {
  try {
    const group = await getGroup(groupId);
    if (!group) {
      notFound();
    }
    return <GroupDetailView group={group} />;
  } catch (error) {
    console.error('Error loading group:', error);
    return (
      <div className="p-8 text-center">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg inline-block">
          <p className="text-destructive">Failed to load group details. Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { id } = await params;

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <Suspense fallback={<GroupDetailSkeleton />}>
        <GroupDetailContent groupId={id} />
      </Suspense>
    </div>
  );
}
