/**
 * Audit Logger Utility (Simplified for Admin Service)
 * Creates audit logs - blockchain logging is optional
 */

const crypto = require('crypto')
const axios = require('axios')
const AuditLog = require('../models/AuditLog')

/**
 * Calculate audit hash for an audit log entry
 */
function calculateAuditHash(userId, eventType, fieldChanged, oldValue, newValue, role, metadata, timestamp) {
  const hashableData = {
    userId: String(userId),
    eventType,
    fieldChanged: fieldChanged || '',
    oldValue: oldValue || '',
    newValue: newValue || '',
    role,
    metadata: JSON.stringify(metadata || {}),
    timestamp,
  }
  const dataString = JSON.stringify(hashableData)
  return crypto.createHash('sha256').update(dataString).digest('hex')
}

/**
 * Create audit log
 * Non-blocking - operation succeeds even if logging fails
 */
async function createAuditLog(userId, eventType, fieldChanged, oldValue, newValue, role, metadata = {}, slotId = null) {
  try {
    // Prepare metadata
    const fullMetadata = {
      ...metadata,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
    }

    // Calculate hash before creating document
    const timestamp = new Date().toISOString()
    const hash = calculateAuditHash(
      userId,
      eventType,
      fieldChanged,
      oldValue || '',
      newValue || '',
      role,
      fullMetadata,
      timestamp
    )

    // Create audit log entry
    const auditLog = await AuditLog.create({
      userId,
      eventType,
      fieldChanged,
      oldValue: oldValue || '',
      newValue: newValue || '',
      role,
      slotId,
      metadata: fullMetadata,
      hash,
      blockchainStatus: 'pending',
    })

    // Forward to audit-service for blockchain anchoring (non-blocking)
    const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'
    const headers = { 'Content-Type': 'application/json' }
    if (process.env.AUDIT_SERVICE_API_KEY) headers['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY
    axios.post(`${auditServiceUrl}/api/audit/log`, {
      operation: 'logAuditHash',
      params: [hash, eventType],
      auditLogId: String(auditLog._id),
    }, { headers, timeout: 5000 }).catch(async (err) => {
      console.warn('[AuditLogger] Failed to forward audit log to Audit Service:', err.message)
      await AuditLog.findByIdAndUpdate(auditLog._id, {
        blockchainStatus: 'skipped',
        blockchainError: err.message,
      }).catch(() => {})
    })

    return auditLog
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break operations
    console.error('Error creating audit log:', error)
    return null
  }
}

module.exports = {
  createAuditLog,
  calculateAuditHash,
}
