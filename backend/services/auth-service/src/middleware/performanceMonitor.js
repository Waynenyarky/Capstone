const logger = require('../lib/logger');

/**
 * Performance Monitoring Middleware
 * Tracks API response times and database performance
 */

// Store performance metrics
const performanceMetrics = {
  endpoints: new Map(), // endpoint -> { count, totalTime, min, max, avg }
  databaseQueries: new Map(), // collection -> { count, totalTime, min, max, avg }
};

/**
 * Middleware to track API response times
 */
function performanceMonitorMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Track response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.path}`;
    
    // Update endpoint metrics
    if (!performanceMetrics.endpoints.has(endpoint)) {
      performanceMetrics.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      });
    }
    
    const metrics = performanceMetrics.endpoints.get(endpoint);
    metrics.count++;
    metrics.totalTime += duration;
    metrics.min = Math.min(metrics.min, duration);
    metrics.max = Math.max(metrics.max, duration);
    metrics.avg = Math.round(metrics.totalTime / metrics.count);
    
    // Log slow requests
    const slowThreshold = 1000; // 1 second
    if (duration > slowThreshold) {
      logger.warn('Slow API request detected', {
        correlationId: req.correlationId,
        request: {
          method: req.method,
          path: req.path,
          ip: req.ip,
        },
        performance: {
          duration,
          threshold: slowThreshold,
        },
        userId: req._userId,
      });
    }
    
    // Log performance metric
    logger.logPerformance('api_response_time', duration, 'ms', {
      correlationId: req.correlationId,
      endpoint,
      statusCode: res.statusCode,
    });
  });
  
  next();
}

/**
 * Track database query performance
 */
function trackDatabaseQuery(collection, operation, duration) {
  const key = `${collection}.${operation}`;
  
  if (!performanceMetrics.databaseQueries.has(key)) {
    performanceMetrics.databaseQueries.set(key, {
      count: 0,
      totalTime: 0,
      min: Infinity,
      max: 0,
      avg: 0,
    });
  }
  
  const metrics = performanceMetrics.databaseQueries.get(key);
  metrics.count++;
  metrics.totalTime += duration;
  metrics.min = Math.min(metrics.min, duration);
  metrics.max = Math.max(metrics.max, duration);
  metrics.avg = Math.round(metrics.totalTime / metrics.count);
  
  // Log slow queries
  const slowThreshold = 500; // 500ms
  if (duration > slowThreshold) {
    logger.warn('Slow database query detected', {
      database: {
        collection,
        operation,
        duration,
        threshold: slowThreshold,
      },
    });
  }
  
  // Log database performance
  logger.logDatabaseQuery(operation, collection, duration);
}

/**
 * Get performance statistics
 */
function getPerformanceStats() {
  const endpointStats = {};
  for (const [endpoint, metrics] of performanceMetrics.endpoints.entries()) {
    endpointStats[endpoint] = {
      count: metrics.count,
      avgResponseTime: metrics.avg,
      minResponseTime: metrics.min === Infinity ? 0 : metrics.min,
      maxResponseTime: metrics.max,
    };
  }
  
  const databaseStats = {};
  for (const [key, metrics] of performanceMetrics.databaseQueries.entries()) {
    databaseStats[key] = {
      count: metrics.count,
      avgDuration: metrics.avg,
      minDuration: metrics.min === Infinity ? 0 : metrics.min,
      maxDuration: metrics.max,
    };
  }
  
  return {
    endpoints: endpointStats,
    database: databaseStats,
  };
}

/**
 * Reset performance metrics
 */
function resetMetrics() {
  performanceMetrics.endpoints.clear();
  performanceMetrics.databaseQueries.clear();
}

module.exports = {
  performanceMonitorMiddleware,
  trackDatabaseQuery,
  getPerformanceStats,
  resetMetrics,
};
