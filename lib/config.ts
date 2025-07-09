import { NextRequest } from 'next/server';

/**
 * Environment configuration and validation
 */

interface EnvironmentConfig {
  webhookSecret: string;
  resendApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  fromEmail: string;
  nodeEnv: string;
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  const requiredVars = [
    'WEBHOOK_SECRET',
    'RESEND_API_KEY', 
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    webhookSecret: process.env.WEBHOOK_SECRET!,
    resendApiKey: process.env.RESEND_API_KEY!,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    fromEmail: process.env.FROM_EMAIL || 'AIRS@aireadyschool.com',
    nodeEnv: process.env.NODE_ENV || 'development'
  };
}

/**
 * Simple rate limiting implementation
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const requestData = requestCounts.get(identifier);

  if (!requestData || now > requestData.resetTime) {
    // Reset or create new entry
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (requestData.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  requestData.count++;
  return true;
}

/**
 * Get client IP address for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Sanitize log data to prevent sensitive information leakage
 */
export function sanitizeLogData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data as Record<string, unknown> };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'email', 'phone', 'ip_address', 'user_agent'
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Production-safe logger
 */
export const logger = {
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data ? sanitizeLogData(data) : '');
    }
    // In production, send to logging service like Datadog, LogRocket, etc.
  },
  
  error: (message: string, error?: Error | unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error);
    }
    // In production, send to error tracking service like Sentry
    // Sentry.captureException(error, { extra: { message } });
  },
  
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data ? sanitizeLogData(data) : '');
    }
    // In production, send to logging service
  }
};

// Initialize environment validation on module load
try {
  validateEnvironment();
} catch (error) {
  logger.error('Environment validation failed', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
