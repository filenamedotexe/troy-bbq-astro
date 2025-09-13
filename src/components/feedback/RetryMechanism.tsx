/**
 * Retry Mechanism Components for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern UX patterns
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, AlertCircle, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressIndicator } from './LoadingSkeleton';
import { cn } from '../../lib/utils';
import { 
  createAppError, 
  classifyError, 
  isRetryableError, 
  withRetry,
  AppError,
  ErrorType 
} from '../../lib/errorHandling';
import { notifications } from '../../lib/notifications';

// Retry component interfaces
interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  backoffFactor?: number;
  retryableErrors?: ErrorType[];
  onRetry?: (attempt: number) => void;
  onSuccess?: (result: any) => void;
  onFailure?: (error: AppError) => void;
}

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  disabled?: boolean;
  attempt?: number;
  maxAttempts?: number;
  error?: AppError;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showAttemptCount?: boolean;
}

interface RetryCardProps {
  error: AppError;
  onRetry: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  attempt?: number;
  maxAttempts?: number;
  className?: string;
  compact?: boolean;
}

interface AutoRetryProps {
  operation: () => Promise<any>;
  options?: RetryOptions;
  children: (state: AutoRetryState) => React.ReactNode;
  trigger?: any; // Dependency to trigger retry
}

interface AutoRetryState {
  isLoading: boolean;
  isRetrying: boolean;
  error: AppError | null;
  data: any;
  attempt: number;
  maxAttempts: number;
  canRetry: boolean;
  retry: () => void;
  reset: () => void;
}

/**
 * Retry Button Component
 */
export function RetryButton({
  onRetry,
  isRetrying = false,
  disabled = false,
  attempt = 0,
  maxAttempts = 3,
  error,
  size = 'md',
  variant = 'default',
  className,
  showAttemptCount = true,
  ...props
}: RetryButtonProps) {
  const canRetry = !disabled && (!error || isRetryableError(error.type)) && attempt < maxAttempts;
  
  return (
    <Button
      onClick={onRetry}
      disabled={!canRetry || isRetrying}
      size={size}
      variant={variant}
      className={cn('flex items-center space-x-2', className)}
      aria-label={
        isRetrying 
          ? `Retrying operation (attempt ${attempt + 1} of ${maxAttempts})`
          : `Retry failed operation${showAttemptCount && attempt > 0 ? ` (attempt ${attempt} of ${maxAttempts})` : ''}`
      }
      {...props}
    >
      <RefreshCw 
        className={cn(
          'w-4 h-4',
          isRetrying && 'animate-spin'
        )} 
        aria-hidden="true"
      />
      <span>
        {isRetrying ? 'Retrying...' : 'Try Again'}
        {showAttemptCount && attempt > 0 && !isRetrying && (
          <span className="ml-1 text-xs opacity-75">
            ({attempt}/{maxAttempts})
          </span>
        )}
      </span>
    </Button>
  );
}

/**
 * Retry Card Component
 */
export function RetryCard({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  attempt = 0,
  maxAttempts = 3,
  className,
  compact = false
}: RetryCardProps) {
  const canRetry = isRetryableError(error.type) && attempt < maxAttempts;
  const isMaxAttemptsReached = attempt >= maxAttempts;
  
  if (compact) {
    return (
      <div 
        className={cn(
          'flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md',
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <AlertCircle 
            className="w-4 h-4 text-red-500 flex-shrink-0" 
            aria-hidden="true"
          />
          <p className="text-sm text-red-700 dark:text-red-300 truncate">
            {error.message}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          {canRetry && (
            <RetryButton
              onRetry={onRetry}
              isRetrying={isRetrying}
              attempt={attempt}
              maxAttempts={maxAttempts}
              error={error}
              size="sm"
              variant="outline"
              showAttemptCount={false}
            />
          )}
          
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-red-700 hover:text-red-900 p-1"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        'p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-500" aria-hidden="true" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Operation Failed
          </h3>
          
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error.message}
          </p>
          
          {error.details && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
                Technical Details
              </summary>
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded">
                {error.details}
              </p>
            </details>
          )}
          
          {isMaxAttemptsReached ? (
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 mb-4">
              <X className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">
                Maximum retry attempts reached ({maxAttempts})
              </span>
            </div>
          ) : (
            canRetry && (
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 mb-4">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">
                  This operation can be retried
                </span>
              </div>
            )
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry && (
              <RetryButton
                onRetry={onRetry}
                isRetrying={isRetrying}
                attempt={attempt}
                maxAttempts={maxAttempts}
                error={error}
              />
            )}
            
            {onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Auto Retry Component with Render Props
 */
export function AutoRetry({
  operation,
  options = {},
  children,
  trigger
}: AutoRetryProps) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    backoffFactor = 2,
    retryableErrors,
    onRetry,
    onSuccess,
    onFailure
  } = options;
  
  const [state, setState] = useState<Omit<AutoRetryState, 'retry' | 'reset'>>({
    isLoading: false,
    isRetrying: false,
    error: null,
    data: null,
    attempt: 0,
    maxAttempts,
    canRetry: true
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Execute operation with retry logic
  const executeOperation = useCallback(async (isRetry = false) => {
    // Abort any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      isRetrying: isRetry,
      error: null,
      attempt: isRetry ? prev.attempt + 1 : 0
    }));
    
    if (isRetry && onRetry) {
      onRetry(state.attempt + 1);
    }
    
    try {
      abortControllerRef.current = new AbortController();
      
      const result = await operation();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
        data: result,
        error: null,
        canRetry: true
      }));
      
      if (onSuccess) {
        onSuccess(result);
      }
      
    } catch (error) {
      const appError = createAppError(
        classifyError(error),
        error as Error,
        { attempt: state.attempt + 1 }
      );
      
      const canRetryError = retryableErrors 
        ? retryableErrors.includes(appError.type)
        : isRetryableError(appError.type);
      
      const canRetryAttempt = (state.attempt + 1) < maxAttempts;
      const shouldRetry = canRetryError && canRetryAttempt;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
        error: appError,
        canRetry: shouldRetry
      }));
      
      if (onFailure) {
        onFailure(appError);
      }
      
      // Auto-retry for certain errors
      if (shouldRetry && appError.type === ErrorType.NETWORK) {
        const delay = baseDelay * Math.pow(backoffFactor, state.attempt);
        retryTimeoutRef.current = setTimeout(() => {
          executeOperation(true);
        }, delay);
      }
    }
  }, [operation, state.attempt, maxAttempts, baseDelay, backoffFactor, retryableErrors, onRetry, onSuccess, onFailure]);
  
  // Manual retry function
  const retry = useCallback(() => {
    if (state.canRetry && !state.isLoading) {
      executeOperation(true);
    }
  }, [executeOperation, state.canRetry, state.isLoading]);
  
  // Reset function
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setState({
      isLoading: false,
      isRetrying: false,
      error: null,
      data: null,
      attempt: 0,
      maxAttempts,
      canRetry: true
    });
  }, [maxAttempts]);
  
  // Execute operation on mount or when trigger changes
  useEffect(() => {
    executeOperation();
  }, [trigger]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  return children({
    ...state,
    retry,
    reset
  });
}

/**
 * Retry Progress Component
 */
export function RetryProgress({
  attempt,
  maxAttempts,
  isRetrying,
  nextRetryIn,
  className
}: {
  attempt: number;
  maxAttempts: number;
  isRetrying: boolean;
  nextRetryIn?: number;
  className?: string;
}) {
  const progress = (attempt / maxAttempts) * 100;
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Retry Progress</span>
        <span>{attempt} of {maxAttempts} attempts</span>
      </div>
      
      <ProgressIndicator
        value={progress}
        variant="linear"
        color={attempt >= maxAttempts ? 'error' : 'primary'}
        size="sm"
      />
      
      {nextRetryIn && nextRetryIn > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" aria-hidden="true" />
          <span>Next retry in {Math.ceil(nextRetryIn / 1000)} seconds</span>
        </div>
      )}
      
      {isRetrying && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Retrying...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing retry state
 */
export function useRetryState(maxAttempts = 3) {
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<AppError | null>(null);
  
  const canRetry = attempt < maxAttempts && (lastError ? isRetryableError(lastError.type) : true);
  
  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    if (!canRetry) {
      throw new Error('Cannot retry: maximum attempts reached or error is not retryable');
    }
    
    setIsRetrying(true);
    setAttempt(prev => prev + 1);
    
    try {
      const result = await withRetry(operation, 1); // Single attempt since we handle retry logic here
      setLastError(null);
      return result;
    } catch (error) {
      const appError = createAppError(classifyError(error), error as Error);
      setLastError(appError);
      throw appError;
    } finally {
      setIsRetrying(false);
    }
  }, [canRetry, maxAttempts]);
  
  const reset = useCallback(() => {
    setAttempt(0);
    setIsRetrying(false);
    setLastError(null);
  }, []);
  
  return {
    attempt,
    maxAttempts,
    isRetrying,
    lastError,
    canRetry,
    retry,
    reset
  };
}