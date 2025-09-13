import { neon, neonConfig } from '@neondatabase/serverless';
import type { DatabaseService } from './database';

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true; // Enable connection caching
neonConfig.useSecureWebSocket = false; // Use regular WebSocket for lower latency in dev

// Create optimized connection with pooling
const sql = neon(process.env.DATABASE_URL || import.meta.env.DATABASE_URL || '', {
  // Connection pool configuration
  // Note: Neon serverless handles pooling internally, but we can configure behavior
});

// Query optimization utilities
export class QueryOptimizer {
  private static queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Cache frequently accessed queries
  static async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.result;
    }

    const result = await queryFn();
    this.queryCache.set(key, { result, timestamp: now, ttl });

    // Clean up expired entries periodically
    if (this.queryCache.size > 100) {
      this.cleanupCache();
    }

    return result;
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  private static cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache) {
      if ((now - value.timestamp) > value.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  // Batch operations for multiple database calls
  static async batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(queries);
  }

  // Paginated query with optimized counting
  static async paginatedQuery<T>(
    dataQuery: () => Promise<T[]>,
    countQuery: () => Promise<{ count: string }[]>,
    limit: number,
    offset: number,
    cacheKey?: string
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const executeQueries = async () => {
      const [data, countResult] = await Promise.all([
        dataQuery(),
        countQuery()
      ]);

      const total = parseInt(countResult[0]?.count || '0');
      const hasMore = offset + limit < total;

      return { data, total, hasMore };
    };

    if (cacheKey) {
      return this.cachedQuery(cacheKey, executeQueries, 2 * 60 * 1000); // 2 min cache for paginated data
    }

    return executeQueries();
  }
}

// Performance monitoring for database operations
export class DatabasePerformanceMonitor {
  private static metrics = new Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
  }>();

  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - start;

      this.recordMetric(queryName, duration);

      // Log slow queries
      if (duration > 1000) { // > 1 second
        console.warn(`🐌 Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ Query failed: ${queryName} (${duration.toFixed(2)}ms)`, error);
      throw error;
    }
  }

  private static recordMetric(queryName: string, duration: number) {
    const existing = this.metrics.get(queryName);

    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.avgTime = existing.totalTime / existing.count;
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.minTime = Math.min(existing.minTime, duration);
    } else {
      this.metrics.set(queryName, {
        count: 1,
        totalTime: duration,
        avgTime: duration,
        maxTime: duration,
        minTime: duration
      });
    }
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics.entries());
  }

  static getSlowQueries(threshold = 500) {
    const slowQueries = [];
    for (const [name, metrics] of this.metrics) {
      if (metrics.avgTime > threshold || metrics.maxTime > threshold * 2) {
        slowQueries.push({ name, ...metrics });
      }
    }
    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }

  static reset() {
    this.metrics.clear();
  }
}

// Optimized database service extensions
export class OptimizedDatabaseService {
  // Optimized admin settings with caching
  static async getAdminSettings() {
    return QueryOptimizer.cachedQuery(
      'admin-settings',
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'getAdminSettings',
          async () => {
            const result = await sql`
              SELECT config FROM admin_settings ORDER BY id LIMIT 1
            `;
            return result[0]?.config || null;
          }
        );
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  // Optimized product listing with smart pagination
  static async listProductsOptimized(filters: {
    search?: string;
    category_ids?: string[];
    status?: string[];
    limit?: number;
    offset?: number;
  } = {}) {
    const { search, category_ids, status, limit = 20, offset = 0 } = filters;

    const cacheKey = `products-${JSON.stringify(filters)}`;

    return QueryOptimizer.paginatedQuery(
      // Data query
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'listProducts',
          async () => {
            if (status?.includes('published')) {
              return sql`
                SELECT p.*,
                       COALESCE(
                         json_agg(
                           json_build_object(
                             'id', pv.id,
                             'title', pv.title,
                             'price_cents', pv.price_cents,
                             'inventory_quantity', pv.inventory_quantity
                           )
                         ) FILTER (WHERE pv.id IS NOT NULL),
                         '[]'
                       ) as variants
                FROM products p
                LEFT JOIN product_variants pv ON p.id = pv.product_id
                WHERE p.status = 'published'
                GROUP BY p.id
                ORDER BY p.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
              `;
            } else {
              return sql`
                SELECT p.*,
                       COALESCE(
                         json_agg(
                           json_build_object(
                             'id', pv.id,
                             'title', pv.title,
                             'price_cents', pv.price_cents,
                             'inventory_quantity', pv.inventory_quantity
                           )
                         ) FILTER (WHERE pv.id IS NOT NULL),
                         '[]'
                       ) as variants
                FROM products p
                LEFT JOIN product_variants pv ON p.id = pv.product_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
              `;
            }
          }
        );
      },
      // Count query
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'countProducts',
          async () => {
            if (status?.includes('published')) {
              return sql`SELECT COUNT(*) as count FROM products WHERE status = 'published'`;
            } else {
              return sql`SELECT COUNT(*) as count FROM products`;
            }
          }
        );
      },
      limit,
      offset,
      cacheKey
    );
  }

  // Optimized catering quotes with aggregation
  static async getCateringQuotesWithStats(limit = 50, offset = 0) {
    return QueryOptimizer.paginatedQuery(
      // Data query with stats
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'getCateringQuotesWithStats',
          async () => {
            return sql`
              SELECT
                cq.*,
                CASE
                  WHEN cq.status = 'completed' THEN 'fulfilled'
                  WHEN cq.status = 'deposit_paid' THEN 'confirmed'
                  ELSE 'pending'
                END as display_status,
                EXTRACT(EPOCH FROM (cq.updated_at - cq.created_at)) / 3600 as processing_hours
              FROM catering_quotes cq
              ORDER BY cq.created_at DESC
              LIMIT ${limit} OFFSET ${offset}
            `;
          }
        );
      },
      // Count query
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'countCateringQuotes',
          async () => {
            return sql`SELECT COUNT(*) as count FROM catering_quotes`;
          }
        );
      },
      limit,
      offset,
      `catering-quotes-${limit}-${offset}`
    );
  }

  // Optimized search across products and categories
  static async globalSearch(query: string, limit = 20) {
    return QueryOptimizer.cachedQuery(
      `search-${query}-${limit}`,
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'globalSearch',
          async () => {
            // Use full-text search capabilities
            return sql`
              (
                SELECT
                  'product' as type,
                  id,
                  title as name,
                  description,
                  handle,
                  thumbnail as image_url,
                  ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')), plainto_tsquery('english', ${query})) as rank
                FROM products
                WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', ${query})
                AND status = 'published'
                ORDER BY rank DESC
                LIMIT ${Math.floor(limit * 0.7)}
              )
              UNION ALL
              (
                SELECT
                  'category' as type,
                  id,
                  name,
                  description,
                  handle,
                  NULL as image_url,
                  ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', ${query})) as rank
                FROM product_categories
                WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', ${query})
                AND is_active = true
                ORDER BY rank DESC
                LIMIT ${Math.floor(limit * 0.3)}
              )
              ORDER BY rank DESC
            `;
          }
        );
      },
      2 * 60 * 1000 // 2 minutes cache for search results
    );
  }

  // Optimized analytics queries
  static async getDashboardAnalytics() {
    return QueryOptimizer.cachedQuery(
      'dashboard-analytics',
      async () => {
        return DatabasePerformanceMonitor.measureQuery(
          'getDashboardAnalytics',
          async () => {
            // Batch multiple analytics queries
            const [
              quoteStats,
              productStats,
              recentActivity
            ] = await Promise.all([
              // Quote statistics
              sql`
                SELECT
                  COUNT(*) as total_quotes,
                  COUNT(*) FILTER (WHERE status = 'completed') as completed_quotes,
                  COUNT(*) FILTER (WHERE status = 'deposit_paid') as confirmed_quotes,
                  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as quotes_this_month,
                  AVG(CASE WHEN status = 'completed' THEN (pricing_breakdown->>'total')::numeric ELSE NULL END) as avg_order_value
                FROM catering_quotes
              `,
              // Product statistics
              sql`
                SELECT
                  COUNT(*) as total_products,
                  COUNT(*) FILTER (WHERE status = 'published') as published_products,
                  AVG(pv.price_cents) as avg_price_cents,
                  SUM(pv.inventory_quantity) as total_inventory
                FROM products p
                LEFT JOIN product_variants pv ON p.id = pv.product_id
              `,
              // Recent activity
              sql`
                SELECT 'quote' as type, id, created_at, customer_email as identifier
                FROM catering_quotes
                WHERE created_at >= NOW() - INTERVAL '7 days'
                ORDER BY created_at DESC
                LIMIT 10
              `
            ]);

            return {
              quotes: quoteStats[0],
              products: productStats[0],
              recentActivity
            };
          }
        );
      },
      5 * 60 * 1000 // 5 minutes cache for analytics
    );
  }

  // Connection health check
  static async healthCheck() {
    return DatabasePerformanceMonitor.measureQuery(
      'healthCheck',
      async () => {
        const result = await sql`SELECT NOW() as timestamp, 1 as status`;
        return {
          status: 'healthy',
          timestamp: result[0].timestamp,
          latency: performance.now()
        };
      }
    );
  }

  // Bulk operations optimization
  static async bulkInsertProducts(products: any[]) {
    return DatabasePerformanceMonitor.measureQuery(
      'bulkInsertProducts',
      async () => {
        // Use transaction-like behavior with batch inserts
        const results = [];

        // Process in chunks to avoid memory issues
        const chunkSize = 10;
        for (let i = 0; i < products.length; i += chunkSize) {
          const chunk = products.slice(i, i + chunkSize);

          const chunkResults = await Promise.all(
            chunk.map(async (product) => {
              return sql`
                INSERT INTO products (title, description, status, handle)
                VALUES (${product.title}, ${product.description}, ${product.status}, ${product.handle})
                RETURNING id
              `;
            })
          );

          results.push(...chunkResults.map(r => r[0].id));
        }

        // Clear relevant caches
        QueryOptimizer.clearCache('products');

        return results;
      }
    );
  }

  // Index usage analysis (for development)
  static async analyzeQueryPerformance() {
    if (process.env.NODE_ENV !== 'development') {
      return { message: 'Query analysis only available in development' };
    }

    return DatabasePerformanceMonitor.measureQuery(
      'analyzeQueryPerformance',
      async () => {
        // Get table statistics
        const tableStats = await sql`
          SELECT
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY n_live_tup DESC
        `;

        // Get index usage
        const indexStats = await sql`
          SELECT
            indexrelname as index_name,
            tablename,
            idx_scan as times_used,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public'
          ORDER BY idx_scan DESC
        `;

        return {
          tableStats,
          indexStats,
          performanceMetrics: DatabasePerformanceMonitor.getMetrics(),
          slowQueries: DatabasePerformanceMonitor.getSlowQueries()
        };
      }
    );
  }
}

// Export for easy access
export { sql, QueryOptimizer, DatabasePerformanceMonitor };