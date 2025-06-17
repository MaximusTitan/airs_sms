import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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

    const { id: membershipId } = await params;

    // Verify the membership belongs to a group owned by the user
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select(`
        id,
        lead_groups!inner (
          id,
          user_id
        )
      `)
      .eq("id", membershipId)
      .eq("lead_groups.user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Delete the membership
    const { error: deleteError } = await supabase
      .from("group_memberships")
      .delete()
      .eq("id", membershipId);

    if (deleteError) {
      console.error("Error deleting membership:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member from group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Member removed from group successfully",
    });
  } catch (error) {
    console.error("Error in delete membership API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
