const express = require('express')
const { requireJwt, requireRole } = require('../middleware/auth')
const respond = require('../middleware/respond')
const AuditLog = require('../models/AuditLog')
const User = require('../models/User')
const AuditViewLog = require('../models/AuditViewLog')
const auditVerifier = require('../lib/auditVerifier')
const { isBusinessOwnerRole, isAdminRole } = require('../lib/roleHelpers')
const { maskSensitiveData } = require('../lib/dataMasker')
const { validateBody, Joi } = require('../middleware/validation')
const { containsSqlInjection } = require('../lib/sanitizer')

const router = express.Router()

/**
 * Mask sensitive data in audit log
 */
function maskAuditLogData(log) {
  const masked = { ...log }
  
  // Mask password fields
  if (masked.fieldChanged === 'password') {
    masked.oldValue = '[REDACTED]'
    masked.newValue = '[REDACTED]'
  }

  // Mask sensitive fields in metadata
  if (masked.metadata) {
    const safeMetadata = { ...masked.metadata }
    if (safeMetadata.newPasswordHash) {
      safeMetadata.newPasswordHash = '[REDACTED]'
    }
    masked.metadata = safeMetadata
  }

  return masked
}

/**
 * Log audit view for compliance
 */
async function logAuditView(viewerId, viewedUserId, auditLogId = null) {
  try {
    await AuditViewLog.create({
      viewerId,
      viewedUserId,
      auditLogId,
      viewedAt: new Date(),
      ip: 'unknown', // Will be set from request
      userAgent: 'unknown', // Will be set from request
    })
  } catch (error) {
    console.error('Failed to log audit view:', error)
    // Don't fail the request if logging fails
  }
}

// GET /api/auth/audit/history
// Get user's audit history
router.get('/history', requireJwt, async (req, res) => {
  try {
    const viewerId = req._userId
    const viewerRole = req._userRole

    // Validate query parameters for SQL injection
    const requestedEventType = req.query.eventType
    const requestedUserId = req.query.userId
    
    if (requestedEventType && containsSqlInjection(String(requestedEventType))) {
      return respond.error(res, 400, 'validation_error', 'Invalid query parameter: SQL injection attempt detected')
    }
    
    if (requestedUserId && containsSqlInjection(String(requestedUserId))) {
      return respond.error(res, 400, 'validation_error', 'Invalid query parameter: SQL injection attempt detected')
    }

    // Determine which user's audit history to view
    let targetUserId = viewerId

    // Admins can view any user's audit history
    if (requestedUserId && isAdminRole(viewerRole)) {
      targetUserId = requestedUserId
    } else if (requestedUserId && requestedUserId !== viewerId) {
      // Non-admins can only view their own
      return respond.error(res, 403, 'forbidden', 'You can only view your own audit history')
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).lean()
    if (!targetUser) {
      return respond.error(res, 404, 'user_not_found', 'User not found')
    }

    // Parse query parameters
    const limit = Math.min(Number(req.query.limit) || 50, 100) // Max 100
    const skip = Number(req.query.skip) || 0
    const eventType = requestedEventType
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null

    // Build query
    const query = { userId: targetUserId }
    if (eventType) {
      query.eventType = eventType
    }
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = startDate
      if (endDate) query.createdAt.$lte = endDate
    }

    // Get audit logs
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    // Mask sensitive data
    const safeLogs = auditLogs.map((log) => {
      const masked = maskAuditLogData(log)
      return {
        id: String(masked._id),
        eventType: masked.eventType,
        fieldChanged: masked.fieldChanged,
        oldValue: masked.oldValue,
        newValue: masked.newValue,
        role: masked.role,
        createdAt: masked.createdAt,
        verified: masked.verified,
        txHash: masked.txHash,
        blockNumber: masked.blockNumber,
        metadata: masked.metadata,
      }
    })

    const total = await AuditLog.countDocuments(query)

    // Log audit view for compliance
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    await AuditViewLog.create({
      viewerId,
      viewedUserId: targetUserId,
      viewedAt: new Date(),
      ip,
      userAgent,
      metadata: {
        limit,
        skip,
        eventType,
        startDate,
        endDate,
      },
    }).catch((err) => {
      console.error('Failed to log audit view:', err)
    })

    return res.json({
      success: true,
      logs: safeLogs,
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
    })
  } catch (err) {
    console.error('GET /api/auth/audit/history error:', err)
    return respond.error(res, 500, 'audit_history_failed', 'Failed to retrieve audit history')
  }
})

// GET /api/auth/audit/history/:auditLogId
// Get specific audit log
router.get('/history/:auditLogId', requireJwt, async (req, res) => {
  try {
    const viewerId = req._userId
    const viewerRole = req._userRole
    const { auditLogId } = req.params

    // Validate auditLogId format (MongoDB ObjectId)
    if (!auditLogId || !/^[0-9a-fA-F]{24}$/.test(auditLogId)) {
      return respond.error(res, 400, 'invalid_audit_log_id', 'Invalid audit log ID format')
    }

    const auditLog = await AuditLog.findById(auditLogId).lean()
    if (!auditLog) {
      return respond.error(res, 404, 'audit_log_not_found', 'Audit log not found')
    }

    // Check permissions
    const isOwner = String(auditLog.userId) === String(viewerId)
    const isAdmin = isAdminRole(viewerRole)

    if (!isOwner && !isAdmin) {
      return respond.error(res, 403, 'forbidden', 'You do not have permission to view this audit log')
    }

    // Mask sensitive data
    const safeLog = maskAuditLogData(auditLog)

    // Log audit view for compliance (async, don't wait)
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      AuditViewLog.create({
        viewerId,
        viewedUserId: auditLog.userId,
        auditLogId,
        viewedAt: new Date(),
        ip,
        userAgent,
      }).catch((err) => {
        console.error('Failed to log audit view:', err)
      })
    } catch (err) {
      // Ignore audit view logging errors
      console.error('Failed to create audit view log:', err)
    }

    return res.json({
      success: true,
      log: {
        id: String(safeLog._id),
        eventType: safeLog.eventType,
        fieldChanged: safeLog.fieldChanged,
        oldValue: safeLog.oldValue,
        newValue: safeLog.newValue,
        role: safeLog.role,
        createdAt: safeLog.createdAt,
        updatedAt: safeLog.updatedAt,
        verified: safeLog.verified,
        txHash: safeLog.txHash,
        blockNumber: safeLog.blockNumber,
        metadata: safeLog.metadata,
      },
    })
  } catch (err) {
    console.error('GET /api/auth/audit/history/:auditLogId error:', err)
    return respond.error(res, 500, 'audit_log_fetch_failed', 'Failed to retrieve audit log')
  }
})

// GET /api/auth/audit/verify/:auditLogId
// Verify audit log integrity against blockchain
router.get('/verify/:auditLogId', requireJwt, async (req, res) => {
  try {
    const viewerId = req._userId
    const viewerRole = req._userRole
    const { auditLogId } = req.params

    // Validate auditLogId format (MongoDB ObjectId)
    if (!auditLogId || !/^[0-9a-fA-F]{24}$/.test(auditLogId)) {
      return respond.error(res, 400, 'invalid_audit_log_id', 'Invalid audit log ID format')
    }

    const auditLog = await AuditLog.findById(auditLogId).lean()
    if (!auditLog) {
      return respond.error(res, 404, 'audit_log_not_found', 'Audit log not found')
    }

    // Check permissions
    const isOwner = String(auditLog.userId) === String(viewerId)
    const isAdmin = isAdminRole(viewerRole)

    if (!isOwner && !isAdmin) {
      return respond.error(res, 403, 'forbidden', 'You do not have permission to verify this audit log')
    }

    // Verify against blockchain
    const verificationResult = await auditVerifier.verifyAuditLog(auditLogId)

    return res.json({
      success: true,
      verification: verificationResult,
    })
  } catch (err) {
    console.error('GET /api/auth/audit/verify/:auditLogId error:', err)
    return respond.error(res, 500, 'verification_failed', 'Failed to verify audit log')
  }
})

// GET /api/auth/audit/export
// Export audit history (CSV/JSON) - GDPR compliance
const exportSchema = Joi.object({
  format: Joi.string().valid('json', 'csv').default('json'),
  eventType: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  userId: Joi.string().optional(), // For admins only
})

router.get('/export', requireJwt, async (req, res) => {
  try {
    const viewerId = req._userId
    const viewerRole = req._userRole
    const { format = 'json', eventType, startDate, endDate, userId } = req.query || {}

    // Determine target user
    let targetUserId = viewerId
    if (userId && isAdminRole(viewerRole)) {
      targetUserId = userId
    } else if (userId && userId !== viewerId) {
      return respond.error(res, 403, 'forbidden', 'You can only export your own audit history')
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).lean()
    if (!targetUser) {
      return respond.error(res, 404, 'user_not_found', 'User not found')
    }

    // Build query
    const query = { userId: targetUserId }
    if (eventType) {
      query.eventType = eventType
    }
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    // Get all matching audit logs (no pagination for export)
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .lean()

    // Mask sensitive data
    const safeLogs = auditLogs.map((log) => maskAuditLogData(log))

    // Log export for compliance
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    await AuditViewLog.create({
      viewerId,
      viewedUserId: targetUserId,
      viewedAt: new Date(),
      ip,
      userAgent,
      metadata: {
        action: 'export',
        format,
        eventType,
        startDate,
        endDate,
        recordCount: safeLogs.length,
      },
    }).catch((err) => {
      console.error('Failed to log audit export:', err)
    })

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = ['ID', 'Event Type', 'Field Changed', 'Old Value', 'New Value', 'Role', 'Created At', 'Verified', 'TX Hash']
      const csvRows = safeLogs.map((log) => [
        String(log._id),
        log.eventType || '',
        log.fieldChanged || '',
        log.oldValue || '',
        log.newValue || '',
        log.role || '',
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.verified ? 'Yes' : 'No',
        log.txHash || '',
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="audit-history-${Date.now()}.csv"`)
      return res.send(csvContent)
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="audit-history-${Date.now()}.json"`)
      return res.json({
        exportedAt: new Date().toISOString(),
        userId: String(targetUserId),
        totalRecords: safeLogs.length,
        logs: safeLogs.map((log) => ({
          id: String(log._id),
          eventType: log.eventType,
          fieldChanged: log.fieldChanged,
          oldValue: log.oldValue,
          newValue: log.newValue,
          role: log.role,
          createdAt: log.createdAt,
          verified: log.verified,
          txHash: log.txHash,
          blockNumber: log.blockNumber,
        })),
      })
    }
  } catch (err) {
    console.error('GET /api/auth/audit/export error:', err)
    return respond.error(res, 500, 'export_failed', 'Failed to export audit history')
  }
})

// GET /api/auth/audit/stats
// Get audit statistics (admin only)
router.get('/stats', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await auditVerifier.getVerificationStats()

    return res.json({
      success: true,
      stats,
    })
  } catch (err) {
    console.error('GET /api/auth/audit/stats error:', err)
    return respond.error(res, 500, 'stats_failed', 'Failed to retrieve audit statistics')
  }
})

module.exports = router
