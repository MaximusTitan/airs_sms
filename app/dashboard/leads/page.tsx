import { createClient } from "@/lib/supabase/server";
import { LeadsPageContent } from "@/components/leads/leads-page-content";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch leads with form information including field definitions - no user filtering
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      forms (
        name,
        fields
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch group memberships separately to avoid join issues
  let leadsWithGroups = leads || [];
  if (leads && leads.length > 0) {    const { data: memberships } = await supabase
      .from('group_memberships')
      .select(`
        lead_id,
        lead_groups (
          id,
          name
        )
      `)
      .in('lead_id', leads.map(lead => lead.id));

    // Attach group information to leads
    leadsWithGroups = leads.map(lead => ({
      ...lead,
      group_memberships: memberships?.filter(m => m.lead_id === lead.id) || []    }));
  }
  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <LeadsPageContent leads={leadsWithGroups} />
    </div>
  );
}
