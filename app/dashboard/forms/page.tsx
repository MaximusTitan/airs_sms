import { createClient } from "@/lib/supabase/server";
import { FormsHeader } from "@/components/forms/forms-header";
import { FormsGrid } from "@/components/forms/forms-grid";

export default async function FormsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch forms with lead count - no user filtering
  const { data: forms } = await supabase
    .from('forms')
    .select(`
      *,
      leads (count)
    `)
    .order('created_at', { ascending: false });
  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <FormsHeader />
      <FormsGrid forms={forms || []} />
    </div>
  );
}
