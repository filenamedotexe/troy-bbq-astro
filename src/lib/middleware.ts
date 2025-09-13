import type { APIRoute } from 'astro';
import {
  isAuthenticated,
  validateMedusaKey,
  validateOrigin,
  getClientIP,
  checkRateLimit,
  getSecurityHeaders,
  sanitizeInput
} from './auth';

/**
 * Security middleware configuration
 */
interface SecurityConfig {
  requireAuth?: boolean;
  requireMedusaKey?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  cors?: boolean;
  compression?: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_CONFIG: SecurityConfig = {
  requireAuth: false,
  requireMedusaKey: false,
  rateLimit: {
    requests: 100,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  cors: true,
  compression: true
};

/**
 * Creates a secure API route wrapper
 */
export function createSecureRoute(
  handler: (context: any) => Promise<Response> | Response,
  config: SecurityConfig = {}
): APIRoute {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (context) => {
    const { request } = context;

    try {
      // Apply security headers
      const securityHeaders = getSecurityHeaders();

      // CORS validation
      if (finalConfig.cors && !validateOrigin(request)) {
        return new Response(
          JSON.stringify({ error: 'Invalid origin' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders
            }
          }
        );
      }

      // Rate limiting
      if (finalConfig.rateLimit) {
        const clientIP = getClientIP(request);
        const rateLimitKey = `${request.method}:${new URL(request.url).pathname}:${clientIP}`;

        if (!checkRateLimit(rateLimitKey, finalConfig.rateLimit.requests, finalConfig.rateLimit.windowMs)) {
          return new Response(
            JSON.stringify({
              error: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil(finalConfig.rateLimit.windowMs / 1000)
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil(finalConfig.rateLimit.windowMs / 1000)),
                ...securityHeaders
              }
            }
          );
        }
      }

      // Authentication check
      if (finalConfig.requireAuth && !isAuthenticated(request)) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer',
              ...securityHeaders
            }
          }
        );
      }

      // MedusaJS API key validation
      if (finalConfig.requireMedusaKey && !validateMedusaKey(request)) {
        return new Response(
          JSON.stringify({ error: 'Valid MedusaJS API key required' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders
            }
          }
        );
      }

      // Call the actual handler
      const response = await handler(context);

      // Apply compression and security headers to response
      const responseHeaders = new Headers(response.headers);

      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      // Add compression headers if applicable
      if (finalConfig.compression && response.body) {
        responseHeaders.set('Content-Encoding', 'gzip');
        responseHeaders.set('Vary', 'Accept-Encoding');
      }

      // Add performance headers
      responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('Expires', '0');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('Security middleware error:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          requestId: generateRequestId()
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders()
          }
        }
      );
    }
  };
}

/**
 * Admin route wrapper with authentication
 */
export function createAdminRoute(
  handler: (context: any) => Promise<Response> | Response
): APIRoute {
  return createSecureRoute(handler, {
    requireAuth: true,
    rateLimit: {
      requests: 50, // Lower rate limit for admin endpoints
      windowMs: 15 * 60 * 1000
    }
  });
}

/**
 * Store route wrapper with MedusaJS validation
 */
export function createStoreRoute(
  handler: (context: any) => Promise<Response> | Response
): APIRoute {
  return createSecureRoute(handler, {
    requireMedusaKey: true,
    rateLimit: {
      requests: 200, // Higher rate limit for store endpoints
      windowMs: 15 * 60 * 1000
    }
  });
}

/**
 * Public route wrapper with basic security
 */
export function createPublicRoute(
  handler: (context: any) => Promise<Response> | Response
): APIRoute {
  return createSecureRoute(handler, {
    rateLimit: {
      requests: 100,
      windowMs: 15 * 60 * 1000
    }
  });
}

/**
 * Input validation middleware
 */
export function validateInput(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'number') {
      // Validate numeric inputs
      if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Invalid numeric value for ${key}`);
      }
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = validateInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Generates a unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates ETags for response caching
 */
export function generateETag(content: string): string {
  const crypto = globalThis.crypto;
  if (!crypto || !crypto.subtle) {
    // Fallback for environments without crypto API
    return `"${Buffer.from(content).toString('base64').slice(0, 16)}"`;
  }

  return `"${Date.now()}_${content.length}"`;
}

/**
 * Handles OPTIONS requests for CORS preflight
 */
export function handleCORSPreflight(request: Request): Response {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:4005',
    'http://localhost:3000',
    'https://troybbq.com',
    'https://www.troybbq.com'
  ];

  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Publishable-Api-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
      ...getSecurityHeaders()
    }
  });
}

export type { SecurityConfig };