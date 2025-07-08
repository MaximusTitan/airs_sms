import { Suspense } from "react";
import { FormsHeader } from "@/components/forms/forms-header";
import { FormsGrid } from "@/components/forms/forms-grid";
import { getUser, getForms } from "@/lib/cache";

// Enable ISR with 5-minute revalidation for forms
export const revalidate = 300;

function FormsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="space-y-4">
            <div className="h-5 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="flex justify-between">
              <div className="h-6 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function FormsContent() {
  try {
    const forms = await getForms();
    return <FormsGrid forms={forms} />;
  } catch (error) {
    console.error('Error loading forms:', error);
    return (
      <div className="p-8 text-center">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg inline-block">
          <p className="text-destructive">Failed to load forms. Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default async function FormsPage() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <FormsHeader />
      
      <Suspense fallback={<FormsGridSkeleton />}>
        <FormsContent />
      </Suspense>
    </div>
  );
}
