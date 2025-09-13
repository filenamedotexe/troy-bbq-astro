import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.PAYMENT_JWT_SECRET || 'fallback-dev-secret-please-change-in-production';
const TOKEN_EXPIRY_HOURS = 48; // 48 hours for balance payment links
const HMAC_ALGORITHM = 'sha256';

// Interfaces for secure tokens
export interface PaymentTokenPayload {
  quoteId: string;
  customerEmail: string;
  purpose: 'balance_payment' | 'deposit_payment';
  amount: number; // Amount in cents
  currency: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string; // For replay protection
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: PaymentTokenPayload;
  error?: string;
}

// Generate cryptographically secure nonce
export function generateSecureNonce(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Create secure base64url encoding (URL-safe)
function base64urlEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Decode base64url
function base64urlDecode(str: string): Buffer {
  // Add padding back
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64');
}

// Create HMAC signature for JWT-like token
function createSignature(payload: string): string {
  const hmac = createHmac(HMAC_ALGORITHM, JWT_SECRET);
  hmac.update(payload);
  return base64urlEncode(hmac.digest());
}

// Verify HMAC signature with timing-safe comparison
function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = createSignature(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(signature);
  
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

// Generate secure payment token
export function generatePaymentToken(
  quoteId: string,
  customerEmail: string,
  purpose: PaymentTokenPayload['purpose'],
  amount: number,
  currency: string = 'USD'
): string {
  const now = Date.now();
  const expiresAt = now + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  const nonce = generateSecureNonce();
  
  const payload: PaymentTokenPayload = {
    quoteId,
    customerEmail,
    purpose,
    amount,
    currency,
    issuedAt: now,
    expiresAt,
    nonce
  };
  
  // Create JWT-like structure: header.payload.signature
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = base64urlEncode(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(tokenData);
  
  return `${tokenData}.${signature}`;
}

// Validate and decode payment token
export function validatePaymentToken(token: string): TokenValidationResult {
  try {
    // Parse JWT-like structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        valid: false,
        error: 'Invalid token format'
      };
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const tokenData = `${encodedHeader}.${encodedPayload}`;
    
    // Verify signature first
    if (!verifySignature(tokenData, signature)) {
      return {
        valid: false,
        error: 'Invalid token signature'
      };
    }
    
    // Decode and validate payload
    const payloadBuffer = base64urlDecode(encodedPayload);
    const payload: PaymentTokenPayload = JSON.parse(payloadBuffer.toString());
    
    // Validate token structure
    if (!payload.quoteId || !payload.customerEmail || !payload.purpose || 
        typeof payload.amount !== 'number' || !payload.nonce) {
      return {
        valid: false,
        error: 'Invalid token payload structure'
      };
    }
    
    // Check expiration
    const now = Date.now();
    if (now > payload.expiresAt) {
      return {
        valid: false,
        error: 'Token has expired'
      };
    }
    
    // Check if token is not too old (issued within reasonable time)
    if (now < payload.issuedAt || (now - payload.issuedAt) > (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)) {
      return {
        valid: false,
        error: 'Token timestamp invalid'
      };
    }
    
    return {
      valid: true,
      payload
    };
    
  } catch (error) {
    return {
      valid: false,
      error: 'Token parsing failed'
    };
  }
}

// Secure amount comparison with proper precision handling
export function secureAmountCompare(amount1: number, amount2: number, tolerance: number = 0.01): boolean {
  // Convert to integers (cents) to avoid floating point precision issues
  const cents1 = Math.round(amount1 * 100);
  const cents2 = Math.round(amount2 * 100);
  const toleranceCents = Math.round(tolerance * 100);
  
  return Math.abs(cents1 - cents2) <= toleranceCents;
}

// Generate cryptographically secure payment reference
export function generatePaymentReference(prefix: string = 'pay'): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

// Hash sensitive data for logging (one-way hash)
export function hashSensitiveData(data: string): string {
  const hash = createHmac('sha256', JWT_SECRET);
  hash.update(data);
  return hash.digest('hex').substring(0, 16); // Truncate for logs
}

// Rate limiting helper - generate bucket key
export function generateRateLimitKey(identifier: string, window: string): string {
  const hash = createHmac('sha256', JWT_SECRET);
  hash.update(`${identifier}:${window}`);
  return hash.digest('hex').substring(0, 32);
}

// Validate environment security
export function validateSecurityEnvironment(): { secure: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!JWT_SECRET || JWT_SECRET === 'fallback-dev-secret-please-change-in-production') {
    warnings.push('JWT_SECRET not properly configured - using fallback secret');
  }
  
  if (JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is too short - should be at least 32 characters');
  }
  
  if (process.env.NODE_ENV === 'production' && JWT_SECRET.includes('dev')) {
    warnings.push('Development JWT secret detected in production environment');
  }
  
  return {
    secure: warnings.length === 0,
    warnings
  };
}