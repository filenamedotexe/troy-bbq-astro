import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Environment variables with fallbacks (NEVER use fallbacks in production)
const JWT_SECRET = process.env.JWT_SECRET || 'troy-bbq-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'its.zach.w@gmail.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$DqMVD3Tq.2s5ZxxjyTCqze3dSALcI5/X8A81crog5lMEEP5ubJoM6';
const MEDUSA_PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY;

// Session configuration
const SESSION_COOKIE_NAME = 'troy-admin-session';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface JWTPayload {
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

interface SessionData {
  email: string;
  isAdmin: boolean;
}

/**
 * Rate limiting function
 */
export function checkRateLimit(identifier: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Validates admin credentials
 */
export async function validateAdminCredentials(email: string, password: string): Promise<boolean> {
  if (email !== ADMIN_EMAIL) {
    return false;
  }

  return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

/**
 * Creates a JWT token
 */
export function createJWTToken(email: string): string {
  const payload: JWTPayload = {
    email,
    isAdmin: true
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

/**
 * Validates and decodes a JWT token
 */
export function validateJWTToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;

    // Validate token data
    if (decoded.email === ADMIN_EMAIL && decoded.isAdmin) {
      return {
        email: decoded.email,
        isAdmin: decoded.isAdmin
      };
    }

    return null;
  } catch (error) {
    // JWT expired, invalid signature, etc.
    return null;
  }
}

/**
 * Legacy function for backward compatibility - use createJWTToken instead
 */
export function createSessionToken(email: string): string {
  return createJWTToken(email);
}

/**
 * Legacy function for backward compatibility - use validateJWTToken instead
 */
export function validateSessionToken(token: string): SessionData | null {
  return validateJWTToken(token);
}

/**
 * Checks if the request has valid admin authentication
 */
export function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const cookies = parseCookies(request.headers.get('cookie') || '');

  let token = null;

  // Check Authorization header first (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  // Fallback to cookie
  else if (cookies[SESSION_COOKIE_NAME]) {
    token = cookies[SESSION_COOKIE_NAME];
  }

  if (!token) {
    return false;
  }

  const sessionData = validateJWTToken(token);
  return sessionData !== null;
}

/**
 * Validates MedusaJS publishable key for store endpoints
 */
export function validateMedusaKey(request: Request): boolean {
  if (!MEDUSA_PUBLISHABLE_KEY) {
    console.warn('MEDUSA_PUBLISHABLE_KEY not configured');
    return false;
  }

  const providedKey = request.headers.get('x-publishable-api-key') ||
                     request.headers.get('X-Publishable-Api-Key');

  return providedKey === MEDUSA_PUBLISHABLE_KEY;
}

/**
 * Gets the session cookie header for setting authentication
 */
export function getSessionCookieHeader(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=86400`;
}

/**
 * Gets the logout cookie header for clearing authentication
 */
export function getLogoutCookieHeader(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=0`;
}

/**
 * Parses cookies from cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}

/**
 * Sanitizes input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validates request origin for CORS
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:4005',
    'http://localhost:3000',
    'https://troybbq.com',
    'https://www.troybbq.com',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean);

  if (!origin) {
    // Allow same-origin requests (no Origin header)
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Gets client IP address for rate limiting
 */
export function getClientIP(request: Request): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIp || cfConnectingIp || 'unknown';
}

/**
 * Generates the hash for the admin password (utility function)
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 12); // Increased rounds for better security
}

/**
 * Creates comprehensive security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Content Security Policy - Enterprise-grade protection
    'Content-Security-Policy': getContentSecurityPolicy(isProduction),

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent framing (clickjacking protection)
    'X-Frame-Options': 'DENY',

    // XSS Protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Prevent DNS prefetching for privacy
    'X-DNS-Prefetch-Control': 'off',

    // Disable client-side caching of sensitive data
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',

    // HTTP Strict Transport Security (HSTS) - production only
    ...(isProduction && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),

    // Permissions Policy (Feature Policy successor)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'payment=(self)',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),

    // Cross-Origin policies
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',

    // Server information hiding
    'Server': 'Troy BBQ Security Server',
    'X-Powered-By': '', // Remove server technology disclosure
  };
}

/**
 * Generates Content Security Policy with proper nonce support
 */
function getContentSecurityPolicy(isProduction: boolean): string {
  const basePolicy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Vite/Astro development
      ...(isProduction ? [] : ["'unsafe-inline'"]), // Remove in production
      'https://js.stripe.com',
      'https://checkout.square.com',
      'https://cdn.jsdelivr.net', // For CDN resources
      'https://unpkg.com', // For package CDN
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and component styles
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.stripe.com',
      'https://*.squareup.com',
      'https://*.square.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://checkout.square.com',
      'https://connect.squareup.com',
      'https://pci-connect.squareup.com',
      ...(isProduction ? [] : ['ws://localhost:*', 'wss://localhost:*']), // WebSocket for dev
      process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
      process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).origin : '',
    ].filter(Boolean),
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://checkout.square.com',
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': isProduction ? [] : undefined,
  };

  return Object.entries(basePolicy)
    .filter(([_, value]) => value !== undefined)
    .map(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        return `${directive} ${sources.join(' ')}`;
      } else if (Array.isArray(sources) && sources.length === 0) {
        return directive;
      }
      return null;
    })
    .filter(Boolean)
    .join('; ');
}

// Export constants and types for use in other files
export { SESSION_COOKIE_NAME, JWT_SECRET };
export type { JWTPayload, SessionData };