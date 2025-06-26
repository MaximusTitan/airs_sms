import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentLeads } from "@/components/dashboard/recent-leads";
import { LeadsChart } from "@/components/dashboard/leads-chart";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch dashboard data - no user filtering
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: forms } = await supabase
    .from('forms')
    .select('*');

  const { data: emails } = await supabase
    .from('emails')
    .select('*');

  const stats = {
    totalLeads: leads?.length || 0,
    qualifiedLeads: leads?.filter(lead => lead.status === 'qualified').length || 0,
    totalForms: forms?.length || 0,
    emailsSent: emails?.filter(email => email.status === 'sent').length || 0,
  };
  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <DashboardHeader />
      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeadsChart leads={leads || []} />
        <RecentLeads leads={leads?.slice(0, 5) || []} />
      </div>
    </div>
  );
}
