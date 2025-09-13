/**
 * Error Handling and User Feedback Components Index
 * Comprehensive export file for Troy BBQ error handling system
 */

// Error Boundary Components
export {
  ErrorBoundary,
  AsyncErrorBoundary,
  withErrorBoundary,
  useErrorHandler
} from '../errors/ErrorBoundary';

// Toast Notification System
export {
  ToastNotification,
  ToastContainer
} from './ToastNotification';

// Loading States and Progress Indicators
export {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  TableSkeleton,
  FormSkeleton,
  ProgressIndicator,
  LoadingOverlay
} from './LoadingSkeleton';

// Confirmation Dialogs
export {
  ConfirmationDialog,
  useConfirmation,
  confirmationDialogs,
  DialogProvider
} from './ConfirmationDialog';

// Network Status Components
export {
  NetworkStatusIndicator,
  OfflineBanner,
  SyncStatus,
  useNetworkStatus,
  useOfflineFirst
} from './NetworkStatus';

// Form Validation and Feedback
export {
  ValidationMessage,
  FormField,
  ValidatedInput,
  FieldSet,
  FormSummary,
  validators
} from './FormValidationFeedback';

// Retry Mechanisms
export {
  RetryButton,
  RetryCard,
  AutoRetry,
  RetryProgress,
  useRetryState
} from './RetryMechanism';

// Demo Component (for testing and development)
export {
  ErrorHandlingDemo
} from './ErrorHandlingDemo';

// Error Handling Utilities (re-export from lib)
export {
  createAppError,
  classifyError,
  isRetryableError,
  getErrorSeverity,
  getUserFriendlyError,
  withErrorHandling,
  withRetry,
  setupGlobalErrorHandling,
  ErrorLogger,
  type AppError,
  type ErrorType,
  type ErrorSeverity
} from '../../lib/errorHandling';

// Notification System (re-export from lib)
export {
  notifications,
  formNotifications,
  networkNotifications,
  NotificationManager,
  type Notification,
  type NotificationType,
  type NotificationPosition,
  type NotificationAction
} from '../../lib/notifications';

// Custom Hooks
export {
  useAsyncOperation,
  useFormErrors,
  useLoadingState,
  useFeedback,
  useRetry,
  useFocusManagement
} from '../../hooks/useErrorHandling';