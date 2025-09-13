import { generateETag } from './middleware';

/**
 * Compression utility for response data
 */
export function shouldCompress(request: Request, contentLength: number): boolean {
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const hasGzipSupport = acceptEncoding.includes('gzip');
  const isLargeContent = contentLength > 1024; // Only compress if > 1KB

  return hasGzipSupport && isLargeContent;
}

/**
 * Cache control headers for different content types
 */
export const CacheControlHeaders = {
  // Static assets - cache for 1 year
  static: 'public, max-age=31536000, immutable',

  // API responses - cache for 5 minutes with stale-while-revalidate
  api: 'public, max-age=300, stale-while-revalidate=600',

  // Dynamic content - cache for 1 minute
  dynamic: 'public, max-age=60, stale-while-revalidate=120',

  // Private admin content - no cache
  private: 'private, no-cache, no-store, must-revalidate',

  // Long-lived public content - cache for 1 hour
  longLived: 'public, max-age=3600, stale-while-revalidate=7200'
};

/**
 * Creates optimized response headers with compression and caching
 */
export function createOptimizedHeaders(
  request: Request,
  content: string,
  options: {
    cacheControl?: string;
    contentType?: string;
    enableCompression?: boolean;
    additionalHeaders?: Record<string, string>;
  } = {}
): Record<string, string> {
  const {
    cacheControl = CacheControlHeaders.api,
    contentType = 'application/json',
    enableCompression = true,
    additionalHeaders = {}
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'ETag': generateETag(content),
    'Vary': 'Accept-Encoding',
    ...additionalHeaders
  };

  // Add compression headers if applicable
  if (enableCompression && shouldCompress(request, content.length)) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding, Origin';
  }

  return headers;
}

/**
 * Handles conditional requests (If-None-Match)
 */
export function handleConditionalRequest(
  request: Request,
  etag: string
): Response | null {
  const ifNoneMatch = request.headers.get('if-none-match');

  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': CacheControlHeaders.api
      }
    });
  }

  return null;
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private startTime: number;
  private metrics: Record<string, number> = {};

  constructor() {
    this.startTime = performance.now();
  }

  mark(label: string): void {
    this.metrics[label] = performance.now() - this.startTime;
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  getTotalTime(): number {
    return performance.now() - this.startTime;
  }

  getPerformanceHeaders(): Record<string, string> {
    const totalTime = this.getTotalTime();

    return {
      'X-Response-Time': `${totalTime.toFixed(2)}ms`,
      'X-Performance-Metrics': JSON.stringify(this.metrics)
    };
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): Record<string, number> {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
    };
  }

  return {};
}

/**
 * Response optimization wrapper
 */
export function createOptimizedResponse(
  request: Request,
  data: any,
  options: {
    status?: number;
    cacheControl?: string;
    enableCompression?: boolean;
    additionalHeaders?: Record<string, string>;
  } = {}
): Response {
  const {
    status = 200,
    cacheControl = CacheControlHeaders.api,
    enableCompression = true,
    additionalHeaders = {}
  } = options;

  const content = JSON.stringify(data);
  const etag = generateETag(content);

  // Check for conditional request
  const conditionalResponse = handleConditionalRequest(request, etag);
  if (conditionalResponse) {
    return conditionalResponse;
  }

  const headers = createOptimizedHeaders(request, content, {
    cacheControl,
    enableCompression,
    additionalHeaders: {
      'ETag': etag,
      ...additionalHeaders
    }
  });

  return new Response(content, {
    status,
    headers
  });
}

/**
 * Database query optimization helpers
 */
export const QueryOptimization = {
  /**
   * Validates and sanitizes pagination parameters
   */
  sanitizePagination(limit?: string | number, offset?: string | number) {
    const maxLimit = 100;
    const defaultLimit = 20;

    const sanitizedLimit = Math.min(
      Math.max(Number(limit) || defaultLimit, 1),
      maxLimit
    );

    const sanitizedOffset = Math.max(Number(offset) || 0, 0);

    return { limit: sanitizedLimit, offset: sanitizedOffset };
  },

  /**
   * Validates sort parameters
   */
  sanitizeSort(sortBy?: string, sortOrder?: string) {
    const allowedSortFields = [
      'created_at', 'updated_at', 'title', 'name', 'price_cents', 'sort_order'
    ];

    const allowedSortOrders = ['ASC', 'DESC'];

    const sanitizedSortBy = allowedSortFields.includes(sortBy || '')
      ? sortBy
      : 'created_at';

    const sanitizedSortOrder = allowedSortOrders.includes(sortOrder?.toUpperCase() || '')
      ? sortOrder?.toUpperCase() as 'ASC' | 'DESC'
      : 'DESC';

    return { sortBy: sanitizedSortBy, sortOrder: sanitizedSortOrder };
  }
};

export { CacheControlHeaders as CacheControl };