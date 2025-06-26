import { createClient } from "@/lib/supabase/server";
import { GroupsPageContent } from "@/components/groups/groups-page-content";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch groups with member information - no user filtering
  const { data: groups } = await supabase
    .from('lead_groups')
    .select(`
      *,
      group_memberships (
        id,
        leads (
          id,
          name,
          email,
          status,
          phone,
          created_at
        )
      )
    `)
    .order('created_at', { ascending: false });
  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <GroupsPageContent groups={groups || []} />
    </div>
  );
}
