/**
 * React Error Boundary Components for Troy BBQ
 * Based on React error boundary best practices and WCAG 2.2 accessibility guidelines
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { createAppError, classifyError, ErrorLogger } from '../../lib/errorHandling';
import { notifications } from '../../lib/notifications';

// Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  identifier?: string;
  enableRetry?: boolean;
  showErrorDetails?: boolean;
}

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Main Error Boundary component with accessibility and UX improvements
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to render error UI
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    const appError = createAppError(
      classifyError(error),
      error,
      {
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        identifier: this.props.identifier,
        retryCount: this.state.retryCount
      }
    );
    
    ErrorLogger.getInstance().log(appError);
    
    // Update state with error info
    this.setState({
      errorInfo,
      errorId: appError.id
    });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Show notification for critical errors
    if (this.props.level === 'page') {
      notifications.fromError(appError, 'Page Error');
    }
  }
  
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
  
  private handleRetry = (): void => {
    if (this.state.retryCount >= this.maxRetries) {
      notifications.error(
        'Maximum Retries Exceeded',
        'Please refresh the page or contact support if the problem persists.'
      );
      return;
    }
    
    // Show loading notification
    const loadingId = notifications.loading(
      'Retrying...',
      'Attempting to recover from the error.'
    );
    
    // Reset error state after a short delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1
      });
      
      // Remove loading notification
      notifications.remove(loadingId);
      
      // Show success notification
      notifications.success(
        'Retry Successful',
        'The component has been restored.'
      );
    }, 1000);
  };
  
  private handleGoHome = (): void => {
    window.location.href = '/';
  };
  
  private handleGoBack = (): void => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  };
  
  private renderErrorFallback(): ReactNode {
    const { error, errorInfo, errorId } = this.state;
    const { level = 'component', enableRetry = true, showErrorDetails = false } = this.props;
    
    if (!error) return null;
    
    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback(error, errorInfo!, this.handleRetry);
    }
    
    // Determine error UI based on level
    switch (level) {
      case 'page':
        return this.renderPageError();
      case 'section':
        return this.renderSectionError();
      default:
        return this.renderComponentError();
    }
  }
  
  private renderPageError(): ReactNode {
    const { error, errorId, retryCount } = this.state;
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8"
        role="alert"
        aria-live="assertive"
        aria-labelledby="error-title"
        aria-describedby="error-description"
      >
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <AlertTriangle 
              className="mx-auto h-16 w-16 text-red-500 mb-4"
              aria-hidden="true"
            />
            <h1 
              id="error-title"
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Oops! Something went wrong
            </h1>
            <p 
              id="error-description"
              className="text-lg text-gray-600 mb-8"
            >
              We're sorry, but an unexpected error occurred. Our team has been notified and is working to fix this issue.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                disabled={retryCount >= this.maxRetries}
                className="w-full sm:w-auto"
                aria-label="Retry loading the page"
              >
                <RefreshCw 
                  className="w-4 h-4 mr-2" 
                  aria-hidden="true"
                />
                Try Again
                {retryCount > 0 && ` (${retryCount}/${this.maxRetries})`}
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto"
                aria-label="Go to homepage"
              >
                <Home 
                  className="w-4 h-4 mr-2" 
                  aria-hidden="true"
                />
                Go Home
              </Button>
            </div>
            
            <Button
              variant="ghost"
              onClick={this.handleGoBack}
              className="w-full sm:w-auto"
              aria-label="Go back to previous page"
            >
              <ArrowLeft 
                className="w-4 h-4 mr-2" 
                aria-hidden="true"
              />
              Go Back
            </Button>
          </div>
          
          {this.props.showErrorDetails && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded-md text-xs font-mono text-gray-700 overflow-auto max-h-40">
                <div><strong>Error ID:</strong> {errorId}</div>
                <div><strong>Message:</strong> {error?.message}</div>
                <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }
  
  private renderSectionError(): ReactNode {
    const { error, retryCount } = this.state;
    
    return (
      <Card 
        className="p-6 m-4 border-red-200 bg-red-50"
        role="alert"
        aria-live="polite"
        aria-labelledby="section-error-title"
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle 
            className="w-6 h-6 text-red-500 flex-shrink-0 mt-1"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h3 
              id="section-error-title"
              className="text-lg font-medium text-red-800 mb-2"
            >
              Section temporarily unavailable
            </h3>
            <p className="text-red-700 mb-4">
              This section couldn't load properly. You can try refreshing it or continue using other parts of the application.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={this.handleRetry}
                disabled={retryCount >= this.maxRetries}
                aria-label="Retry loading this section"
              >
                <RefreshCw 
                  className="w-3 h-3 mr-1" 
                  aria-hidden="true"
                />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  private renderComponentError(): ReactNode {
    const { retryCount } = this.state;
    
    return (
      <div 
        className="p-4 border border-red-200 bg-red-50 rounded-md"
        role="alert"
        aria-live="polite"
        aria-label="Component error"
      >
        <div className="flex items-center space-x-2">
          <AlertTriangle 
            className="w-5 h-5 text-red-500 flex-shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-sm text-red-800">
              This component couldn't load properly.
            </p>
          </div>
          
          {this.props.enableRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleRetry}
              disabled={retryCount >= this.maxRetries}
              aria-label="Retry loading this component"
            >
              <RefreshCw 
                className="w-3 h-3" 
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }
    
    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to trigger error boundary from functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // Create a React error that will be caught by the error boundary
    throw error;
  };
}

/**
 * Async error boundary for handling promise rejections
 */
export class AsyncErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = createAppError(
      classifyError(error),
      error,
      {
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        identifier: this.props.identifier,
        async: true
      }
    );
    
    ErrorLogger.getInstance().log(appError);
    
    this.setState({
      errorInfo,
      errorId: appError.id
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  componentDidMount(): void {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }
  
  componentWillUnmount(): void {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }
  
  private handlePromiseRejection = (event: PromiseRejectionEvent): void => {
    // Convert promise rejection to error boundary error
    const error = new Error(event.reason?.message || 'Unhandled promise rejection');
    error.stack = event.reason?.stack;
    
    this.setState({
      hasError: true,
      error,
      errorInfo: {
        componentStack: 'Promise rejection'
      } as ErrorInfo,
      errorId: `async_${Date.now()}`
    });
    
    // Prevent default console error
    event.preventDefault();
  };
  
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorBoundary
          {...this.props}
          level="section"
          fallback={(error, errorInfo, retry) => (
            <Card className="p-6 m-4 border-red-200 bg-red-50">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Async Operation Failed
                </h3>
                <p className="text-red-700 mb-4">
                  An asynchronous operation failed. This might be due to network issues or server problems.
                </p>
                <Button onClick={retry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </Card>
          )}
        >
          {/* This won't render due to hasError state */}
          {this.props.children}
        </ErrorBoundary>
      );
    }
    
    return this.props.children;
  }
}