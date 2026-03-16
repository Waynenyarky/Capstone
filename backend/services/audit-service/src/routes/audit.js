const express = require('express');
const crypto = require('crypto');
const { requireJwt, requireRole } = require('../middleware/auth');
const respond = require('../middleware/respond');
const { auditLogRateLimit, auditVerifyRateLimit } = require('../middleware/rateLimit');
const { requireServiceAuth } = require('../middleware/requireServiceAuth');
const logger = require('../lib/logger');
const AuditLog = require('../models/AuditLog');
const blockchainService = require('../lib/blockchainService');
const router = express.Router();

// GET /api/audit/history - Get audit history (least privilege: non-admin sees only own logs)
router.get('/history', requireJwt, async (req, res) => {
  try {
    const { userId, eventType, startDate, endDate, limit = 50, skip = 0 } = req.query;
    const isAdmin = req._userRole === 'admin' || req._userRole === 'super_admin';
    
    const query = {};
    if (userId) {
      if (!isAdmin && userId !== req._userId) {
        return respond.error(res, 403, 'forbidden', 'Cannot view other users\' audit history');
      }
      query.userId = userId;
    } else if (!isAdmin) {
      query.userId = req._userId;
    }
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
router.get('/verify/:auditLogId', requireJwt, auditVerifyRateLimit(), async (req, res) => {
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

// POST /api/audit/verify-data - Verify raw data against on-chain hash (hash is one-way; we verify data matches)
router.post('/verify-data', requireJwt, auditVerifyRateLimit(), async (req, res) => {
  try {
    const { data } = req.body;
    if (data == null || (typeof data === 'string' && !data.trim())) {
      return respond.error(res, 400, 'missing_data', 'Request body must include "data" (string) to verify');
    }
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const hash = crypto.createHash('sha256').update(dataStr).digest('hex');
    const verifyResult = await blockchainService.verifyHash(hash);

    return res.json({
      success: true,
      verified: verifyResult.exists || false,
      hash,
      blockchain: {
        exists: verifyResult.exists,
        timestamp: verifyResult.timestamp,
      },
      message: verifyResult.exists
        ? 'Data matches a hash stored on-chain.'
        : 'Data does not match any stored hash.',
    });
  } catch (err) {
    console.error('POST /api/audit/verify-data error:', err);
    return respond.error(res, 500, 'verification_failed', 'Failed to verify data');
  }
});

// POST /api/audit/log - Queue blockchain operation (called by other services)
router.post('/log', requireServiceAuth, auditLogRateLimit(), async (req, res) => {
  try {
    const { operation, params, auditLogId } = req.body;
    const eventType = Array.isArray(params) && params[1] != null ? params[1] : operation;
    logger.info('Audit log received from service', { operation, eventType, auditLogId });

    // Gas policy: classify event tier
    const gasPolicy = require('../lib/gasPolicy');
    const policy = gasPolicy.classify(operation, eventType);
    logger.info('Gas policy classification', { operation, eventType, tier: policy.tier });

    // Tier C: off-chain only — skip blockchain entirely
    if (policy.skip) {
      if (auditLogId) {
        await AuditLog.findByIdAndUpdate(auditLogId, { blockchainStatus: 'skipped', blockchainError: 'off-chain-only tier' }).catch(() => {});
      }
      return res.json({ success: true, queued: false, tier: policy.tier, message: 'Event classified as off-chain only' });
    }

    // Dedup check: if logAuditHash and we have a hash param, skip if already anchored
    if (operation === 'logAuditHash' && Array.isArray(params) && params[0]) {
      const existingAnchored = await AuditLog.findOne({ hash: params[0], blockchainStatus: 'anchored' }).lean();
      if (existingAnchored) {
        logger.info('Dedup: hash already anchored, skipping', { hash: params[0] });
        return res.json({ success: true, queued: false, dedup: true, message: 'Hash already anchored on-chain' });
      }
    }

    // This endpoint is called by other services to log to blockchain
    if (blockchainService && blockchainService.isAvailable && blockchainService.isAvailable()) {
      const blockchainQueue = require('../lib/blockchainQueue');

      if (policy.anchor) {
        // Tier A: immediate queue (high priority)
        blockchainQueue.queueBlockchainOperation(operation, params, auditLogId);
        return res.json({ success: true, queued: true, tier: policy.tier });
      } else if (policy.batch) {
        // Tier B: add to batch buffer for scheduled commit
        blockchainQueue.addToBatchBuffer(operation, params, auditLogId);
        return res.json({ success: true, queued: true, tier: policy.tier, batched: true });
      }

      // Fallback: queue normally
      blockchainQueue.queueBlockchainOperation(operation, params, auditLogId);
      return res.json({ success: true, queued: true, tier: policy.tier });
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
router.post('/store-document', requireServiceAuth, async (req, res) => {
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
router.post('/register-user', requireServiceAuth, async (req, res) => {
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

// GET /api/audit/queue-status — blockchain queue health (service-to-service)
router.get('/queue-status', requireServiceAuth, async (req, res) => {
  try {
    const blockchainQueue = require('../lib/blockchainQueue');
    const status = blockchainQueue.getQueueStatus()
    const batchStatus = blockchainQueue.getBatchBufferStatus()
    const pendingCount = await AuditLog.countDocuments({ blockchainStatus: 'pending', txHash: { $in: ['', null] } })
    const failedCount = await AuditLog.countDocuments({ blockchainStatus: 'failed' })
    const skippedCount = await AuditLog.countDocuments({ blockchainStatus: 'skipped' })
    const digestCount = await AuditLog.countDocuments({ blockchainStatus: 'anchored_via_digest' })

    return res.json({
      queue: status,
      batchBuffer: batchStatus,
      unanchored: { pending: pendingCount, failed: failedCount, skipped: skippedCount, digestAnchored: digestCount },
      blockchainAvailable: blockchainService.isAvailable(),
      gasMode: blockchainService.getGasMode ? blockchainService.getGasMode() : 'unknown',
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
});

// GET /api/audit/gas-budget — gas budget status for treasury/IT dashboard
router.get('/gas-budget', requireServiceAuth, async (req, res) => {
  try {
    const gasBudgetTracker = require('../lib/gasBudgetTracker');
    return res.json(gasBudgetTracker.getStatus())
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
});

// GET /api/audit/forensic/:auditLogId — forensic analysis of a single audit record
router.get('/forensic/:auditLogId', requireServiceAuth, async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.auditLogId).lean()
    if (!auditLog) return res.status(404).json({ error: 'Audit log not found' })

    const hashableData = {
      userId: String(auditLog.userId),
      eventType: auditLog.eventType,
      fieldChanged: auditLog.fieldChanged || '',
      oldValue: auditLog.oldValue || '',
      newValue: auditLog.newValue || '',
      role: auditLog.role,
      metadata: JSON.stringify(auditLog.metadata || {}),
      timestamp: auditLog.createdAt ? auditLog.createdAt.toISOString() : '',
    }
    const currentHash = crypto.createHash('sha256').update(JSON.stringify(hashableData)).digest('hex')
    const storedHash = auditLog.hash
    const tampered = currentHash !== storedHash

    let blockchainRecord = null
    if (auditLog.txHash && blockchainService.isAvailable()) {
      try { blockchainRecord = await blockchainService.verifyHash(storedHash) } catch { blockchainRecord = null }
    }

    return res.json({
      auditLog,
      forensic: {
        currentHash,
        storedHash,
        hashMatch: !tampered,
        tampered,
        blockchainRecord,
        blockchainAnchored: !!auditLog.txHash,
        blockchainVerified: blockchainRecord?.exists || false,
        diagnosis: tampered
          ? 'The MongoDB record has been modified after it was hashed. The stored hash (anchored on blockchain) represents the ORIGINAL data.'
          : auditLog.txHash
            ? 'Record integrity verified. MongoDB data matches the blockchain-anchored hash.'
            : 'Record has not been anchored to blockchain. Integrity cannot be verified against an immutable source.',
      },
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
});

module.exports = router;
