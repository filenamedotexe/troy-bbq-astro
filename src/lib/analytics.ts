// Analytics and Performance Monitoring for Troy BBQ

interface AnalyticsEvent {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface PerformanceMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
}

class Analytics {
  private gtag: any;
  private isProduction: boolean;

  constructor() {
    this.isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    this.initializeGoogleAnalytics();
  }

  private initializeGoogleAnalytics() {
    if (typeof window === 'undefined' || !this.isProduction) return;

    // Google Analytics 4 Configuration
    const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with actual GA4 ID

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    this.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    this.gtag('js', new Date());
    this.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: {
        'custom_event_parameter': 'dimension1'
      }
    });

    // Enhanced eCommerce for restaurant orders
    this.gtag('config', GA_MEASUREMENT_ID, {
      custom_map: {
        'order_value': 'metric1',
        'menu_category': 'dimension2',
        'location': 'dimension3'
      }
    });
  }

  // Track page views
  trackPageView(url: string, title: string) {
    if (!this.gtag) return;

    this.gtag('config', 'G-XXXXXXXXXX', {
      page_path: url,
      page_title: title,
    });
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.gtag) {
      console.log('Analytics Event (Dev):', event);
      return;
    }

    this.gtag('event', event.event, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters
    });
  }

  // Track restaurant-specific events
  trackMenuView(category: string, item: string) {
    this.trackEvent({
      event: 'menu_view',
      category: 'menu',
      action: 'view_item',
      label: `${category} - ${item}`,
      custom_parameters: {
        menu_category: category,
        item_name: item
      }
    });
  }

  trackAddToCart(item: string, price: number, quantity: number) {
    this.trackEvent({
      event: 'add_to_cart',
      category: 'ecommerce',
      action: 'add_to_cart',
      label: item,
      value: price * quantity,
      custom_parameters: {
        currency: 'USD',
        item_name: item,
        price: price,
        quantity: quantity
      }
    });
  }

  trackCateringInquiry(eventType: string, guests: number) {
    this.trackEvent({
      event: 'catering_inquiry',
      category: 'catering',
      action: 'inquiry_started',
      label: eventType,
      value: guests,
      custom_parameters: {
        event_type: eventType,
        guest_count: guests
      }
    });
  }

  trackPurchase(orderId: string, value: number, items: any[]) {
    if (!this.gtag) return;

    this.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: value,
      currency: 'USD',
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }

  // Performance monitoring
  trackPerformanceMetrics() {
    if (typeof window === 'undefined') return;

    // Web Vitals tracking
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.sendMetricToAnalytics.bind(this));
      getFID(this.sendMetricToAnalytics.bind(this));
      getFCP(this.sendMetricToAnalytics.bind(this));
      getLCP(this.sendMetricToAnalytics.bind(this));
      getTTFB(this.sendMetricToAnalytics.bind(this));
    }).catch(() => {
      // Fallback for when web-vitals is not available
      this.trackBasicPerformanceMetrics();
    });
  }

  private sendMetricToAnalytics(metric: any) {
    this.trackEvent({
      event: 'web_vitals',
      category: 'performance',
      action: metric.name,
      label: metric.rating,
      value: Math.round(metric.value),
      custom_parameters: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_delta: metric.delta
      }
    });
  }

  private trackBasicPerformanceMetrics() {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics = {
        TTFB: navigation.responseStart - navigation.fetchStart,
        DOM_Load: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        Window_Load: navigation.loadEventEnd - navigation.fetchStart
      };

      Object.entries(metrics).forEach(([name, value]) => {
        this.trackEvent({
          event: 'performance_metric',
          category: 'performance',
          action: name,
          value: Math.round(value),
          custom_parameters: {
            metric_name: name,
            metric_value: value
          }
        });
      });
    }
  }

  // Track scroll depth
  trackScrollDepth() {
    if (typeof window === 'undefined') return;

    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];
    const triggeredThresholds = new Set();

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        thresholds.forEach(threshold => {
          if (scrollPercent >= threshold && !triggeredThresholds.has(threshold)) {
            triggeredThresholds.add(threshold);
            this.trackEvent({
              event: 'scroll_depth',
              category: 'engagement',
              action: 'scroll',
              label: `${threshold}%`,
              value: threshold
            });
          }
        });
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  // Track form interactions
  trackFormStart(formName: string) {
    this.trackEvent({
      event: 'form_start',
      category: 'forms',
      action: 'start',
      label: formName
    });
  }

  trackFormSubmit(formName: string, success: boolean) {
    this.trackEvent({
      event: 'form_submit',
      category: 'forms',
      action: success ? 'success' : 'error',
      label: formName,
      custom_parameters: {
        form_name: formName,
        success: success
      }
    });
  }

  // Track user engagement
  trackTimeOnPage() {
    if (typeof window === 'undefined') return;

    const startTime = Date.now();
    
    const sendTimeOnPage = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      
      this.trackEvent({
        event: 'time_on_page',
        category: 'engagement',
        action: 'time_spent',
        value: timeOnPage,
        custom_parameters: {
          time_seconds: timeOnPage,
          page_url: window.location.pathname
        }
      });
    };

    // Send time on page when user leaves
    window.addEventListener('beforeunload', sendTimeOnPage);
    
    // Also send after 30 seconds for active sessions
    setTimeout(sendTimeOnPage, 30000);
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializePerformanceObserver();
  }

  private initializePerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          this.logMetric('LCP', entry.startTime);
        } else if (entry.entryType === 'first-input') {
          this.logMetric('FID', (entry as any).processingStart - entry.startTime);
        } else if (entry.entryType === 'layout-shift') {
          if (!(entry as any).hadRecentInput) {
            this.logMetric('CLS', (entry as any).value);
          }
        }
      });
    });

    // Observe different performance entry types
    try {
      this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      console.warn('Performance Observer not fully supported');
    }
  }

  private logMetric(name: string, value: number) {
    if (this.isProduction()) {
      analytics.trackEvent({
        event: 'core_web_vital',
        category: 'performance',
        action: name,
        value: Math.round(value),
        custom_parameters: {
          metric_name: name,
          metric_value: value
        }
      });
    } else {
      console.log(`Performance Metric - ${name}:`, value);
    }
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  }

  // Resource timing analysis
  analyzeResourceTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowResources = resources.filter(resource => resource.duration > 1000);
    
    slowResources.forEach(resource => {
      analytics.trackEvent({
        event: 'slow_resource',
        category: 'performance',
        action: 'slow_load',
        label: resource.name,
        value: Math.round(resource.duration),
        custom_parameters: {
          resource_url: resource.name,
          duration: resource.duration,
          size: resource.transferSize || 0
        }
      });
    });
  }

  // Memory usage monitoring
  monitorMemoryUsage() {
    if (typeof window === 'undefined' || !(window.performance as any).memory) return;

    const memory = (window.performance as any).memory;
    const memoryUsage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };

    // Alert if memory usage is high (>80% of limit)
    if (memoryUsage.used / memoryUsage.limit > 0.8) {
      analytics.trackEvent({
        event: 'high_memory_usage',
        category: 'performance',
        action: 'memory_warning',
        value: Math.round((memoryUsage.used / memoryUsage.limit) * 100),
        custom_parameters: memoryUsage
      });
    }
  }
}

// Singleton instances
export const analytics = new Analytics();
export const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      analytics.trackPerformanceMetrics();
      analytics.trackScrollDepth();
      analytics.trackTimeOnPage();
      performanceMonitor.analyzeResourceTiming();
      performanceMonitor.monitorMemoryUsage();
    });
  } else {
    // DOM already loaded
    analytics.trackPerformanceMetrics();
    analytics.trackScrollDepth();
    analytics.trackTimeOnPage();
    performanceMonitor.analyzeResourceTiming();
    performanceMonitor.monitorMemoryUsage();
  }
}