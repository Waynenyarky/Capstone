/**
 * Audit Logger Utility for Auth Service
 * Creates audit logs via centralized audit-service
 */

const axios = require("axios");
const logger = require("./logger");

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
 * Create audit log and log to blockchain via Audit Service
 * Non-blocking - operation succeeds even if blockchain logging fails
 * Now uses centralized audit-service ingestion endpoint
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

    // Send to audit-service ingestion endpoint
    const auditServiceUrl =
      process.env.AUDIT_SERVICE_URL || "http://localhost:3004";
    const headers = { "Content-Type": "application/json" };
    if (process.env.AUDIT_SERVICE_API_KEY)
      headers["X-API-Key"] = process.env.AUDIT_SERVICE_API_KEY;

    const response = await axios.post(
      `${auditServiceUrl}/api/audit/ingest`,
      {
        userId,
        eventType,
        entityType: "User",
        entityId: userId,
        fieldChanged,
        oldValue: oldValue || "",
        newValue: newValue || "",
        role,
        metadata: fullMetadata,
      },
      { headers },
    );

    logger.info("Audit log sent to audit-service", {
      auditLogId: response.data?.auditLogId,
      eventType,
    });

    return response.data;
  } catch (error) {
    logger.error("Failed to send audit log to audit-service", {
      error: error.message,
    });
    return null;
  }
}

module.exports = {
  createAuditLog,
  calculateAuditHash,
};
