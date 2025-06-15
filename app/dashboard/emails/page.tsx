import { createClient } from "@/lib/supabase/server";
import { EmailsHeader } from "@/components/emails/emails-header";
import { EmailsList } from "@/components/emails/emails-list";

export default async function EmailsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch emails
  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch email templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <EmailsHeader />
      <EmailsList emails={emails || []} templates={templates || []} />
    </div>
  );
}
