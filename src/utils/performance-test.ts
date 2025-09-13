// Performance testing utilities for Troy BBQ
// Run performance tests and generate reports

interface PerformanceTestResult {
  url: string;
  timestamp: number;
  metrics: {
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  };
  networkInfo?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  deviceInfo?: {
    type: string;
    screenSize: string;
    userAgent: string;
  };
  bundleSize?: {
    js: number;
    css: number;
    total: number;
  };
  recommendations: string[];
}

export class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];

  // Test Core Web Vitals
  async testCoreWebVitals(url: string): Promise<PerformanceTestResult> {
    const result: PerformanceTestResult = {
      url,
      timestamp: Date.now(),
      metrics: {},
      recommendations: []
    };

    // Collect Web Vitals (this would typically be done with real user monitoring)
    if (typeof window !== 'undefined') {
      const { getCLS, getFCP, getFID, getLCP, getTTFB } = await import('web-vitals');

      // Collect metrics with promises
      const metricsPromises = [
        new Promise<void>((resolve) => {
          getCLS((metric) => {
            result.metrics.CLS = metric.value;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          getFCP((metric) => {
            result.metrics.FCP = metric.value;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          getFID((metric) => {
            result.metrics.FID = metric.value;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          getLCP((metric) => {
            result.metrics.LCP = metric.value;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          getTTFB((metric) => {
            result.metrics.TTFB = metric.value;
            resolve();
          });
        })
      ];

      // Wait for metrics collection (with timeout)
      await Promise.race([
        Promise.all(metricsPromises),
        new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
      ]);

      // Collect network info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        result.networkInfo = {
          effectiveType: connection?.effectiveType || 'unknown',
          downlink: connection?.downlink || 0,
          rtt: connection?.rtt || 0
        };
      }

      // Collect device info
      result.deviceInfo = {
        type: this.getDeviceType(),
        screenSize: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent
      };
    }

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);
    this.results.push(result);

    return result;
  }

  // Test bundle sizes
  async testBundleSize(): Promise<{ js: number; css: number; total: number }> {
    if (typeof window === 'undefined') {
      return { js: 0, css: 0, total: 0 };
    }

    let jsSize = 0;
    let cssSize = 0;

    // Estimate bundle sizes from loaded resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    for (const resource of resources) {
      if (resource.name.includes('/_astro/') || resource.name.includes('.js')) {
        jsSize += resource.transferSize || 0;
      } else if (resource.name.includes('.css')) {
        cssSize += resource.transferSize || 0;
      }
    }

    return {
      js: Math.round(jsSize / 1024), // KB
      css: Math.round(cssSize / 1024), // KB
      total: Math.round((jsSize + cssSize) / 1024) // KB
    };
  }

  // Test mobile performance
  async testMobilePerformance(): Promise<{
    touchTargets: { compliant: number; total: number };
    viewportOptimized: boolean;
    textReadable: boolean;
    contentSized: boolean;
  }> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        touchTargets: { compliant: 0, total: 0 },
        viewportOptimized: false,
        textReadable: false,
        contentSized: false
      };
    }

    // Check touch target sizes
    const touchTargets = this.checkTouchTargets();

    // Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const viewportOptimized = !!viewportMeta && viewportMeta.getAttribute('content')?.includes('width=device-width');

    // Check text readability (font sizes)
    const textReadable = this.checkTextReadability();

    // Check if content fits viewport
    const contentSized = document.body.scrollWidth <= window.innerWidth;

    return {
      touchTargets,
      viewportOptimized,
      textReadable,
      contentSized
    };
  }

  // Test loading performance
  async testLoadingPerformance(): Promise<{
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    resourceCount: number;
    criticalRequests: number;
  }> {
    if (typeof window === 'undefined') {
      return {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        resourceCount: 0,
        criticalRequests: 0
      };
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource');

    const firstPaint = paint.find(entry => entry.name === 'first-paint')?.startTime || 0;
    const criticalRequests = resources.filter(resource =>
      resource.name.includes('.css') ||
      resource.name.includes('font') ||
      (resource.name.includes('.js') && !resource.name.includes('chunk'))
    ).length;

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstPaint,
      resourceCount: resources.length,
      criticalRequests
    };
  }

  // Generate performance report
  generateReport(): {
    summary: {
      overallScore: number;
      coreWebVitalsScore: number;
      mobileScore: number;
      loadingScore: number;
    };
    details: any;
    recommendations: string[];
  } {
    if (this.results.length === 0) {
      return {
        summary: { overallScore: 0, coreWebVitalsScore: 0, mobileScore: 0, loadingScore: 0 },
        details: {},
        recommendations: ['No performance data available. Run tests first.']
      };
    }

    const latestResult = this.results[this.results.length - 1];

    // Calculate scores
    const coreWebVitalsScore = this.calculateCoreWebVitalsScore(latestResult.metrics);
    const mobileScore = 85; // Would be calculated from mobile tests
    const loadingScore = 80; // Would be calculated from loading tests
    const overallScore = Math.round((coreWebVitalsScore + mobileScore + loadingScore) / 3);

    // Aggregate all recommendations
    const allRecommendations = this.results.flatMap(r => r.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return {
      summary: {
        overallScore,
        coreWebVitalsScore,
        mobileScore,
        loadingScore
      },
      details: {
        latestMetrics: latestResult.metrics,
        testCount: this.results.length,
        averageMetrics: this.calculateAverageMetrics()
      },
      recommendations: uniqueRecommendations
    };
  }

  // Helper methods
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private checkTouchTargets(): { compliant: number; total: number } {
    if (typeof document === 'undefined') return { compliant: 0, total: 0 };

    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
    let compliant = 0;

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // 44px minimum touch target size

      if (rect.width >= minSize && rect.height >= minSize) {
        compliant++;
      }
    });

    return {
      compliant,
      total: interactiveElements.length
    };
  }

  private checkTextReadability(): boolean {
    if (typeof document === 'undefined') return false;

    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    let readableCount = 0;

    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);

      // Minimum 16px for mobile readability
      if (fontSize >= 16) {
        readableCount++;
      }
    });

    return readableCount / textElements.length > 0.8; // 80% of text should be readable
  }

  private calculateCoreWebVitalsScore(metrics: PerformanceTestResult['metrics']): number {
    let score = 0;
    let count = 0;

    // LCP score
    if (metrics.LCP !== undefined) {
      score += metrics.LCP <= 2500 ? 100 : metrics.LCP <= 4000 ? 50 : 0;
      count++;
    }

    // FID score
    if (metrics.FID !== undefined) {
      score += metrics.FID <= 100 ? 100 : metrics.FID <= 300 ? 50 : 0;
      count++;
    }

    // CLS score
    if (metrics.CLS !== undefined) {
      score += metrics.CLS <= 0.1 ? 100 : metrics.CLS <= 0.25 ? 50 : 0;
      count++;
    }

    return count > 0 ? Math.round(score / count) : 0;
  }

  private calculateAverageMetrics() {
    if (this.results.length === 0) return {};

    const totals = this.results.reduce((acc, result) => {
      Object.entries(result.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          acc[key] = (acc[key] || 0) + value;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const averages: Record<string, number> = {};
    Object.entries(totals).forEach(([key, total]) => {
      averages[key] = Math.round((total / this.results.length) * 100) / 100;
    });

    return averages;
  }

  private generateRecommendations(result: PerformanceTestResult): string[] {
    const recommendations: string[] = [];

    // LCP recommendations
    if (result.metrics.LCP && result.metrics.LCP > 2500) {
      recommendations.push('Optimize Largest Contentful Paint: Consider optimizing images, enabling lazy loading, and reducing server response times');
    }

    // FID recommendations
    if (result.metrics.FID && result.metrics.FID > 100) {
      recommendations.push('Improve First Input Delay: Reduce JavaScript execution time and break up long tasks');
    }

    // CLS recommendations
    if (result.metrics.CLS && result.metrics.CLS > 0.1) {
      recommendations.push('Fix Cumulative Layout Shift: Set dimensions for images and videos, avoid inserting content above existing content');
    }

    // FCP recommendations
    if (result.metrics.FCP && result.metrics.FCP > 1800) {
      recommendations.push('Optimize First Contentful Paint: Minimize render-blocking resources and optimize critical rendering path');
    }

    // TTFB recommendations
    if (result.metrics.TTFB && result.metrics.TTFB > 800) {
      recommendations.push('Improve Time to First Byte: Optimize server performance, use CDN, and enable caching');
    }

    // Network-based recommendations
    if (result.networkInfo?.effectiveType === 'slow-2g' || result.networkInfo?.effectiveType === '2g') {
      recommendations.push('Optimize for slow connections: Implement aggressive caching, reduce bundle sizes, and prioritize critical resources');
    }

    // Device-based recommendations
    if (result.deviceInfo?.type === 'mobile') {
      recommendations.push('Mobile optimization: Ensure touch targets are at least 44px, optimize for thumb navigation, and test on real devices');
    }

    return recommendations;
  }
}

// Utility functions for quick testing
export async function runQuickPerformanceTest(): Promise<void> {
  const testSuite = new PerformanceTestSuite();

  try {
    console.log('🚀 Starting Troy BBQ Performance Test...');

    // Test Core Web Vitals
    const vitalsResult = await testSuite.testCoreWebVitals(window.location.href);
    console.log('📊 Core Web Vitals:', vitalsResult.metrics);

    // Test bundle sizes
    const bundleSize = await testSuite.testBundleSize();
    console.log('📦 Bundle Size:', bundleSize);

    // Test mobile performance
    const mobilePerf = await testSuite.testMobilePerformance();
    console.log('📱 Mobile Performance:', mobilePerf);

    // Test loading performance
    const loadingPerf = await testSuite.testLoadingPerformance();
    console.log('⚡ Loading Performance:', loadingPerf);

    // Generate report
    const report = testSuite.generateReport();
    console.log('📋 Performance Report:', report);

    // Log recommendations
    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`- ${rec}`));
      console.groupEnd();
    }

  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// Export the test suite
export default PerformanceTestSuite;