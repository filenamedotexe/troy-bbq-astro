/**
 * Comprehensive Notification System for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern UX patterns
 */

import { AppError, ErrorType } from './errorHandling';

// Notification types and interfaces
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: NotificationAction;
  timestamp: Date;
  read?: boolean;
  ariaLabel?: string;
  context?: Record<string, unknown>;
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  style?: 'primary' | 'secondary' | 'danger';
  ariaLabel?: string;
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  LOADING = 'loading'
}

export enum NotificationPosition {
  TOP_RIGHT = 'top-right',
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center'
}

// Default durations for different notification types (in milliseconds)
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  [NotificationType.SUCCESS]: 5000,
  [NotificationType.ERROR]: 8000,
  [NotificationType.WARNING]: 7000,
  [NotificationType.INFO]: 6000,
  [NotificationType.LOADING]: 0 // Persistent until manually dismissed
};

// ARIA live region configurations
const ARIA_LIVE_REGIONS: Record<NotificationType, 'polite' | 'assertive'> = {
  [NotificationType.SUCCESS]: 'polite',
  [NotificationType.ERROR]: 'assertive',
  [NotificationType.WARNING]: 'assertive',
  [NotificationType.INFO]: 'polite',
  [NotificationType.LOADING]: 'polite'
};

/**
 * Notification Manager - Singleton class for managing all notifications
 */
export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Map<string, Notification> = new Map();
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private maxNotifications: number = 5;
  private position: NotificationPosition = NotificationPosition.TOP_RIGHT;
  private pauseOnHover: boolean = true;
  private reducedMotion: boolean = false;
  
  private constructor() {
    // Check for reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for changes in motion preferences
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });
  }
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    
    // Send current notifications immediately
    listener(Array.from(this.notifications.values()));
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Notify all listeners of changes
   */
  private notify(): void {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    this.listeners.forEach(listener => listener(notifications));
  }
  
  /**
   * Add a new notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    
    const newNotification: Notification = {
      id,
      timestamp,
      duration: notification.duration ?? DEFAULT_DURATIONS[notification.type],
      ariaLabel: notification.ariaLabel || `${notification.type} notification: ${notification.title}`,
      ...notification
    };
    
    // Remove oldest notification if we exceed the maximum
    if (this.notifications.size >= this.maxNotifications) {
      const oldest = Array.from(this.notifications.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      
      if (oldest && !oldest.persistent) {
        this.remove(oldest.id);
      }
    }
    
    this.notifications.set(id, newNotification);
    this.notify();
    
    // Auto-remove notification after duration (if not persistent and duration > 0)
    if (!newNotification.persistent && newNotification.duration! > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }
    
    // Announce to screen readers
    this.announceToScreenReader(newNotification);
    
    return id;
  }
  
  /**
   * Remove a notification by ID
   */
  remove(id: string): void {
    if (this.notifications.has(id)) {
      this.notifications.delete(id);
      this.notify();
    }
  }
  
  /**
   * Remove all notifications
   */
  clear(): void {
    this.notifications.clear();
    this.notify();
  }
  
  /**
   * Remove all notifications of a specific type
   */
  clearByType(type: NotificationType): void {
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.type === type) {
        this.notifications.delete(id);
      }
    }
    this.notify();
  }
  
  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get a specific notification by ID
   */
  get(id: string): Notification | undefined {
    return this.notifications.get(id);
  }
  
  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notify();
    }
  }
  
  /**
   * Update notification settings
   */
  configure(settings: {
    maxNotifications?: number;
    position?: NotificationPosition;
    pauseOnHover?: boolean;
  }): void {
    if (settings.maxNotifications !== undefined) {
      this.maxNotifications = settings.maxNotifications;
    }
    if (settings.position !== undefined) {
      this.position = settings.position;
    }
    if (settings.pauseOnHover !== undefined) {
      this.pauseOnHover = settings.pauseOnHover;
    }
  }
  
  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      maxNotifications: this.maxNotifications,
      position: this.position,
      pauseOnHover: this.pauseOnHover,
      reducedMotion: this.reducedMotion
    };
  }
  
  /**
   * Announce notification to screen readers
   */
  private announceToScreenReader(notification: Notification): void {
    const liveRegion = document.getElementById('notification-live-region') ||
      this.createLiveRegion();
    
    if (liveRegion) {
      const ariaLive = ARIA_LIVE_REGIONS[notification.type];
      liveRegion.setAttribute('aria-live', ariaLive);
      
      // Clear and set new content
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = `${notification.title}. ${notification.message}`;
      }, 100);
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 2000);
    }
  }
  
  /**
   * Create ARIA live region for screen reader announcements
   */
  private createLiveRegion(): HTMLElement {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'notification-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    return liveRegion;
  }
}

/**
 * Convenience functions for common notification types
 */
export const notifications = {
  /**
   * Show success notification
   */
  success(title: string, message: string, options?: Partial<Notification>): string {
    return NotificationManager.getInstance().add({
      type: NotificationType.SUCCESS,
      title,
      message,
      ...options
    });
  },
  
  /**
   * Show error notification
   */
  error(title: string, message: string, options?: Partial<Notification>): string {
    return NotificationManager.getInstance().add({
      type: NotificationType.ERROR,
      title,
      message,
      persistent: options?.persistent ?? true, // Errors are persistent by default
      ...options
    });
  },
  
  /**
   * Show warning notification
   */
  warning(title: string, message: string, options?: Partial<Notification>): string {
    return NotificationManager.getInstance().add({
      type: NotificationType.WARNING,
      title,
      message,
      ...options
    });
  },
  
  /**
   * Show info notification
   */
  info(title: string, message: string, options?: Partial<Notification>): string {
    return NotificationManager.getInstance().add({
      type: NotificationType.INFO,
      title,
      message,
      ...options
    });
  },
  
  /**
   * Show loading notification
   */
  loading(title: string, message: string, options?: Partial<Notification>): string {
    return NotificationManager.getInstance().add({
      type: NotificationType.LOADING,
      title,
      message,
      persistent: true,
      ...options
    });
  },
  
  /**
   * Show error from AppError object
   */
  fromError(error: AppError, customTitle?: string): string {
    const errorTypeMessages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Connection Error',
      [ErrorType.VALIDATION]: 'Validation Error',
      [ErrorType.AUTHENTICATION]: 'Authentication Error',
      [ErrorType.AUTHORIZATION]: 'Access Denied',
      [ErrorType.NOT_FOUND]: 'Not Found',
      [ErrorType.SERVER]: 'Server Error',
      [ErrorType.CLIENT]: 'Application Error',
      [ErrorType.PAYMENT]: 'Payment Error',
      [ErrorType.DATABASE]: 'Data Error',
      [ErrorType.EXTERNAL_API]: 'Service Error',
      [ErrorType.UNKNOWN]: 'Unknown Error'
    };
    
    const title = customTitle || errorTypeMessages[error.type];
    
    const retryAction: NotificationAction | undefined = error.retry ? {
      label: 'Try Again',
      handler: () => {
        // This would be handled by the component that shows the notification
        console.log('Retry requested for error:', error.id);
      },
      style: 'primary' as const,
      ariaLabel: 'Retry the failed operation'
    } : undefined;
    
    return this.error(title, error.message, {
      action: retryAction,
      context: { errorId: error.id, errorType: error.type }
    });
  },
  
  /**
   * Remove a notification
   */
  remove(id: string): void {
    NotificationManager.getInstance().remove(id);
  },
  
  /**
   * Clear all notifications
   */
  clear(): void {
    NotificationManager.getInstance().clear();
  },
  
  /**
   * Clear notifications by type
   */
  clearByType(type: NotificationType): void {
    NotificationManager.getInstance().clearByType(type);
  }
};

/**
 * Form-specific notification helpers
 */
export const formNotifications = {
  /**
   * Show validation error notification
   */
  validationError(fieldName: string, message: string): string {
    return notifications.error(
      'Form Validation Error',
      `${fieldName}: ${message}`,
      {
        duration: 8000,
        ariaLabel: `Validation error for ${fieldName}: ${message}`
      }
    );
  },
  
  /**
   * Show form submission success
   */
  submitSuccess(formName: string, customMessage?: string): string {
    const message = customMessage || `${formName} submitted successfully!`;
    return notifications.success('Success', message);
  },
  
  /**
   * Show form save success
   */
  saveSuccess(itemName: string): string {
    return notifications.success('Saved', `${itemName} has been saved successfully.`);
  },
  
  /**
   * Show form deletion confirmation
   */
  deleteConfirmation(itemName: string, onConfirm: () => void): string {
    return notifications.warning(
      'Confirm Deletion',
      `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      {
        persistent: true,
        action: {
          label: 'Delete',
          handler: onConfirm,
          style: 'danger',
          ariaLabel: `Confirm deletion of ${itemName}`
        }
      }
    );
  }
};

/**
 * Network-specific notification helpers
 */
export const networkNotifications = {
  /**
   * Show offline notification
   */
  offline(): string {
    return notifications.warning(
      'You\'re Offline',
      'Some features may not be available. We\'ll sync your changes when you\'re back online.',
      {
        persistent: true,
        context: { type: 'offline' }
      }
    );
  },
  
  /**
   * Show back online notification
   */
  online(): string {
    // Remove offline notifications first
    const manager = NotificationManager.getInstance();
    const offlineNotifications = manager.getAll().filter(
      n => n.context?.type === 'offline'
    );
    
    offlineNotifications.forEach(n => manager.remove(n.id));
    
    return notifications.success(
      'You\'re Back Online',
      'All features are now available. Syncing any pending changes.',
      {
        duration: 3000
      }
    );
  },
  
  /**
   * Show sync in progress
   */
  syncing(): string {
    return notifications.loading(
      'Syncing',
      'Synchronizing your changes with the server...',
      {
        context: { type: 'sync' }
      }
    );
  },
  
  /**
   * Show sync complete
   */
  syncComplete(): string {
    // Remove syncing notifications first
    const manager = NotificationManager.getInstance();
    const syncNotifications = manager.getAll().filter(
      n => n.context?.type === 'sync'
    );
    
    syncNotifications.forEach(n => manager.remove(n.id));
    
    return notifications.success(
      'Sync Complete',
      'All changes have been synchronized.',
      {
        duration: 2000
      }
    );
  }
};