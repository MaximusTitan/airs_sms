import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all leads with form information
    const { data: leads, error } = await supabase
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
        forms (
          name,
          fields
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Set caching headers for better performance
    const response = NextResponse.json({ leads: leads || [] });
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    return response;

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

    return NextResponse.json({ lead }, { status: 201 });

  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
