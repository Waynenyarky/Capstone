/**
 * Audit Logger Utility (Simplified for Business Service)
 * Creates audit logs - blockchain logging is optional
 */

const crypto = require('crypto')
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
async function createAuditLog(userId, eventType, fieldChanged, oldValue, newValue, role, metadata = {}) {
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
      metadata: fullMetadata,
      hash,
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
