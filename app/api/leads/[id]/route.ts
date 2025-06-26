import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, status, notes, tags, form_data } = body;

    // Prepare update data, converting undefined to null for database
    const updateData: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      status?: string;
      notes?: string | null;
      tags?: string[];
      updated_at: string;
      form_data?: Record<string, unknown>;
    } = {
      name: name !== undefined ? name : null,
      email: email !== undefined ? email : null,
      phone: phone !== undefined ? phone : null,
      status,
      notes: notes !== undefined ? notes : null,
      tags: tags || [],
      updated_at: new Date().toISOString(),
    };

    // Only include form_data if it's provided
    if (form_data !== undefined) {
      updateData.form_data = form_data;
    }

    // Update the lead
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PATCH /api/leads/[id]:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the lead
    const { data: lead, error } = await supabase
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
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return NextResponse.json(
        { error: "Failed to fetch lead" },
        { status: 500 }
      );
    }

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);

  } catch (error) {
    console.error('Error in GET /api/leads/[id]:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
