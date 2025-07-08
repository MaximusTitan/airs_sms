import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Test analytics endpoint - check if we can read analytics data
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get recent email events
    const { data: events, error: eventsError } = await supabase
      .from('email_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (eventsError) {
      console.error('Events query error:', eventsError);
      return NextResponse.json({ 
        error: 'Failed to fetch events', 
        details: eventsError.message 
      }, { status: 500 });
    }
    
    // Get recent metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('email_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
      
    if (metricsError) {
      console.error('Metrics query error:', metricsError);
      return NextResponse.json({ 
        error: 'Failed to fetch metrics', 
        details: metricsError.message 
      }, { status: 500 });
    }
    
    // Calculate some basic stats
    const totalEvents = events?.length || 0;
    const totalMetrics = metrics?.length || 0;
    const eventTypes = events?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const metricCounts = metrics?.reduce((acc, metric) => {
      acc[metric.event_type] = (acc[metric.event_type] || 0) + metric.count;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return NextResponse.json({ 
      status: 'Analytics data retrieved successfully',
      events: {
        total: totalEvents,
        byType: eventTypes,
        recent: events?.slice(0, 3) || []
      },
      metrics: {
        total: totalMetrics,
        byType: metricCounts,
        recent: metrics?.slice(0, 3) || []
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
