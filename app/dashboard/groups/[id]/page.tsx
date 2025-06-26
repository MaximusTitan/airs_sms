import { createClient } from "@/lib/supabase/server";
import { GroupDetailView } from "@/components/groups/group-detail-view";
import { redirect, notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface GroupDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { id } = await params;
  // Fetch group with detailed member information - no user filtering
  const { data: group, error } = await supabase
    .from('lead_groups')
    .select(`
      *,
      group_memberships (
        id,
        created_at,
        leads (
          id,
          name,
          email,
          status,
          phone,
          created_at,
          updated_at,
          source,
          notes,
          tags,
          form_data,
          forms (
            name,
            fields
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !group) {
    notFound();
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <GroupDetailView group={group} />
    </div>
  );
}
