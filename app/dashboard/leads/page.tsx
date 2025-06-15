import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadsHeader } from "@/components/leads/leads-header";
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
    <div className="p-8 space-y-8 bg-background min-h-full">
      <LeadsHeader />
      <LeadsTable leads={leads || []} />
    </div>
  );
}
