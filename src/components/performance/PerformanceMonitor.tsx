import { useEffect, useRef, useState } from 'react';

interface Metric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceMetrics {
  cls: number | null;
  fcp: number | null;
  fid: number | null;
  lcp: number | null;
  ttfb: number | null;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  reportUrl?: string;
  onMetricChange?: (metric: Metric) => void;
  showDebugInfo?: boolean;
}

const THRESHOLDS = {
  LCP: { good: 2500, needs_improvement: 4000 },
  FID: { good: 100, needs_improvement: 300 },
  CLS: { good: 0.1, needs_improvement: 0.25 },
  FCP: { good: 1800, needs_improvement: 3000 },
  TTFB: { good: 800, needs_improvement: 1800 }
};

function getPerformanceRating(value: number, thresholds: { good: number; needs_improvement: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needs_improvement) return 'needs-improvement';
  return 'poor';
}

export default function PerformanceMonitor({
  enabled = true,
  reportUrl,
  onMetricChange,
  showDebugInfo = false
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    fcp: null,
    fid: null,
    lcp: null,
    ttfb: null
  });

  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({});

  const reportedMetrics = useRef(new Set<string>());

  // Get network information
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionInfo({
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      });

      const updateConnection = () => {
        setConnectionInfo({
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt
        });
      };

      connection?.addEventListener('change', updateConnection);
      return () => connection?.removeEventListener('change', updateConnection);
    }
  }, []);

  // Core Web Vitals collection
  useEffect(() => {
    if (!enabled) return;

    const handleMetric = (metric: Metric) => {
      // Avoid duplicate reporting
      const key = `${metric.name}-${metric.id}`;
      if (reportedMetrics.current.has(key)) return;
      reportedMetrics.current.add(key);

      // Update local state
      setMetrics(prev => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value
      }));

      // Call external handler
      onMetricChange?.(metric);

      // Report to analytics endpoint
      if (reportUrl) {
        const payload = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          url: window.location.href,
          userAgent: navigator.userAgent,
          connection: connectionInfo,
          timestamp: Date.now()
        };

        // Send to analytics (non-blocking)
        navigator.sendBeacon?.(reportUrl, JSON.stringify(payload)) ||
        fetch(reportUrl, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {}); // Silently fail
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development' || showDebugInfo) {
        const rating = getPerformanceRating(
          metric.value,
          THRESHOLDS[metric.name as keyof typeof THRESHOLDS]
        );

        console.group(`🔥 ${metric.name} Performance`);
        console.log(`Value: ${metric.value}ms`);
        console.log(`Rating: ${rating} (${metric.rating})`);
        console.log(`Delta: ${metric.delta}ms`);
        console.log(`Navigation: ${metric.navigationType}`);
        if (connectionInfo.effectiveType) {
          console.log(`Connection: ${connectionInfo.effectiveType} (${connectionInfo.downlink}Mbps, ${connectionInfo.rtt}ms RTT)`);
        }
        console.groupEnd();
      }
    };

    // Initialize Web Vitals monitoring with dynamic imports
    const initWebVitals = async () => {
      try {
        const { getCLS, getFCP, getFID, getLCP, getTTFB } = await import('web-vitals');

        getCLS(handleMetric);
        getFCP(handleMetric);
        getFID(handleMetric);
        getLCP(handleMetric);
        getTTFB(handleMetric);
      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    initWebVitals();

  }, [enabled, reportUrl, onMetricChange, connectionInfo, showDebugInfo]);

  // Performance observer for additional metrics
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitor long tasks (> 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Monitor layout shifts beyond CLS
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.value > 0.1) {
              console.warn(`📐 Large layout shift: ${entry.value.toFixed(4)}`);
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

        return () => {
          longTaskObserver.disconnect();
          layoutShiftObserver.disconnect();
        };
      } catch (e) {
        console.warn('Performance monitoring not fully supported');
      }
    }
  }, [enabled]);

  // Memory monitoring
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize / 1048576; // MB
        const total = memory.totalJSHeapSize / 1048576; // MB
        const limit = memory.jsHeapSizeLimit / 1048576; // MB

        if (used / limit > 0.9) {
          console.warn(`🧠 High memory usage: ${used.toFixed(1)}MB / ${limit.toFixed(1)}MB`);
        }

        if (showDebugInfo) {
          console.log(`Memory: ${used.toFixed(1)}MB used, ${total.toFixed(1)}MB total, ${limit.toFixed(1)}MB limit`);
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [enabled, showDebugInfo]);

  // Don't render anything in production unless debug mode is enabled
  if (!showDebugInfo && process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!showDebugInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Performance Metrics</div>

      {Object.entries(metrics).map(([key, value]) => {
        if (value === null) return null;

        const threshold = THRESHOLDS[key.toUpperCase() as keyof typeof THRESHOLDS];
        const rating = threshold ? getPerformanceRating(value, threshold) : 'unknown';
        const color = rating === 'good' ? 'text-green-400' :
                     rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400';

        return (
          <div key={key} className="flex justify-between items-center mb-1">
            <span className="uppercase">{key}:</span>
            <span className={color}>
              {key === 'cls' ? value.toFixed(4) : `${Math.round(value)}ms`}
            </span>
          </div>
        );
      })}

      {connectionInfo.effectiveType && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-gray-300">
            {connectionInfo.effectiveType} • {connectionInfo.downlink}Mbps
          </div>
        </div>
      )}
    </div>
  );
}

// Utility hook for component-level performance monitoring
export function usePerformanceMetric(name: string) {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      const duration = end - start;

      if (duration > 16.67) { // > 1 frame at 60fps
        console.warn(`⚡ Component ${name} render took ${duration.toFixed(2)}ms`);
      }
    };
  });
}

// Performance budget checker
export function checkPerformanceBudget() {
  if (typeof window === 'undefined') return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  const budgets = {
    'DOM Content Loaded': { actual: navigation.domContentLoadedEventEnd - navigation.fetchStart, budget: 1500 },
    'Load Complete': { actual: navigation.loadEventEnd - navigation.fetchStart, budget: 3000 },
    'First Byte': { actual: navigation.responseStart - navigation.fetchStart, budget: 800 }
  };

  Object.entries(budgets).forEach(([name, { actual, budget }]) => {
    if (actual > budget) {
      console.warn(`💰 Performance budget exceeded for ${name}: ${actual.toFixed(0)}ms > ${budget}ms`);
    } else {
      console.log(`✅ ${name} within budget: ${actual.toFixed(0)}ms <= ${budget}ms`);
    }
  });
}