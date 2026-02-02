const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const { getEffectiveInspectorId } = require('./resolveInspector')
const Violation = require('../../models/Violation')

/**
 * GET /api/inspector/violations
 * List violations issued by inspector (filter by status)
 */
router.get('/', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const { status, page = 1, limit = 20 } = req.query

    const query = { inspectorId }
    if (status) query.status = status

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const total = await Violation.countDocuments(query)
    const violations = await Violation.find(query)
      .populate({
        path: 'inspectionId',
        select: 'businessProfileId businessId permitType inspectionType scheduledDate',
        populate: { path: 'businessProfileId', select: 'businesses' }
      })
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean()

    const items = violations.map((v) => {
      const insp = v.inspectionId
      const businesses = insp?.businessProfileId?.businesses || []
      const business = businesses.find((b) => String(b?.businessId) === String(insp?.businessId))
      return {
        _id: v._id,
        violationId: v.violationId,
        violationType: v.violationType,
        description: v.description,
        severity: v.severity,
        complianceDeadline: v.complianceDeadline,
        status: v.status,
        issuedAt: v.issuedAt,
        businessName: business?.businessName || business?.registeredBusinessName || 'Unknown',
        inspectionId: v.inspectionId?._id
      }
    })

    return res.json({
      violations: items,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('GET /api/inspector/violations error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch violations')
  }
})

module.exports = router
