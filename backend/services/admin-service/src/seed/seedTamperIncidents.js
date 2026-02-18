/**
 * Seed tamper incidents for development/testing.
 * Creates open (new), acknowledged, and resolved TamperIncident records
 * so the Audit Tamper admin page can be tested with realistic data.
 *
 * Idempotent: only inserts when the collection is empty.
 * Run when SEED_TAMPER_INCIDENTS=true or SEED_DEV=true (after DB connection).
 */

const TamperIncident = require('../models/TamperIncident')
const User = require('../models/User')
const logger = require('../lib/logger')
const mongoose = require('mongoose')

/** Base timestamp for "past" resolved incidents (e.g. 7–14 days ago) */
function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

async function seedTamperIncidentsIfEmpty() {
  const enabled = process.env.SEED_TAMPER_INCIDENTS === 'true' || process.env.SEED_DEV === 'true'
  if (!enabled) {
    return { seeded: false, reason: 'SEED_TAMPER_INCIDENTS or SEED_DEV not set' }
  }

  try {
    const existing = await TamperIncident.countDocuments().maxTimeMS(5000)
    if (existing > 0) {
      logger.info('Tamper incidents seed: collection already has documents, skipping.')
      return { seeded: false, reason: 'already has incidents', count: existing }
    }

    let adminId = null
    try {
      const admin = await User.findOne({ email: 'admin@example.com', isActive: true }).select('_id').lean().maxTimeMS(5000)
      if (admin) adminId = admin._id
    } catch (_) {
      // User collection may be in another DB in microservices; ignore
    }

    const now = new Date()
    const created = []

    // —— Open (new) incidents ——
    await TamperIncident.create({
      status: 'new',
      severity: 'high',
      verificationStatus: 'tamper_detected',
      message: 'Seed: Hash mismatch for audit log entry; on-chain verification failed.',
      affectedUserIds: adminId ? [adminId] : [],
      auditLogIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      containmentActive: false,
      detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      lastSeenAt: now,
    })
    created.push('new-high')

    await TamperIncident.create({
      status: 'new',
      severity: 'medium',
      verificationStatus: 'not_logged',
      message: 'Seed: Audit log not yet recorded on-chain (pending tx).',
      affectedUserIds: [],
      auditLogIds: [new mongoose.Types.ObjectId()],
      containmentActive: false,
      detectedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
      lastSeenAt: now,
    })
    created.push('new-medium')

    // —— Acknowledged incident ——
    await TamperIncident.create({
      status: 'acknowledged',
      severity: 'high',
      verificationStatus: 'tamper_detected',
      message: 'Seed: Hash mismatch acknowledged; containment active for affected accounts.',
      affectedUserIds: adminId ? [adminId] : [],
      auditLogIds: [new mongoose.Types.ObjectId()],
      containmentActive: true,
      detectedAt: daysAgo(1),
      lastSeenAt: now,
      acknowledgedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      acknowledgedBy: adminId,
    })
    created.push('acknowledged')

    // —— Resolved (past) incidents ——
    const resolvedAt1 = daysAgo(7)
    await TamperIncident.create({
      status: 'resolved',
      severity: 'high',
      verificationStatus: 'tamper_detected',
      message: 'Seed: Audit log hash mismatch; verified against blockchain and documented.',
      affectedUserIds: [],
      auditLogIds: [new mongoose.Types.ObjectId()],
      containmentActive: false,
      resolutionNotes: 'Confirmed on-chain hash matches expected value after re-verification. No data change; incident logged for audit.',
      detectedAt: daysAgo(8),
      lastSeenAt: daysAgo(7),
      acknowledgedAt: daysAgo(8),
      acknowledgedBy: adminId,
      resolvedAt: resolvedAt1,
      resolvedBy: adminId,
    })
    created.push('resolved-1')

    const resolvedAt2 = daysAgo(3)
    await TamperIncident.create({
      status: 'resolved',
      severity: 'medium',
      verificationStatus: 'verification_error',
      message: 'Seed: Temporary verification error (chain unavailable).',
      affectedUserIds: [],
      auditLogIds: [],
      containmentActive: false,
      resolutionNotes: 'Chain was temporarily unavailable. Re-ran verification after recovery; all logs verified.',
      detectedAt: daysAgo(4),
      lastSeenAt: daysAgo(3),
      acknowledgedAt: daysAgo(4),
      acknowledgedBy: adminId,
      resolvedAt: resolvedAt2,
      resolvedBy: adminId,
    })
    created.push('resolved-2')

    const resolvedAt3 = daysAgo(14)
    await TamperIncident.create({
      status: 'resolved',
      severity: 'low',
      verificationStatus: 'not_logged',
      message: 'Seed: New audit log not yet submitted to chain.',
      affectedUserIds: [],
      auditLogIds: [new mongoose.Types.ObjectId()],
      containmentActive: false,
      resolutionNotes: 'Log was still in queue. Next run confirmed it was logged and verified.',
      detectedAt: daysAgo(15),
      lastSeenAt: daysAgo(14),
      acknowledgedAt: daysAgo(15),
      acknowledgedBy: adminId,
      resolvedAt: resolvedAt3,
      resolvedBy: adminId,
    })
    created.push('resolved-3')

    logger.info('Tamper incidents seeded', { created: created.length })
    return { seeded: true, created: created.length }
  } catch (err) {
    logger.warn('Seed tamper incidents failed', { error: err.message })
    return { seeded: false, error: err.message }
  }
}

module.exports = { seedTamperIncidentsIfEmpty }
