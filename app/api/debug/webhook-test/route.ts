import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple webhook health check endpoint
 * This endpoint helps verify that webhook URLs are accessible
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: request.url,
    message: 'Your webhook endpoint is working. Configure this URL in Resend dashboard.'
  });
}

/**
 * Test webhook payload processing (without signature verification)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      status: 'Test webhook received',
      timestamp: new Date().toISOString(),
      receivedPayload: body,
      message: 'Webhook payload received successfully. In production, this would be processed with signature verification.'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse webhook payload',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
