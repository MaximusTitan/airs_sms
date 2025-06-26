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

    // Fetch all forms for the current user
    const { data: forms, error } = await supabase
      .from('forms')
      .select('id, name, fields')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching forms:', error);
      return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
    }

    return NextResponse.json({ forms: forms || [] });
  } catch (error) {
    console.error('Error in forms API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
