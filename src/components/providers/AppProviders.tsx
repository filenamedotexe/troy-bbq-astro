import React, { useEffect, type ReactNode } from 'react';
import { CartProvider } from '../../contexts/CartContext';
import { PerformanceProvider } from '../performance/PerformanceProvider';
import PerformanceMonitor from '../performance/PerformanceMonitor';
import ServiceWorkerRegistration, { OfflineIndicator } from '../performance/ServiceWorkerRegistration';
import { ViewportTester } from '../performance/MobileOptimizer';
import { preloadCriticalComponents } from '../performance/LazyLoader';

interface AppProvidersProps {
  children: ReactNode;
  enablePerformanceMonitoring?: boolean;
  enableServiceWorker?: boolean;
  showViewportTester?: boolean;
}

export default function AppProviders({
  children,
  enablePerformanceMonitoring = true,
  enableServiceWorker = true,
  showViewportTester = false
}: AppProvidersProps) {
  useEffect(() => {
    // Preload critical components after initial render
    preloadCriticalComponents();
  }, []);

  return (
    <PerformanceProvider enableOptimizations={enablePerformanceMonitoring}>
      <CartProvider>
        {children}

        {/* Performance monitoring in development */}
        {enablePerformanceMonitoring && (
          <PerformanceMonitor
            enabled={true}
            reportUrl="/api/performance"
            showDebugInfo={process.env.NODE_ENV === 'development'}
            onMetricChange={(metric) => {
              // Log metrics in development
              if (process.env.NODE_ENV === 'development') {
                console.log(`📊 ${metric.name}: ${metric.value}ms (${metric.rating})`);
              }
            }}
          />
        )}

        {/* Service Worker registration */}
        {enableServiceWorker && (
          <ServiceWorkerRegistration
            onUpdate={() => {
              console.log('🔄 Service Worker updated');
            }}
            onDismiss={() => {
              console.log('⏭️ Service Worker update dismissed');
            }}
          />
        )}

        {/* Offline indicator */}
        <OfflineIndicator />

        {/* Development viewport tester */}
        {showViewportTester && (
          <ViewportTester
            show={process.env.NODE_ENV === 'development'}
            onDeviceChange={(device) => {
              console.log('📱 Device changed:', device);
            }}
          />
        )}
      </CartProvider>
    </PerformanceProvider>
  );
}