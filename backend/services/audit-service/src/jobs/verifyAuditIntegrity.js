const AuditLog = require('../models/AuditLog')
// TamperIncident lives in admin-service; in Docker each service has its own codebase, so it may be missing
let TamperIncident = null
try {
  TamperIncident = require('../../../admin-service/src/models/TamperIncident')
} catch (_) {
  // Running as standalone audit-service (e.g. Docker): call admin-service API to create incidents
}

const auditVerifier = require('../lib/auditVerifier')
const logger = require('../lib/logger')
const auditLogger = require('../lib/auditLogger')

// Configurable scope and limits
const WINDOW_HOURS = Number(process.env.AUDIT_VERIFY_WINDOW_HOURS || 24)
const MAX_PER_RUN = Number(process.env.AUDIT_VERIFY_MAX || 200)
const ALERT_COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes to dedupe noisy alerts
// Skip verifying logs created in the last N minutes (pending blockchain anchor)
const VERIFY_GRACE_MINUTES = Number(process.env.AUDIT_VERIFY_GRACE_MINUTES || 15)

const lastAlertMap = new Map()

function buildWindowDate() {
  const now = Date.now()
  return new Date(now - WINDOW_HOURS * 60 * 60 * 1000)
}

function classifyVerificationStatus(verification) {
  if (verification.error) {
    const errLower = verification.error.toLowerCase()
    if (errLower.includes('hash does not match')) {
      return 'tamper_detected'
    }
    if (errLower.includes('no transaction hash')) {
      return 'not_logged'
    }
    if (verification.error.toLowerCase().includes('no transaction hash')) {
      return 'not_logged'
    }
    return 'verification_error'
  }
  return 'tamper_detected'
}

/**
 * Log tamper/integrity finding as a security_event in the audit log (durable trail).
 * Called for every verification failure (except blockchain unavailable) before recording incident.
 */
async function logSecurityEventForTamper(auditLog, verification) {
  const verificationStatus = classifyVerificationStatus(verification)
  try {
    await auditLogger.createAuditLog(
      auditLog.userId,
      'security_event',
      'security',
      '',
      `audit_tamper_detected:${verificationStatus}`,
      'system',
      {
        reason: 'audit_tamper_detected',
        auditLogId: String(auditLog._id),
        verificationStatus,
        error: verification.error || verification.errorMessage,
      }
    )
  } catch (err) {
    logger.error('Failed to log security_event for tamper finding', { err, auditLogId: String(auditLog._id) })
  }
}

/**
 * Call admin-service to create/update TamperIncident when model is not available in this service (e.g. Docker).
 */
async function createIncidentViaAdminApi(auditLog, verification) {
  const baseUrl = process.env.ADMIN_SERVICE_URL || ''
  if (!baseUrl) {
    logger.warn('ADMIN_SERVICE_URL not set; cannot create tamper incident via API')
    return null
  }

  const verificationStatus = classifyVerificationStatus(verification)
  const severity = verificationStatus === 'tamper_detected' ? 'high' : 'medium'
  const message =
    verification.error ||
    verification.errorMessage ||
    verification.details?.error ||
    'Audit log integrity issue detected'

  const axios = require('axios')
  const internalKey = process.env.ADMIN_SERVICE_INTERNAL_API_KEY || ''
  try {
    const res = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/api/admin/tamper/incidents`,
      {
        eventType: 'audit_tamper_detected',
        auditLogId: String(auditLog._id),
        userId: String(auditLog.userId),
        verificationStatus,
        message,
        severity,
        verification,
        hash: auditLog.hash,
        txHash: auditLog.txHash,
        blockNumber: auditLog.blockNumber,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(internalKey && { 'X-Internal-API-Key': internalKey }),
        },
        timeout: 5000,
      }
    )
    if (res.data && res.data.incident) {
      return res.data.incident
    }
    return null
  } catch (err) {
    logger.error('Could not create tamper incident via admin-service (security_event was still written)', {
      error: err.message,
      auditLogId: String(auditLog._id),
      response: err.response && err.response.data,
    })
    return null
  }
}

async function recordIncident(auditLog, verification) {
  if (!TamperIncident) {
    const verificationStatus = classifyVerificationStatus(verification)
    const incident = await createIncidentViaAdminApi(auditLog, verification)
    if (!incident) {
      logger.warn('Audit tamper/integrity issue (could not create incident via admin-service)', {
        auditLogId: String(auditLog._id),
        userId: String(auditLog.userId),
        verificationStatus,
        error: verification.error || verification.errorMessage,
      })
    }
    return incident ? { _id: incident.id } : null
  }

  const verificationStatus = classifyVerificationStatus(verification)
  const severity = verificationStatus === 'tamper_detected' ? 'high' : 'medium'
  const message =
    verification.error ||
    verification.errorMessage ||
    verification.details?.error ||
    'Audit log integrity issue detected'

  const payload = {
    auditLogId: String(auditLog._id),
    userId: String(auditLog.userId),
    hash: auditLog.hash,
    txHash: auditLog.txHash,
    blockNumber: auditLog.blockNumber,
    verification,
  }

  let incident = await TamperIncident.findOne({
    auditLogIds: { $in: [auditLog._id] },
    status: { $ne: 'resolved' },
  })

  if (!incident) {
    incident = await TamperIncident.create({
      status: 'new',
      severity,
      verificationStatus,
      message,
      containmentActive: verificationStatus === 'tamper_detected',
      lastSeenAt: new Date(),
      detectedAt: new Date(),
      verificationPayload: payload,
      affectedUserIds: [auditLog.userId],
      auditLogIds: [auditLog._id],
      verificationEvents: [
        {
          at: new Date(),
          payload,
        },
      ],
    })
  } else {
    incident.severity = severity
    incident.verificationStatus = verificationStatus
    incident.message = message
    incident.containmentActive = verificationStatus === 'tamper_detected'
    incident.lastSeenAt = new Date()
    incident.verificationPayload = payload
    if (!incident.affectedUserIds.map(String).includes(String(auditLog.userId))) {
      incident.affectedUserIds.push(auditLog.userId)
    }
    if (!incident.auditLogIds.map(String).includes(String(auditLog._id))) {
      incident.auditLogIds.push(auditLog._id)
    }
    incident.verificationEvents = incident.verificationEvents || []
    incident.verificationEvents.push({ at: new Date(), payload })
    await incident.save()
  }

  const lastAlert = lastAlertMap.get(String(incident._id)) || 0
  if (Date.now() - lastAlert > ALERT_COOLDOWN_MS) {
    logger.warn('Tamper incident alert (notify admins placeholder)', {
      incidentId: String(incident._id),
      severity: incident.severity,
      verificationStatus: incident.verificationStatus,
      affectedUsers: (incident.affectedUserIds || []).map(String),
    })
    lastAlertMap.set(String(incident._id), Date.now())
  }

  logger.warn('Audit tamper incident recorded', {
    incidentId: String(incident._id),
    status: incident.status,
    severity: incident.severity,
    verificationStatus: incident.verificationStatus,
  })

  return incident
}

async function handleResult(auditLog, verification) {
  if (verification.verified && verification.matches) {
    return null
  }

  const verificationStatus = classifyVerificationStatus(verification)

  // Only create incidents and send emails for actual tampering (hash mismatch).
  // Do NOT create incidents for "not_logged" (pending tx) or "verification_error" (e.g. chain down/reset)
  // to avoid flooding admins with emails when blockchain is slow or unavailable.
  if (verificationStatus !== 'tamper_detected') {
    logger.debug('Audit verification failed but not treated as tamper (no incident)', {
      auditLogId: String(auditLog._id),
      verificationStatus,
      error: verification.error,
    })
    return null
  }

  await logSecurityEventForTamper(auditLog, verification)
  return recordIncident(auditLog, verification)
}

async function verifyAuditIntegrity() {
  const since = buildWindowDate()
  const graceCutoff = new Date(Date.now() - VERIFY_GRACE_MINUTES * 60 * 1000)

  const logs = await AuditLog.find({
    $or: [{ verified: false }, { createdAt: { $gte: since } }],
    // Skip logs that have no txHash (not yet on chain) - no point creating incidents for "pending"
    txHash: { $exists: true, $ne: '', $nin: [null] },
    // Skip very recent logs (give time for blockchain queue to anchor)
    createdAt: { $lt: graceCutoff },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_PER_RUN)
    .lean()

  if (!logs.length) {
    logger.debug('Audit integrity job: no logs to verify')
    return { checked: 0, incidents: 0 }
  }

  let incidents = 0

  for (const log of logs) {
    try {
      const verification = await auditVerifier.verifyAuditLog(log._id)

      // Treat blockchain availability separately
      if (verification.error && verification.error.includes('Blockchain service not initialized')) {
        logger.warn('Audit integrity verification skipped: blockchain unavailable', {
          auditLogId: String(log._id),
        })
        continue
      }

      const incident = await handleResult(log, verification)
      if (incident) incidents += 1
    } catch (error) {
      logger.error('Audit integrity verification failed', {
        error,
        auditLogId: String(log._id),
      })
    }
  }

  logger.info('Audit integrity job completed', {
    checked: logs.length,
    incidents,
    windowHours: WINDOW_HOURS,
    graceMinutes: VERIFY_GRACE_MINUTES,
  })

  return { checked: logs.length, incidents }
}

module.exports = verifyAuditIntegrity
