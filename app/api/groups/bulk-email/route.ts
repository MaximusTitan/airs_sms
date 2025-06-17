import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const bulkEmailSchema = z.object({
  groupIds: z.array(z.string()).min(1, "At least one group is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
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
    const { groupIds, subject, content } = bulkEmailSchema.parse(body);

    // Get all leads from the selected groups
    const { data: memberships, error: membershipError } = await supabase
      .from("group_memberships")
      .select(`
        leads (
          id,
          name,
          email
        ),
        lead_groups!inner (
          id,
          user_id
        )
      `)
      .in("group_id", groupIds)
      .eq("lead_groups.user_id", user.id);

    if (membershipError) {
      console.error("Error fetching group memberships:", membershipError);
      return NextResponse.json(
        { error: "Failed to fetch group members" },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        { error: "No leads found in selected groups" },
        { status: 400 }
      );
    }    // Extract unique email addresses
    const recipients = Array.from(
      new Set(
        memberships
          .filter((m) => m.leads && typeof m.leads === 'object' && 'email' in m.leads)
          .map((m) => (m.leads as unknown as { email: string }).email)
          .filter((email): email is string => Boolean(email))
      )
    );

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses found" },
        { status: 400 }
      );
    }

    // Send email using Resend
    const emailData = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: recipients,
      subject,
      html: content,
    });

    // Store email record in database
    const { data: emailRecord, error: emailError } = await supabase
      .from("emails")
      .insert({
        subject,
        content,
        recipient_emails: recipients,
        lead_ids: memberships
          .filter((m) => m.leads && typeof m.leads === 'object' && 'id' in m.leads)
          .map((m) => (m.leads as unknown as { id: string }).id)
          .filter(Boolean),
        status: "sent",
        sent_at: new Date().toISOString(),
        user_id: user.id,
        resend_id: emailData.data?.id || null,
      })
      .select()
      .single();

    if (emailError) {
      console.error("Error storing email record:", emailError);
      // Don't fail the request if email was sent successfully
    }

    return NextResponse.json({
      message: `Email sent successfully to ${recipients.length} recipients`,
      emailId: emailRecord?.id,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error("Error in bulk email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
