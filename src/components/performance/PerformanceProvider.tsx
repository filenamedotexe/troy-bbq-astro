import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Metric } from 'web-vitals';

interface PerformanceContextType {
  metrics: Record<string, number>;
  isSlowConnection: boolean;
  memoryPressure: 'low' | 'medium' | 'high';
  shouldOptimizeImages: boolean;
  shouldReduceAnimations: boolean;
  reportMetric: (metric: Metric) => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

interface PerformanceProviderProps {
  children: ReactNode;
  enableOptimizations?: boolean;
}

export function PerformanceProvider({ children, enableOptimizations = true }: PerformanceProviderProps) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [memoryPressure, setMemoryPressure] = useState<'low' | 'medium' | 'high'>('low');

  // Detect slow connections
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const checkConnection = () => {
        const slow = connection?.effectiveType === 'slow-2g' ||
                    connection?.effectiveType === '2g' ||
                    connection?.downlink < 1.5;
        setIsSlowConnection(slow);
      };

      checkConnection();
      connection?.addEventListener('change', checkConnection);

      return () => connection?.removeEventListener('change', checkConnection);
    }
  }, []);

  // Monitor memory pressure
  useEffect(() => {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usageRatio > 0.8) {
        setMemoryPressure('high');
      } else if (usageRatio > 0.6) {
        setMemoryPressure('medium');
      } else {
        setMemoryPressure('low');
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 10000);
    return () => clearInterval(interval);
  }, []);

  const reportMetric = (metric: Metric) => {
    setMetrics(prev => ({
      ...prev,
      [metric.name]: metric.value
    }));
  };

  const shouldOptimizeImages = enableOptimizations && (isSlowConnection || memoryPressure === 'high');
  const shouldReduceAnimations = enableOptimizations && (isSlowConnection || memoryPressure === 'high');

  const value: PerformanceContextType = {
    metrics,
    isSlowConnection,
    memoryPressure,
    shouldOptimizeImages,
    shouldReduceAnimations,
    reportMetric
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// Adaptive loading hook
export function useAdaptiveLoading() {
  const { isSlowConnection, memoryPressure } = usePerformance();

  return {
    // Image quality adjustments
    imageQuality: isSlowConnection ? 70 : memoryPressure === 'high' ? 80 : 90,

    // Lazy loading distance
    lazyThreshold: isSlowConnection ? '50px' : '200px',

    // Preload strategy
    shouldPreload: !isSlowConnection && memoryPressure === 'low',

    // Animation preferences
    reduceMotion: isSlowConnection || memoryPressure === 'high',

    // Chunk size for data loading
    pageSize: isSlowConnection ? 5 : memoryPressure === 'high' ? 10 : 20
  };
}

// Performance-aware image component
export function useOptimizedImages() {
  const { shouldOptimizeImages } = usePerformance();

  return {
    format: shouldOptimizeImages ? 'webp' : 'auto',
    quality: shouldOptimizeImages ? 70 : 90,
    sizes: shouldOptimizeImages ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 800px'
  };
}