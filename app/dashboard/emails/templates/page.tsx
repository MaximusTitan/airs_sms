import { createClient } from "@/lib/supabase/server";
import { TemplatesPageContent } from "@/components/emails/templates-page-content";

export default async function TemplatesPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch email templates - no user filtering
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Email Templates
          </h1>
          <p className="text-muted-foreground text-lg">
            Create and manage reusable email templates
          </p>
        </div>
      </div>
      
      <TemplatesPageContent templates={templates || []} />
    </div>
  );
}
