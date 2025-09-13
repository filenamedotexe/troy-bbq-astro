/**
 * Loading Skeleton and Progress Indicator Components for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern UX patterns
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Skeleton props
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  'aria-label'?: string;
}

// Progress indicator props
interface ProgressIndicatorProps {
  value?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'linear' | 'circular' | 'spinner';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  label?: string;
  className?: string;
  indeterminate?: boolean;
}

// Loading overlay props
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  spinner?: boolean;
  backdrop?: boolean;
  className?: string;
}

/**
 * Basic Skeleton Component
 */
export function Skeleton({
  className,
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  'aria-label': ariaLabel,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
    rounded: 'rounded-lg'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      role="progressbar"
      aria-label={ariaLabel || 'Loading content'}
      aria-busy="true"
      {...props}
    />
  );
}

/**
 * Text Loading Skeleton
 */
export function TextSkeleton({ 
  lines = 3, 
  className,
  lastLineWidth = '75%',
  ...props 
}: SkeletonProps & { lines?: number; lastLineWidth?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-label="Loading text content">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          {...props}
        />
      ))}
    </div>
  );
}

/**
 * Card Loading Skeleton
 */
export function CardSkeleton({ 
  className,
  showImage = true,
  showAvatar = false,
  ...props 
}: SkeletonProps & { showImage?: boolean; showAvatar?: boolean }) {
  return (
    <div className={cn('space-y-4 p-4 border rounded-lg', className)} aria-label="Loading card content">
      {/* Header with optional avatar */}
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <Skeleton variant="circular" width={40} height={40} {...props} />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" {...props} />
          <Skeleton variant="text" width="40%" {...props} />
        </div>
      </div>
      
      {/* Optional image */}
      {showImage && (
        <Skeleton variant="rectangular" height={200} {...props} />
      )}
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" {...props} />
        <Skeleton variant="text" width="90%" {...props} />
        <Skeleton variant="text" width="75%" {...props} />
      </div>
      
      {/* Actions */}
      <div className="flex space-x-2">
        <Skeleton variant="rounded" width={80} height={32} {...props} />
        <Skeleton variant="rounded" width={60} height={32} {...props} />
      </div>
    </div>
  );
}

/**
 * Table Loading Skeleton
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className,
  showHeader = true,
  ...props 
}: SkeletonProps & { rows?: number; columns?: number; showHeader?: boolean }) {
  return (
    <div className={cn('space-y-4', className)} aria-label="Loading table content">
      {/* Header */}
      {showHeader && (
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              variant="text"
              width={`${100 / columns}%`}
              height={20}
              {...props}
            />
          ))}
        </div>
      )}
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              width={`${100 / columns}%`}
              height={16}
              {...props}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Progress Indicator Component
 */
export function ProgressIndicator({
  value = 0,
  size = 'md',
  variant = 'linear',
  color = 'primary',
  showPercentage = false,
  label,
  className,
  indeterminate = false,
  ...props
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const colorClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  const circularSizes = {
    sm: { size: 20, stroke: 2 },
    md: { size: 32, stroke: 3 },
    lg: { size: 48, stroke: 4 }
  };
  
  if (variant === 'circular') {
    const { size: circularSize, stroke } = circularSizes[size];
    const radius = (circularSize - stroke * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = indeterminate ? 0 : circumference - (value / 100) * circumference;
    
    return (
      <div 
        className={cn('inline-flex items-center justify-center', className)}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={label || `Progress: ${value}%`}
      >
        <svg
          width={circularSize}
          height={circularSize}
          className={indeterminate ? 'animate-spin' : ''}
        >
          {/* Background circle */}
          <circle
            cx={circularSize / 2}
            cy={circularSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx={circularSize / 2}
            cy={circularSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              colorClasses[color],
              'transition-all duration-300 ease-out'
            )}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        
        {showPercentage && !indeterminate && (
          <span className="absolute text-xs font-medium">
            {Math.round(value)}%
          </span>
        )}
      </div>
    );
  }
  
  if (variant === 'spinner') {
    const spinnerSizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };
    
    return (
      <div 
        className={cn('inline-flex items-center space-x-2', className)}
        role="progressbar"
        aria-label={label || 'Loading'}
      >
        <Loader2 
          className={cn(
            spinnerSizes[size],
            colorClasses[color],
            'animate-spin'
          )}
          aria-hidden="true"
        />
        {label && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </span>
        )}
      </div>
    );
  }
  
  // Linear progress bar
  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
      
      <div 
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={label || `Progress: ${value}%`}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color],
            indeterminate && 'animate-pulse'
          )}
          style={{
            width: indeterminate ? '100%' : `${Math.min(100, Math.max(0, value))}%`
          }}
        />
      </div>
    </div>
  );
}

/**
 * Loading Overlay Component
 */
export function LoadingOverlay({
  isLoading,
  children,
  message = 'Loading...',
  spinner = true,
  backdrop = true,
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center z-10',
            backdrop && 'bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm'
          )}
          role="progressbar"
          aria-live="polite"
          aria-label={message}
        >
          <div className="flex flex-col items-center space-y-3">
            {spinner && (
              <ProgressIndicator
                variant="spinner"
                size="lg"
                color="primary"
              />
            )}
            
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Form Loading Skeleton
 */
export function FormSkeleton({ 
  fields = 4, 
  showSubmitButton = true, 
  className,
  ...props 
}: SkeletonProps & { fields?: number; showSubmitButton?: boolean }) {
  return (
    <div className={cn('space-y-6', className)} aria-label="Loading form">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <Skeleton variant="text" width="25%" height={16} {...props} />
          
          {/* Input */}
          <Skeleton variant="rounded" height={40} {...props} />
          
          {/* Helper text (occasional) */}
          {index % 3 === 0 && (
            <Skeleton variant="text" width="40%" height={14} {...props} />
          )}
        </div>
      ))}
      
      {/* Submit button */}
      {showSubmitButton && (
        <div className="pt-4">
          <Skeleton variant="rounded" width={120} height={40} {...props} />
        </div>
      )}
    </div>
  );
}