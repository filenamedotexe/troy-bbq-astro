/**
 * Comprehensive Error Handling Utilities for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and React error boundary best practices
 */

// Error types and interfaces
export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: Date;
  stack?: string;
  context?: Record<string, unknown>;
  retry?: boolean;
  userFriendly: boolean;
}

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  PAYMENT = 'payment',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error classification and severity mapping
const ERROR_SEVERITY_MAP: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.NETWORK]: ErrorSeverity.MEDIUM,
  [ErrorType.VALIDATION]: ErrorSeverity.LOW,
  [ErrorType.AUTHENTICATION]: ErrorSeverity.HIGH,
  [ErrorType.AUTHORIZATION]: ErrorSeverity.HIGH,
  [ErrorType.NOT_FOUND]: ErrorSeverity.LOW,
  [ErrorType.SERVER]: ErrorSeverity.HIGH,
  [ErrorType.CLIENT]: ErrorSeverity.MEDIUM,
  [ErrorType.PAYMENT]: ErrorSeverity.CRITICAL,
  [ErrorType.DATABASE]: ErrorSeverity.CRITICAL,
  [ErrorType.EXTERNAL_API]: ErrorSeverity.MEDIUM,
  [ErrorType.UNKNOWN]: ErrorSeverity.MEDIUM
};

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string; action?: string }> = {
  [ErrorType.NETWORK]: {
    title: 'Connection Problem',
    message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
    action: 'Try again'
  },
  [ErrorType.VALIDATION]: {
    title: 'Invalid Information',
    message: 'Please check the information you entered and try again.',
    action: 'Review and fix'
  },
  [ErrorType.AUTHENTICATION]: {
    title: 'Authentication Required',
    message: 'You need to sign in to access this feature.',
    action: 'Sign in'
  },
  [ErrorType.AUTHORIZATION]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'Contact support'
  },
  [ErrorType.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The item you\'re looking for couldn\'t be found.',
    action: 'Go back'
  },
  [ErrorType.SERVER]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified.',
    action: 'Try again later'
  },
  [ErrorType.CLIENT]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try refreshing the page.',
    action: 'Refresh page'
  },
  [ErrorType.PAYMENT]: {
    title: 'Payment Error',
    message: 'There was a problem processing your payment. Please check your payment details and try again.',
    action: 'Review payment'
  },
  [ErrorType.DATABASE]: {
    title: 'Data Error',
    message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
    action: 'Try again'
  },
  [ErrorType.EXTERNAL_API]: {
    title: 'Service Unavailable',
    message: 'One of our services is temporarily unavailable. Please try again later.',
    action: 'Try again later'
  },
  [ErrorType.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'Try again'
  }
};

/**
 * Creates a standardized error object
 */
export function createAppError(
  type: ErrorType,
  originalError?: Error | unknown,
  context?: Record<string, unknown>,
  customMessage?: string
): AppError {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date();
  
  let message = customMessage || ERROR_MESSAGES[type].message;
  let stack: string | undefined;
  
  if (originalError instanceof Error) {
    if (!customMessage) {
      message = originalError.message;
    }
    stack = originalError.stack;
  }
  
  return {
    id: errorId,
    type,
    message,
    timestamp,
    stack,
    context,
    retry: isRetryableError(type),
    userFriendly: true
  };
}

/**
 * Determines if an error type is retryable
 */
export function isRetryableError(type: ErrorType): boolean {
  return [
    ErrorType.NETWORK,
    ErrorType.SERVER,
    ErrorType.EXTERNAL_API,
    ErrorType.DATABASE
  ].includes(type);
}

/**
 * Gets the severity level of an error
 */
export function getErrorSeverity(type: ErrorType): ErrorSeverity {
  return ERROR_SEVERITY_MAP[type];
}

/**
 * Gets user-friendly error information
 */
export function getUserFriendlyError(type: ErrorType, customMessage?: string) {
  const errorInfo = ERROR_MESSAGES[type];
  return {
    ...errorInfo,
    message: customMessage || errorInfo.message
  };
}

/**
 * Classifies errors based on their characteristics
 */
export function classifyError(error: Error | unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorName = error instanceof Error ? error.name.toLowerCase() : '';
  
  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorName.includes('networkerror')
  ) {
    return ErrorType.NETWORK;
  }
  
  // Authentication errors
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('invalid token') ||
    errorName.includes('autherror')
  ) {
    return ErrorType.AUTHENTICATION;
  }
  
  // Authorization errors
  if (
    errorMessage.includes('forbidden') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('permission')
  ) {
    return ErrorType.AUTHORIZATION;
  }
  
  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorName.includes('validationerror')
  ) {
    return ErrorType.VALIDATION;
  }
  
  // Payment errors
  if (
    errorMessage.includes('payment') ||
    errorMessage.includes('stripe') ||
    errorMessage.includes('square') ||
    errorMessage.includes('charge')
  ) {
    return ErrorType.PAYMENT;
  }
  
  // Not found errors
  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('404') ||
    errorName.includes('notfound')
  ) {
    return ErrorType.NOT_FOUND;
  }
  
  // Server errors
  if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('internal')
  ) {
    return ErrorType.SERVER;
  }
  
  // Database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('sql') ||
    errorMessage.includes('connection') && errorMessage.includes('db')
  ) {
    return ErrorType.DATABASE;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Error logging utility with different levels
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  log(error: AppError): void {
    const severity = getErrorSeverity(error.type);
    
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🔴 CRITICAL ERROR:', error);
        this.reportToCrashlytics(error);
        break;
      case ErrorSeverity.HIGH:
        console.error('🟠 HIGH SEVERITY ERROR:', error);
        this.reportToMonitoring(error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('🟡 MEDIUM SEVERITY ERROR:', error);
        break;
      case ErrorSeverity.LOW:
        console.info('🔵 LOW SEVERITY ERROR:', error);
        break;
    }
    
    // Store in local storage for debugging (max 50 errors)
    this.storeForDebugging(error);
  }
  
  private reportToCrashlytics(error: AppError): void {
    // In a real application, integrate with crash reporting service
    console.log('📊 Reporting to crash analytics:', error.id);
  }
  
  private reportToMonitoring(error: AppError): void {
    // In a real application, integrate with monitoring service
    console.log('📈 Reporting to monitoring:', error.id);
  }
  
  private storeForDebugging(error: AppError): void {
    try {
      const stored = localStorage.getItem('debug_errors');
      const errors: AppError[] = stored ? JSON.parse(stored) : [];
      
      errors.unshift(error);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(50);
      }
      
      localStorage.setItem('debug_errors', JSON.stringify(errors));
    } catch (e) {
      // Silently fail if localStorage is not available
      console.debug('Could not store error for debugging:', e);
    }
  }
  
  getDebugErrors(): AppError[] {
    try {
      const stored = localStorage.getItem('debug_errors');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
  
  clearDebugErrors(): void {
    try {
      localStorage.removeItem('debug_errors');
    } catch (e) {
      console.debug('Could not clear debug errors:', e);
    }
  }
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling(): void {
  const logger = ErrorLogger.getInstance();
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = createAppError(
      classifyError(event.reason),
      event.reason,
      { source: 'unhandledrejection' }
    );
    
    logger.log(error);
    
    // Prevent default console error
    event.preventDefault();
  });
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const error = createAppError(
      classifyError(event.error),
      event.error,
      { 
        source: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
    
    logger.log(error);
  });
}

/**
 * Async wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = createAppError(
      classifyError(error),
      error as Error,
      context
    );
    
    ErrorLogger.getInstance().log(appError);
    
    return { error: appError };
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      const errorType = classifyError(error);
      
      // Don't retry non-retryable errors
      if (!isRetryableError(errorType)) {
        throw error;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
      }
    }
  }
  
  throw lastError!;
}