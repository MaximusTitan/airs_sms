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

  // Fetch analytics data
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      forms (
        name
      )
    `)
    .eq('user_id', user.id);

  const { data: forms } = await supabase
    .from('forms')
    .select('*')
    .eq('user_id', user.id);

  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', user.id);

  return (
    <div className="p-6 space-y-6">
      <AnalyticsHeader />
      <AnalyticsStats leads={leads || []} forms={forms || []} emails={emails || []} />
      <AnalyticsCharts leads={leads || []} />
    </div>
  );
}
