/**
 * Audit Logger Utility (Simplified for Business Service)
 * Creates audit logs via centralized audit-service
 */

const { logAuditEvent } = require("./auditClient");

/**
 * Create audit log via centralized audit-service
 * Non-blocking - operation succeeds even if logging fails
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
      fieldChanged,
      oldValue: oldValue || "",
      newValue: newValue || "",
    };

    await logAuditEvent(
      eventType,
      userId,
      "BusinessProfile",
      userId,
      fullMetadata,
    );

    return { success: true };
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break operations
    console.error("Error creating audit log:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createAuditLog,
};
