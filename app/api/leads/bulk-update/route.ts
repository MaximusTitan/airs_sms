import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { leadIds, status } = await request.json();

    // Validate status
    const validStatuses = ['new_lead', 'qualified', 'pilot_ready', 'running_pilot', 'pilot_done', 'sale_done', 'implementation', 'not_interested', 'unqualified', 'trash'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Validate leadIds
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lead IDs' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update lead statuses - no user restriction
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .in('id', leadIds)
      .select();

    if (error) {
      console.error('Error updating lead statuses:', error);
      return NextResponse.json(
        { error: 'Failed to update lead statuses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating lead statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
