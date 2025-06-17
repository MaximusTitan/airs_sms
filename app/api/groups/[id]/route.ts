import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").optional(),
  description: z.string().optional(),
});

export async function PATCH(
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
    const body = await request.json();
    const updateData = updateGroupSchema.parse(body);

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

    // Update the group
    const { data: updatedGroup, error: updateError } = await supabase
      .from("lead_groups")
      .update(updateData)
      .eq("id", groupId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating group:", updateError);
      return NextResponse.json(
        { error: "Failed to update group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      group: updatedGroup,
      message: "Group updated successfully",
    });
  } catch (error) {
    console.error("Error in update group API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { id: groupId } = await params;

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

    // Delete group memberships first (they will cascade delete automatically due to foreign key constraints)
    const { error: membershipError } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId);

    if (membershipError) {
      console.error("Error deleting group memberships:", membershipError);
      return NextResponse.json(
        { error: "Failed to delete group memberships" },
        { status: 500 }
      );
    }

    // Delete the group
    const { error: deleteError } = await supabase
      .from("lead_groups")
      .delete()
      .eq("id", groupId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting group:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete group API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
