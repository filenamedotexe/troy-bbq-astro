import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';

// Session security configuration
const SESSION_CONFIG = {
  maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
  renewThreshold: parseInt(process.env.SESSION_RENEW_THRESHOLD || '3600000'), // 1 hour
  maxSessions: parseInt(process.env.MAX_SESSIONS_PER_USER || '5'),
  cookieName: process.env.SESSION_COOKIE_NAME || 'troy-session',
  secureSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-dev-secret',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  domain: process.env.SESSION_DOMAIN || undefined,
};

export interface SessionData {
  userId: string;
  email: string;
  isAdmin: boolean;
  permissions: string[];
  deviceFingerprint: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  renewedAt?: number;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  reason?: 'expired' | 'invalid_signature' | 'device_mismatch' | 'suspicious_activity' | 'malformed';
  shouldRenew?: boolean;
}

export interface SecureSessionToken {
  sessionId: string;
  signature: string;
  payload: string;
}

export class SessionSecurityService {
  private static activeSessions = new Map<string, SessionData[]>();
  private static blacklistedTokens = new Set<string>();

  /**
   * Creates a secure session token
   */
  static createSession(
    userId: string,
    email: string,
    isAdmin: boolean,
    permissions: string[],
    request: Request
  ): { token: string; sessionData: SessionData } {
    const now = Date.now();
    const deviceFingerprint = this.generateDeviceFingerprint(request);
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const sessionData: SessionData = {
      userId,
      email,
      isAdmin,
      permissions,
      deviceFingerprint,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      userAgent,
    };

    // Clean up old sessions for this user
    this.cleanupUserSessions(userId);

    // Add to active sessions
    const userSessions = this.activeSessions.get(userId) || [];
    userSessions.push(sessionData);
    this.activeSessions.set(userId, userSessions);

    // Generate secure token
    const token = this.generateSecureToken(sessionData);

    return { token, sessionData };
  }

  /**
   * Validates a session token
   */
  static validateSession(token: string, request: Request): SessionValidationResult {
    try {
      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        return { valid: false, reason: 'invalid_signature' };
      }

      // Parse and verify token
      const tokenData = this.parseSecureToken(token);
      if (!tokenData) {
        return { valid: false, reason: 'malformed' };
      }

      const sessionData = JSON.parse(tokenData.payload) as SessionData;

      // Validate token signature
      if (!this.verifyTokenSignature(tokenData)) {
        return { valid: false, reason: 'invalid_signature' };
      }

      // Check expiration
      const now = Date.now();
      if (now > sessionData.createdAt + SESSION_CONFIG.maxAge) {
        this.revokeSession(sessionData.userId, token);
        return { valid: false, reason: 'expired' };
      }

      // Device fingerprint validation
      const currentFingerprint = this.generateDeviceFingerprint(request);
      if (sessionData.deviceFingerprint !== currentFingerprint) {
        this.revokeSession(sessionData.userId, token);
        return { valid: false, reason: 'device_mismatch' };
      }

      // IP address change detection (allow but log)
      const currentIP = this.getClientIP(request);
      if (sessionData.ipAddress !== currentIP) {
        console.warn('Session IP address changed:', {
          userId: sessionData.userId,
          originalIP: sessionData.ipAddress,
          currentIP,
          userAgent: sessionData.userAgent,
          timestamp: new Date().toISOString()
        });

        // Update IP in session but continue validation
        sessionData.ipAddress = currentIP;
      }

      // Check if session should be renewed
      const shouldRenew = now > sessionData.lastActivity + SESSION_CONFIG.renewThreshold;

      // Update last activity
      sessionData.lastActivity = now;

      return {
        valid: true,
        session: sessionData,
        shouldRenew
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, reason: 'malformed' };
    }
  }

  /**
   * Renews a session token
   */
  static renewSession(token: string, request: Request): { token: string; sessionData: SessionData } | null {
    const validation = this.validateSession(token, request);

    if (!validation.valid || !validation.session) {
      return null;
    }

    // Mark old token as blacklisted
    this.blacklistedTokens.add(token);

    // Create new session with updated data
    const sessionData = {
      ...validation.session,
      renewedAt: Date.now(),
      lastActivity: Date.now(),
    };

    const newToken = this.generateSecureToken(sessionData);

    return { token: newToken, sessionData };
  }

  /**
   * Revokes a session
   */
  static revokeSession(userId: string, token?: string): void {
    if (token) {
      this.blacklistedTokens.add(token);
    }

    // Remove from active sessions
    const userSessions = this.activeSessions.get(userId);
    if (userSessions) {
      this.activeSessions.set(userId, []);
    }
  }

  /**
   * Revokes all sessions for a user
   */
  static revokeAllUserSessions(userId: string): void {
    const userSessions = this.activeSessions.get(userId) || [];

    // Add all session tokens to blacklist (if we tracked them)
    // In this implementation, we rely on device fingerprint validation

    // Clear active sessions
    this.activeSessions.set(userId, []);

    console.info('All sessions revoked for user:', { userId, count: userSessions.length });
  }

  /**
   * Generates a secure session token
   */
  private static generateSecureToken(sessionData: SessionData): string {
    const sessionId = randomBytes(32).toString('hex');
    const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64url');

    // Create HMAC signature
    const signature = createHmac('sha256', SESSION_CONFIG.secureSecret)
      .update(`${sessionId}.${payload}`)
      .digest('base64url');

    return `${sessionId}.${payload}.${signature}`;
  }

  /**
   * Parses a secure token
   */
  private static parseSecureToken(token: string): SecureSessionToken | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    return {
      sessionId: parts[0],
      payload: Buffer.from(parts[1], 'base64url').toString(),
      signature: parts[2]
    };
  }

  /**
   * Verifies token signature
   */
  private static verifyTokenSignature(tokenData: SecureSessionToken): boolean {
    const expectedSignature = createHmac('sha256', SESSION_CONFIG.secureSecret)
      .update(`${tokenData.sessionId}.${Buffer.from(tokenData.payload).toString('base64url')}`)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(tokenData.signature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  }

  /**
   * Generates device fingerprint for session validation
   */
  private static generateDeviceFingerprint(request: Request): string {
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';

    const fingerprint = createHmac('sha256', SESSION_CONFIG.secureSecret)
      .update(`${userAgent}:${acceptLanguage}:${acceptEncoding}`)
      .digest('hex')
      .substring(0, 32);

    return fingerprint;
  }

  /**
   * Gets client IP address
   */
  private static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIp || cfConnectingIp || 'unknown';
  }

  /**
   * Cleans up old sessions for a user
   */
  private static cleanupUserSessions(userId: string): void {
    const userSessions = this.activeSessions.get(userId) || [];
    const now = Date.now();

    // Remove expired sessions
    const validSessions = userSessions.filter(session =>
      now <= session.createdAt + SESSION_CONFIG.maxAge
    );

    // Limit number of concurrent sessions
    if (validSessions.length >= SESSION_CONFIG.maxSessions) {
      // Remove oldest sessions
      validSessions.sort((a, b) => b.lastActivity - a.lastActivity);
      const sessionsToKeep = validSessions.slice(0, SESSION_CONFIG.maxSessions - 1);
      this.activeSessions.set(userId, sessionsToKeep);
    } else {
      this.activeSessions.set(userId, validSessions);
    }
  }

  /**
   * Gets secure cookie options
   */
  static getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    domain?: string;
    path: string;
  } {
    return {
      httpOnly: SESSION_CONFIG.httpOnly,
      secure: SESSION_CONFIG.secure,
      sameSite: SESSION_CONFIG.sameSite as 'strict' | 'lax' | 'none',
      maxAge: SESSION_CONFIG.maxAge,
      domain: SESSION_CONFIG.domain,
      path: '/',
    };
  }

  /**
   * Creates a secure cookie header
   */
  static createCookieHeader(token: string): string {
    const options = this.getCookieOptions();
    const optionParts = [
      `${SESSION_CONFIG.cookieName}=${token}`,
      `Max-Age=${Math.floor(options.maxAge / 1000)}`,
      `Path=${options.path}`,
      `SameSite=${options.sameSite}`
    ];

    if (options.httpOnly) optionParts.push('HttpOnly');
    if (options.secure) optionParts.push('Secure');
    if (options.domain) optionParts.push(`Domain=${options.domain}`);

    return optionParts.join('; ');
  }

  /**
   * Creates a logout cookie header
   */
  static createLogoutCookieHeader(): string {
    const options = this.getCookieOptions();
    const optionParts = [
      `${SESSION_CONFIG.cookieName}=`,
      'Max-Age=0',
      `Path=${options.path}`,
      `SameSite=${options.sameSite}`
    ];

    if (options.httpOnly) optionParts.push('HttpOnly');
    if (options.secure) optionParts.push('Secure');
    if (options.domain) optionParts.push(`Domain=${options.domain}`);

    return optionParts.join('; ');
  }

  /**
   * Extracts session token from request cookies
   */
  static extractSessionToken(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = this.parseCookies(cookieHeader);
    return cookies[SESSION_CONFIG.cookieName] || null;
  }

  /**
   * Parses cookie header
   */
  private static parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        cookies[name] = decodeURIComponent(rest.join('='));
      }
    });

    return cookies;
  }

  /**
   * Gets session statistics
   */
  static getSessionStatistics(): {
    totalSessions: number;
    userSessionCounts: Record<string, number>;
    oldestSession: number | null;
    newestSession: number | null;
  } {
    let totalSessions = 0;
    let oldestSession: number | null = null;
    let newestSession: number | null = null;
    const userSessionCounts: Record<string, number> = {};

    for (const [userId, sessions] of this.activeSessions.entries()) {
      userSessionCounts[userId] = sessions.length;
      totalSessions += sessions.length;

      for (const session of sessions) {
        if (oldestSession === null || session.createdAt < oldestSession) {
          oldestSession = session.createdAt;
        }
        if (newestSession === null || session.createdAt > newestSession) {
          newestSession = session.createdAt;
        }
      }
    }

    return {
      totalSessions,
      userSessionCounts,
      oldestSession,
      newestSession
    };
  }

  /**
   * Cleanup expired sessions and blacklisted tokens
   */
  static performMaintenance(): void {
    const now = Date.now();
    let cleanedSessions = 0;
    let cleanedTokens = 0;

    // Clean expired sessions
    for (const [userId, sessions] of this.activeSessions.entries()) {
      const validSessions = sessions.filter(session =>
        now <= session.createdAt + SESSION_CONFIG.maxAge
      );

      if (validSessions.length !== sessions.length) {
        cleanedSessions += sessions.length - validSessions.length;
        this.activeSessions.set(userId, validSessions);
      }
    }

    // Clean blacklisted tokens (keep for 24 hours)
    const blacklistCutoff = now - (24 * 60 * 60 * 1000);
    const tokensToRemove: string[] = [];

    for (const token of this.blacklistedTokens) {
      try {
        const tokenData = this.parseSecureToken(token);
        if (tokenData) {
          const sessionData = JSON.parse(tokenData.payload);
          if (sessionData.createdAt < blacklistCutoff) {
            tokensToRemove.push(token);
          }
        }
      } catch {
        // Remove malformed tokens
        tokensToRemove.push(token);
      }
    }

    tokensToRemove.forEach(token => {
      this.blacklistedTokens.delete(token);
      cleanedTokens++;
    });

    if (cleanedSessions > 0 || cleanedTokens > 0) {
      console.info('Session maintenance completed:', {
        cleanedSessions,
        cleanedTokens,
        activeSessions: this.activeSessions.size,
        blacklistedTokens: this.blacklistedTokens.size
      });
    }
  }
}

// Schedule periodic maintenance
setInterval(() => {
  SessionSecurityService.performMaintenance();
}, 60 * 60 * 1000); // Every hour

export { SESSION_CONFIG };