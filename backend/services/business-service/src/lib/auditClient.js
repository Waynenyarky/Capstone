const http = require("http");
const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");

const AUDIT_SERVICE_URL =
  process.env.AUDIT_SERVICE_URL || "http://localhost:3004";

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
 * Sends an audit event to the audit-service for blockchain anchoring.
 * First creates the audit log in the local database, then queues blockchain operation.
 * Fire-and-forget: failures are logged but never block the caller.
 */
async function logAuditEvent(
  eventType,
  userId,
  entityType,
  entityId,
  metadata = {},
) {
  try {
    // Prepare metadata with entity info
    const fullMetadata = {
      ...metadata,
      entityType,
      entityId,
    };

    // Calculate hash before creating document
    const timestamp = new Date().toISOString();
    const hash = calculateAuditHash(
      userId,
      eventType,
      null, // fieldChanged
      "", // oldValue
      "", // newValue
      metadata.role || "lgu_officer",
      fullMetadata,
      timestamp,
    );

    console.log("[AuditClient] Creating audit log:", { eventType, userId, entityType, entityId });

    // Create audit log entry in local database
    const auditLog = await AuditLog.create({
      userId,
      eventType,
      fieldChanged: null,
      oldValue: "",
      newValue: "",
      role: metadata.role || "lgu_officer",
      metadata: fullMetadata,
      entityType,
      entityId,
      hash,
    });

    console.log("[AuditClient] Audit log created successfully:", auditLog._id);

    // Queue blockchain operation via Audit Service (non-blocking)
    const body = JSON.stringify({
      operation: "logAuditHash",
      params: [auditLog.hash, eventType],
      auditLogId: String(auditLog._id),
    });

    const url = new URL(`${AUDIT_SERVICE_URL}/api/audit/log`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "BizClear-BusinessService/1.0",
        "x-api-key": process.env.AUDIT_SERVICE_API_KEY || "",
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        // Fire-and-forget - don't care about response
      });
    });
    req.on("error", (err) => {
      console.error(
        "[AuditClient] Blockchain queue failed (non-blocking):",
        err.message,
      );
    });
    req.setTimeout(5000, () => {
      req.destroy();
    });
    req.write(body);
    req.end();

    return auditLog;
  } catch (err) {
    console.error("[AuditClient] Failed to create audit log:", err.message);
    return null;
  }
}

module.exports = { logAuditEvent };
