import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailCampaignAnalytics } from '@/lib/email-analytics';

/**
 * POST /api/analytics/email/campaigns
 * Returns analytics for specific email campaigns
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailIds } = await request.json();

    if (!Array.isArray(emailIds)) {
      return NextResponse.json({ error: 'emailIds must be an array' }, { status: 400 });
    }

    const analytics = await getEmailCampaignAnalytics(emailIds);

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('Email campaign analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email campaign analytics' },
      { status: 500 }
    );
  }
}
