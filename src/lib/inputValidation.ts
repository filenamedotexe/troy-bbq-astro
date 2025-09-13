import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Input validation configuration
const VALIDATION_CONFIG = {
  maxStringLength: 10000,
  maxArrayLength: 1000,
  maxObjectDepth: 10,
  emailMaxLength: 254,
  phoneRegex: /^\+?[\d\s\-\(\)]{7,15}$/,
  strongPasswordMinLength: 12,
  allowedHTMLTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  blockedPatterns: [
    // Script injection patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,

    // SQL injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)|(-{2,})|\/\*|\*\//gi,

    // Command injection patterns
    /[;&|`$\\]/,
    /\b(eval|exec|system|shell_exec|passthru|proc_open)\s*\(/gi,

    // XSS patterns
    /(\bxss\b)|(\balert\s*\()|(\bconfirm\s*\()|(\bprompt\s*\()/gi,
  ],
};

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  sanitized?: T;
}

export interface SanitizationOptions {
  removeHTML?: boolean;
  allowBasicHTML?: boolean;
  trimWhitespace?: boolean;
  escapeHTML?: boolean;
  maxLength?: number;
  removeNullBytes?: boolean;
}

export class InputValidationService {
  /**
   * Comprehensive input sanitization
   */
  static sanitizeInput(
    input: any,
    options: SanitizationOptions = {}
  ): any {
    const {
      removeHTML = false,
      allowBasicHTML = false,
      trimWhitespace = true,
      escapeHTML = false,
      maxLength = VALIDATION_CONFIG.maxStringLength,
      removeNullBytes = true,
    } = options;

    if (typeof input === 'string') {
      let sanitized = input;

      // Remove null bytes
      if (removeNullBytes) {
        sanitized = sanitized.replace(/\0/g, '');
      }

      // Trim whitespace
      if (trimWhitespace) {
        sanitized = sanitized.trim();
      }

      // Length restriction
      if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }

      // HTML handling
      if (removeHTML) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      } else if (allowBasicHTML) {
        // Use DOMPurify for safe HTML sanitization
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: VALIDATION_CONFIG.allowedHTMLTags,
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true,
        });
      } else if (escapeHTML) {
        sanitized = this.escapeHTML(sanitized);
      }

      // Check for malicious patterns
      for (const pattern of VALIDATION_CONFIG.blockedPatterns) {
        if (pattern.test(sanitized)) {
          throw new Error('Input contains potentially malicious content');
        }
      }

      return sanitized;
    }

    if (typeof input === 'number') {
      if (!Number.isFinite(input) || Number.isNaN(input)) {
        throw new Error('Invalid numeric value');
      }
      return input;
    }

    if (typeof input === 'boolean') {
      return input;
    }

    if (input === null || input === undefined) {
      return input;
    }

    if (Array.isArray(input)) {
      if (input.length > VALIDATION_CONFIG.maxArrayLength) {
        throw new Error('Array too large');
      }
      return input.map(item => this.sanitizeInput(item, options));
    }

    if (typeof input === 'object') {
      return this.sanitizeObject(input, options);
    }

    return input;
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(
    obj: Record<string, any>,
    options: SanitizationOptions,
    depth = 0
  ): Record<string, any> {
    if (depth > VALIDATION_CONFIG.maxObjectDepth) {
      throw new Error('Object nesting too deep');
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeInput(key, { ...options, removeHTML: true });
      sanitized[sanitizedKey] = this.sanitizeInput(value, options);
    }

    return sanitized;
  }

  /**
   * HTML entity encoding
   */
  private static escapeHTML(input: string): string {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };

    return input.replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
  }

  /**
   * Email validation with comprehensive checks
   */
  static validateEmail(email: string): ValidationResult<string> {
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required and must be a string');
      return { success: false, errors };
    }

    const sanitized = this.sanitizeInput(email, {
      trimWhitespace: true,
      removeHTML: true,
      maxLength: VALIDATION_CONFIG.emailMaxLength,
    });

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Length validation
    if (sanitized.length > VALIDATION_CONFIG.emailMaxLength) {
      errors.push(`Email too long (max ${VALIDATION_CONFIG.emailMaxLength} characters)`);
    }

    // Domain validation (basic)
    const [localPart, domain] = sanitized.split('@');
    if (localPart && localPart.length > 64) {
      errors.push('Email local part too long (max 64 characters)');
    }

    if (domain && domain.length > 255) {
      errors.push('Email domain too long (max 255 characters)');
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /[<>'"]/,
      /javascript:/i,
      /data:/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('Email contains invalid characters');
        break;
      }
    }

    return {
      success: errors.length === 0,
      data: sanitized,
      sanitized,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Phone number validation
   */
  static validatePhone(phone: string): ValidationResult<string> {
    const errors: string[] = [];

    if (!phone || typeof phone !== 'string') {
      errors.push('Phone number is required and must be a string');
      return { success: false, errors };
    }

    const sanitized = this.sanitizeInput(phone, {
      trimWhitespace: true,
      removeHTML: true,
      maxLength: 20,
    });

    if (!VALIDATION_CONFIG.phoneRegex.test(sanitized)) {
      errors.push('Invalid phone number format');
    }

    return {
      success: errors.length === 0,
      data: sanitized,
      sanitized,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Strong password validation
   */
  static validatePassword(password: string): ValidationResult<string> {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      errors.push('Password is required and must be a string');
      return { success: false, errors };
    }

    // Don't sanitize passwords - they need to be checked as-is
    if (password.length < VALIDATION_CONFIG.strongPasswordMinLength) {
      errors.push(`Password must be at least ${VALIDATION_CONFIG.strongPasswordMinLength} characters long`);
    }

    if (password.length > 128) {
      errors.push('Password too long (max 128 characters)');
    }

    // Check for complexity requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const complexityRequirements = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars];
    const metRequirements = complexityRequirements.filter(Boolean).length;

    if (metRequirements < 3) {
      errors.push('Password must contain at least 3 of: uppercase, lowercase, numbers, special characters');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common weak patterns');
        break;
      }
    }

    return {
      success: errors.length === 0,
      data: password, // Don't return the actual password in the result
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * UUID validation
   */
  static validateUUID(uuid: string): ValidationResult<string> {
    const errors: string[] = [];

    if (!uuid || typeof uuid !== 'string') {
      errors.push('UUID is required and must be a string');
      return { success: false, errors };
    }

    const sanitized = this.sanitizeInput(uuid, {
      trimWhitespace: true,
      removeHTML: true,
    });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sanitized)) {
      errors.push('Invalid UUID format');
    }

    return {
      success: errors.length === 0,
      data: sanitized,
      sanitized,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * URL validation
   */
  static validateURL(url: string, allowedProtocols = ['http:', 'https:']): ValidationResult<string> {
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      errors.push('URL is required and must be a string');
      return { success: false, errors };
    }

    const sanitized = this.sanitizeInput(url, {
      trimWhitespace: true,
      removeHTML: true,
      maxLength: 2000,
    });

    try {
      const parsedURL = new URL(sanitized);

      if (!allowedProtocols.includes(parsedURL.protocol)) {
        errors.push(`URL protocol must be one of: ${allowedProtocols.join(', ')}`);
      }

      // Check for dangerous patterns in URL
      const dangerousPatterns = [
        /javascript:/i,
        /vbscript:/i,
        /data:/i,
        /file:/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(sanitized)) {
          errors.push('URL contains potentially dangerous protocol');
          break;
        }
      }

    } catch (urlError) {
      errors.push('Invalid URL format');
    }

    return {
      success: errors.length === 0,
      data: sanitized,
      sanitized,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * SQL injection detection
   */
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|truncate)\b)/gi,
      /(;|\-\-|\/\*|\*\/)/g,
      /(\b(or|and)\s+\d+\s*=\s*\d+\b)/gi,
      /(\b(or|and)\s+(true|false)\b)/gi,
      /(\bxp_cmdshell\b)/gi,
      /(\bsp_executesql\b)/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * XSS detection
   */
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /(\balert\s*\()|(\bconfirm\s*\()|(\bprompt\s*\()/gi,
      /<img[^>]+src[^>]*=[\s"']*javascript:/gi,
      /<svg[^>]*on\w+/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Comprehensive input validation using Zod schemas
   */
  static createValidationSchema() {
    return {
      email: z.string()
        .email('Invalid email format')
        .max(VALIDATION_CONFIG.emailMaxLength, 'Email too long')
        .refine(email => !this.detectXSS(email), 'Email contains invalid characters'),

      password: z.string()
        .min(VALIDATION_CONFIG.strongPasswordMinLength, 'Password too short')
        .max(128, 'Password too long')
        .refine(password => {
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
          const complexity = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
          return complexity >= 3;
        }, 'Password must meet complexity requirements'),

      uuid: z.string()
        .uuid('Invalid UUID format'),

      url: z.string()
        .url('Invalid URL format')
        .refine(url => {
          try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
          } catch {
            return false;
          }
        }, 'URL must use HTTP or HTTPS protocol'),

      phone: z.string()
        .regex(VALIDATION_CONFIG.phoneRegex, 'Invalid phone number format'),

      safeString: z.string()
        .max(VALIDATION_CONFIG.maxStringLength, 'String too long')
        .refine(str => !this.detectSQLInjection(str), 'String contains SQL injection patterns')
        .refine(str => !this.detectXSS(str), 'String contains XSS patterns'),

      positiveInteger: z.number()
        .int('Must be an integer')
        .positive('Must be positive'),

      nonEmptyString: z.string()
        .min(1, 'Cannot be empty')
        .max(VALIDATION_CONFIG.maxStringLength, 'String too long'),
    };
  }
}

// Export common validation schemas
export const ValidationSchemas = InputValidationService.createValidationSchema();

// Export configuration for external use
export { VALIDATION_CONFIG };