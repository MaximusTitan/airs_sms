import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getEmailAnalytics, 
  getDailyEmailMetrics, 
  getEmailEngagementTrends 
} from '@/lib/email-analytics';

/**
 * GET /api/analytics/email
 * Returns comprehensive email analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all analytics data in parallel - NO USER FILTERING
    const [analytics, dailyMetrics, engagementTrends] = await Promise.all([
      getEmailAnalytics(startDateStr, endDateStr), // No user.id passed
      getDailyEmailMetrics(startDateStr, endDateStr),
      getEmailEngagementTrends(startDateStr, endDateStr)
    ]);

    return NextResponse.json({
      analytics,
      dailyMetrics,
      engagementTrends,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
        range
      }
    });

  } catch (error) {
    console.error('Email analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email analytics' },
      { status: 500 }
    );
  }
}
