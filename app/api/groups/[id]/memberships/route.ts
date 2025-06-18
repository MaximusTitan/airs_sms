import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { leadIds }: { leadIds: string[] } = await request.json();

    if (!leadIds || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided" },
        { status: 400 }
      );
    }

    // Verify the group belongs to the user
    const { data: group, error: groupError } = await supabase
      .from("lead_groups")
      .select("id")
      .eq("id", groupId)
      .eq("user_id", user.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Verify all leads belong to the user
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id")
      .in("id", leadIds)
      .eq("user_id", user.id);

    if (leadsError || !leads || leads.length !== leadIds.length) {
      return NextResponse.json(
        { error: "One or more leads not found" },
        { status: 404 }
      );
    }

    // Check for existing memberships to avoid duplicates
    const { data: existingMemberships } = await supabase
      .from("group_memberships")
      .select("lead_id")
      .eq("group_id", groupId)
      .in("lead_id", leadIds);

    const existingLeadIds = existingMemberships?.map(m => m.lead_id) || [];
    const newLeadIds = leadIds.filter(id => !existingLeadIds.includes(id));

    if (newLeadIds.length === 0) {
      return NextResponse.json(
        { error: "All leads are already members of this group" },
        { status: 400 }
      );
    }

    // Create new memberships
    const membershipData = newLeadIds.map(leadId => ({
      group_id: groupId,
      lead_id: leadId
    }));

    const { data: newMemberships, error: insertError } = await supabase
      .from("group_memberships")
      .insert(membershipData)
      .select();

    if (insertError) {
      console.error("Error creating memberships:", insertError);
      return NextResponse.json(
        { error: "Failed to add members to group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully added ${newMemberships.length} members to group`,
      addedCount: newMemberships.length,
      skippedCount: leadIds.length - newMemberships.length
    });

  } catch (error) {
    console.error("Error in POST /api/groups/[id]/memberships:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
