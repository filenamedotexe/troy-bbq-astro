import { randomBytes, createHash } from 'crypto';
import path from 'path';

// Configuration for file upload security
const FILE_UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  allowedMimeTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif,application/pdf').split(','),
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'],
  uploadDirectory: process.env.UPLOAD_DIRECTORY || '/tmp/uploads',
  virusScanEnabled: process.env.ENABLE_VIRUS_SCAN === 'true',
  quarantineDirectory: process.env.QUARANTINE_DIRECTORY || '/tmp/quarantine',
};

// File type validation signatures (magic numbers)
const FILE_SIGNATURES = {
  'image/jpeg': ['ffd8ff'],
  'image/png': ['89504e47'],
  'image/webp': ['52494646'],
  'image/gif': ['47494638'],
  'application/pdf': ['25504446'],
};

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileHash?: string;
  errors?: string[];
  quarantined?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  detectedMimeType?: string;
  actualExtension?: string;
}

export class FileUploadSecurityService {
  /**
   * Validates file against security policies
   */
  static async validateFile(file: File): Promise<FileValidationResult> {
    const errors: string[] = [];

    // 1. File size validation
    if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum allowed size of ${FILE_UPLOAD_CONFIG.maxFileSize} bytes`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // 2. MIME type validation
    if (!FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
      errors.push(`MIME type ${file.type} is not allowed. Allowed types: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`);
    }

    // 3. File extension validation
    const extension = path.extname(file.name).toLowerCase();
    if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed. Allowed extensions: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`);
    }

    // 4. Filename validation
    const fileNameErrors = this.validateFileName(file.name);
    errors.push(...fileNameErrors);

    // 5. Magic number validation (file signature)
    let detectedMimeType: string | undefined;
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      detectedMimeType = this.detectFileType(uint8Array);

      if (detectedMimeType && detectedMimeType !== file.type) {
        errors.push(`File signature mismatch. Detected: ${detectedMimeType}, Declared: ${file.type}`);
      }

      // 6. Content validation based on file type
      const contentErrors = await this.validateFileContent(uint8Array, file.type);
      errors.push(...contentErrors);

    } catch (error) {
      errors.push('Failed to read file content for validation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      detectedMimeType,
      actualExtension: extension
    };
  }

  /**
   * Validates filename for security issues
   */
  private static validateFileName(fileName: string): string[] {
    const errors: string[] = [];

    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(fileName)) {
      errors.push('Filename contains dangerous characters');
    }

    // Check for directory traversal attempts
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      errors.push('Filename contains directory traversal characters');
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = path.parse(fileName).name.toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      errors.push('Filename uses reserved system name');
    }

    // Check length
    if (fileName.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }

    if (fileName.length === 0) {
      errors.push('Filename is empty');
    }

    // Check for multiple extensions (double extension attack)
    const parts = fileName.split('.');
    if (parts.length > 3) {
      errors.push('Filename has too many extensions (possible double extension attack)');
    }

    return errors;
  }

  /**
   * Detects file type based on magic numbers/signatures
   */
  private static detectFileType(buffer: Uint8Array): string | undefined {
    const hex = Array.from(buffer.slice(0, 10))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
      for (const signature of signatures) {
        if (hex.startsWith(signature.toLowerCase())) {
          return mimeType;
        }
      }
    }

    return undefined;
  }

  /**
   * Validates file content based on type
   */
  private static async validateFileContent(buffer: Uint8Array, mimeType: string): Promise<string[]> {
    const errors: string[] = [];

    try {
      if (mimeType.startsWith('image/')) {
        // Image-specific validation
        const imageErrors = await this.validateImageContent(buffer, mimeType);
        errors.push(...imageErrors);
      } else if (mimeType === 'application/pdf') {
        // PDF-specific validation
        const pdfErrors = this.validatePDFContent(buffer);
        errors.push(...pdfErrors);
      }
    } catch (error) {
      errors.push(`Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return errors;
  }

  /**
   * Validates image content for malicious payloads
   */
  private static async validateImageContent(buffer: Uint8Array, mimeType: string): Promise<string[]> {
    const errors: string[] = [];

    // Check for embedded scripts or suspicious content
    const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    // Look for script tags, PHP tags, and other suspicious content
    const suspiciousPatterns = [
      /<script/i,
      /<\?php/i,
      /eval\s*\(/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /&#x/i, // HTML entities that could be used for XSS
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push('Image contains suspicious embedded content');
        break;
      }
    }

    // Check image dimensions and basic structure validation
    if (mimeType === 'image/jpeg') {
      const jpegErrors = this.validateJPEGStructure(buffer);
      errors.push(...jpegErrors);
    } else if (mimeType === 'image/png') {
      const pngErrors = this.validatePNGStructure(buffer);
      errors.push(...pngErrors);
    }

    return errors;
  }

  /**
   * Basic JPEG structure validation
   */
  private static validateJPEGStructure(buffer: Uint8Array): string[] {
    const errors: string[] = [];

    // JPEG should start with FFD8 and end with FFD9
    if (buffer.length < 4) {
      errors.push('JPEG file too small');
      return errors;
    }

    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      errors.push('Invalid JPEG header');
    }

    if (buffer[buffer.length - 2] !== 0xFF || buffer[buffer.length - 1] !== 0xD9) {
      errors.push('Invalid JPEG footer');
    }

    return errors;
  }

  /**
   * Basic PNG structure validation
   */
  private static validatePNGStructure(buffer: Uint8Array): string[] {
    const errors: string[] = [];

    if (buffer.length < 8) {
      errors.push('PNG file too small');
      return errors;
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const expectedSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < 8; i++) {
      if (buffer[i] !== expectedSignature[i]) {
        errors.push('Invalid PNG signature');
        break;
      }
    }

    return errors;
  }

  /**
   * Basic PDF structure validation
   */
  private static validatePDFContent(buffer: Uint8Array): string[] {
    const errors: string[] = [];

    if (buffer.length < 5) {
      errors.push('PDF file too small');
      return errors;
    }

    // PDF should start with %PDF-
    const header = new TextDecoder().decode(buffer.slice(0, 5));
    if (header !== '%PDF-') {
      errors.push('Invalid PDF header');
    }

    // Look for suspicious JavaScript or embedded content
    const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const suspiciousPatterns = [
      /\/JavaScript/i,
      /\/JS/i,
      /\/Launch/i,
      /\/EmbeddedFile/i,
      /\/URI/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push('PDF contains potentially dangerous embedded content');
        break;
      }
    }

    return errors;
  }

  /**
   * Generates a secure filename
   */
  static generateSecureFileName(originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomSuffix = randomBytes(8).toString('hex');

    // Remove any dangerous characters from the original name
    const safeName = path.parse(originalName).name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50); // Limit length

    return `${safeName}_${timestamp}_${randomSuffix}${extension}`;
  }

  /**
   * Generates file hash for integrity checking
   */
  static generateFileHash(buffer: ArrayBuffer): string {
    const hash = createHash('sha256');
    hash.update(new Uint8Array(buffer));
    return hash.digest('hex');
  }

  /**
   * Virus scanning simulation (placeholder for real antivirus integration)
   */
  static async performVirusScan(buffer: Uint8Array): Promise<{ isClean: boolean; threats?: string[] }> {
    // In a real implementation, this would integrate with ClamAV, VirusTotal API, or similar

    // Simple heuristic checks for now
    const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    const virusPatterns = [
      /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H\+H\*/i, // EICAR test string
      /eval\s*\(\s*base64_decode/i,
      /shell_exec\s*\(/i,
      /system\s*\(/i,
      /exec\s*\(/i,
    ];

    const threats: string[] = [];
    for (const pattern of virusPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious code pattern detected');
      }
    }

    return {
      isClean: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    };
  }

  /**
   * Rate limiting for file uploads
   */
  private static uploadRateLimit = new Map<string, { count: number; resetTime: number }>();

  static checkUploadRateLimit(clientIP: string, maxUploads = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const key = `upload_${clientIP}`;

    const existing = this.uploadRateLimit.get(key);

    if (!existing || now > existing.resetTime) {
      this.uploadRateLimit.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (existing.count >= maxUploads) {
      return false;
    }

    existing.count++;
    return true;
  }

  /**
   * Complete file upload security processing
   */
  static async processSecureUpload(file: File, clientIP: string): Promise<FileUploadResult> {
    const errors: string[] = [];

    try {
      // 1. Rate limiting check
      if (!this.checkUploadRateLimit(clientIP)) {
        return {
          success: false,
          errors: ['Upload rate limit exceeded. Please try again later.']
        };
      }

      // 2. File validation
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 3. Generate secure filename and hash
      const secureFileName = this.generateSecureFileName(file.name);
      const buffer = await file.arrayBuffer();
      const fileHash = this.generateFileHash(buffer);

      // 4. Virus scanning (if enabled)
      let quarantined = false;
      if (FILE_UPLOAD_CONFIG.virusScanEnabled) {
        const scanResult = await this.performVirusScan(new Uint8Array(buffer));
        if (!scanResult.isClean) {
          quarantined = true;
          errors.push('File failed virus scan and has been quarantined');

          // Log security incident
          console.warn('File quarantined:', {
            fileName: file.name,
            hash: fileHash,
            threats: scanResult.threats,
            clientIP,
            timestamp: new Date().toISOString()
          });
        }
      }

      // 5. Determine final path
      const directory = quarantined ? FILE_UPLOAD_CONFIG.quarantineDirectory : FILE_UPLOAD_CONFIG.uploadDirectory;
      const filePath = path.join(directory, secureFileName);

      return {
        success: !quarantined,
        filePath,
        fileName: secureFileName,
        fileHash,
        errors: errors.length > 0 ? errors : undefined,
        quarantined
      };

    } catch (error) {
      console.error('File upload processing error:', error);
      return {
        success: false,
        errors: ['File upload processing failed']
      };
    }
  }
}

export { FILE_UPLOAD_CONFIG };