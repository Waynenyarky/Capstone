const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const { requireJwt, requireRole } = require('../middleware/auth');
const logger = require('../lib/logger');
const errorTracking = require('../lib/errorTracking');
const { getPerformanceStats } = require('../middleware/performanceMonitor');
const { getSecurityStats } = require('../middleware/securityMonitor');
const respond = require('../middleware/respond');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const router = express.Router();

const SERVICE_URLS = [
  { key: 'auth', name: 'Auth Service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001' },
  { key: 'business', name: 'Business Service', url: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3002' },
  { key: 'admin', name: 'Admin Service', url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3003' },
  { key: 'audit', name: 'Audit Service', url: process.env.AUDIT_SERVICE_URL || 'http://localhost:3004' },
];

async function checkServiceHealth({ key, name, url }) {
  const healthUrl = `${url.replace(/\/$/, '')}/api/health`;
  try {
    const res = await axios.get(healthUrl, { timeout: 5000 });
    const ok = res.status === 200 && (res.data && (res.data.ok === true || res.data.ok === undefined));
    return {
      key,
      name,
      status: ok ? 'up' : 'degraded',
      ok: !!ok,
      database: res.data && res.data.database,
      timestamp: res.data && res.data.timestamp,
    };
  } catch (err) {
    logger.warn('Service health check failed', { service: name, url: healthUrl, error: err.message });
    return { key, name, status: 'down', ok: false, error: err.message || 'Unreachable' };
  }
}

/**
 * Check AI service health (LOB model)
 */
async function checkAiServiceHealth() {
  const aiUrl = process.env.AI_SERVICE_URL || process.env.LOB_MODEL_SERVICE_URL || 'http://localhost:5050';
  try {
    const res = await axios.get(`${aiUrl}/health`, { timeout: 5000 });
    return {
      key: 'ai',
      name: 'AI Service',
      status: res.status === 200 && res.data && res.data.status === 'ok' ? 'up' : 'degraded',
      ok: res.status === 200 && res.data && res.data.status === 'ok',
      model_loaded: res.data && res.data.model_loaded,
      num_labels: res.data && res.data.num_labels,
    };
  } catch (err) {
    logger.warn('AI Service health check failed', { url: aiUrl, error: err.message });
    return { key: 'ai', name: 'AI Service', status: 'down', ok: false, error: err.message || 'Unreachable' };
  }
}

/**
 * Get IPFS availability (admin service uses IPFS for uploads).
 */
async function getIpfsStatus() {
  try {
    const ipfsService = require('../lib/ipfsService');
    const isAvailable = typeof ipfsService.isAvailable === 'function' && ipfsService.isAvailable();
    
    if (!isAvailable) {
      // Try to initialize if not already initialized
      if (typeof ipfsService.initialize === 'function') {
        await ipfsService.initialize();
        return ipfsService.isAvailable();
      }
    }
    
    return isAvailable;
  } catch (e) {
    logger.warn('Could not get IPFS status', { error: e.message });
    return false;
  }
}

/**
 * GET /api/admin/monitoring/services-health
 * Aggregate health of auth, business, admin, audit, AI services + infrastructure (admin only).
 * Returns: { services, dependencies: { mongodb, ipfs }, timestamp }
 */
router.get('/services-health', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const [serviceResults, aiResult, ipfsStatus] = await Promise.all([
      Promise.all(SERVICE_URLS.map(checkServiceHealth)),
      checkAiServiceHealth(),
      getIpfsStatus(),
    ]);
    
    const results = [...serviceResults, aiResult];
    
    const adminIndex = results.findIndex((r) => r.key === 'admin');
    if (adminIndex >= 0) {
      results[adminIndex].ok = true;
      results[adminIndex].status = mongoose.connection.readyState === 1 ? 'up' : 'degraded';
      results[adminIndex].database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    }

    const mongodbConnected = mongoose.connection.readyState === 1;
    const dependencies = {
      mongodb: mongodbConnected ? 'connected' : 'disconnected',
      ipfs: ipfsStatus ? 'connected' : 'disconnected',
    };

    return respond.ok(res, 200, {
      services: results,
      dependencies,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Services health aggregation failed', { error: err, correlationId: req.correlationId });
    return respond.error(res, 500, 'services_health_failed', 'Failed to retrieve services health');
  }
});

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

/**
 * GET /api/admin/monitoring/audit-logs
 * Get admin audit logs with pagination (admin only).
 * Query: page, limit, adminId, dateFrom, dateTo.
 * Response: { data: { logs }, meta: { total } }
 */
router.get('/audit-logs', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const adminId = req.query.adminId ? String(req.query.adminId).trim() : null;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;

    const query = {};
    if (adminId) query.userId = adminId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    const userIds = [...new Set(logs.map((l) => String(l.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id email').lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const safeLogs = logs.map((log) => {
      const user = userMap.get(String(log.userId));
      let details = [log.fieldChanged, log.oldValue, log.newValue].filter(Boolean).join(' · ');
      if (!details && log.metadata) {
        try {
          details = JSON.stringify(log.metadata).slice(0, 100);
        } catch {
          details = '';
        }
      }
      details = details || '';
      return {
        _id: log._id,
        id: String(log._id),
        userEmail: user ? user.email : (log.userId || '—'),
        userId: String(log.userId),
        action: log.eventType || '—',
        resource: log.fieldChanged || log.eventType || '—',
        resourceType: log.fieldChanged || log.eventType,
        createdAt: log.createdAt,
        details: details.slice(0, 200),
        description: details.slice(0, 200),
      };
    });

    return respond.ok(res, 200, {
      data: { logs: safeLogs },
      meta: { total },
    });
  } catch (err) {
    logger.error('Failed to get audit logs', { error: err, correlationId: req.correlationId });
    return respond.error(res, 500, 'audit_logs_failed', 'Failed to retrieve audit logs');
  }
});

module.exports = router;
