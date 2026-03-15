const express = require('express')
const mongoose = require('mongoose')
const BusinessProfile = require('../models/BusinessProfile')
const { requireJwt, requireRole } = require('../middleware/auth')

const router = express.Router()

const Violation = require('../models/Violation')
const Inspection = require('../models/Inspection')
const { logAuditEvent } = require('../lib/auditClient')

function isBusinessMatch(business, identifier) {
  if (!business || !identifier) return false
  const businessId = String(business.businessId || '')
  const subdocId = String(business._id || '')
  const target = String(identifier)
  return businessId === target || subdocId === target
}

function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || '')
  const clauses = [{ 'businesses.businessId': target }]
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ 'businesses._id': target })
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses }
}

/**
 * POST /api/business/:businessId/retire
 * Business owner submits retirement application
 */
router.post('/:businessId/retire', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.params
    const { applicationLetter, swornStatementGrossSales } = req.body

    const profile = await BusinessProfile.findOne({ userId: req._userId })
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } })

    const business = profile.businesses.find((b) => isBusinessMatch(b, businessId))
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    // Edge case UC-2F-8: Check for existing retirement request
    if (
      business.retirementStatus === 'requested' ||
      business.retirementStatus === 'inspector_verified' ||
      business.retirementStatus === 'confirmed'
    ) {
      return res.status(409).json({
        error: { code: 'RETIREMENT_ALREADY_PENDING', message: 'Retirement already requested or confirmed' },
      })
    }

    // Edge case UC-2F-4: Check for open violations (resolve via Inspection → Violation)
    const inspections = await Inspection.find({
      businessProfileId: profile._id,
      businessId,
    }).select('_id').lean()
    const inspectionIds = inspections.map(i => i._id)
    const openViolations = inspectionIds.length > 0
      ? await Violation.countDocuments({ inspectionId: { $in: inspectionIds }, status: 'open' })
      : 0
    if (openViolations > 0) {
      return res.status(400).json({
        error: {
          code: 'OPEN_VIOLATIONS',
          message: `Cannot retire business with ${openViolations} open violation(s). Resolve violations first.`,
          count: openViolations,
        },
      })
    }

    // Edge case UC-2F-5: Check for unpaid fees (simplified — check if business has pending payments)
    if (business.outstandingBalance && business.outstandingBalance > 0) {
      return res.status(400).json({
        error: {
          code: 'UNPAID_FEES',
          message: `Cannot retire business with outstanding balance of ${business.outstandingBalance}. Settle fees first or request officer waiver.`,
          amount: business.outstandingBalance,
        },
      })
    }

    // Update retirement fields
    business.retirementStatus = 'requested'
    business.retirementRequestedAt = new Date()
    business.retirementApplicationLetter = applicationLetter || ''
    business.swornStatementGrossSales = swornStatementGrossSales || 0

    // Calculate years active
    if (business.businessStartDate || business.yearEstablished) {
      const startYear = business.yearEstablished || new Date(business.businessStartDate).getFullYear()
      business.yearsActive = new Date().getFullYear() - startYear
    }

    await profile.save()
    logAuditEvent('business_retired', req._userId, 'BusinessProfile', profile._id.toString(), { businessId, status: 'requested' })
    return res.json({ data: { businessId, retirementStatus: 'requested', message: 'Retirement application submitted' } })
  } catch (err) {
    console.error('POST /retire error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to submit retirement' } })
  }
})

/**
 * POST /api/business/:businessId/retire/verify
 * Inspector verifies business closure
 */
router.post('/:businessId/retire/verify', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { verified, rejectionReason } = req.body

    // Find the profile containing this business
    const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    const business = profile.businesses.find((b) => isBusinessMatch(b, businessId))
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    if (business.retirementStatus !== 'requested') {
      return res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Business must be in requested state' } })
    }

    if (verified) {
      business.retirementStatus = 'inspector_verified'
      business.inspectorVerifiedClosed = true
      business.inspectorVerifiedAt = new Date()
    } else {
      // Edge case UC-2F-7: Inspector reports "still operating"
      business.retirementStatus = 'rejected'
      business.retirementRejectionReason = rejectionReason || 'Inspector found business still operating'
      business.inspectorVerifiedClosed = false
      business.inspectorVerifiedAt = new Date()
    }

    await profile.save()
    return res.json({ data: { businessId, retirementStatus: business.retirementStatus } })
  } catch (err) {
    console.error('POST /retire/verify error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to verify retirement' } })
  }
})

/**
 * POST /api/business/:businessId/retire/confirm
 * Officer confirms retirement (after inspector verification)
 */
router.post('/:businessId/retire/confirm', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params

    const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    const business = profile.businesses.find((b) => isBusinessMatch(b, businessId))
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    if (business.retirementStatus !== 'inspector_verified') {
      return res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Business must be inspector-verified first' } })
    }

    business.retirementStatus = 'confirmed'
    business.retirementConfirmedAt = new Date()
    business.businessStatus = 'closed'

    await profile.save()
    return res.json({ data: { businessId, retirementStatus: 'confirmed', businessStatus: 'closed' } })
  } catch (err) {
    console.error('POST /retire/confirm error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to confirm retirement' } })
  }
})

/**
 * GET /api/business/retirements
 * List all retirement applications (for staff)
 */
router.get('/', requireJwt, async (req, res) => {
  try {
    const { status } = req.query
    const profiles = await BusinessProfile.find({ businesses: { $exists: true, $ne: [] } }).lean()
    const retirements = []
    for (const profile of profiles) {
      for (const business of profile.businesses || []) {
        const retirementStatus = business.retirementStatus || (business.businessStatus === 'closed' ? 'confirmed' : '')
        const hasRetirementSignal = Boolean(
          retirementStatus ||
          business.retirementRequestedAt ||
          business.retirementConfirmedAt ||
          business.inspectorVerifiedAt
        )
        if (!hasRetirementSignal) continue
        if (status && retirementStatus !== status) continue

          retirements.push({
            userId: profile.userId,
            businessId: business.businessId || String(business._id || ''),
            businessName: business.businessName || business.registeredBusinessName || 'N/A',
            retirementStatus,
            retirementRequestedAt: business.retirementRequestedAt,
            yearsActive: business.yearsActive,
            swornStatementGrossSales: business.swornStatementGrossSales,
            inspectorVerifiedClosed: business.inspectorVerifiedClosed,
            retirementConfirmedAt: business.retirementConfirmedAt,
          })
      }
    }

    return res.json({ data: retirements })
  } catch (err) {
    console.error('GET /retirements error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch retirements' } })
  }
})

module.exports = router
