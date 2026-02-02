const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const Inspection = require('../../models/Inspection')
const Violation = require('../../models/Violation')
const User = require('../../models/User')
const Role = require('../../models/Role')
const BusinessProfile = require('../../models/BusinessProfile')
const { createChecklistFromTemplate } = require('../../data/inspectionChecklistTemplate')
const notificationService = require('../../services/notificationService')

/**
 * GET /api/lgu-officer/businesses-for-inspection
 * List businesses eligible for inspection (approved status)
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
 * List all inspections (for assignment UI)
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
 * Create and assign inspection to inspector; support parentInspectionId for re-inspection
 */
router.post('/inspections', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const assignedBy = req._userId
    const {
      inspectorId,
      businessProfileId,
      businessId,
      permitType,
      inspectionType,
      scheduledDate,
      parentInspectionId,
      scheduledTimeWindow
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
    const business = (profile.businesses || []).find((b) => b.businessId === businessId)
    if (!business) return respond.error(res, 404, 'business_unit_not_found', 'Business unit not found')

    let checklist = createChecklistFromTemplate()
    const inspectionPayload = {
      inspectorId,
      businessProfileId,
      businessId,
      permitType,
      inspectionType,
      scheduledDate: new Date(scheduledDate),
      status: 'pending',
      assignedBy,
      checklist
    }

    let carriedOverViolations = []
    if (parentInspectionId) {
      inspectionPayload.parentInspectionId = parentInspectionId
      const parentInspection = await Inspection.findById(parentInspectionId).lean()
      if (parentInspection && parentInspection.businessProfileId?.toString() === businessProfileId?.toString() && parentInspection.businessId === businessId) {
        const unresolvedViolations = await Violation.find({
          inspectionId: parentInspectionId,
          status: 'open'
        }).lean()
        carriedOverViolations = unresolvedViolations.map((v) => ({
          violationType: v.violationType,
          description: v.description,
          severity: v.severity,
          complianceDeadline: v.complianceDeadline,
          legalBasis: v.legalBasis
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
          inspectionId: inspection._id,
          violationId,
          violationType: v.violationType,
          description: `[Carried over from re-inspection] ${v.description}`,
          severity: v.severity,
          complianceDeadline: v.complianceDeadline,
          legalBasis: v.legalBasis,
          inspectorId: inspection.inspectorId,
          status: 'open'
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
        inspectorId,
        'inspection_assigned',
        'New Inspection Assigned',
        message,
        'inspection',
        String(inspection._id),
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
 * List users with inspector role (for dropdown)
 */
router.get('/inspectors', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const inspectorRole = await Role.findOne({ slug: 'inspector' }).lean()
    if (!inspectorRole) return res.json({ inspectors: [] })

    const inspectors = await User.find({
      role: inspectorRole._id,
      isActive: true
    })
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

module.exports = router
