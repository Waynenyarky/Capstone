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

// GET /api/auth/audit/my-actions
// Get current user's FULL action history — both work events AND personal security events.
// Uses raw MongoDB collection to bypass Mongoose enum restrictions, since officer work
// events (application_claimed, permit_review, etc.) are written by admin-service
// and the auth-service AuditLog model's enum doesn't include them.
// Also decrypts metadata in application code since metadata is encrypted at rest.
router.get('/my-actions', requireJwt, async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const viewerId = req._userId
    const viewerIdStr = String(viewerId)
    const limit = Math.min(Number(req.query.limit) || 100, 200)
    const skip = Number(req.query.skip) || 0
    const eventType = req.query.eventType

    // Import decryption utility (safe wrapper that never throws)
    let _decrypt
    try {
      _decrypt = require('../../../../shared/lib/fieldCipher').decrypt
    } catch (e) {
      _decrypt = null
    }
    const decrypt = (v) => {
      if (!_decrypt) return v
      try { return _decrypt(v) } catch { return v }
    }

    // Query raw collection directly to bypass Mongoose enum validation
    const collection = mongoose.connection.db.collection('auditlogs')

    // Step 1: Get ALL logs where officer is the direct userId (includes security + work events)
    const directQuery = {
      userId: new mongoose.Types.ObjectId(viewerIdStr),
    }
    if (eventType) directQuery.eventType = eventType

    const directLogs = await collection
      .find(directQuery)
      .sort({ createdAt: -1 })
      .limit(limit * 3) // fetch extra since we'll merge with work logs
      .toArray()

    // Step 2: Get work-event logs where officer is identified via metadata.officerId
    // (these logs have userId = business owner, not the officer)
    const workEventTypes = [
      'permit_review', 'permit_review_started',
      'application_claimed', 'application_released', 'application_transferred',
      'decision_revoked',
    ]
    const workQuery = {
      eventType: { $in: workEventTypes },
    }
    if (eventType) workQuery.eventType = eventType

    const workLogs = await collection
      .find(workQuery)
      .sort({ createdAt: -1 })
      .limit(500) // reasonable window
      .toArray()

    // Decrypt metadata and filter by officerId
    const officerWorkLogs = workLogs.filter(log => {
      // Skip if we already have this log from directQuery (userId matches officer)
      if (String(log.userId) === viewerIdStr) return false

      let meta = log.metadata
      if (typeof meta === 'string') {
        try { meta = JSON.parse(decrypt(meta) || meta) } catch { return false }
      }
      if (!meta || typeof meta !== 'object') return false
      const officerId = meta.officerId
      return officerId && String(officerId) === viewerIdStr
    })

    // Merge and deduplicate by _id
    const seen = new Set()
    const merged = []
    for (const log of [...directLogs, ...officerWorkLogs]) {
      const id = String(log._id)
      if (seen.has(id)) continue
      seen.add(id)
      merged.push(log)
    }

    // Sort by createdAt desc, apply pagination
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const paginated = merged.slice(skip, skip + limit)

    // Decrypt fields and format response
    const safeLogs = paginated.map((log) => {
      let meta = log.metadata
      if (typeof meta === 'string') {
        try { meta = JSON.parse(decrypt(meta) || meta) } catch { meta = {} }
      }
      return {
        _id: String(log._id),
        eventType: log.eventType,
        fieldChanged: log.fieldChanged || null,
        oldValue: decrypt(log.oldValue) || log.oldValue || '',
        newValue: decrypt(log.newValue) || log.newValue || '',
        role: decrypt(log.role) || log.role || '',
        createdAt: log.createdAt,
        verified: log.verified || false,
        txHash: log.txHash || '',
        blockNumber: log.blockNumber || null,
        metadata: meta,
      }
    })

    return res.json({
      success: true,
      logs: safeLogs,
      total: merged.length,
      limit,
      skip,
      hasMore: skip + limit < merged.length,
    })
  } catch (err) {
    console.error('GET /api/auth/audit/my-actions error:', err)
    return respond.error(res, 500, 'my_actions_failed', 'Failed to retrieve action history')
  }
})

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

// GET /api/auth/audit/admin/all — register before /admin/recent so static path matches first
// Get all audit logs across all users (admin only) with pagination, filters, search
router.get('/admin/all', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const skip = Number(req.query.skip) || 0
    const eventType = req.query.eventType
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null
    const search = req.query.search ? String(req.query.search).trim() : ''

    const query = {}
    if (eventType) query.eventType = eventType
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = startDate
      if (endDate) query.createdAt.$lte = endDate
    }

    // If search is provided, find matching users first
    let userFilter = null
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      }).select('_id').lean()
      userFilter = matchingUsers.map((u) => u._id)
      query.userId = { $in: userFilter }
    }

    const [auditLogs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
      AuditLog.countDocuments(query),
    ])

    // Collect unique userIds (target users) to resolve names
    const userIds = [...new Set(auditLogs.map((l) => String(l.userId)))]
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id firstName lastName email office role')
      .populate('role')
      .lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    // Resolve "performed by" (actor) from metadata: changedBy, resetBy, issuedBy, approvedBy, deniedBy, reviewedBy
    const performerIdKeys = ['changedBy', 'resetBy', 'issuedBy', 'approvedBy', 'deniedBy', 'reviewedBy']
    const performerIds = new Set()
    auditLogs.forEach((log) => {
      const meta = log.metadata || {}
      for (const key of performerIdKeys) {
        const val = meta[key]
        if (val != null) {
          const ids = Array.isArray(val) ? val : [val]
          ids.forEach((id) => {
            const sid = String(id)
            if (sid && /^[0-9a-fA-F]{24}$/.test(sid)) performerIds.add(sid)
          })
          break
        }
      }
    })
    const performerUsers = await User.find({ _id: { $in: [...performerIds] } })
      .select('_id firstName lastName email')
      .lean()
    const performerMap = new Map(performerUsers.map((u) => [String(u._id), u]))

    const safeLogs = auditLogs.map((log) => {
      const masked = maskAuditLogData(log)
      const user = userMap.get(String(masked.userId))
      let performedBy = null
      const meta = masked.metadata || {}
      for (const key of performerIdKeys) {
        const val = meta[key]
        if (val != null) {
          const id = Array.isArray(val) ? val[0] : val
          const sid = String(id)
          if (sid && /^[0-9a-fA-F]{24}$/.test(sid)) {
            const performer = performerMap.get(sid)
            performedBy = performer ? [performer.firstName, performer.lastName].filter(Boolean).join(' ') || performer.email : null
            if (performedBy) break
          }
          break
        }
      }
      return {
        id: String(masked._id),
        userId: String(masked.userId),
        eventType: masked.eventType,
        fieldChanged: masked.fieldChanged,
        oldValue: masked.oldValue,
        newValue: masked.newValue,
        role: masked.role,
        performedBy: performedBy || undefined,
        user: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '—',
        userEmail: user?.email || '—',
        userRole: user?.role?.slug || '—',
        office: user?.office || '—',
        createdAt: masked.createdAt,
        metadata: masked.metadata,
      }
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
    console.error('GET /api/auth/audit/admin/all error:', err)
    return respond.error(res, 500, 'admin_audit_failed', 'Failed to retrieve admin audit logs')
  }
})

// GET /api/auth/admin/audit/recent
// Get recent audit activity across all staff (admin only)
router.get('/admin/recent', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const Role = require('../models/Role')
    const { getStaffRoles } = require('../lib/roleHelpers')
    await require('../lib/roleHelpers').refreshStaffRoleCache()
    const staffRoleSlugs = [...getStaffRoles(), 'admin']
    const staffRoles = await Role.find({ slug: { $in: staffRoleSlugs } }).lean()
    const roleIds = staffRoles.map((r) => r._id)
    const staffUsers = await User.find({ role: { $in: roleIds } }).select('_id firstName lastName email office role').populate('role').lean()
    const staffIds = staffUsers.map((u) => u._id)
    const userMap = new Map(staffUsers.map((u) => [String(u._id), u]))

    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const auditLogs = await AuditLog.find({ userId: { $in: staffIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const safeLogs = auditLogs.map((log) => {
      const masked = maskAuditLogData(log)
      const user = userMap.get(String(masked.userId))
      const roleSlug = user?.role?.slug || ''
      return {
        id: String(masked._id),
        eventType: masked.eventType,
        fieldChanged: masked.fieldChanged,
        user: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '—',
        role: roleSlug,
        office: user?.office || '—',
        createdAt: masked.createdAt,
        metadata: masked.metadata,
      }
    })

    return res.json({
      success: true,
      logs: safeLogs,
    })
  } catch (err) {
    console.error('GET /api/auth/admin/audit/recent error:', err)
    return respond.error(res, 500, 'recent_audit_failed', 'Failed to retrieve recent audit activity')
  }
})

// GET /api/auth/audit/staff/all
// Get all audit logs for staff users (lgu_officer, lgu_manager, etc.)
// Shows system-wide logs relevant to staff operations
router.get('/staff/all', requireJwt, async (req, res) => {
  try {
    const viewerRole = req._userRole
    const { isStaffRole } = require('../lib/roleHelpers')
    
    // Only staff and admin can access this endpoint
    if (!isStaffRole(viewerRole) && viewerRole !== 'admin') {
      return respond.error(res, 403, 'forbidden', 'Staff access required')
    }

    const limit = Math.min(Number(req.query.limit) || 100, 200)
    const skip = Number(req.query.skip) || 0
    const eventType = req.query.eventType
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null
    const search = req.query.search ? String(req.query.search).trim() : ''

    // Build query - show all logs (not filtered by userId)
    const query = {}
    if (eventType) query.eventType = eventType
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = startDate
      if (endDate) query.createdAt.$lte = endDate
    }

    // If search is provided, find matching users first
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      }).select('_id').lean()
      if (matchingUsers.length > 0) {
        query.userId = { $in: matchingUsers.map((u) => u._id) }
      } else {
        // Also search by eventType
        query.$or = [
          { eventType: searchRegex },
        ]
      }
    }

    const [auditLogs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
      AuditLog.countDocuments(query),
    ])

    // Collect unique userIds to resolve names
    const userIds = [...new Set(auditLogs.map((l) => String(l.userId)))]
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id firstName lastName email office role')
      .populate('role')
      .lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    // Resolve "performed by" (actor) from metadata
    const performerIdKeys = ['changedBy', 'resetBy', 'issuedBy', 'approvedBy', 'deniedBy', 'reviewedBy', 'claimedBy', 'releasedBy', 'transferredBy']
    const performerIds = new Set()
    auditLogs.forEach((log) => {
      const meta = log.metadata || {}
      for (const key of performerIdKeys) {
        const val = meta[key]
        if (val != null) {
          const ids = Array.isArray(val) ? val : [val]
          ids.forEach((id) => {
            const sid = String(id)
            if (sid && /^[0-9a-fA-F]{24}$/.test(sid)) performerIds.add(sid)
          })
        }
      }
    })
    const performerUsers = performerIds.size > 0 
      ? await User.find({ _id: { $in: [...performerIds] } }).select('_id firstName lastName email').lean()
      : []
    const performerMap = new Map(performerUsers.map((u) => [String(u._id), u]))

    const safeLogs = auditLogs.map((log) => {
      const masked = maskAuditLogData(log)
      const user = userMap.get(String(masked.userId))
      let performedBy = null
      const meta = masked.metadata || {}
      for (const key of performerIdKeys) {
        const val = meta[key]
        if (val != null) {
          const id = Array.isArray(val) ? val[0] : val
          const sid = String(id)
          if (sid && /^[0-9a-fA-F]{24}$/.test(sid)) {
            const performer = performerMap.get(sid)
            performedBy = performer ? [performer.firstName, performer.lastName].filter(Boolean).join(' ') || performer.email : null
          }
          break
        }
      }
      return {
        _id: String(masked._id),
        userId: String(masked.userId),
        eventType: masked.eventType,
        fieldChanged: masked.fieldChanged,
        oldValue: masked.oldValue,
        newValue: masked.newValue,
        role: masked.role,
        performedBy: performedBy || undefined,
        user: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '—',
        userEmail: user?.email || '—',
        userRole: user?.role?.slug || '—',
        office: user?.office || '—',
        createdAt: masked.createdAt,
        metadata: masked.metadata,
        verified: masked.verified,
        txHash: masked.txHash,
      }
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
    console.error('GET /api/auth/audit/staff/all error:', err)
    return respond.error(res, 500, 'staff_audit_failed', 'Failed to retrieve staff audit logs')
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
