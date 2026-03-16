const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const BusinessProfile = require('../../models/BusinessProfile')
const Inspection = require('../../models/Inspection')
const respond = require('../../middleware/respond')
const Violation = require('../../models/Violation')
const User = require('../../models/User')
const Role = require('../../models/Role')
const { createChecklistFromTemplate } = require('../../data/inspectionChecklistTemplate')
const notificationService = require('../../services/notificationService')
const { logAuditEvent } = require('../../lib/auditClient')

// Helper: build query that matches either businessId or subdoc _id
function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || '')
  const clauses = [{ 'businesses.businessId': target }]
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ 'businesses._id': new mongoose.Types.ObjectId(target) })
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses }
}

// Helper: find business in profile by either businessId or subdoc _id
function findBusinessInProfile(profile, identifier) {
  if (!profile?.businesses) return { business: null, index: -1 }
  const target = String(identifier)
  const index = profile.businesses.findIndex(b => 
    b.businessId === target || String(b._id) === target
  )
  return { business: index >= 0 ? profile.businesses[index] : null, index }
}

/**
 * GET /api/lgu-officer/businesses-for-inspection
 */
router.get('/businesses-for-inspection', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const businesses = await BusinessProfile.aggregate([
      { $match: { businesses: { $exists: true, $ne: [] } } },
      { $unwind: '$businesses' },
      { $match: { 'businesses.applicationStatus': 'approved' } },
      {
        $project: {
          businessProfileId: '$_id',
          businessId: '$businesses.businessId',
          businessName: { $ifNull: ['$businesses.registeredBusinessName', '$businesses.businessName'] }
        }
      },
      { $sort: { businessName: 1 } },
      { $limit: 500 }
    ])
    return res.json({ businesses })
  } catch (err) {
    console.error('GET /api/lgu-officer/businesses-for-inspection error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch businesses')
  }
})

/**
 * GET /api/lgu-officer/inspections
 */
router.get('/inspections', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { status, inspectorId, dateFrom, dateTo, page = 1, limit = 20 } = req.query

    const query = {}
    if (status) query.status = status
    if (inspectorId) query.inspectorId = inspectorId
    if (dateFrom || dateTo) {
      query.scheduledDate = {}
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom)
      if (dateTo) query.scheduledDate.$lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const total = await Inspection.countDocuments(query)
    const inspections = await Inspection.find(query)
      .populate('inspectorId', 'firstName lastName email')
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
        businessProfileId: i.businessProfileId?._id,
        permitType: i.permitType,
        inspectionType: i.inspectionType,
        scheduledDate: i.scheduledDate,
        status: i.status,
        overallResult: i.overallResult,
        inspectorId: i.inspectorId?._id,
        inspectorName: i.inspectorId ? `${i.inspectorId.firstName} ${i.inspectorId.lastName}` : null,
        assignedBy: i.assignedBy ? `${i.assignedBy.firstName} ${i.assignedBy.lastName}` : null,
        assignedAt: i.assignedAt
      }
    })

    return res.json({
      inspections: items,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('GET /api/lgu-officer/inspections error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch inspections')
  }
})

/**
 * POST /api/lgu-officer/inspections
 */
router.post('/inspections', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const assignedBy = req._userId
    const {
      inspectorId, businessProfileId, businessId, permitType,
      inspectionType, scheduledDate, parentInspectionId, scheduledTimeWindow
    } = req.body

    if (!inspectorId || !businessProfileId || !businessId || !permitType || !inspectionType || !scheduledDate) {
      return respond.error(res, 400, 'missing_fields', 'inspectorId, businessProfileId, businessId, permitType, inspectionType, and scheduledDate are required')
    }
    if (!['initial', 'renewal'].includes(permitType)) {
      return respond.error(res, 400, 'invalid_permit_type', 'permitType must be initial or renewal')
    }
    if (!['initial', 'renewal', 'follow_up'].includes(inspectionType)) {
      return respond.error(res, 400, 'invalid_inspection_type', 'inspectionType must be initial, renewal, or follow_up')
    }

    const inspector = await User.findById(inspectorId).populate('role').lean()
    if (!inspector) return respond.error(res, 404, 'inspector_not_found', 'Inspector not found')
    const roleSlug = inspector.role?.slug || ''
    if (roleSlug !== 'inspector') {
      return respond.error(res, 400, 'invalid_inspector', 'Selected user must have inspector role')
    }

    const profile = await BusinessProfile.findById(businessProfileId).lean()
    if (!profile) return respond.error(res, 404, 'business_not_found', 'Business profile not found')
    const business = (profile.businesses || []).find((b) => b.businessId === businessId || String(b._id) === businessId)
    if (!business) return respond.error(res, 404, 'business_unit_not_found', 'Business unit not found')

    let checklist = createChecklistFromTemplate()
    const inspectionPayload = {
      inspectorId, businessProfileId, businessId, permitType,
      inspectionType, scheduledDate: new Date(scheduledDate),
      status: 'pending', assignedBy, checklist
    }

    let carriedOverViolations = []
    if (parentInspectionId) {
      inspectionPayload.parentInspectionId = parentInspectionId
      const parentInspection = await Inspection.findById(parentInspectionId).lean()
      if (parentInspection && parentInspection.businessProfileId?.toString() === businessProfileId?.toString() && parentInspection.businessId === businessId) {
        const unresolvedViolations = await Violation.find({ inspectionId: parentInspectionId, status: 'open' }).lean()
        carriedOverViolations = unresolvedViolations.map((v) => ({
          violationType: v.violationType, description: v.description,
          severity: v.severity, complianceDeadline: v.complianceDeadline, legalBasis: v.legalBasis
        }))
      }
    }

    if (scheduledTimeWindow && scheduledTimeWindow.start && scheduledTimeWindow.end) {
      inspectionPayload.scheduledTimeWindow = {
        start: new Date(scheduledTimeWindow.start),
        end: new Date(scheduledTimeWindow.end)
      }
    }

    const inspection = await Inspection.create(inspectionPayload)
    logAuditEvent('inspection_created', req._userId, 'Inspection', inspection._id.toString(), { businessId: inspection.businessId })

    if (carriedOverViolations.length > 0) {
      for (const v of carriedOverViolations) {
        const year = new Date().getFullYear()
        const prefix = `VIO-${year}-`
        const last = await Violation.findOne({ violationId: new RegExp(`^${prefix}`) }).sort({ violationId: -1 }).lean()
        let seq = 1
        if (last && last.violationId) {
          const match = last.violationId.match(/-(\d+)$/)
          if (match) seq = parseInt(match[1], 10) + 1
        }
        const violationId = `${prefix}${String(seq).padStart(3, '0')}`
        await Violation.create({
          inspectionId: inspection._id, violationId,
          violationType: v.violationType,
          description: `[Carried over from re-inspection] ${v.description}`,
          severity: v.severity, complianceDeadline: v.complianceDeadline,
          legalBasis: v.legalBasis, inspectorId: inspection.inspectorId, status: 'open'
        })
      }
    }

    const businessName = business.businessName || business.registeredBusinessName || 'Unknown'
    const scheduledStr = new Date(scheduledDate).toLocaleDateString()
    const message = parentInspectionId
      ? `Re-inspection assigned for ${businessName}. Scheduled: ${scheduledStr}.`
      : `You have been assigned to inspect ${businessName}. Scheduled: ${scheduledStr}.`
    try {
      await notificationService.createNotification(
        inspectorId, 'inspection_assigned', 'New Inspection Assigned', message,
        'inspection', String(inspection._id),
        { inspectionId: inspection._id, businessName, scheduledDate, parentInspectionId: parentInspectionId || null }
      )
    } catch (notifErr) {
      console.warn('Failed to create inspection_assigned notification:', notifErr)
    }

    return res.status(201).json({ success: true, inspection })
  } catch (err) {
    console.error('POST /api/lgu-officer/inspections error:', err)
    return respond.error(res, 500, 'create_error', err.message || 'Failed to create inspection')
  }
})

/**
 * GET /api/lgu-officer/inspectors
 */
router.get('/inspectors', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const inspectorRole = await Role.findOne({ slug: 'inspector' }).lean()
    if (!inspectorRole) return res.json({ inspectors: [] })

    const inspectors = await User.find({ role: inspectorRole._id, isActive: true })
      .select('_id firstName lastName email')
      .sort({ lastName: 1, firstName: 1 })
      .lean()

    return res.json({
      inspectors: inspectors.map((u) => ({
        _id: u._id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email
      }))
    })
  } catch (err) {
    console.error('GET /api/lgu-officer/inspectors error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch inspectors')
  }
})

/**
 * POST /api/lgu-officer/permit-applications/:applicationId/reset-status
 * Reset application status (for testing - undo approval)
 */
router.post('/permit-applications/:applicationId/reset-status', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'admin']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { newStatus } = req.body

    if (!newStatus) {
      return respond.error(res, 400, 'validation_error', 'New status is required')
    }

    // Find the business profile containing this application
    const profile = await BusinessProfile.findOne({
      'businesses.applicationId': applicationId
    })

    if (!profile) {
      // Try finding by businessId or subdoc _id
      const profileByBusinessId = await BusinessProfile.findOne(buildBusinessLookupQuery(applicationId))
      
      if (!profileByBusinessId) {
        return respond.error(res, 404, 'not_found', 'Application not found')
      }

      const { index: businessIndex } = findBusinessInProfile(profileByBusinessId, applicationId)
      if (businessIndex === -1) {
        return respond.error(res, 404, 'not_found', 'Business not found')
      }

      // Reset status
      profileByBusinessId.businesses[businessIndex].applicationStatus = newStatus
      profileByBusinessId.businesses[businessIndex].updatedAt = new Date()
      
      await profileByBusinessId.save()

      return respond.success(res, 200, {
        message: 'Application status reset successfully',
        application: profileByBusinessId.businesses[businessIndex]
      })
    }

    // Find the specific business
    const businessIndex = profile.businesses.findIndex(b => b.applicationId === applicationId)
    if (businessIndex === -1) {
      return respond.error(res, 404, 'not_found', 'Application not found in profile')
    }

    // Reset status
    profile.businesses[businessIndex].applicationStatus = newStatus
    profile.businesses[businessIndex].updatedAt = new Date()
    
    await profile.save()

    return respond.success(res, 200, {
      message: 'Application status reset successfully',
      application: profile.businesses[businessIndex]
    })
  } catch (err) {
    console.error('POST /api/lgu-officer/permit-applications/:applicationId/reset-status error:', err)
    return respond.error(res, 500, 'reset_error', err.message || 'Failed to reset application status')
  }
})

/**
 * PUT /api/lgu-officer/inspections/:id/reschedule
 * Reschedule an existing inspection to a new date/time
 */
router.put('/inspections/:id/reschedule', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { id } = req.params
    const { scheduledDate, scheduledTimeWindow, reason } = req.body

    if (!scheduledDate) {
      return respond.error(res, 400, 'missing_date', 'scheduledDate is required')
    }

    const newDate = new Date(scheduledDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (newDate < now) {
      return respond.error(res, 400, 'past_date', 'Cannot reschedule to a date in the past')
    }

    const inspection = await Inspection.findById(id)
    if (!inspection) {
      return respond.error(res, 404, 'not_found', 'Inspection not found')
    }
    if (inspection.status === 'completed') {
      return respond.error(res, 400, 'already_completed', 'Cannot reschedule a completed inspection')
    }

    const previousDate = inspection.scheduledDate
    inspection.scheduledDate = newDate

    if (scheduledTimeWindow && scheduledTimeWindow.start && scheduledTimeWindow.end) {
      inspection.scheduledTimeWindow = {
        start: new Date(scheduledTimeWindow.start),
        end: new Date(scheduledTimeWindow.end)
      }
    }

    inspection.editHistory = inspection.editHistory || []
    inspection.editHistory.push({
      changedAt: new Date(),
      changedBy: req._userId,
      field: 'scheduledDate',
      reason: reason || `Rescheduled from ${previousDate.toISOString().split('T')[0]} to ${newDate.toISOString().split('T')[0]}`
    })

    await inspection.save()

    logAuditEvent('inspection_rescheduled', req._userId, 'Inspection', inspection._id.toString(), {
      businessId: inspection.businessId,
      previousDate,
      newDate: inspection.scheduledDate
    })

    try {
      const profile = await BusinessProfile.findById(inspection.businessProfileId).lean()
      const business = (profile?.businesses || []).find((b) => b.businessId === inspection.businessId)
      const businessName = business?.businessName || business?.registeredBusinessName || 'Unknown'
      const scheduledStr = newDate.toLocaleDateString()
      await notificationService.createNotification(
        inspection.inspectorId.toString(), 'inspection_rescheduled', 'Inspection Rescheduled',
        `Inspection for ${businessName} has been rescheduled to ${scheduledStr}.`,
        'inspection', String(inspection._id),
        { inspectionId: inspection._id, businessName, scheduledDate: newDate, previousDate }
      )
    } catch (notifErr) {
      console.warn('Failed to create inspection_rescheduled notification:', notifErr)
    }

    return res.json({ success: true, inspection })
  } catch (err) {
    console.error('PUT /api/lgu-officer/inspections/:id/reschedule error:', err)
    return respond.error(res, 500, 'reschedule_error', err.message || 'Failed to reschedule inspection')
  }
})

/**
 * GET /api/lgu-officer/inspections/:id/violations
 * Get violations associated with a specific inspection
 */
router.get('/inspections/:id/violations', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { id } = req.params
    const violations = await Violation.find({ inspectionId: id })
      .sort({ createdAt: -1 })
      .lean()
    return res.json({ violations })
  } catch (err) {
    console.error('GET /api/lgu-officer/inspections/:id/violations error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch violations')
  }
})

/**
 * GET /api/lgu-officer/violations
 * List all violations with optional filters
 */
router.get('/violations', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { status, businessId, severity, page = 1, limit = 50 } = req.query
    const query = {}
    if (status) query.status = status
    if (businessId) query.businessId = businessId
    if (severity) query.severity = severity

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const total = await Violation.countDocuments(query)
    const violations = await Violation.find(query)
      .populate('inspectorId', 'firstName lastName')
      .populate('inspectionId', 'businessId businessProfileId scheduledDate status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean()

    return res.json({
      violations,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('GET /api/lgu-officer/violations error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch violations')
  }
})

/**
 * PUT /api/lgu-officer/violations/:id/resolve
 * Mark a violation as resolved
 */
router.put('/violations/:id/resolve', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { id } = req.params
    const { resolution, notes } = req.body

    const violation = await Violation.findById(id)
    if (!violation) {
      return respond.error(res, 404, 'not_found', 'Violation not found')
    }

    if (violation.status === 'resolved') {
      return respond.error(res, 400, 'already_resolved', 'Violation is already resolved')
    }

    violation.status = 'resolved'
    violation.resolution = resolution || 'Resolved by officer'
    violation.resolvedAt = new Date()
    violation.resolvedBy = req._userId
    if (notes) violation.notes = notes
    await violation.save()

    logAuditEvent('violation_resolved', req._userId, 'Violation', violation._id.toString(), {
      businessId: violation.businessId,
      violationId: violation.violationId,
    })

    return res.json({ success: true, violation })
  } catch (err) {
    console.error('PUT /api/lgu-officer/violations/:id/resolve error:', err)
    return respond.error(res, 500, 'resolve_error', err.message || 'Failed to resolve violation')
  }
})

module.exports = router
