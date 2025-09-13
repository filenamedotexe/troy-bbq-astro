import type { MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { getSecurityHeaders } from './lib/auth';

// Security middleware for Astro
export const onRequest = defineMiddleware(async (context, next: MiddlewareNext) => {
  const { request, url } = context;

  // Security headers for all responses
  const securityHeaders = getSecurityHeaders();

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') !== 'https') {
    const httpsUrl = new URL(url.toString());
    httpsUrl.protocol = 'https:';

    return new Response(null, {
      status: 301,
      headers: {
        'Location': httpsUrl.toString(),
        ...securityHeaders
      }
    });
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:4005',
      'http://localhost:3000',
      'https://troybbq.com',
      'https://www.troybbq.com',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Publishable-Api-Key, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
          ...securityHeaders
        }
      });
    }

    return new Response(null, {
      status: 403,
      headers: securityHeaders
    });
  }

  // Basic request validation
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 5) {
    console.warn('Suspicious request with invalid user agent:', {
      url: url.toString(),
      userAgent,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      timestamp: new Date().toISOString()
    });
  }

  // Rate limiting check for suspicious behavior
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  // Block known bad IPs or patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scanner/i,
    /hack/i,
  ];

  if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    // Log suspicious activity
    console.warn('Blocked suspicious request:', {
      url: url.toString(),
      userAgent,
      clientIP,
      timestamp: new Date().toISOString()
    });

    return new Response('Access Denied', {
      status: 403,
      headers: securityHeaders
    });
  }

  // Continue to the next middleware/page
  const response = await next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove server information disclosure
  response.headers.delete('x-powered-by');
  response.headers.delete('server');

  // Add security-related headers based on response type
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('text/html')) {
    // Additional HTML-specific security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
  }

  if (contentType?.includes('application/json')) {
    // JSON-specific security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  return response;
});