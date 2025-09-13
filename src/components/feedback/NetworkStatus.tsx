/**
 * Network Status Detection and Offline Messaging for Troy BBQ
 * Based on WCAG 2.2 accessibility guidelines and modern UX patterns
 */

import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { notifications, networkNotifications } from '../../lib/notifications';

// Network status types
export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  lastChecked: Date;
}

// Network status indicator props
interface NetworkStatusIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showWhenOnline?: boolean;
  className?: string;
}

// Offline banner props
interface OfflineBannerProps {
  isVisible: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  message?: string;
  showRetryButton?: boolean;
  className?: string;
}

// Sync status props
interface SyncStatusProps {
  isOnline: boolean;
  hasPendingChanges: boolean;
  isSyncing: boolean;
  onSync?: () => void;
  className?: string;
}

/**
 * Network Status Manager - Singleton for managing network state
 */
class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private status: NetworkStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: new Date()
  };
  private checkInterval: NodeJS.Timeout | null = null;
  private offlineNotificationId: string | null = null;
  
  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startPeriodicCheck();
      this.getNetworkInfo();
    }
  }
  
  static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }
  
  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  private notify(): void {
    this.listeners.forEach(listener => listener(this.status));
  }
  
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Listen for network connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange);
    }
  }
  
  private handleOnline = (): void => {
    const wasOffline = !this.status.isOnline;
    
    this.status = {
      ...this.status,
      isOnline: true,
      lastChecked: new Date()
    };
    
    this.getNetworkInfo();
    this.notify();
    
    if (wasOffline) {
      // Remove offline notification
      if (this.offlineNotificationId) {
        notifications.remove(this.offlineNotificationId);
        this.offlineNotificationId = null;
      }
      
      // Show back online notification
      networkNotifications.online();
    }
  };
  
  private handleOffline = (): void => {
    const wasOnline = this.status.isOnline;
    
    this.status = {
      ...this.status,
      isOnline: false,
      lastChecked: new Date()
    };
    
    this.notify();
    
    if (wasOnline) {
      // Show offline notification
      this.offlineNotificationId = networkNotifications.offline();
    }
  };
  
  private handleConnectionChange = (): void => {
    this.getNetworkInfo();
    
    // Double-check online status with actual network request
    this.checkConnectivity();
  };
  
  private getNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.status = {
        ...this.status,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
  }
  
  private startPeriodicCheck(): void {
    // Check connectivity every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 30000);
  }
  
  private async checkConnectivity(): Promise<boolean> {
    try {
      // Make a lightweight request to check actual connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      } as RequestInit);
      
      const isConnected = response.ok;
      
      if (isConnected !== this.status.isOnline) {
        if (isConnected) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
      
      this.status.lastChecked = new Date();
      return isConnected;
      
    } catch (error) {
      // If request fails, we're likely offline
      if (this.status.isOnline) {
        this.handleOffline();
      }
      return false;
    }
  }
  
  getStatus(): NetworkStatus {
    return { ...this.status };
  }
  
  async forceCheck(): Promise<boolean> {
    return await this.checkConnectivity();
  }
  
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', this.handleConnectionChange);
      }
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

/**
 * Network Status Indicator Component
 */
export function NetworkStatusIndicator({
  position = 'top-right',
  showWhenOnline = false,
  className
}: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    lastChecked: new Date()
  });
  
  useEffect(() => {
    const manager = NetworkStatusManager.getInstance();
    const unsubscribe = manager.subscribe(setStatus);
    return unsubscribe;
  }, []);
  
  // Don't show indicator when online (unless explicitly requested)
  if (status.isOnline && !showWhenOnline) {
    return null;
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  return (
    <div
      className={cn(
        'fixed z-40 flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg',
        status.isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200',
        positionClasses[position],
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={status.isOnline ? 'Connected to internet' : 'No internet connection'}
    >
      {status.isOnline ? (
        <Wifi className="w-4 h-4" aria-hidden="true" />
      ) : (
        <WifiOff className="w-4 h-4" aria-hidden="true" />
      )}
      
      <span className="text-sm font-medium">
        {status.isOnline ? 'Online' : 'Offline'}
      </span>
      
      {/* Connection quality indicator */}
      {status.isOnline && status.effectiveType && (
        <span className="text-xs opacity-75">
          ({status.effectiveType})
        </span>
      )}
    </div>
  );
}

/**
 * Offline Banner Component
 */
export function OfflineBanner({
  isVisible,
  onRetry,
  onDismiss,
  message = "You're currently offline. Some features may not be available.",
  showRetryButton = true,
  className
}: OfflineBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-yellow-50 border-b border-yellow-200',
        'transition-all duration-300 ease-in-out',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm text-yellow-800 font-medium">
          {message}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        {showRetryButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
          >
            <RefreshCw 
              className={cn(
                'w-4 h-4 mr-1',
                isRetrying && 'animate-spin'
              )} 
              aria-hidden="true"
            />
            {isRetrying ? 'Checking...' : 'Retry'}
          </Button>
        )}
        
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-yellow-800 hover:bg-yellow-100"
            aria-label="Dismiss offline notification"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Sync Status Component
 */
export function SyncStatus({
  isOnline,
  hasPendingChanges,
  isSyncing,
  onSync,
  className
}: SyncStatusProps) {
  if (!hasPendingChanges && !isSyncing) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg',
        isOnline
          ? isSyncing 
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-800',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={
        isSyncing 
          ? 'Syncing changes' 
          : hasPendingChanges 
            ? 'Changes pending sync'
            : 'All changes synced'
      }
    >
      {isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Syncing...</span>
        </>
      ) : hasPendingChanges ? (
        <>
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">
            {isOnline ? 'Changes pending' : 'Will sync when online'}
          </span>
          {isOnline && onSync && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSync}
              className="ml-2"
            >
              Sync Now
            </Button>
          )}
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">All changes synced</span>
        </>
      )}
    </div>
  );
}

/**
 * Custom hook for network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: new Date()
  });
  
  useEffect(() => {
    const manager = NetworkStatusManager.getInstance();
    const unsubscribe = manager.subscribe(setStatus);
    return unsubscribe;
  }, []);
  
  const forceCheck = async () => {
    const manager = NetworkStatusManager.getInstance();
    return await manager.forceCheck();
  };
  
  return {
    ...status,
    forceCheck
  };
}

/**
 * Custom hook for offline-first data management
 */
export function useOfflineFirst<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    maxAge?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const { isOnline } = useNetworkStatus();
  
  const staleTime = options?.staleTime || 5 * 60 * 1000; // 5 minutes
  const maxAge = options?.maxAge || 24 * 60 * 60 * 1000; // 24 hours
  
  // Load data from cache
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(`offline_cache_${key}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          
          if (age < maxAge) {
            setData(parsed.data);
            setIsStale(age > staleTime);
          } else {
            localStorage.removeItem(`offline_cache_${key}`);
          }
        }
      } catch (error) {
        console.warn('Failed to load from cache:', error);
      }
    };
    
    loadFromCache();
  }, [key, staleTime, maxAge]);
  
  // Fetch fresh data when online
  const fetchData = async (force = false) => {
    if (!isOnline && !force) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
      setIsStale(false);
      
      // Cache the result
      try {
        localStorage.setItem(`offline_cache_${key}`, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to cache data:', error);
      }
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-fetch when online and data is stale
  useEffect(() => {
    if (isOnline && (isStale || data === null)) {
      fetchData();
    }
  }, [isOnline, isStale, data]);
  
  return {
    data,
    isLoading,
    error,
    isStale,
    isOnline,
    refetch: () => fetchData(true)
  };
}