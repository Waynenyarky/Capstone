const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const mongoose = require('mongoose')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const { getEffectiveInspectorId, toObjectId } = require('./resolveInspector')
const Inspection = require('../../models/Inspection')
const Violation = require('../../models/Violation')
const BusinessProfile = require('../../models/BusinessProfile')
const { createChecklistFromTemplate } = require('../../data/inspectionChecklistTemplate')
const blockchainQueue = require('../../lib/blockchainQueue')
const crypto = require('crypto')

const GPS_MISMATCH_THRESHOLD_METERS = Number(process.env.GPS_MISMATCH_THRESHOLD_METERS || 500)

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const evidenceUploadsRoot = path.join(__dirname, '..', '..', '..', 'uploads', 'inspections')
const ensureDir = (dir) => {
  try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
}

const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params
    const inspectionDir = path.join(evidenceUploadsRoot, id || 'unknown')
    ensureDir(inspectionDir)
    cb(null, inspectionDir)
  },
  filename: (req, file, cb) => {
    const safeOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '')
    const stamp = Date.now()
    cb(null, `evidence_${stamp}_${safeOriginal}`)
  }
})
const uploadEvidence = multer({ storage: evidenceStorage })

/**
 * GET /api/inspector/inspections/counts
 * Get dashboard counts (today, pending, completed)
 */
router.get('/counts', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)

    const [today, pending, completed] = await Promise.all([
      Inspection.countDocuments({
        inspectorId,
        scheduledDate: { $gte: startOfToday, $lte: endOfToday }
      }),
      Inspection.countDocuments({ inspectorId, status: 'pending' }),
      Inspection.countDocuments({ inspectorId, status: 'completed' })
    ])

    // Debug: trace inspector counts (remove or gate by NODE_ENV if desired)
    console.log('[Inspector counts] userId=%s inspectorId=%s today=%d pending=%d completed=%d', req._userId, String(inspectorId), today, pending, completed)

    return res.json({ today, pending, completed })
  } catch (err) {
    console.error('GET /api/inspector/inspections/counts error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch counts')
  }
})

/**
 * GET /api/inspector/inspections
 * List inspections assigned to current user (filter by status, date, location)
 */
router.get('/', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query

    const query = { inspectorId }
    if (status) query.status = status
    if (dateFrom || dateTo) {
      query.scheduledDate = {}
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom)
      if (dateTo) query.scheduledDate.$lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const total = await Inspection.countDocuments(query)
    const inspections = await Inspection.find(query)
      .populate('businessProfileId', 'businesses userId')
      .populate('assignedBy', 'firstName lastName')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean()

    const items = inspections.map((i) => {
      const business = (i.businessProfileId?.businesses || []).find((b) => b.businessId === i.businessId)
      return {
        _id: i._id,
        businessName: business?.businessName || business?.registeredBusinessName || 'Unknown',
        businessId: i.businessId,
        permitType: i.permitType,
        inspectionType: i.inspectionType,
        scheduledDate: i.scheduledDate,
        scheduledTimeWindow: i.scheduledTimeWindow,
        parentInspectionId: i.parentInspectionId,
        status: i.status,
        overallResult: i.overallResult,
        assignedBy: i.assignedBy ? `${i.assignedBy.firstName} ${i.assignedBy.lastName}` : null,
        assignedAt: i.assignedAt
      }
    })

    return res.json({
      inspections: items,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('GET /api/inspector/inspections error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch inspections')
  }
})

/**
 * GET /api/inspector/inspections/:id
 * Get inspection detail + read-only business profile
 */
router.get('/:id', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
      .populate('businessProfileId')
      .populate('assignedBy', 'firstName lastName email')
      .lean()

    if (!inspection) {
      return respond.error(res, 404, 'not_found', 'Inspection not found')
    }

    const business = (inspection.businessProfileId?.businesses || []).find((b) => b.businessId === inspection.businessId)
    const businessProfile = inspection.businessProfileId
      ? {
          businessName: business?.businessName || business?.registeredBusinessName || 'Unknown',
          businessId: inspection.businessId,
          ownerFullName: business?.ownerFullName || '',
          permitNumber: business?.applicationReferenceNumber || '',
          category: business?.businessClassification || business?.primaryLineOfBusiness || '',
          address: business?.businessAddress || [business?.street, business?.barangay, business?.cityMunicipality].filter(Boolean).join(', '),
          location: business?.location
        }
      : null

    const openViolations = await Violation.countDocuments({ inspectionId: id, status: 'open' })

    return res.json({
      ...inspection,
      businessProfile: businessProfile ? { ...businessProfile, openViolations } : null,
      assignedBy: inspection.assignedBy ? { name: `${inspection.assignedBy.firstName} ${inspection.assignedBy.lastName}`, email: inspection.assignedBy.email } : null
    })
  } catch (err) {
    console.error('GET /api/inspector/inspections/:id error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch inspection')
  }
})

/**
 * GET /api/inspector/inspections/:id/risk-indicators
 * Aggregate risk indicators: repeat violations, past failed inspections, pending appeals
 */
router.get('/:id/risk-indicators', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
      .select('businessProfileId businessId')
      .lean()
    if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')

    const { businessProfileId, businessId } = inspection

    const otherInspections = await Inspection.find({
      businessProfileId,
      businessId,
      _id: { $ne: id }
    }).select('_id').lean()
    const otherInspIds = otherInspections.map((i) => i._id)

    const [repeatViolationsCount, pastFailedCount, pendingAppealsCount] = await Promise.all([
      otherInspIds.length > 0
        ? Violation.countDocuments({
            inspectionId: { $in: otherInspIds },
            status: { $in: ['open', 'resolved'] }
          })
        : 0,
      Inspection.countDocuments({
        businessProfileId,
        businessId,
        _id: { $ne: id },
        overallResult: 'failed'
      }),
      Violation.countDocuments({
        inspectionId: id,
        status: 'appealed'
      })
    ])

    return res.json({
      repeatViolations: repeatViolationsCount > 0,
      repeatViolationsCount,
      pastFailedInspections: pastFailedCount > 0,
      pastFailedCount,
      pendingAppeals: pendingAppealsCount > 0,
      pendingAppealsCount
    })
  } catch (err) {
    console.error('GET /api/inspector/inspections/:id/risk-indicators error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch risk indicators')
  }
})

/**
 * POST /api/inspector/inspections/:id/start
 * Set status to in_progress; accept gpsAtStart, validate against business address
 */
router.post('/:id/start', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params
    const { gpsAtStart, gpsMismatchReason } = req.body || {}

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
      .populate('businessProfileId', 'businesses')
    if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')
    if (inspection.status !== 'pending') return respond.error(res, 400, 'invalid_state', 'Inspection can only be started when pending')

    let gpsMismatch = false
    if (gpsAtStart && typeof gpsAtStart.lat === 'number' && typeof gpsAtStart.lng === 'number') {
      inspection.gpsAtStart = {
        lat: gpsAtStart.lat,
        lng: gpsAtStart.lng,
        accuracy: typeof gpsAtStart.accuracy === 'number' ? gpsAtStart.accuracy : null,
        capturedAt: gpsAtStart.capturedAt ? new Date(gpsAtStart.capturedAt) : new Date()
      }
      const profile = inspection.businessProfileId
      const business = (profile?.businesses || []).find((b) => b.businessId === inspection.businessId)
      const geo = business?.location?.geolocation
      if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
        const dist = haversineDistanceMeters(
          gpsAtStart.lat,
          gpsAtStart.lng,
          geo.lat,
          geo.lng
        )
        if (dist > GPS_MISMATCH_THRESHOLD_METERS) {
          gpsMismatch = true
          inspection.gpsMismatch = true
          inspection.gpsMismatchReason = typeof gpsMismatchReason === 'string' ? gpsMismatchReason.trim() : ''
        }
      }
    }
    if (!gpsMismatch) {
      inspection.gpsMismatch = false
      inspection.gpsMismatchReason = ''
    }

    inspection.status = 'in_progress'
    inspection.startedAt = new Date()
    await inspection.save()

    return res.json({
      success: true,
      inspection,
      gpsMismatch: inspection.gpsMismatch
    })
  } catch (err) {
    console.error('POST /api/inspector/inspections/:id/start error:', err)
    return respond.error(res, 500, 'update_error', err.message || 'Failed to start inspection')
  }
})

/**
 * PATCH /api/inspector/inspections/:id/gps-mismatch-reason
 * Set reason when inspector proceeds despite GPS mismatch
 */
router.patch('/:id/gps-mismatch-reason', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params
    const { gpsMismatchReason } = req.body || {}

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
    if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')
    if (!inspection.gpsMismatch) return respond.error(res, 400, 'invalid_state', 'No GPS mismatch to document')
    if (inspection.status !== 'in_progress') return respond.error(res, 400, 'invalid_state', 'Inspection must be in progress')

    inspection.gpsMismatchReason = typeof gpsMismatchReason === 'string' ? gpsMismatchReason.trim() : ''
    await inspection.save()

    return res.json({ success: true, inspection })
  } catch (err) {
    console.error('PATCH /api/inspector/inspections/:id/gps-mismatch-reason error:', err)
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update')
  }
})

/**
 * PUT /api/inspector/inspections/:id/checklist
 * Update checklist items (only when in_progress)
 */
router.put('/:id/checklist', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params
    const { checklist } = req.body

    if (!Array.isArray(checklist)) return respond.error(res, 400, 'invalid_data', 'Checklist must be an array')

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
    if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')
    if (inspection.status !== 'in_progress') return respond.error(res, 400, 'invalid_state', 'Checklist can only be updated when inspection is in progress')
    if (inspection.isImmutable) return respond.error(res, 400, 'immutable', 'Inspection has been submitted and cannot be modified')

    inspection.checklist = checklist
    await inspection.save()

    return res.json({ success: true, checklist: inspection.checklist })
  } catch (err) {
    console.error('PUT /api/inspector/inspections/:id/checklist error:', err)
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update checklist')
  }
})

/**
 * Generate next violation ID (e.g. VIO-2024-001)
 */
async function generateViolationId() {
  const year = new Date().getFullYear()
  const prefix = `VIO-${year}-`
  const last = await Violation.findOne({ violationId: new RegExp(`^${prefix}`) }).sort({ violationId: -1 }).lean()
  let seq = 1
  if (last && last.violationId) {
    const match = last.violationId.match(/-(\d+)$/)
    if (match) seq = parseInt(match[1], 10) + 1
  }
  return `${prefix}${String(seq).padStart(3, '0')}`
}

/**
 * POST /api/inspector/inspections/:id/violations
 * Issue violation
 */
router.post('/:id/violations', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params
    const { violationType, description, severity, complianceDeadline, legalBasis } = req.body

    if (!violationType || !description || !severity || !complianceDeadline) {
      return respond.error(res, 400, 'missing_fields', 'violationType, description, severity, and complianceDeadline are required')
    }
    if (!['minor', 'major', 'critical'].includes(severity)) {
      return respond.error(res, 400, 'invalid_severity', 'Severity must be minor, major, or critical')
    }

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
    if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')
    if (inspection.status !== 'in_progress') return respond.error(res, 400, 'invalid_state', 'Violations can only be issued when inspection is in progress')
    if (inspection.isImmutable) return respond.error(res, 400, 'immutable', 'Inspection has been submitted and cannot be modified')

    const violationId = await generateViolationId()
    const violation = await Violation.create({
      inspectionId: id,
      violationId,
      violationType,
      description,
      severity,
      complianceDeadline: new Date(complianceDeadline),
      legalBasis: legalBasis || '',
      inspectorId,
      status: 'open'
    })

    const hashPayload = JSON.stringify({ violationId, inspectionId: id, issuedAt: violation.issuedAt })
    const hash = crypto.createHash('sha256').update(hashPayload).digest('hex')
    violation.blockchainHash = hash
    await violation.save()

    blockchainQueue.queueBlockchainOperation('logAuditHash', [hash, 'violation_issued'])

    return res.status(201).json({ success: true, violation })
  } catch (err) {
    console.error('POST /api/inspector/inspections/:id/violations error:', err)
    return respond.error(res, 500, 'create_error', err.message || 'Failed to issue violation')
  }
})

/**
 * POST /api/inspector/inspections/:id/evidence
 * Upload evidence (photo/document)
 */
router.post(
  '/:id/evidence',
  requireJwt,
  requireRole(['inspector']),
  uploadEvidence.single('file'),
  async (req, res) => {
    try {
      const inspectorId = await getEffectiveInspectorId(req)
      const { id } = req.params
      const file = req.file
      const { type = 'photo', metadata = {} } = req.body || {}

      if (!file) return respond.error(res, 400, 'no_file', 'No file uploaded')

      const inspection = await Inspection.findOne({ _id: id, inspectorId })
      if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')
      if (inspection.status !== 'in_progress') return respond.error(res, 400, 'invalid_state', 'Evidence can only be added when inspection is in progress')
      if (inspection.isImmutable) return respond.error(res, 400, 'immutable', 'Inspection has been submitted and cannot be modified')

      const url = `/uploads/inspections/${id}/${path.basename(file.path)}`
      const meta = typeof metadata === 'string' ? (() => { try { return JSON.parse(metadata) || {} } catch { return {} } })() : (metadata || {})
      const evidenceItem = {
        type: type === 'document' ? 'document' : 'photo',
        url,
        metadata: {
          notes: meta.notes || '',
          violationArea: meta.violationArea || '',
          checklistItemId: meta.checklistItemId || '',
          annotationX: typeof meta.annotationX === 'number' ? meta.annotationX : undefined,
          annotationY: typeof meta.annotationY === 'number' ? meta.annotationY : undefined
        }
      }
      inspection.evidence.push(evidenceItem)
      await inspection.save()

      return res.status(201).json({ success: true, evidence: evidenceItem })
    } catch (err) {
      console.error('POST /api/inspector/inspections/:id/evidence error:', err)
      return respond.error(res, 500, 'upload_error', err.message || 'Failed to upload evidence')
    }
  }
)

/**
 * POST /api/inspector/inspections/:id/submit
 * Submit inspection (passed/failed/needs_reinspection); require inspectorSignature; set immutable
 */
router.post('/:id/submit', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { id } = req.params
    const { overallResult, inspectorSignature } = req.body

    if (!overallResult || !['passed', 'failed', 'needs_reinspection'].includes(overallResult)) {
      return respond.error(res, 400, 'invalid_result', 'overallResult must be passed, failed, or needs_reinspection')
    }
    if (!inspectorSignature || typeof inspectorSignature.dataUrl !== 'string' || !inspectorSignature.dataUrl) {
      return respond.error(res, 400, 'signature_required', 'inspectorSignature with dataUrl is required to submit')
    }

    const inspection = await Inspection.findOne({ _id: id, inspectorId })
    if (!inspection) return respond.error(res, 404, 'not_found', 'Inspection not found')
    if (inspection.status !== 'in_progress') return respond.error(res, 400, 'invalid_state', 'Only in-progress inspections can be submitted')
    if (inspection.isImmutable) return respond.error(res, 400, 'immutable', 'Inspection has already been submitted')

    const now = new Date()
    inspection.overallResult = overallResult
    inspection.status = 'completed'
    inspection.completedAt = now
    inspection.submittedAt = now
    inspection.inspectorSignature = {
      dataUrl: inspectorSignature.dataUrl,
      timestamp: inspectorSignature.timestamp ? new Date(inspectorSignature.timestamp) : now
    }
    inspection.isImmutable = true

    const hashPayload = JSON.stringify({
      inspectionId: id,
      overallResult,
      completedAt: inspection.completedAt,
      checklist: inspection.checklist,
      evidenceCount: (inspection.evidence || []).length,
      inspectorSignature: inspection.inspectorSignature.dataUrl.substring(0, 64)
    })
    const hash = crypto.createHash('sha256').update(hashPayload).digest('hex')
    inspection.blockchainHash = hash
    await inspection.save()

    blockchainQueue.queueBlockchainOperation('logAuditHash', [hash, 'inspection_submitted'])

    return res.json({ success: true, inspection })
  } catch (err) {
    console.error('POST /api/inspector/inspections/:id/submit error:', err)
    return respond.error(res, 500, 'submit_error', err.message || 'Failed to submit inspection')
  }
})

module.exports = router
