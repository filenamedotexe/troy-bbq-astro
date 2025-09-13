import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect } from 'react';
import { usePerformance } from './PerformanceProvider';

// Loading skeleton components
interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({ className = '', lines = 3, width = '100%', height = '1rem' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded"
          style={{
            width: i === lines - 1 ? '75%' : width,
            height
          }}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-md h-10 w-24 ${className}`} />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse border rounded-lg p-4 ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2" />
      <div className="bg-gray-200 rounded h-3 w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="bg-gray-200 rounded h-3 w-full" />
        <div className="bg-gray-200 rounded h-3 w-4/5" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b">
          <div className="flex">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="flex-1 p-3">
                <div className="bg-gray-200 rounded h-4" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b last:border-b-0">
            <div className="flex">
              {Array.from({ length: cols }).map((_, j) => (
                <div key={j} className="flex-1 p-3">
                  <div className="bg-gray-200 rounded h-3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dynamic import utility with performance optimization
interface LazyComponentOptions {
  fallback?: ReactNode;
  preload?: boolean;
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const {
    fallback = <LoadingSkeleton />,
    preload = false,
    timeout = 10000,
    retries = 3,
    onError,
    onLoad
  } = options;

  // Add timeout and retry logic to import function
  const importWithRetry = async (attempt = 1): Promise<{ default: T }> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Import timeout')), timeout);
    });

    try {
      const module = await Promise.race([importFn(), timeoutPromise]);
      onLoad?.();
      return module;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Import failed, retrying (${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return importWithRetry(attempt + 1);
      }

      const finalError = error instanceof Error ? error : new Error('Import failed');
      onError?.(finalError);
      throw finalError;
    }
  };

  const LazyComponent = lazy(importWithRetry);

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    importWithRetry().catch(() => {
      // Silently fail preload attempts
    });
  }

  const WrappedComponent = (props: Parameters<T>[0]) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Add preload method
  WrappedComponent.preload = () => importWithRetry();

  return WrappedComponent;
}

// Performance-aware lazy loading hook
export function useLazyLoading(shouldLoad: boolean = true) {
  const { isSlowConnection, memoryPressure } = usePerformance();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!shouldLoad) return;

    // Delay loading on slow connections or high memory pressure
    const delay = isSlowConnection ? 2000 : memoryPressure === 'high' ? 1000 : 0;

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldLoad, isSlowConnection, memoryPressure]);

  return isLoaded;
}

// Intersection observer lazy loading
export function useIntersectionLazyLoad(threshold = 0.1, rootMargin = '50px') {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, threshold, rootMargin]);

  return [setElement, isIntersecting] as const;
}

// Route-based code splitting helpers
export const AdminComponents = {
  // Settings
  Settings: createLazyComponent(
    () => import('../admin/AdminSettingsWrapper'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={12} /></div>
    }
  ),

  // Quote Management
  QuoteManagement: createLazyComponent(
    () => import('../admin/QuotesManagementWrapper'),
    {
      fallback: <div className="p-6"><TableSkeleton rows={6} cols={7} /></div>
    }
  ),

  // Addon Management
  AddonManagement: createLazyComponent(
    () => import('../admin/CateringAddonsWrapper'),
    {
      fallback: <div className="p-6"><TableSkeleton rows={5} cols={4} /></div>
    }
  )
};

export const CustomerComponents = {
  // Product Catalog
  ProductCatalog: createLazyComponent(
    () => import('../products/ProductCatalogWrapper'),
    {
      fallback: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>,
      preload: true // Preload customer-facing components
    }
  ),

  // Cart
  Cart: createLazyComponent(
    () => import('../cart/CartPageWrapper'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={8} /></div>
    }
  ),

  // Checkout
  Checkout: createLazyComponent(
    () => import('../checkout/CheckoutWrapper'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={10} /></div>
    }
  ),

  // Catering Quote
  CateringQuote: createLazyComponent(
    () => import('../catering/CateringQuoteWrapper'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={12} /></div>
    }
  ),

  // Balance Payment
  BalancePayment: createLazyComponent(
    () => import('../catering/BalancePaymentWrapper'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={6} /></div>
    }
  ),

  // Order Tracking
  OrderTracking: createLazyComponent(
    () => import('../orders/OrderTracker'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={8} /></div>
    }
  ),

  // Contact Form
  ContactForm: createLazyComponent(
    () => import('../contact/ContactFormWrapper'),
    {
      fallback: <div className="p-6"><LoadingSkeleton lines={6} /></div>
    }
  )
};

// Utility components for lazy loading sections
interface LazySection {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazySection({
  children,
  fallback = <LoadingSkeleton />,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}: LazySection) {
  const [setRef, isVisible] = useIntersectionLazyLoad(threshold, rootMargin);

  return (
    <div ref={setRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Preloader for critical components
export function preloadCriticalComponents() {
  if (typeof window === 'undefined') return;

  // Preload commonly accessed customer components
  const criticalComponents = [
    CustomerComponents.ProductCatalog,
    CustomerComponents.Cart
  ];

  // Preload after initial page load
  setTimeout(() => {
    criticalComponents.forEach(component => {
      if ('preload' in component && typeof component.preload === 'function') {
        component.preload().catch(() => {
          // Silently handle preload failures
        });
      }
    });
  }, 1000);
}

// Performance-aware component router
interface ComponentRouterProps {
  component: 'admin' | 'customer';
  route: string;
  fallback?: ReactNode;
  [key: string]: any;
}

export function ComponentRouter({ component, route, fallback, ...props }: ComponentRouterProps) {
  const { isSlowConnection } = usePerformance();

  // Use simpler fallbacks on slow connections
  const adaptiveFallback = fallback || (
    isSlowConnection ?
      <div className="p-4 text-center text-gray-500">Loading...</div> :
      <LoadingSkeleton lines={6} />
  );

  if (component === 'admin') {
    const Component = AdminComponents[route as keyof typeof AdminComponents];
    return Component ? <Component {...props} /> : <div>Component not found</div>;
  }

  if (component === 'customer') {
    const Component = CustomerComponents[route as keyof typeof CustomerComponents];
    return Component ? <Component {...props} /> : <div>Component not found</div>;
  }

  return <div>Invalid component type</div>;
}

// Export everything needed
export default createLazyComponent;