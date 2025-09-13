import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isWaiting: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isWaiting: false,
    hasUpdate: false,
    registration: null
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'imports'
        });

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          setState(prev => ({ ...prev, hasUpdate: true }));

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, isWaiting: true }));
            }
          });
        });

        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        // Check for waiting worker
        if (registration.waiting) {
          setState(prev => ({ ...prev, isWaiting: true, hasUpdate: true }));
        }

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  const updateServiceWorker = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const unregister = async () => {
    if (state.registration) {
      await state.registration.unregister();
      setState(prev => ({
        ...prev,
        isRegistered: false,
        registration: null
      }));
    }
  };

  return {
    ...state,
    updateServiceWorker,
    unregister
  };
}

interface ServiceWorkerToastProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export default function ServiceWorkerRegistration({ onUpdate, onDismiss }: ServiceWorkerToastProps = {}) {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const { isWaiting, hasUpdate, updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    if (isWaiting && hasUpdate) {
      setShowUpdatePrompt(true);
    }
  }, [isWaiting, hasUpdate]);

  const handleUpdate = () => {
    updateServiceWorker();
    setShowUpdatePrompt(false);
    onUpdate?.();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    onDismiss?.();
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            App Update Available
          </h4>
          <p className="text-sm text-gray-500">
            A new version of Troy BBQ is ready with performance improvements.
          </p>
        </div>
      </div>

      <div className="mt-3 flex space-x-3">
        <button
          onClick={handleUpdate}
          className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Update Now
        </button>
        <button
          onClick={handleDismiss}
          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

// Hook for offline detection
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Offline status indicator
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  );
}