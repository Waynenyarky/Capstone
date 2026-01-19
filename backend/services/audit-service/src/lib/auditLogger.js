/**
 * Audit Logger Utility
 * Shared utility for creating audit logs and logging to blockchain
 */

const crypto = require('crypto')
const AuditLog = require('../models/AuditLog')
const blockchainService = require('./blockchainService')
const blockchainQueue = require('./blockchainQueue')

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
 * Create audit log and log to blockchain
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

    // Queue blockchain operation (non-blocking, with retry)
    if (blockchainService.isAvailable()) {
      blockchainQueue.queueBlockchainOperation(
        'logAuditHash',
        [auditLog.hash, eventType],
        String(auditLog._id)
      )
    } else {
      console.warn('Blockchain service not available, audit log created but not logged to blockchain')
    }

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
