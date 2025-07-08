import { Suspense } from "react";
import { EmailAnalyticsDashboard } from "@/components/emails/email-analytics-dashboard";
import { 
  getEmailAnalytics, 
  getDailyEmailMetrics, 
  getEmailEngagementTrends 
} from "@/lib/email-analytics";
import { getUser } from "@/lib/cache";
import { Card } from "@/components/ui/card";

// Enable ISR with 5-minute revalidation for email analytics
export const revalidate = 300;

function EmailAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-72"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 bg-muted rounded w-32"></div>
          <div className="h-10 bg-muted rounded w-24"></div>
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            </div>
            <div className="h-4 bg-muted rounded w-32 mt-2"></div>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="flex gap-8">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded w-12"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

async function EmailAnalyticsContent() {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get data for the last 7 days by default
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const [analytics, dailyMetrics, engagementTrends] = await Promise.all([
      getEmailAnalytics(startDateStr, endDateStr, user.id),
      getDailyEmailMetrics(startDateStr, endDateStr),
      getEmailEngagementTrends(startDateStr, endDateStr)
    ]);

    return (
      <EmailAnalyticsDashboard 
        initialData={{
          analytics,
          dailyMetrics,
          engagementTrends
        }}
      />
    );
  } catch (error) {
    console.error('Error loading email analytics:', error);
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
        <h3 className="font-semibold text-destructive mb-2">Failed to Load Email Analytics</h3>
        <p className="text-destructive/80">
          There was an error loading your email analytics data. This might be due to:
        </p>
        <ul className="list-disc list-inside text-destructive/80 mt-2 space-y-1">
          <li>Database connection issues</li>
          <li>Missing webhook data (emails may not have event tracking yet)</li>
          <li>Authentication problems</li>
        </ul>
        <p className="text-destructive/80 mt-2">
          Please try refreshing the page or contact support if the issue persists.
        </p>
      </div>
    );
  }
}

export default async function EmailAnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Suspense fallback={<EmailAnalyticsSkeleton />}>
        <EmailAnalyticsContent />
      </Suspense>
    </div>
  );
}
