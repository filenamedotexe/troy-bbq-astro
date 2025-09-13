import bcrypt from 'bcryptjs';

// Admin credentials
const ADMIN_EMAIL = 'its.zach.w@gmail.com';
const ADMIN_PASSWORD_HASH = '$2b$10$GPBEGVFXsG0l0fQRJWGSAu.Zq/IFSUB6THydHiLOkjHKCCHhhD1IC'; // Hash of "Password123!"

// Session configuration
const SESSION_COOKIE_NAME = 'troy-admin-session';
const SESSION_SECRET = 'troy-bbq-admin-secret-key-2024'; // In production, use environment variable

interface SessionData {
  email: string;
  isAdmin: boolean;
  loginTime: number;
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
 * Creates a session token
 */
export function createSessionToken(email: string): string {
  const sessionData: SessionData = {
    email,
    isAdmin: true,
    loginTime: Date.now()
  };
  
  // Simple base64 encoding for demo purposes
  // In production, use proper JWT or encrypted sessions
  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}

/**
 * Validates and decodes a session token
 */
export function validateSessionToken(token: string): SessionData | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const sessionData: SessionData = JSON.parse(decoded);
    
    // Check if session is expired (24 hours)
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.loginTime > twentyFourHours) {
      return null;
    }
    
    // Validate session data
    if (sessionData.email === ADMIN_EMAIL && sessionData.isAdmin) {
      return sessionData;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if the request has valid admin authentication
 */
export function isAuthenticated(request: Request): boolean {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  
  if (!sessionToken) {
    return false;
  }
  
  const sessionData = validateSessionToken(sessionToken);
  return sessionData !== null;
}

/**
 * Gets the session cookie header for setting authentication
 */
export function getSessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`;
}

/**
 * Gets the logout cookie header for clearing authentication
 */
export function getLogoutCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
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
 * Generates the hash for the admin password (utility function)
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Export cookie name for use in other files
export { SESSION_COOKIE_NAME };