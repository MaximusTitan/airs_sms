import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Simple database connection test endpoint
 * This endpoint tests if we can connect to the database and insert test data
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test if we can read from the database
    const { error: eventsError } = await supabase
      .from('email_events')
      .select('count')
      .limit(1);
      
    if (eventsError) {
      console.error('Database error:', eventsError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: eventsError.message 
      }, { status: 500 });
    }
    
    // Test if we can read metrics
    const { error: metricsError } = await supabase
      .from('email_metrics')
      .select('count')
      .limit(1);
      
    if (metricsError) {
      console.error('Metrics table error:', metricsError);
      return NextResponse.json({ 
        error: 'Metrics table access failed', 
        details: metricsError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: 'Database connection successful',
      email_events_accessible: true,
      email_metrics_accessible: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Test event recording
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Insert a test email event directly
    const testEvent = {
      email_id: `test-${Date.now()}`,
      event_type: 'sent',
      data: {
        subject: 'Test Email',
        to: ['test@example.com']
      },
      created_at: new Date().toISOString()
    };
    
    const { data: eventResult, error: eventError } = await supabase
      .from('email_events')
      .insert(testEvent)
      .select();
      
    if (eventError) {
      console.error('Event insert error:', eventError);
      return NextResponse.json({ 
        error: 'Failed to insert event', 
        details: eventError.message 
      }, { status: 500 });
    }
    
    // Insert a test metric
    const testMetric = {
      date: new Date().toISOString().split('T')[0],
      event_type: 'sent',
      count: 1
    };
    
    const { data: metricResult, error: metricError } = await supabase
      .from('email_metrics')
      .upsert(testMetric, { 
        onConflict: 'date,event_type',
        ignoreDuplicates: false 
      })
      .select();
      
    if (metricError) {
      console.error('Metric upsert error:', metricError);
      return NextResponse.json({ 
        error: 'Failed to insert metric', 
        details: metricError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: 'Test data inserted successfully',
      event: eventResult,
      metric: metricResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test POST endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
