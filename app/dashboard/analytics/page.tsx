import { createClient } from "@/lib/supabase/server";
import { AnalyticsHeader } from "@/components/analytics/analytics-header";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { AnalyticsStats } from "@/components/analytics/analytics-stats";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch analytics data - no user filtering
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      forms (
        name
      )
    `);

  const { data: forms } = await supabase
    .from('forms')
    .select('*');

  const { data: emails } = await supabase
    .from('emails')
    .select('*');
  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <AnalyticsHeader />
      <AnalyticsStats leads={leads || []} forms={forms || []} emails={emails || []} />
      <AnalyticsCharts leads={leads || []} />
    </div>
  );
}
