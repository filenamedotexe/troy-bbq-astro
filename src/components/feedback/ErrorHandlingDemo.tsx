/**
 * Error Handling and User Feedback Demo Component for Troy BBQ
 * Comprehensive testing and demonstration of all error handling features
 * Based on WCAG 2.2 accessibility guidelines
 */

import React, { useState, useCallback } from 'react';
import { AlertTriangle, Wifi, RefreshCw, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Import all error handling components
import { ErrorBoundary, withErrorBoundary } from '../errors/ErrorBoundary';
import { ToastContainer } from './ToastNotification';
import { 
  TextSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  FormSkeleton,
  ProgressIndicator,
  LoadingOverlay 
} from './LoadingSkeleton';
import { ConfirmationDialog, useConfirmation } from './ConfirmationDialog';
import { 
  NetworkStatusIndicator, 
  OfflineBanner, 
  SyncStatus,
  useNetworkStatus 
} from './NetworkStatus';
import { 
  FormField, 
  ValidatedInput, 
  FieldSet, 
  FormSummary,
  validators 
} from './FormValidationFeedback';
import { RetryButton, RetryCard, AutoRetry } from './RetryMechanism';

// Import hooks and utilities
import { 
  useAsyncOperation, 
  useFormErrors, 
  useLoadingState, 
  useFeedback 
} from '../../hooks/useErrorHandling';
import { 
  createAppError, 
  ErrorType, 
  setupGlobalErrorHandling 
} from '../../lib/errorHandling';
import { notifications } from '../../lib/notifications';

/**
 * Component that intentionally throws errors for testing
 */
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error thrown by ErrorThrowingComponent');
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-green-800">Component is working correctly!</span>
      </div>
    </div>
  );
}

const WrappedErrorComponent = withErrorBoundary(ErrorThrowingComponent, {
  level: 'component',
  enableRetry: true
});

/**
 * Async operation simulator for testing
 */
function createAsyncOperation(
  type: 'success' | 'network-error' | 'validation-error' | 'server-error',
  delay = 2000
) {
  return () => new Promise((resolve, reject) => {
    setTimeout(() => {
      switch (type) {
        case 'success':
          resolve({ message: 'Operation completed successfully!', timestamp: new Date().toISOString() });
          break;
        case 'network-error':
          reject(new Error('Network connection failed'));
          break;
        case 'validation-error':
          reject(new Error('Invalid data provided'));
          break;
        case 'server-error':
          reject(new Error('Internal server error'));
          break;
        default:
          resolve({ message: 'Default success' });
      }
    }, delay);
  });
}

/**
 * Main Demo Component
 */
export function ErrorHandlingDemo() {
  const [demoSection, setDemoSection] = useState<string>('overview');
  const { isOnline } = useNetworkStatus();
  const { confirm, ConfirmationDialog } = useConfirmation();
  const { showSuccess, showError, showWarning, showInfo } = useFeedback();
  
  // Initialize global error handling
  React.useEffect(() => {
    setupGlobalErrorHandling();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Fixed position elements */}
      <ToastContainer position="top-right" />
      <NetworkStatusIndicator position="top-left" showWhenOnline />
      <ConfirmationDialog />
      
      {/* Main content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Error Handling & User Feedback Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Comprehensive demonstration of accessibility-compliant error handling and user feedback systems
          </p>
          
          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              'overview',
              'error-boundaries',
              'notifications',
              'loading-states',
              'form-validation',
              'retry-mechanisms',
              'network-status',
              'confirmation-dialogs'
            ].map((section) => (
              <Button
                key={section}
                variant={demoSection === section ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDemoSection(section)}
                className="capitalize"
              >
                {section.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Demo sections */}
        {demoSection === 'overview' && <OverviewSection />}
        {demoSection === 'error-boundaries' && <ErrorBoundarySection />}
        {demoSection === 'notifications' && <NotificationSection />}
        {demoSection === 'loading-states' && <LoadingStatesSection />}
        {demoSection === 'form-validation' && <FormValidationSection />}
        {demoSection === 'retry-mechanisms' && <RetryMechanismSection />}
        {demoSection === 'network-status' && <NetworkStatusSection />}
        {demoSection === 'confirmation-dialogs' && <ConfirmationDialogSection />}
      </div>
    </div>
  );
}

/**
 * Overview Section
 */
function OverviewSection() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">System Overview</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Features Implemented</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>✅ WCAG 2.2 compliant error handling</li>
              <li>✅ React Error Boundaries with retry logic</li>
              <li>✅ Toast notification system</li>
              <li>✅ Loading skeletons and progress indicators</li>
              <li>✅ Form validation with ARIA support</li>
              <li>✅ Network status detection</li>
              <li>✅ Retry mechanisms with exponential backoff</li>
              <li>✅ Confirmation dialogs</li>
              <li>✅ Focus management and keyboard navigation</li>
              <li>✅ Screen reader announcements</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Accessibility Features</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• ARIA live regions for dynamic content</li>
              <li>• Proper focus management</li>
              <li>• High contrast error indicators</li>
              <li>• Keyboard navigation support</li>
              <li>• Screen reader optimized announcements</li>
              <li>• Reduced motion preference detection</li>
              <li>• Color-independent error indication</li>
              <li>• Semantic HTML structure</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Error Boundary Section
 */
function ErrorBoundarySection() {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Error Boundary Testing</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShouldThrow(!shouldThrow)}
              variant={shouldThrow ? 'destructive' : 'default'}
            >
              {shouldThrow ? 'Fix Component' : 'Break Component'}
            </Button>
            
            <Button
              onClick={() => {
                throw new Error('Unhandled error test');
              }}
              variant="outline"
            >
              Throw Unhandled Error
            </Button>
          </div>
          
          <ErrorBoundary level="section" showErrorDetails>
            <WrappedErrorComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      </Card>
    </div>
  );
}

/**
 * Notification Section
 */
function NotificationSection() {
  const { showSuccess, showError, showWarning, showInfo } = useFeedback();
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Toast Notifications</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => showSuccess('Success!', 'Operation completed successfully.')}
            className="bg-green-600 hover:bg-green-700"
          >
            Show Success
          </Button>
          
          <Button
            onClick={() => showError('Error!', 'Something went wrong.')}
            variant="destructive"
          >
            Show Error
          </Button>
          
          <Button
            onClick={() => showWarning('Warning!', 'Please review this action.')}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Show Warning
          </Button>
          
          <Button
            onClick={() => showInfo('Info', 'Here is some useful information.')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Show Info
          </Button>
        </div>
        
        <div className="mt-6">
          <Button
            onClick={() => {
              const error = createAppError(ErrorType.NETWORK, new Error('Network connection failed'));
              notifications.fromError(error);
            }}
            variant="outline"
          >
            Show Error with Retry
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Loading States Section
 */
function LoadingStatesSection() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10));
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Loading States</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Skeletons</h3>
            <div className="space-y-4">
              <TextSkeleton lines={3} />
              <CardSkeleton showImage showAvatar />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Progress Indicators</h3>
            <div className="space-y-4">
              <ProgressIndicator value={progress} showPercentage label="Linear Progress" />
              <ProgressIndicator value={progress} variant="circular" showPercentage />
              <ProgressIndicator variant="spinner" label="Loading..." />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Button onClick={() => setShowOverlay(!showOverlay)}>
            {showOverlay ? 'Hide' : 'Show'} Loading Overlay
          </Button>
          
          <LoadingOverlay isLoading={showOverlay} message="Processing...">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
              <span className="text-gray-500">Content area</span>
            </div>
          </LoadingOverlay>
        </div>
      </Card>
    </div>
  );
}

/**
 * Form Validation Section
 */
function FormValidationSection() {
  const { 
    addError, 
    removeError, 
    getFieldProps, 
    getErrorProps, 
    shouldShowError,
    hasAnyErrors 
  } = useFormErrors({ showNotifications: true, focusOnError: true });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    const emailError = validators.compose(
      validators.required,
      validators.email
    )(formData.email);
    
    if (emailError) {
      addError('email', emailError);
      isValid = false;
    } else {
      removeError('email');
    }
    
    // Password validation
    const passwordError = validators.compose(
      validators.required,
      validators.minLength(8)
    )(formData.password);
    
    if (passwordError) {
      addError('password', passwordError);
      isValid = false;
    } else {
      removeError('password');
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      addError('confirmPassword', 'Passwords do not match');
      isValid = false;
    } else {
      removeError('confirmPassword');
    }
    
    return isValid;
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Form Validation</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          validateForm();
        }} className="space-y-6">
          
          <FormSummary
            errors={hasAnyErrors() ? ['Please fix the validation errors below'] : []}
          />
          
          <ValidatedInput
            id="email"
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            validator={validators.compose(validators.required, validators.email)}
            validateOnBlur
            required
            {...getFieldProps('email')}
          />
          
          <ValidatedInput
            id="password"
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            validator={validators.compose(validators.required, validators.minLength(8))}
            validateOnBlur
            showPasswordToggle
            required
            description="Must be at least 8 characters long"
            {...getFieldProps('password')}
          />
          
          <ValidatedInput
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            validateOnBlur
            showPasswordToggle
            required
            {...getFieldProps('confirmPassword')}
          />
          
          <Button type="submit">
            Validate Form
          </Button>
        </form>
      </Card>
    </div>
  );
}

/**
 * Retry Mechanism Section
 */
function RetryMechanismSection() {
  const operation = useAsyncOperation(createAsyncOperation('network-error'), {
    retries: 3,
    showErrorNotification: false
  });
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Retry Mechanisms</h2>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={() => operation.execute()}>
              Test Network Error
            </Button>
            <Button onClick={() => operation.reset()} variant="outline">
              Reset
            </Button>
          </div>
          
          {operation.error && (
            <RetryCard
              error={operation.error}
              onRetry={() => operation.execute()}
              isRetrying={operation.isLoading}
            />
          )}
          
          <AutoRetry
            operation={createAsyncOperation('success')}
            options={{ maxAttempts: 3, showSuccessNotification: true }}
          >
            {({ isLoading, error, data, attempt, retry, canRetry }) => (
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold mb-2">Auto Retry Demo</h3>
                
                {isLoading && <p>Loading...</p>}
                {error && (
                  <div className="text-red-600">
                    Error: {error.message} (Attempt {attempt})
                    {canRetry && (
                      <Button size="sm" onClick={retry} className="ml-2">
                        Retry
                      </Button>
                    )}
                  </div>
                )}
                {data && (
                  <div className="text-green-600">
                    Success: {JSON.stringify(data)}
                  </div>
                )}
              </div>
            )}
          </AutoRetry>
        </div>
      </Card>
    </div>
  );
}

/**
 * Network Status Section
 */
function NetworkStatusSection() {
  const { isOnline } = useNetworkStatus();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Network Status</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span>Current Status:</span>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button onClick={() => setShowOfflineBanner(!showOfflineBanner)}>
              {showOfflineBanner ? 'Hide' : 'Show'} Offline Banner
            </Button>
            <Button onClick={() => setHasPendingChanges(!hasPendingChanges)}>
              {hasPendingChanges ? 'Clear' : 'Add'} Pending Changes
            </Button>
            <Button 
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => setIsSyncing(false), 3000);
              }}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Start Sync'}
            </Button>
          </div>
          
          <OfflineBanner
            isVisible={showOfflineBanner}
            onRetry={() => console.log('Retry connection')}
            onDismiss={() => setShowOfflineBanner(false)}
          />
          
          <SyncStatus
            isOnline={isOnline}
            hasPendingChanges={hasPendingChanges}
            isSyncing={isSyncing}
            onSync={() => {
              setIsSyncing(true);
              setTimeout(() => {
                setIsSyncing(false);
                setHasPendingChanges(false);
              }, 2000);
            }}
          />
        </div>
      </Card>
    </div>
  );
}

/**
 * Confirmation Dialog Section
 */
function ConfirmationDialogSection() {
  const { confirm, ConfirmationDialog } = useConfirmation();
  
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (confirmed) {
      notifications.success('Deleted', 'Item has been deleted successfully.');
    }
  };
  
  const handleDeleteWithConfirmation = async () => {
    const confirmed = await confirm({
      title: 'Delete Important Data',
      message: 'This will permanently delete all your data. Please type "DELETE" to confirm.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      requireTextConfirmation: true,
      confirmationText: 'DELETE'
    });
    
    if (confirmed) {
      notifications.success('Deleted', 'Data has been permanently deleted.');
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Confirmation Dialogs</h2>
        
        <div className="space-x-4">
          <Button onClick={handleDelete} variant="destructive">
            Delete Item
          </Button>
          
          <Button onClick={handleDeleteWithConfirmation} variant="destructive">
            Delete with Text Confirmation
          </Button>
        </div>
        
        <ConfirmationDialog />
      </Card>
    </div>
  );
}