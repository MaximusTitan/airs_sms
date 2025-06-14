import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadsHeader } from "@/components/leads/leads-header";

export default async function LeadsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch leads with form information
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      forms (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <LeadsHeader />
      <LeadsTable leads={leads || []} />
    </div>
  );
}
