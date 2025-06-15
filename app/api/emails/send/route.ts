import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  let subject, content, recipientEmails, leadIds, templateId;
  
  try {
    ({ subject, content, recipientEmails, leadIds, templateId } = await request.json());
    
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: recipientEmails,
      subject,
      html: content,
    });

    if (error) {
      throw error;
    }

    // Save email record to database
    const { error: dbError } = await supabase
      .from('emails')
      .insert([
        {
          subject,
          content,
          template_id: templateId,
          sent_at: new Date().toISOString(),
          status: 'sent',
          recipient_emails: recipientEmails,
          lead_ids: leadIds,
          user_id: user.id,
          resend_id: data?.id,
        },
      ]);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({ 
      success: true, 
      emailId: data?.id,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    // Save failed email record
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('emails')
          .insert([
            {
              subject: subject || 'Failed Email',
              content: content || '',
              status: 'failed',
              recipient_emails: recipientEmails || [],
              lead_ids: leadIds || [],
              user_id: user.id,
            },
          ]);
      }
    } catch (dbError) {
      console.error('Failed to save error record:', dbError);
    }

    return NextResponse.json(
      { error: 'Failed to send email', details: error },
      { status: 500 }
    );
  }
}
