import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Note: Using React 19 cache() function for server-side caching
// This provides automatic request deduplication and caching within a single request
// For more advanced caching features, upgrade to Next.js canary version

// Define cached data fetching functions outside components
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
  
  return user;
});

export const getLeads = cache(async () => {
  const supabase = await createClient();
  
  // Optimized query with better performance - limit to 100 most recent leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      *,
      forms (
        name,
        fields
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100); // Limit initial load to improve performance
    
  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }
  
  return leads || [];
});

export const getLeadsWithGroups = cache(async () => {
  const supabase = await createClient();
  
  // Optimized single query approach - fetch leads with groups in one go
  const { data: leadsWithGroups, error } = await supabase
    .from('leads')
    .select(`
      *,
      forms (
        name,
        fields
      ),
      group_memberships (
        lead_groups (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100); // Limit initial load to improve performance
    
  if (error) {
    throw new Error(`Failed to fetch leads with groups: ${error.message}`);
  }
  
  // Transform the data to the expected format
  return (leadsWithGroups || []).map(lead => ({
    ...lead,
    groups: lead.group_memberships?.map((membership: { lead_groups: { id: string; name: string } }) => membership.lead_groups) || []
  }));
});

export const getForms = cache(async () => {
  const supabase = await createClient();
  
  const { data: forms, error } = await supabase
    .from('forms')
    .select(`
      *,
      leads (count)
    `)
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch forms: ${error.message}`);
  }
  
  return forms || [];
});

export const getGroups = cache(async () => {
  const supabase = await createClient();
  
  const { data: groups, error } = await supabase
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
    
  if (error) {
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }
  
  return groups || [];
});

export const getGroup = cache(async (id: string) => {
  const supabase = await createClient();
  
  const { data: group, error } = await supabase
    .from('lead_groups')
    .select(`
      *,
      group_memberships (
        id,
        leads (
          id,
          name,
          email,
          phone,
          status,
          created_at,
          form_data,
          forms (
            fields
          )
        )
      )
    `)
    .eq('id', id)
    .single();
    
  if (error) {
    throw new Error(`Failed to fetch group: ${error.message}`);
  }
  
  return group;
});

export const getEmails = cache(async () => {
  const supabase = await createClient();
  
  const { data: emails, error } = await supabase
    .from('emails')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
  
  return emails || [];
});

export const getEmailsWithLeads = cache(async () => {
  const supabase = await createClient();
  const emails = await getEmails();
  
  if (!emails.length) return emails;
  
  // Get all unique lead IDs from emails
  const allLeadIds = [...new Set(emails.flatMap(email => email.lead_ids || []))];
  
  if (!allLeadIds.length) return emails;
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .in('id', allLeadIds);
    
  if (error) {
    throw new Error(`Failed to fetch leads for emails: ${error.message}`);
  }
  
  // Attach lead details to each email
  return emails.map(email => ({
    ...email,
    recipients: email.lead_ids 
      ? leads?.filter(lead => email.lead_ids.includes(lead.id)) || []
      : []
  }));
});

export const getEmailTemplates = cache(async () => {
  const supabase = await createClient();
  
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch email templates: ${error.message}`);
  }
  
  return templates || [];
});

// Utility function for timeout handling
export async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeout = 5000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const result = await fetchFn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Batch multiple data fetching operations
export async function fetchDashboardData() {
  const [leads, forms, emails] = await Promise.all([
    getLeads(),
    getForms(),
    getEmails()
  ]);
  
  const stats = {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(lead => lead.status === 'qualified').length,
    totalForms: forms.length,
    emailsSent: emails.filter(email => email.status === 'sent').length,
  };
  
  return { leads, forms, emails, stats };
}

export async function fetchAnalyticsData() {
  const [leads, forms, emails] = await Promise.all([
    getLeads(),
    getForms(),
    getEmails()
  ]);
  
  return { leads, forms, emails };
}
