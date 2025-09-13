import type { APIRoute } from 'astro';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  userAgent: string;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  timestamp: number;
}

// In-memory storage for development (use a proper database in production)
const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000; // Keep only the latest 1000 metrics

export const POST: APIRoute = async ({ request }) => {
  try {
    const metric: PerformanceMetric = await request.json();

    // Validate required fields
    if (!metric.name || typeof metric.value !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid metric data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add server timestamp
    const enrichedMetric = {
      ...metric,
      serverTimestamp: Date.now()
    };

    // Store metric (in production, save to database)
    performanceMetrics.push(enrichedMetric);

    // Keep only recent metrics to prevent memory issues
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.splice(0, performanceMetrics.length - MAX_METRICS);
    }

    // Log slow metrics for immediate attention
    if (metric.rating === 'poor' || metric.value > 2000) {
      console.warn(`🐌 Poor performance detected: ${metric.name} = ${metric.value}ms from ${new URL(metric.url).pathname}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: metric.id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Performance metric collection error:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to record metric' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;
  const limit = parseInt(searchParams.get('limit') || '100');
  const metric = searchParams.get('metric');
  const since = searchParams.get('since'); // ISO date string

  try {
    let filteredMetrics = [...performanceMetrics];

    // Filter by metric name
    if (metric) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metric);
    }

    // Filter by time
    if (since) {
      const sinceTime = new Date(since).getTime();
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= sinceTime);
    }

    // Sort by timestamp (newest first) and limit
    filteredMetrics = filteredMetrics
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Calculate aggregated statistics
    const stats = calculatePerformanceStats(filteredMetrics);

    return new Response(
      JSON.stringify({
        metrics: filteredMetrics,
        stats,
        count: filteredMetrics.length,
        total: performanceMetrics.length
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' // Always get fresh data
        }
      }
    );
  } catch (error) {
    console.error('Performance metric retrieval error:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to retrieve metrics' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

function calculatePerformanceStats(metrics: PerformanceMetric[]) {
  if (metrics.length === 0) {
    return {};
  }

  // Group by metric name
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric.value);
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate stats for each metric
  const stats: Record<string, any> = {};

  for (const [metricName, values] of Object.entries(grouped)) {
    const sorted = values.sort((a, b) => a - b);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    stats[metricName] = {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(avg * 100) / 100,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      poor: values.filter(v => v > getThreshold(metricName, 'poor')).length,
      needsImprovement: values.filter(v => v > getThreshold(metricName, 'needs-improvement')).length,
      good: values.filter(v => v <= getThreshold(metricName, 'good')).length
    };
  }

  // Overall health score
  const healthScore = calculateHealthScore(stats);

  return {
    ...stats,
    healthScore,
    totalSamples: metrics.length,
    timeRange: {
      start: new Date(Math.min(...metrics.map(m => m.timestamp))).toISOString(),
      end: new Date(Math.max(...metrics.map(m => m.timestamp))).toISOString()
    }
  };
}

function getThreshold(metricName: string, level: 'good' | 'needs-improvement' | 'poor') {
  const thresholds = {
    LCP: { good: 2500, 'needs-improvement': 4000 },
    FID: { good: 100, 'needs-improvement': 300 },
    CLS: { good: 0.1, 'needs-improvement': 0.25 },
    FCP: { good: 1800, 'needs-improvement': 3000 },
    TTFB: { good: 800, 'needs-improvement': 1800 }
  };

  const metricThresholds = thresholds[metricName as keyof typeof thresholds];
  if (!metricThresholds) return level === 'good' ? 1000 : level === 'needs-improvement' ? 2000 : Infinity;

  if (level === 'good') return metricThresholds.good;
  if (level === 'needs-improvement') return metricThresholds['needs-improvement'];
  return Infinity; // poor threshold
}

function calculateHealthScore(stats: Record<string, any>): number {
  const coreMetrics = ['LCP', 'FID', 'CLS'];
  let totalScore = 0;
  let metricCount = 0;

  for (const metric of coreMetrics) {
    if (stats[metric]) {
      const { good, needsImprovement, poor } = stats[metric];
      const total = good + needsImprovement + poor;

      if (total > 0) {
        // Score: 100 for good, 50 for needs improvement, 0 for poor
        const score = (good * 100 + needsImprovement * 50) / total;
        totalScore += score;
        metricCount++;
      }
    }
  }

  return metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
}