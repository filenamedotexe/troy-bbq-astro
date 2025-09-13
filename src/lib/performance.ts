// Performance optimization utilities for Troy BBQ

interface CacheOptions {
  maxAge?: number; // in seconds
  staleWhileRevalidate?: number; // in seconds
  type?: 'static' | 'api' | 'image';
}

interface PreloadOptions {
  as: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossorigin?: 'anonymous' | 'use-credentials';
  type?: string;
  media?: string;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private resourceCache = new Map<string, any>();
  private criticalResources: string[] = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Cache control headers for different resource types
  getCacheHeaders(type: CacheOptions['type'] = 'static'): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (type) {
      case 'static':
        headers['Cache-Control'] = 'public, max-age=31536000, immutable'; // 1 year
        break;
      case 'api':
        headers['Cache-Control'] = 'public, max-age=300, s-maxage=600'; // 5 min, CDN 10 min
        break;
      case 'image':
        headers['Cache-Control'] = 'public, max-age=2592000'; // 30 days
        headers['Vary'] = 'Accept';
        break;
      default:
        headers['Cache-Control'] = 'public, max-age=3600'; // 1 hour
    }

    return headers;
  }

  // Critical resource hints
  generatePreloadTags(resources: Array<{ url: string; options: PreloadOptions }>): string {
    return resources.map(({ url, options }) => {
      const attrs = Object.entries(options)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<link rel="preload" href="${url}" ${attrs}>`;
    }).join('\n');
  }

  // DNS prefetch for external domains
  generateDNSPrefetchTags(domains: string[]): string {
    return domains.map(domain => 
      `<link rel="dns-prefetch" href="//${domain}">`
    ).join('\n');
  }

  // Preconnect for critical external resources
  generatePreconnectTags(urls: Array<{ url: string; crossorigin?: boolean }>): string {
    return urls.map(({ url, crossorigin }) => 
      `<link rel="preconnect" href="${url}"${crossorigin ? ' crossorigin' : ''}>`
    ).join('\n');
  }

  // Bundle splitting configuration
  getChunkStrategy() {
    return {
      vendor: ['react', 'react-dom'],
      ui: [
        '@radix-ui/react-label',
        '@radix-ui/react-slot',
        'lucide-react'
      ],
      payments: [
        '@stripe/stripe-js',
        '@stripe/react-stripe-js',
        'react-square-web-payments-sdk'
      ],
      utils: [
        'clsx',
        'tailwind-merge',
        'class-variance-authority'
      ],
      forms: [
        'react-hook-form',
        '@hookform/resolvers',
        'zod'
      ]
    };
  }

  // Service Worker registration for caching
  registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Track SW registration
        if (window.analytics) {
          window.analytics.trackEvent({
            event: 'service_worker_registered',
            category: 'performance',
            action: 'sw_register',
            label: 'success'
          });
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        
        if (window.analytics) {
          window.analytics.trackEvent({
            event: 'service_worker_error',
            category: 'performance',
            action: 'sw_error',
            label: error.message
          });
        }
      }
    });
  }

  // Lazy load non-critical resources
  lazyLoadResource(url: string, type: 'script' | 'style' = 'script'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.resourceCache.has(url)) {
        resolve();
        return;
      }

      const element = type === 'script' 
        ? document.createElement('script')
        : document.createElement('link');

      if (type === 'script') {
        (element as HTMLScriptElement).src = url;
        (element as HTMLScriptElement).async = true;
        (element as HTMLScriptElement).defer = true;
      } else {
        (element as HTMLLinkElement).rel = 'stylesheet';
        (element as HTMLLinkElement).href = url;
      }

      element.onload = () => {
        this.resourceCache.set(url, true);
        resolve();
      };

      element.onerror = () => reject(new Error(`Failed to load ${type}: ${url}`));

      document.head.appendChild(element);
    });
  }

  // Image intersection observer for lazy loading
  setupImageLazyLoading(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
            
            // Track lazy load
            if (window.analytics) {
              window.analytics.trackEvent({
                event: 'image_lazy_loaded',
                category: 'performance',
                action: 'lazy_load',
                label: src
              });
            }
          }
        }
      });
    }, {
      rootMargin: '50px'
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Critical CSS inlining
  inlineCriticalCSS(css: string): string {
    return `<style>${css}</style>`;
  }

  // Font loading optimization
  optimizeFontLoading(): void {
    if (typeof window === 'undefined') return;

    // Use font-display: swap for better performance
    const fontFaces = [
      {
        family: 'Inter',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
      }
    ];

    fontFaces.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.url;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    });
  }

  // Resource prioritization
  prioritizeResources(): void {
    if (typeof window === 'undefined') return;

    // Critical resources for above-the-fold content
    this.criticalResources = [
      '/fonts/inter-variable.woff2',
      '/images/hero-bg.webp',
      '/css/critical.css'
    ];

    // Preload critical resources
    this.criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.endsWith('.webp') || resource.endsWith('.jpg')) {
        link.as = 'image';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      }
      
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Bundle size monitoring
  monitorBundleSize(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    // Alert if bundles are too large
    const maxJSSize = 250 * 1024; // 250KB
    const maxCSSSize = 50 * 1024;  // 50KB
    
    if (totalJSSize > maxJSSize && window.analytics) {
      window.analytics.trackEvent({
        event: 'large_js_bundle',
        category: 'performance',
        action: 'bundle_warning',
        value: Math.round(totalJSSize / 1024),
        custom_parameters: {
          bundle_size_kb: Math.round(totalJSSize / 1024),
          threshold_kb: Math.round(maxJSSize / 1024)
        }
      });
    }
    
    if (totalCSSSize > maxCSSSize && window.analytics) {
      window.analytics.trackEvent({
        event: 'large_css_bundle',
        category: 'performance',
        action: 'bundle_warning',
        value: Math.round(totalCSSSize / 1024),
        custom_parameters: {
          bundle_size_kb: Math.round(totalCSSSize / 1024),
          threshold_kb: Math.round(maxCSSSize / 1024)
        }
      });
    }
  }

  // Third-party script optimization
  loadThirdPartyScripts(): void {
    if (typeof window === 'undefined') return;

    // Load non-critical third-party scripts after page load
    window.addEventListener('load', () => {
      // Delay third-party scripts to improve performance
      setTimeout(() => {
        this.lazyLoadThirdPartyScripts();
      }, 3000); // 3 second delay
    });
  }

  private lazyLoadThirdPartyScripts(): void {
    const thirdPartyScripts = [
      // Add third-party scripts here as needed
      // Example: { src: 'https://example.com/script.js', async: true }
    ];

    thirdPartyScripts.forEach(script => {
      this.lazyLoadResource(script.src, 'script');
    });
  }

  // Initialize all performance optimizations
  init(): void {
    if (typeof window === 'undefined') return;

    this.prioritizeResources();
    this.optimizeFontLoading();
    this.setupImageLazyLoading();
    this.loadThirdPartyScripts();
    this.registerServiceWorker();

    // Monitor performance after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.monitorBundleSize();
      }, 5000);
    });
  }
}

// Core Web Vitals optimization helpers
export class CoreWebVitalsOptimizer {
  // Optimize Largest Contentful Paint (LCP)
  static optimizeLCP(): void {
    // Preload hero images
    const heroImages = document.querySelectorAll('img[data-hero]');
    heroImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = (img as HTMLImageElement).src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });
  }

  // Optimize First Input Delay (FID)
  static optimizeFID(): void {
    // Use passive event listeners
    const addPassiveListener = (element: Element, event: string, handler: EventListener) => {
      element.addEventListener(event, handler, { passive: true });
    };

    // Apply to scroll and touch events
    document.querySelectorAll('[data-scroll]').forEach(el => {
      addPassiveListener(el, 'scroll', () => {});
      addPassiveListener(el, 'touchstart', () => {});
    });
  }

  // Optimize Cumulative Layout Shift (CLS)
  static optimizeCLS(): void {
    // Ensure images have dimensions
    document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
      console.warn('Image without dimensions may cause layout shift:', img);
    });

    // Add aspect ratio boxes for dynamic content
    const dynamicContainers = document.querySelectorAll('[data-dynamic]');
    dynamicContainers.forEach(container => {
      (container as HTMLElement).style.minHeight = '100px';
    });
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-initialize on client
if (typeof window !== 'undefined') {
  performanceOptimizer.init();
}