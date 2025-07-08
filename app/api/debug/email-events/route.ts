import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordEmailEvent, trackEmailMetrics } from '@/lib/webhook-utils';

/**
 * DEBUG ENDPOINT: Test email events recording
 * This endpoint helps test the event recording functionality
 * Remove in production or protect with authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, email_id } = await request.json();
    
    if (action === 'test_event') {
      // Create a test event
      const testEvent = {
        email_id: email_id || 'test-email-id',
        event_type: 'sent',
        created_at: new Date().toISOString(),
        data: {
          email_id: email_id || 'test-email-id',
          to: ['test@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString()
        }
      };
      
      // Record the event
      await recordEmailEvent(testEvent);
      
      // Track metrics
      await trackEmailMetrics('sent');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test event recorded successfully',
        event: testEvent
      });
    }
    
    if (action === 'check_events') {
      // Get recent events
      const { data: events, error } = await supabase
        .from('email_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      // Get recent metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('email_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
        
      if (metricsError) {
        throw metricsError;
      }
      
      return NextResponse.json({
        success: true,
        events,
        metrics
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
