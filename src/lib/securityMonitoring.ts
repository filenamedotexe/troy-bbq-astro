import { createHash, randomBytes } from 'crypto';

// Security monitoring configuration
const SECURITY_CONFIG = {
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
  lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS || '900000'), // 15 minutes
  monitoringEnabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
  alertThresholds: {
    failedLogins: 10,
    suspiciousRequests: 50,
    fileUploadFailures: 20,
    databaseErrors: 10,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

export interface SecurityEvent {
  type: 'auth_failure' | 'suspicious_request' | 'file_upload_blocked' | 'database_error' | 'rate_limit_exceeded' | 'malicious_input' | 'security_scan_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  clientIP?: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  details: Record<string, any>;
  fingerprint: string;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'medium' | 'high' | 'critical';
  count: number;
  timeWindow: string;
  firstOccurrence: string;
  lastOccurrence: string;
  affected: string[];
  details: Record<string, any>;
}

export class SecurityMonitoringService {
  private static events: SecurityEvent[] = [];
  private static alerts: SecurityAlert[] = [];
  private static ipAttempts = new Map<string, { count: number; resetTime: number; lockoutUntil?: number }>();

  /**
   * Logs a security event
   */
  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'fingerprint'>): void {
    if (!SECURITY_CONFIG.monitoringEnabled) return;

    const timestamp = new Date().toISOString();
    const fingerprint = this.generateEventFingerprint(event, timestamp);

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp,
      fingerprint
    };

    this.events.push(securityEvent);

    // Log to console based on severity
    const logMethod = this.getLogMethod(event.severity);
    logMethod('Security Event:', {
      type: event.type,
      severity: event.severity,
      clientIP: event.clientIP,
      fingerprint,
      details: event.details
    });

    // Check for alert conditions
    this.checkAlertConditions(securityEvent);

    // Cleanup old events (keep last 10000 events)
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  /**
   * Generates a unique fingerprint for the event
   */
  private static generateEventFingerprint(event: any, timestamp: string): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify({
      type: event.type,
      clientIP: event.clientIP,
      userAgent: event.userAgent,
      day: timestamp.split('T')[0], // Group by day
    }));
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Gets the appropriate log method based on severity
   */
  private static getLogMethod(severity: string): (message: string, ...args: any[]) => void {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      default:
        return console.info;
    }
  }

  /**
   * Checks if the current events should trigger an alert
   */
  private static checkAlertConditions(event: SecurityEvent): void {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window
    const windowStart = now - windowMs;

    // Get recent events of the same type
    const recentEvents = this.events.filter(e =>
      e.type === event.type &&
      new Date(e.timestamp).getTime() > windowStart
    );

    let shouldAlert = false;
    let threshold = 0;

    switch (event.type) {
      case 'auth_failure':
        threshold = SECURITY_CONFIG.alertThresholds.failedLogins;
        break;
      case 'suspicious_request':
        threshold = SECURITY_CONFIG.alertThresholds.suspiciousRequests;
        break;
      case 'file_upload_blocked':
        threshold = SECURITY_CONFIG.alertThresholds.fileUploadFailures;
        break;
      case 'database_error':
        threshold = SECURITY_CONFIG.alertThresholds.databaseErrors;
        break;
      default:
        threshold = 20; // Default threshold
    }

    if (recentEvents.length >= threshold) {
      shouldAlert = true;
    }

    if (shouldAlert) {
      this.createAlert(event.type, recentEvents);
    }
  }

  /**
   * Creates a security alert
   */
  private static createAlert(type: string, events: SecurityEvent[]): void {
    const alertId = randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    const alert: SecurityAlert = {
      id: alertId,
      type,
      severity: this.getAlertSeverity(type, events.length),
      count: events.length,
      timeWindow: '1 hour',
      firstOccurrence: events[0].timestamp,
      lastOccurrence: events[events.length - 1].timestamp,
      affected: [...new Set(events.map(e => e.clientIP || 'unknown'))],
      details: {
        eventTypes: events.map(e => e.type),
        userAgents: [...new Set(events.map(e => e.userAgent).filter(Boolean))],
        patterns: this.analyzeEventPatterns(events)
      }
    };

    this.alerts.push(alert);

    // Log critical alerts
    console.error('SECURITY ALERT GENERATED:', alert);

    // In a real application, you would send this to your monitoring system
    // this.sendToMonitoringSystem(alert);

    // Cleanup old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Determines alert severity based on type and frequency
   */
  private static getAlertSeverity(type: string, count: number): SecurityAlert['severity'] {
    if (type === 'malicious_input' || type === 'security_scan_detected') {
      return count > 100 ? 'critical' : 'high';
    }

    if (count > 50) return 'critical';
    if (count > 20) return 'high';
    return 'medium';
  }

  /**
   * Analyzes patterns in security events
   */
  private static analyzeEventPatterns(events: SecurityEvent[]): Record<string, any> {
    const patterns: Record<string, any> = {};

    // IP distribution
    const ipCounts = events.reduce((acc, event) => {
      const ip = event.clientIP || 'unknown';
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    patterns.topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Time distribution
    const hourCounts = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    patterns.peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    return patterns;
  }

  /**
   * Tracks login attempts for rate limiting
   */
  static trackLoginAttempt(clientIP: string, success: boolean): {
    allowed: boolean;
    remainingAttempts?: number;
    lockoutUntil?: Date;
  } {
    const now = Date.now();
    const attempts = this.ipAttempts.get(clientIP);

    if (!attempts || now > attempts.resetTime) {
      // Reset or create new attempt tracking
      this.ipAttempts.set(clientIP, {
        count: success ? 0 : 1,
        resetTime: now + SECURITY_CONFIG.lockoutDurationMs
      });

      return { allowed: true, remainingAttempts: SECURITY_CONFIG.maxFailedAttempts - 1 };
    }

    // Check if currently locked out
    if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
      return {
        allowed: false,
        lockoutUntil: new Date(attempts.lockoutUntil)
      };
    }

    if (success) {
      // Reset on successful login
      attempts.count = 0;
      delete attempts.lockoutUntil;
      return { allowed: true };
    }

    // Increment failed attempts
    attempts.count++;

    if (attempts.count >= SECURITY_CONFIG.maxFailedAttempts) {
      // Lock out the IP
      attempts.lockoutUntil = now + SECURITY_CONFIG.lockoutDurationMs;

      this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'high',
        clientIP,
        details: {
          attemptCount: attempts.count,
          lockoutDuration: SECURITY_CONFIG.lockoutDurationMs,
          reason: 'Too many failed login attempts'
        }
      });

      return {
        allowed: false,
        lockoutUntil: new Date(attempts.lockoutUntil)
      };
    }

    return {
      allowed: true,
      remainingAttempts: SECURITY_CONFIG.maxFailedAttempts - attempts.count
    };
  }

  /**
   * Detects potential security scans or automated attacks
   */
  static detectSecurityScan(clientIP: string, userAgent: string, requestPath: string): boolean {
    const suspiciousPatterns = [
      // Common vulnerability scanning paths
      /\/(wp-admin|admin|phpmyadmin|cpanel|login|signin)/i,
      /\.(php|asp|jsp|cgi)$/i,
      /\/\.(env|git|svn|htaccess)/i,

      // SQL injection attempts
      /[\'\";()=<>]/,
      /(union|select|insert|update|delete|drop|create|alter)/i,

      // XSS attempts
      /<script|javascript:|vbscript:|on\w+=/i,

      // Directory traversal
      /\.\.\//,
      /%2e%2e%2f/i,

      // Command injection
      /[;&|`$]/,
    ];

    const isSuspiciousPath = suspiciousPatterns.some(pattern => pattern.test(requestPath));

    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i,
      /dirb/i,
      /gobuster/i,
      /wfuzz/i,
    ];

    const isSuspiciousUserAgent = suspiciousUserAgents.some(pattern => pattern.test(userAgent));

    if (isSuspiciousPath || isSuspiciousUserAgent) {
      this.logSecurityEvent({
        type: 'security_scan_detected',
        severity: 'high',
        clientIP,
        userAgent,
        details: {
          requestPath,
          suspiciousPath: isSuspiciousPath,
          suspiciousUserAgent: isSuspiciousUserAgent,
          patterns: {
            path: suspiciousPatterns.find(p => p.test(requestPath))?.source,
            userAgent: suspiciousUserAgents.find(p => p.test(userAgent))?.source
          }
        }
      });

      return true;
    }

    return false;
  }

  /**
   * Gets security metrics and statistics
   */
  static getSecurityMetrics(timeWindowHours = 24): {
    events: SecurityEvent[];
    alerts: SecurityAlert[];
    metrics: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    eventTypes: Record<string, number>;
  } {
    const windowStart = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e =>
      new Date(e.timestamp).getTime() > windowStart
    );

    const eventTypes = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ipCounts = recentEvents.reduce((acc, event) => {
      const ip = event.clientIP || 'unknown';
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      events: recentEvents,
      alerts: this.alerts,
      metrics: {
        totalEvents: recentEvents.length,
        totalAlerts: this.alerts.length,
        uniqueIPs: Object.keys(ipCounts).length,
        criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
        highSeverityEvents: recentEvents.filter(e => e.severity === 'high').length,
      },
      topIPs,
      eventTypes
    };
  }

  /**
   * Clears old security data (for maintenance)
   */
  static clearOldData(olderThanHours = 168): void { // Default 7 days
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);

    this.events = this.events.filter(e =>
      new Date(e.timestamp).getTime() > cutoff
    );

    // Clear old IP attempt tracking
    const now = Date.now();
    for (const [ip, data] of this.ipAttempts.entries()) {
      if (data.resetTime < now && (!data.lockoutUntil || data.lockoutUntil < now)) {
        this.ipAttempts.delete(ip);
      }
    }

    console.info(`Security monitoring: Cleared old data older than ${olderThanHours} hours`);
  }
}

// Export configuration for external use
export { SECURITY_CONFIG };