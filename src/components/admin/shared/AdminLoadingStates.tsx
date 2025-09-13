import React from 'react';
import { Loader2, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';

// Skeleton loader for table rows
export const TableRowSkeleton: React.FC<{ columns: number; rows?: number }> = ({
  columns,
  rows = 5
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className={cn(
              "h-4 bg-gray-200 rounded animate-pulse",
              colIndex === 0 && "w-24", // First column (checkbox/image)
              colIndex === 1 && "flex-1", // Main content column
              colIndex > 1 && "w-20" // Other columns
            )}
          />
        ))}
      </div>
    ))}
  </div>
);

// Skeleton loader for cards
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="border border-gray-200 rounded-lg p-6 space-y-4 animate-pulse"
      >
        <div className="h-48 bg-gray-200 rounded" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    ))}
  </div>
);

// Form skeleton loader
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>

    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
    </div>

    <div className="flex justify-end space-x-4">
      <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
    </div>
  </div>
);

// Loading spinner with text
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && (
        <p className={cn(
          "text-gray-600",
          size === 'sm' && "text-sm",
          size === 'lg' && "text-lg"
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

// Full page loading state
export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = "Loading..."
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text={message} />
  </div>
);

// Error state component
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryText = "Try again",
  className
}) => (
  <div className={cn("flex flex-col items-center justify-center min-h-[300px] text-center", className)}>
    <div className="p-3 bg-red-100 rounded-full mb-4">
      <AlertTriangle className="h-6 w-6 text-red-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {retryText}
      </Button>
    )}
  </div>
);

// Empty state component
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => (
  <div className={cn("flex flex-col items-center justify-center min-h-[300px] text-center", className)}>
    {icon && (
      <div className="p-3 bg-gray-100 rounded-full mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
    )}
    {action && (
      <Button onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

// Network status indicator
export const NetworkStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <div className={cn(
    "fixed bottom-4 left-4 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 z-50",
    isOnline
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-red-100 text-red-800 border border-red-200"
  )}>
    {isOnline ? (
      <>
        <Wifi className="h-4 w-4" />
        Connected
      </>
    ) : (
      <>
        <WifiOff className="h-4 w-4" />
        Offline
      </>
    )}
  </div>
);

// Progress bar component
export interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  color = 'blue',
  showPercentage = false,
  className
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "transition-all duration-300 ease-out rounded-full",
            colorClasses[color],
            sizeClasses[size]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-sm text-gray-600 mt-1 text-right">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

// Pulse loading animation for text
export const TextSkeleton: React.FC<{
  lines?: number;
  width?: string[];
  className?: string;
}> = ({
  lines = 3,
  width = ['100%', '75%', '50%'],
  className
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className="h-4 bg-gray-200 rounded animate-pulse"
        style={{ width: width[index] || width[width.length - 1] }}
      />
    ))}
  </div>
);

// Button loading state
export interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  [key: string]: any;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading = false,
  children,
  loadingText,
  disabled,
  ...props
}) => (
  <Button disabled={disabled || loading} {...props}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {loading && loadingText ? loadingText : children}
  </Button>
);

// Inline loading component
export const InlineLoading: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <Loader2 className="h-4 w-4 animate-spin" />
    {text}
  </div>
);