/**
 * Comprehensive error handling for the order tracking system
 */

export interface OrderError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export enum OrderErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  SSE_CONNECTION_FAILED = 'SSE_CONNECTION_FAILED',
  
  // API errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_ORDER_ID = 'INVALID_ORDER_ID',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Validation errors
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  MEDUSA_API_ERROR = 'MEDUSA_API_ERROR',
  
  // Real-time errors
  REALTIME_UPDATE_FAILED = 'REALTIME_UPDATE_FAILED',
  SSE_PARSE_ERROR = 'SSE_PARSE_ERROR',
  
  // Business logic errors
  ORDER_ALREADY_COMPLETED = 'ORDER_ALREADY_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ESTIMATION_UNAVAILABLE = 'ESTIMATION_UNAVAILABLE'
}

export class OrderTrackingError extends Error {
  public readonly code: OrderErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly context?: string;

  constructor(code: OrderErrorCode, message: string, details?: any, context?: string) {
    super(message);
    this.name = 'OrderTrackingError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OrderTrackingError);
    }
  }

  toJSON(): OrderError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      context: this.context
    };
  }
}

/**
 * Error handler utility functions
 */
export class OrderErrorHandler {
  private static errorLog: OrderError[] = [];

  /**
   * Log an error for debugging and monitoring
   */
  static logError(error: OrderTrackingError | Error, context?: string): void {
    const orderError = error instanceof OrderTrackingError 
      ? error.toJSON() 
      : {
          code: OrderErrorCode.INTERNAL_SERVER_ERROR,
          message: error.message,
          details: error.stack,
          timestamp: new Date(),
          context
        };

    this.errorLog.push(orderError);
    
    // In production, you might want to send this to a logging service
    console.error('Order Tracking Error:', orderError);
    
    // Keep only the last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: OrderTrackingError | Error): string {
    if (error instanceof OrderTrackingError) {
      switch (error.code) {
        case OrderErrorCode.ORDER_NOT_FOUND:
          return 'Order not found. Please check your order number and try again.';
        case OrderErrorCode.NETWORK_ERROR:
          return 'Network connection issue. Please check your internet connection and try again.';
        case OrderErrorCode.SSE_CONNECTION_FAILED:
          return 'Live updates are temporarily unavailable. The page will refresh automatically.';
        case OrderErrorCode.INVALID_ORDER_ID:
          return 'Invalid order ID format. Please check the order number and try again.';
        case OrderErrorCode.UNAUTHORIZED_ACCESS:
          return 'You do not have permission to view this order.';
        case OrderErrorCode.RATE_LIMITED:
          return 'Too many requests. Please wait a moment and try again.';
        case OrderErrorCode.ORDER_ALREADY_COMPLETED:
          return 'This order has already been completed.';
        case OrderErrorCode.ORDER_CANCELLED:
          return 'This order has been cancelled.';
        case OrderErrorCode.INVALID_STATUS_TRANSITION:
          return 'Invalid status update. Please refresh and try again.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Handle API response errors
   */
  static handleApiError(response: Response, context?: string): OrderTrackingError {
    switch (response.status) {
      case 404:
        return new OrderTrackingError(
          OrderErrorCode.ORDER_NOT_FOUND,
          'Order not found',
          { status: response.status, statusText: response.statusText },
          context
        );
      case 401:
        return new OrderTrackingError(
          OrderErrorCode.UNAUTHORIZED_ACCESS,
          'Unauthorized access',
          { status: response.status, statusText: response.statusText },
          context
        );
      case 429:
        return new OrderTrackingError(
          OrderErrorCode.RATE_LIMITED,
          'Rate limited',
          { status: response.status, statusText: response.statusText },
          context
        );
      case 500:
        return new OrderTrackingError(
          OrderErrorCode.INTERNAL_SERVER_ERROR,
          'Internal server error',
          { status: response.status, statusText: response.statusText },
          context
        );
      default:
        return new OrderTrackingError(
          OrderErrorCode.NETWORK_ERROR,
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status, statusText: response.statusText },
          context
        );
    }
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error: Error, context?: string): OrderTrackingError {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new OrderTrackingError(
        OrderErrorCode.NETWORK_ERROR,
        'Network connection failed',
        { originalError: error.message },
        context
      );
    }

    if (error.name === 'AbortError') {
      return new OrderTrackingError(
        OrderErrorCode.CONNECTION_TIMEOUT,
        'Request timeout',
        { originalError: error.message },
        context
      );
    }

    return new OrderTrackingError(
      OrderErrorCode.INTERNAL_SERVER_ERROR,
      error.message,
      { originalError: error.message },
      context
    );
  }

  /**
   * Handle SSE connection errors
   */
  static handleSSEError(error: Event | Error, context?: string): OrderTrackingError {
    return new OrderTrackingError(
      OrderErrorCode.SSE_CONNECTION_FAILED,
      'Real-time connection failed',
      { error: error.toString() },
      context
    );
  }

  /**
   * Retry wrapper for API calls with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain types of errors
        if (error instanceof OrderTrackingError) {
          switch (error.code) {
            case OrderErrorCode.ORDER_NOT_FOUND:
            case OrderErrorCode.UNAUTHORIZED_ACCESS:
            case OrderErrorCode.INVALID_ORDER_ID:
              throw error;
          }
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.logError(lastError, `${context} - Final attempt failed`);
          throw lastError;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        
        this.logError(lastError, `${context} - Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Create a timeout wrapper for promises
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    context?: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new OrderTrackingError(
          OrderErrorCode.CONNECTION_TIMEOUT,
          `Operation timeout after ${timeoutMs}ms`,
          { timeout: timeoutMs },
          context
        ));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    recentErrors: OrderError[];
  } {
    const errorsByCode: Record<string, number> = {};
    
    this.errorLog.forEach(error => {
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByCode,
      recentErrors: this.errorLog.slice(-10)
    };
  }

  /**
   * Clear error log (useful for testing)
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Custom hook for error handling in React components
 */
export interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (error: OrderTrackingError | Error, context?: string) => void;
  clearError: () => void;
}

export function createErrorHandler(): UseErrorHandlerReturn {
  let currentError: string | null = null;
  const listeners: Array<(error: string | null) => void> = [];

  const setError = (error: string | null) => {
    currentError = error;
    listeners.forEach(listener => listener(error));
  };

  const handleError = (error: OrderTrackingError | Error, context?: string) => {
    OrderErrorHandler.logError(error, context);
    const userMessage = OrderErrorHandler.getUserMessage(error);
    setError(userMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const subscribe = (listener: (error: string | null) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };

  return {
    get error() { return currentError; },
    setError,
    handleError,
    clearError,
    subscribe
  } as any;
}

// Export commonly used error creators
export const createOrderNotFoundError = (orderId: string) => 
  new OrderTrackingError(OrderErrorCode.ORDER_NOT_FOUND, `Order ${orderId} not found`, { orderId });

export const createNetworkError = (message: string) => 
  new OrderTrackingError(OrderErrorCode.NETWORK_ERROR, message);

export const createValidationError = (field: string, message: string) => 
  new OrderTrackingError(OrderErrorCode.INVALID_INPUT_FORMAT, message, { field });

export const createSSEError = (message: string) => 
  new OrderTrackingError(OrderErrorCode.SSE_CONNECTION_FAILED, message);