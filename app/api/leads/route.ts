import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';

// Enable explicit caching with revalidation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    // const groupId = searchParams.get('group') || ''; // TODO: Implement group filtering
    const formId = searchParams.get('form') || '';
    const tags = searchParams.get('tags') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the base query with all necessary joins - NO USER FILTERING
    let query = supabase
      .from('leads')
      .select(`
        id,
        name,
        email,
        phone,
        status,
        created_at,
        updated_at,
        source,
        notes,
        tags,
        form_data,
        form_id,
        user_id,
        forms (
          id,
          name,
          fields
        ),
        group_memberships (
          lead_groups (
            id,
            name
          )
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply form filter
    if (formId && formId !== 'all') {
      if (formId === 'none') {
        query = query.is('form_id', null);
      } else {
        query = query.eq('form_id', formId);
      }
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply tags filter
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      query = query.overlaps('tags', tagList);
    }

    // Apply source filter (form name or direct source)
    if (source && source !== 'all') {
      query = query.or(`source.eq.${source},forms.name.eq.${source}`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      throw error;
    }

    // Process the leads to format groups properly
    const processedLeads = (leads || []).map(lead => ({
      ...lead,
      groups: lead.group_memberships?.map(membership => membership.lead_groups).filter(Boolean) || []
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({ 
      leads: processedLeads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Use body data as provided - NO USER ID ENFORCEMENT
    const { data: lead, error } = await supabase
      .from('leads')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate cached data after mutation
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard');

    return NextResponse.json({ lead });

  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
