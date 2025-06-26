import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all leads for all users - no user filtering
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
        forms (
          name,
          fields
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    return NextResponse.json(leads || []);

  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
