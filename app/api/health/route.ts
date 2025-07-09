import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateEnvironment } from '@/lib/config';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check environment configuration
    let envStatus = 'healthy';
    try {
      validateEnvironment();
    } catch {
      envStatus = 'unhealthy';
    }

    // Check database connection
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      const supabase = await createClient();
      await supabase.from('email_events').select('id').limit(1);
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    const isHealthy = envStatus === 'healthy' && dbStatus === 'healthy';

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        environment: envStatus,
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        }
      },
      performance: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime()
      }
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503
    });

  } catch {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, {
      status: 503
    });
  }
}
