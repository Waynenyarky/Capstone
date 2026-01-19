const express = require('express');
const { requireJwt, requireRole } = require('../middleware/auth');
const logger = require('../lib/logger');
const errorTracking = require('../lib/errorTracking');
const { getPerformanceStats } = require('../middleware/performanceMonitor');
const { getSecurityStats } = require('../middleware/securityMonitor');
const respond = require('../middleware/respond');

const router = express.Router();

/**
 * GET /api/admin/monitoring/stats
 * Get monitoring statistics (admin only)
 */
router.get('/stats', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const errorStats = errorTracking.getErrorStats();
    const performanceStats = getPerformanceStats();
    const securityStats = getSecurityStats();

    logger.info('Monitoring stats requested', {
      correlationId: req.correlationId,
      userId: req._userId,
    });

    return respond.ok(res, 200, {
      errors: errorStats,
      performance: performanceStats,
      security: securityStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get monitoring stats', {
      error,
      correlationId: req.correlationId,
      userId: req._userId,
    });
    return respond.error(res, 500, 'monitoring_stats_failed', 'Failed to retrieve monitoring statistics');
  }
});

module.exports = router;