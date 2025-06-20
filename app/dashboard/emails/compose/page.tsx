import { createClient } from "@/lib/supabase/server";
import { EmailComposer } from "@/components/emails/email-composer";

interface ComposeEmailPageProps {
  searchParams: Promise<{
    leads?: string;
    groups?: string;
    template?: string;
  }>;
}

export default async function ComposeEmailPage({ searchParams }: ComposeEmailPageProps) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }
  // Await and parse pre-selected leads from URL params
  const params = await searchParams;
  const preSelectedLeadIds = params.leads ? params.leads.split(',') : [];
  const preSelectedGroupIds = params.groups ? params.groups.split(',') : [];
  const preSelectedTemplateId = params.template || null;

  // Fetch leads for recipient selection
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // If groups are selected, fetch leads from those groups
  let groupLeadIds: string[] = [];
  if (preSelectedGroupIds.length > 0) {
    const { data: groupMemberships } = await supabase
      .from('group_memberships')
      .select('lead_id')
      .in('group_id', preSelectedGroupIds);
    
    groupLeadIds = groupMemberships?.map(m => m.lead_id) || [];
  }

  // Combine pre-selected leads from direct selection and group selection
  const allPreSelectedLeadIds = [...new Set([...preSelectedLeadIds, ...groupLeadIds])];

  // Fetch email templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });  return (
    <div className="p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Compose Email
          </h1>
          <p className="text-muted-foreground">
            {allPreSelectedLeadIds.length > 0 
              ? `Compose email for ${allPreSelectedLeadIds.length} pre-selected recipients`
              : "Send emails to your leads"
            }
          </p>
        </div>
          <EmailComposer 
          leads={leads || []} 
          templates={templates || []} 
          preSelectedLeads={allPreSelectedLeadIds}
          preSelectedTemplate={preSelectedTemplateId}
        />
      </div>
    </div>
  );
}
