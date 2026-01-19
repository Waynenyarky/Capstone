const express = require('express');
const { requireJwt, requireRole } = require('../middleware/auth');
const respond = require('../middleware/respond');
const AuditLog = require('../models/AuditLog');
const blockchainService = require('../lib/blockchainService');
const router = express.Router();

// GET /api/audit/history - Get audit history
router.get('/history', requireJwt, async (req, res) => {
  try {
    const { userId, eventType, startDate, endDate, limit = 50, skip = 0 } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (eventType) query.eventType = eventType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await AuditLog.countDocuments(query);

    return res.json({
      success: true,
      logs: auditLogs,
      total,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (err) {
    console.error('GET /api/audit/history error:', err);
    return respond.error(res, 500, 'fetch_audit_history_failed', 'Failed to fetch audit history');
  }
});

// GET /api/audit/verify/:auditLogId - Verify audit log integrity
router.get('/verify/:auditLogId', requireJwt, async (req, res) => {
  try {
    const { auditLogId } = req.params;
    const auditLog = await AuditLog.findById(auditLogId);
    
    if (!auditLog) {
      return respond.error(res, 404, 'audit_log_not_found', 'Audit log not found');
    }

    // Verify hash matches blockchain
    const verifyResult = await blockchainService.verifyHash(auditLog.hash);
    
    return res.json({
      success: true,
      verified: verifyResult.exists || false,
      auditLog: {
        id: String(auditLog._id),
        hash: auditLog.hash,
        eventType: auditLog.eventType,
        createdAt: auditLog.createdAt,
      },
      blockchain: {
        exists: verifyResult.exists,
        timestamp: verifyResult.timestamp,
      },
    });
  } catch (err) {
    console.error('GET /api/audit/verify/:auditLogId error:', err);
    return respond.error(res, 500, 'verification_failed', 'Failed to verify audit log');
  }
});

// POST /api/audit/log - Queue blockchain operation (called by other services)
router.post('/log', async (req, res) => {
  try {
    const { operation, params, auditLogId } = req.body;
    
    // This endpoint is called by other services to log to blockchain
    if (blockchainService && blockchainService.isAvailable && blockchainService.isAvailable()) {
      const blockchainQueue = require('../lib/blockchainQueue');
      blockchainQueue.queueBlockchainOperation(operation, params, auditLogId);
      return res.json({ success: true, queued: true });
    } else {
      // Blockchain not available, but don't fail the request
      return res.json({ success: true, queued: false, message: 'Blockchain service not available' });
    }
  } catch (err) {
    console.error('POST /api/audit/log error:', err);
    return respond.error(res, 500, 'audit_log_failed', 'Failed to queue audit log');
  }
});

// POST /api/audit/store-document - Store document CID in DocumentStorage contract (called by other services)
router.post('/store-document', async (req, res) => {
  try {
    const { userId, docType, ipfsCid } = req.body;
    
    if (!userId || !docType || !ipfsCid) {
      return respond.error(res, 400, 'missing_params', 'userId, docType, and ipfsCid are required');
    }

    const documentStorageService = require('../lib/documentStorageService');
    
    if (!documentStorageService) {
      return res.json({ success: false, error: 'DocumentStorage service not available' });
    }

    // Store document CID in blockchain (non-blocking, queue if needed)
    try {
      const result = await documentStorageService.storeDocument(userId, docType, ipfsCid);
      
      if (result.success) {
        return res.json({ success: true, txHash: result.txHash });
      } else {
        // Don't fail the request if blockchain storage fails
        return res.json({ success: false, error: result.error, queued: false });
      }
    } catch (error) {
      // Non-blocking - return success even if blockchain storage fails
      return res.json({ success: false, error: error.message, queued: false });
    }
  } catch (err) {
    console.error('POST /api/audit/store-document error:', err);
    // Non-blocking endpoint - return success even on error
    return res.json({ success: false, error: err.message });
  }
});

// POST /api/audit/register-user - Register user in UserRegistry contract (called by other services)
router.post('/register-user', async (req, res) => {
  try {
    const { userId, userAddress, profileHash } = req.body;
    
    if (!userId || !userAddress || !profileHash) {
      return respond.error(res, 400, 'missing_params', 'userId, userAddress, and profileHash are required');
    }

    const userRegistryService = require('../lib/userRegistryService');
    
    if (!userRegistryService) {
      return res.json({ success: false, error: 'UserRegistry service not available' });
    }

    // Register user in blockchain (non-blocking)
    try {
      const result = await userRegistryService.registerUser(userId, userAddress, profileHash);
      
      if (result.success) {
        return res.json({ success: true, txHash: result.txHash });
      } else {
        return res.json({ success: false, error: result.error });
      }
    } catch (error) {
      return res.json({ success: false, error: error.message });
    }
  } catch (err) {
    console.error('POST /api/audit/register-user error:', err);
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
