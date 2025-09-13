/**
 * Custom Hooks for Error Handling and User Feedback in Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern React patterns
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  createAppError, 
  classifyError, 
  withErrorHandling, 
  withRetry, 
  ErrorLogger,
  AppError,
  ErrorType
} from '../lib/errorHandling';
import { notifications, formNotifications } from '../lib/notifications';

// Hook options and interfaces
interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

interface UseFormErrorsOptions {
  showNotifications?: boolean;
  clearOnSuccess?: boolean;
  focusOnError?: boolean;
}

interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Hook for handling async operations with comprehensive error handling
 */
export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options: UseAsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false
  });
  
  const operationRef = useRef(operation);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update operation ref when it changes
  useEffect(() => {
    operationRef.current = operation;
  }, [operation]);
  
  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false
    }));
    
    // Set timeout if specified
    if (options.timeout) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: createAppError(ErrorType.NETWORK, new Error('Operation timed out')),
          isError: true
        }));
      }, options.timeout);
    }
    
    try {
      const wrappedOperation = options.retries && options.retries > 1
        ? () => withRetry(
            () => operationRef.current(...args),
            options.retries!,
            options.retryDelay || 1000
          )
        : () => operationRef.current(...args);
      
      const { data, error } = await withErrorHandling(wrappedOperation);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
          isError: true
        }));
        
        if (options.showErrorNotification !== false) {
          notifications.fromError(error);
        }
        
        if (options.onError) {
          options.onError(error);
        }
      } else {
        setState(prev => ({
          ...prev,
          data: data!,
          isLoading: false,
          isSuccess: true
        }));
        
        if (options.showSuccessNotification) {
          notifications.success('Success', 'Operation completed successfully');
        }
        
        if (options.onSuccess) {
          options.onSuccess(data);
        }
      }
    } catch (unexpectedError) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const appError = createAppError(
        classifyError(unexpectedError),
        unexpectedError as Error
      );
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: appError,
        isError: true
      }));
      
      if (options.showErrorNotification !== false) {
        notifications.fromError(appError);
      }
      
      if (options.onError) {
        options.onError(appError);
      }
    }
  }, [options]);
  
  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false
    });
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...state,
    execute,
    reset
  };
}

/**
 * Hook for handling form errors with accessibility features
 */
export function useFormErrors(options: UseFormErrorsOptions = {}) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errorRefs = useRef<Record<string, HTMLElement | null>>({});
  
  const addError = useCallback((field: string, message: string | string[]) => {
    const messages = Array.isArray(message) ? message : [message];
    
    setErrors(prev => ({
      ...prev,
      [field]: messages
    }));
    
    if (options.showNotifications) {
      formNotifications.validationError(field, messages.join(', '));
    }
    
    // Focus on first error field if option is enabled
    if (options.focusOnError && errorRefs.current[field]) {
      setTimeout(() => {
        errorRefs.current[field]?.focus();
      }, 100);
    }
  }, [options.showNotifications, options.focusOnError]);
  
  const removeError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setErrors({});
    if (options.clearOnSuccess) {
      setTouched({});
    }
  }, [options.clearOnSuccess]);
  
  const setFieldTouched = useCallback((field: string, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched
    }));
  }, []);
  
  const getFieldError = useCallback((field: string) => {
    return errors[field]?.[0] || null;
  }, [errors]);
  
  const getFieldErrors = useCallback((field: string) => {
    return errors[field] || [];
  }, [errors]);
  
  const hasError = useCallback((field: string) => {
    return Boolean(errors[field] && errors[field].length > 0);
  }, [errors]);
  
  const hasAnyErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);
  
  const isFieldTouched = useCallback((field: string) => {
    return Boolean(touched[field]);
  }, [touched]);
  
  const shouldShowError = useCallback((field: string) => {
    return hasError(field) && isFieldTouched(field);
  }, [hasError, isFieldTouched]);
  
  // Register error element ref for focus management
  const registerErrorRef = useCallback((field: string, element: HTMLElement | null) => {
    errorRefs.current[field] = element;
  }, []);
  
  // Generate ARIA attributes for form fields
  const getFieldProps = useCallback((field: string) => {
    const fieldError = getFieldError(field);
    const fieldHasError = shouldShowError(field);
    
    return {
      'aria-invalid': fieldHasError,
      'aria-describedby': fieldHasError ? `${field}-error` : undefined,
      onBlur: () => setFieldTouched(field, true),
      ref: (element: HTMLElement | null) => registerErrorRef(field, element)
    };
  }, [getFieldError, shouldShowError, setFieldTouched, registerErrorRef]);
  
  // Generate props for error message elements
  const getErrorProps = useCallback((field: string) => {
    return {
      id: `${field}-error`,
      role: 'alert' as const,
      'aria-live': 'assertive' as const
    };
  }, []);
  
  return {
    errors,
    touched,
    addError,
    removeError,
    clearAllErrors,
    setFieldTouched,
    getFieldError,
    getFieldErrors,
    hasError,
    hasAnyErrors,
    isFieldTouched,
    shouldShowError,
    getFieldProps,
    getErrorProps,
    registerErrorRef
  };
}

/**
 * Hook for handling loading states with UX improvements
 */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const startLoading = useCallback((message = 'Loading...', timeout?: number) => {
    setIsLoading(true);
    setLoadingMessage(message);
    setProgress(0);
    
    // Auto-stop loading after timeout to prevent stuck states
    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        notifications.warning(
          'Loading Timeout',
          'The operation is taking longer than expected. Please try again.'
        );
      }, timeout);
    }
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
    setProgress(0);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);
  
  const updateMessage = useCallback((message: string) => {
    setLoadingMessage(message);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    isLoading,
    loadingMessage,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage
  };
}

/**
 * Hook for handling user feedback and notifications
 */
export function useFeedback() {
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return notifications.success(title, message || '', { duration });
  }, []);
  
  const showError = useCallback((title: string, message?: string, persistent = true) => {
    return notifications.error(title, message || '', { persistent });
  }, []);
  
  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return notifications.warning(title, message || '', { duration });
  }, []);
  
  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return notifications.info(title, message || '', { duration });
  }, []);
  
  const showLoading = useCallback((title: string, message?: string) => {
    return notifications.loading(title, message || '');
  }, []);
  
  const dismiss = useCallback((id: string) => {
    notifications.remove(id);
  }, []);
  
  const dismissAll = useCallback(() => {
    notifications.clear();
  }, []);
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    dismissAll
  };
}

/**
 * Hook for handling retry logic with exponential backoff
 */
export function useRetry() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<AppError | null>(null);
  
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    backoffFactor = 2
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);
    
    try {
      const result = await withRetry(
        async () => {
          setRetryCount(prev => prev + 1);
          return await operation();
        },
        maxRetries,
        baseDelay,
        backoffFactor
      );
      
      setLastError(null);
      return result;
    } catch (error) {
      const appError = createAppError(classifyError(error), error as Error);
      setLastError(appError);
      throw appError;
    } finally {
      setIsRetrying(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setLastError(null);
  }, []);
  
  return {
    retry,
    retryCount,
    isRetrying,
    lastError,
    reset
  };
}

/**
 * Hook for handling focus management and accessibility
 */
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  }, []);
  
  const focusFirst = useCallback((container: HTMLElement | string) => {
    const element = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!element) return;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);
  
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    trapFocus
  };
}