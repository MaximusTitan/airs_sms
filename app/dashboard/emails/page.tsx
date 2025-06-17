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
  // Fetch emails with lead information for recipients
  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false });

  // For each email, fetch the lead details if lead_ids exist
  let emailsWithLeads = emails || [];
  if (emails && emails.length > 0) {
    // Get all unique lead IDs from all emails
    const allLeadIds = Array.from(new Set(
      emails
        .filter(email => email.lead_ids && email.lead_ids.length > 0)
        .flatMap(email => email.lead_ids)
    ));

    if (allLeadIds.length > 0) {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, email, status')
        .in('id', allLeadIds);

      // Attach lead details to each email
      emailsWithLeads = emails.map(email => ({
        ...email,
        recipients: email.lead_ids 
          ? leads?.filter(lead => email.lead_ids.includes(lead.id)) || []
          : []
      }));
    }
  }
  // Fetch email templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  // Get the FROM_EMAIL from environment
  const fromEmail = process.env.FROM_EMAIL || 'AIRS@aireadyschool.com';return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <EmailsHeader />
      <EmailsList emails={emailsWithLeads} templates={templates || []} fromEmail={fromEmail} />
    </div>
  );
}
