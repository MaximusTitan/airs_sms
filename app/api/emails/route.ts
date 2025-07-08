import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('emails')
      .select(`
        *,
        template:email_templates(id, name, subject, content)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: emails, error: emailsError } = await query;

    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Get lead details for each email
    const emailsWithLeads = await Promise.all(
      (emails || []).map(async (email) => {
        if (!email.lead_ids || email.lead_ids.length === 0) {
          return { ...email, recipients: [] };
        }

        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, email, status')
          .in('id', email.lead_ids);

        if (leadsError) {
          console.error('Error fetching leads for email:', email.id, leadsError);
          return { ...email, recipients: [] };
        }

        return { ...email, recipients: leads || [] };
      })
    );

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting emails:', countError);
    }

    return NextResponse.json({
      emails: emailsWithLeads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error in emails API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
