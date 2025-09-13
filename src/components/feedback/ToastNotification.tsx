/**
 * Toast Notification Component for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern UX patterns
 */

import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { 
  Notification, 
  NotificationType, 
  NotificationPosition,
  NotificationManager 
} from '../../lib/notifications';

// Toast notification props
interface ToastNotificationProps {
  notification: Notification;
  position: NotificationPosition;
  onDismiss: (id: string) => void;
  pauseOnHover?: boolean;
  reducedMotion?: boolean;
}

// Toast container props
interface ToastContainerProps {
  position?: NotificationPosition;
  maxNotifications?: number;
  pauseOnHover?: boolean;
  className?: string;
}

/**
 * Individual Toast Notification Component
 */
export function ToastNotification({
  notification,
  position,
  onDismiss,
  pauseOnHover = true,
  reducedMotion = false
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(notification.duration || 0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  // Icon mapping for different notification types
  const icons = {
    [NotificationType.SUCCESS]: CheckCircle,
    [NotificationType.ERROR]: AlertCircle,
    [NotificationType.WARNING]: AlertTriangle,
    [NotificationType.INFO]: Info,
    [NotificationType.LOADING]: Loader2
  };
  
  // Color mapping for different notification types
  const colorClasses = {
    [NotificationType.SUCCESS]: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-500',
      title: 'text-green-800',
      message: 'text-green-700',
      button: 'text-green-800 hover:text-green-900'
    },
    [NotificationType.ERROR]: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'text-red-800 hover:text-red-900'
    },
    [NotificationType.WARNING]: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'text-yellow-800 hover:text-yellow-900'
    },
    [NotificationType.INFO]: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'text-blue-800 hover:text-blue-900'
    },
    [NotificationType.LOADING]: {
      container: 'bg-gray-50 border-gray-200',
      icon: 'text-gray-500',
      title: 'text-gray-800',
      message: 'text-gray-700',
      button: 'text-gray-800 hover:text-gray-900'
    }
  };
  
  const Icon = icons[notification.type];
  const colors = colorClasses[notification.type];
  
  // Auto-dismiss logic
  useEffect(() => {
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      const startTimer = () => {
        const remainingTime = Math.max(0, timeRemaining);
        if (remainingTime > 0) {
          timerRef.current = setTimeout(() => {
            onDismiss(notification.id);
          }, remainingTime);
        }
      };
      
      if (!isPaused) {
        startTimer();
      }
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [notification, timeRemaining, isPaused, onDismiss]);
  
  // Update time remaining when paused/unpaused
  useEffect(() => {
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      if (isPaused && timerRef.current) {
        clearTimeout(timerRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        setTimeRemaining(Math.max(0, (notification.duration || 0) - elapsed));
      } else if (!isPaused) {
        startTimeRef.current = Date.now();
      }
    }
  }, [isPaused, notification]);
  
  // Show animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Handle mouse events for pause on hover
  const handleMouseEnter = () => {
    if (pauseOnHover && !notification.persistent) {
      setIsPaused(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (pauseOnHover && !notification.persistent) {
      setIsPaused(false);
    }
  };
  
  // Handle dismiss with animation
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), reducedMotion ? 0 : 150);
  };
  
  // Handle action button click
  const handleActionClick = () => {
    if (notification.action) {
      notification.action.handler();
      handleDismiss();
    }
  };
  
  // Position-based transform classes
  const transformClasses = {
    [NotificationPosition.TOP_RIGHT]: isVisible ? 'translate-x-0' : 'translate-x-full',
    [NotificationPosition.TOP_LEFT]: isVisible ? 'translate-x-0' : '-translate-x-full',
    [NotificationPosition.TOP_CENTER]: isVisible ? 'translate-y-0' : '-translate-y-full',
    [NotificationPosition.BOTTOM_RIGHT]: isVisible ? 'translate-x-0' : 'translate-x-full',
    [NotificationPosition.BOTTOM_LEFT]: isVisible ? 'translate-x-0' : '-translate-x-full',
    [NotificationPosition.BOTTOM_CENTER]: isVisible ? 'translate-y-0' : 'translate-y-full'
  };
  
  return (
    <div
      role="alert"
      aria-live={notification.type === NotificationType.ERROR ? 'assertive' : 'polite'}
      aria-labelledby={`toast-title-${notification.id}`}
      aria-describedby={`toast-message-${notification.id}`}
      className={cn(
        'relative flex items-start p-4 mb-3 border rounded-lg shadow-lg max-w-sm w-full',
        'transition-all duration-300 ease-out',
        reducedMotion ? '' : transformClasses[position],
        colors.container,
        'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration && notification.duration > 0 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all duration-100 ease-linear"
          style={{ 
            width: `${isPaused ? (timeRemaining / notification.duration) * 100 : 0}%`,
            transitionDuration: isPaused ? '0ms' : `${timeRemaining}ms`
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon 
          className={cn(
            'w-5 h-5',
            colors.icon,
            notification.type === NotificationType.LOADING && 'animate-spin'
          )}
          aria-hidden="true"
        />
      </div>
      
      {/* Content */}
      <div className="ml-3 flex-1 min-w-0">
        <h4 
          id={`toast-title-${notification.id}`}
          className={cn('text-sm font-medium', colors.title)}
        >
          {notification.title}
        </h4>
        
        <p 
          id={`toast-message-${notification.id}`}
          className={cn('mt-1 text-sm', colors.message)}
        >
          {notification.message}
        </p>
        
        {/* Action button */}
        {notification.action && (
          <div className="mt-3">
            <Button
              size="sm"
              variant={notification.action.style === 'danger' ? 'destructive' : 'outline'}
              onClick={handleActionClick}
              className="text-xs"
              aria-label={notification.action.ariaLabel || notification.action.label}
            >
              {notification.action.label}
            </Button>
          </div>
        )}
      </div>
      
      {/* Close button */}
      <div className="ml-4 flex-shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            colors.button
          )}
          aria-label={`Dismiss ${notification.type} notification: ${notification.title}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast Container Component
 */
export function ToastContainer({
  position = NotificationPosition.TOP_RIGHT,
  maxNotifications = 5,
  pauseOnHover = true,
  className
}: ToastContainerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [config, setConfig] = useState({ reducedMotion: false });
  
  // Subscribe to notification manager
  useEffect(() => {
    const manager = NotificationManager.getInstance();
    
    // Configure the manager
    manager.configure({ maxNotifications, position, pauseOnHover });
    
    // Get initial config
    setConfig(manager.getConfiguration());
    
    // Subscribe to notifications
    const unsubscribe = manager.subscribe((newNotifications) => {
      setNotifications(newNotifications.slice(0, maxNotifications));
    });
    
    return unsubscribe;
  }, [maxNotifications, position, pauseOnHover]);
  
  // Handle dismiss
  const handleDismiss = (id: string) => {
    NotificationManager.getInstance().remove(id);
  };
  
  if (notifications.length === 0) {
    return null;
  }
  
  // Position-based container classes
  const positionClasses = {
    [NotificationPosition.TOP_RIGHT]: 'top-4 right-4',
    [NotificationPosition.TOP_LEFT]: 'top-4 left-4',
    [NotificationPosition.TOP_CENTER]: 'top-4 left-1/2 transform -translate-x-1/2',
    [NotificationPosition.BOTTOM_RIGHT]: 'bottom-4 right-4',
    [NotificationPosition.BOTTOM_LEFT]: 'bottom-4 left-4',
    [NotificationPosition.BOTTOM_CENTER]: 'bottom-4 left-1/2 transform -translate-x-1/2'
  };
  
  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position],
        className
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col space-y-2 pointer-events-auto">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            position={position}
            onDismiss={handleDismiss}
            pauseOnHover={pauseOnHover}
            reducedMotion={config.reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}