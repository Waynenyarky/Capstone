/**
 * Audit Logger Utility for Auth Service
 * Creates audit logs and calls Audit Service for blockchain logging
 */

const crypto = require('crypto')
const AuditLog = require('../models/AuditLog')
const axios = require('axios')
const logger = require('./logger')

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
 * Create audit log and log to blockchain via Audit Service
 * Non-blocking - operation succeeds even if blockchain logging fails
 */
async function createAuditLog(userId, eventType, fieldChanged, oldValue, newValue, role, metadata = {}) {
  try {
    // Prepare metadata
    const fullMetadata = {
      ...metadata,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
    }
    
    // Calculate hash before creating document (to avoid validation issues)
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
    
    // Create audit log entry with hash already calculated
    const auditLog = await AuditLog.create({
      userId,
      eventType,
      fieldChanged,
      oldValue: oldValue || '',
      newValue: newValue || '',
      role,
      metadata: fullMetadata,
      hash, // Set hash directly
    })

    // Queue blockchain operation via Audit Service (non-blocking)
    const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'
    axios.post(`${auditServiceUrl}/api/audit/log`, {
      operation: 'logAuditHash',
      params: [auditLog.hash, eventType],
      auditLogId: String(auditLog._id)
    }).catch((err) => {
      logger.warn('Failed to log to blockchain via Audit Service', { error: err.message })
    })

    return auditLog
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break operations
    logger.error('Error creating audit log', { error })
    return null
  }
}

module.exports = {
  createAuditLog,
  calculateAuditHash,
}
