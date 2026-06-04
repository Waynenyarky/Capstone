/**
 * Audit Logger Utility
 * Shared utility for creating audit logs and logging to blockchain
 */

const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("./blockchainService");
const blockchainQueue = require("./blockchainQueue");

/**
 * Calculate audit hash for an audit log entry
 */
function calculateAuditHash(
  userId,
  eventType,
  fieldChanged,
  oldValue,
  newValue,
  role,
  metadata,
  timestamp,
) {
  const hashableData = {
    userId: String(userId),
    eventType,
    fieldChanged: fieldChanged || "",
    oldValue: oldValue || "",
    newValue: newValue || "",
    role,
    metadata: JSON.stringify(metadata || {}),
    timestamp,
  };
  const dataString = JSON.stringify(hashableData);
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

/**
 * Create audit log and log to blockchain
 * Non-blocking - operation succeeds even if blockchain logging fails
 * Uses explicit createdAt so verifyHash() (which uses createdAt) matches the hash.
 */
async function createAuditLog(
  userId,
  eventType,
  fieldChanged,
  oldValue,
  newValue,
  role,
  metadata = {},
) {
  try {
    // Prepare metadata
    const fullMetadata = {
      ...metadata,
      ip: metadata.ip || "unknown",
      userAgent: metadata.userAgent || "unknown",
    };

    // Use one timestamp for both hash and createdAt so verification passes
    const timestamp = new Date();
    const timestampISO = timestamp.toISOString();
    const hash = calculateAuditHash(
      userId,
      eventType,
      fieldChanged,
      oldValue || "",
      newValue || "",
      role,
      fullMetadata,
      timestampISO,
    );

    // Create audit log with hash and createdAt set so verifyHash() matches
    const auditLog = await AuditLog.create({
      userId,
      eventType,
      fieldChanged,
      oldValue: oldValue || "",
      newValue: newValue || "",
      role,
      metadata: fullMetadata,
      hash,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Queue blockchain operation (non-blocking, with retry)
    if (blockchainService.isAvailable()) {
      blockchainQueue.queueBlockchainOperation(
        "logAuditHash",
        [auditLog.hash, eventType],
        String(auditLog._id),
      );
    } else {
      console.warn(
        "Blockchain service not available, audit log created but not logged to blockchain",
      );
    }

    return auditLog;
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break operations
    console.error("Error creating audit log:", error);
    return null;
  }
}

module.exports = {
  createAuditLog,
  calculateAuditHash,
};
