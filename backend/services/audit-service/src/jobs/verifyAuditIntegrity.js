const AuditLog = require('../models/AuditLog')
// TamperIncident lives in admin-service; in Docker each service has its own codebase, so it may be missing
let TamperIncident = null
try {
  TamperIncident = require('../../../admin-service/src/models/TamperIncident')
} catch (_) {
  // Running as standalone audit-service (e.g. Docker): skip persisting incidents, only log
}

const auditVerifier = require('../lib/auditVerifier')
const logger = require('../lib/logger')

// Configurable scope and limits
const WINDOW_HOURS = Number(process.env.AUDIT_VERIFY_WINDOW_HOURS || 24)
const MAX_PER_RUN = Number(process.env.AUDIT_VERIFY_MAX || 200)
const ALERT_COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes to dedupe noisy alerts

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

async function recordIncident(auditLog, verification) {
  if (!TamperIncident) {
    const verificationStatus = classifyVerificationStatus(verification)
    logger.warn('Audit tamper/integrity issue (TamperIncident model unavailable in this service)', {
      auditLogId: String(auditLog._id),
      userId: String(auditLog.userId),
      verificationStatus,
      error: verification.error || verification.errorMessage,
    })
    return null
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

  return recordIncident(auditLog, verification)
}

async function verifyAuditIntegrity() {
  const since = buildWindowDate()

  const logs = await AuditLog.find({
    $or: [{ verified: false }, { createdAt: { $gte: since } }],
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
  })

  return { checked: logs.length, incidents }
}

module.exports = verifyAuditIntegrity
