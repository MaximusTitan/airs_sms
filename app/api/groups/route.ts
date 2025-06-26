import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  leadIds: z.array(z.string()).min(1, "At least one lead is required"),
});

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
    const { name, description, leadIds } = createGroupSchema.parse(body);

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("lead_groups")
      .insert({
        name,
        description,
        user_id: user.id,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }

    // Add leads to the group
    const memberships = leadIds.map((leadId) => ({
      group_id: group.id,
      lead_id: leadId,
    }));

    const { error: membershipError } = await supabase
      .from("group_memberships")
      .insert(memberships);

    if (membershipError) {
      console.error("Error adding leads to group:", membershipError);
      
      // Rollback: Delete the created group
      await supabase
        .from("lead_groups")
        .delete()
        .eq("id", group.id);

      return NextResponse.json(
        { error: "Failed to add leads to group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      group,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("Error in create group API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch groups with lead count - no user filtering
    const { data: groups, error } = await supabase
      .from("lead_groups")
      .select(`
        *,
        group_memberships (
          id,
          leads (
            id,
            name,
            email,
            status
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error in get groups API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
