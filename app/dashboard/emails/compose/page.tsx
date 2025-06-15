import { createClient } from "@/lib/supabase/server";
import { EmailComposer } from "@/components/emails/email-composer";

export default async function ComposeEmailPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch leads for recipient selection
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch email templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (
    <div className="p-6 min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Compose Email
          </h1>
          <p className="text-muted-foreground">
            Send emails to your leads
          </p>
        </div>
        
        <EmailComposer leads={leads || []} templates={templates || []} />
      </div>
    </div>
  );
}
