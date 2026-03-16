const express = require('express')
const mongoose = require('mongoose')
const BusinessProfile = require('../models/BusinessProfile')
const { requireJwt, requireRole } = require('../middleware/auth')

const router = express.Router()

const Violation = require('../models/Violation')
const Inspection = require('../models/Inspection')
const Payment = require('../models/Payment')
const FeeConfiguration = require('../models/FeeConfiguration')
const { logAuditEvent } = require('../lib/auditClient')
const { crossClaimForBusiness } = require('../lib/crossClaimService')

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

async function findProfileAndBusinessByIdentifier(identifier) {
  const target = String(identifier || '')

  // Fast path: DB-level lookup by queryable fields
  const directProfile = await BusinessProfile.findOne(buildBusinessLookupQuery(target))
  if (directProfile) {
    const directBusiness = directProfile.businesses.find((b) => isBusinessMatch(b, target))
    if (directBusiness) {
      return { profile: directProfile, business: directBusiness }
    }
  }

  // Fallback path: scan/decrypt in-memory (handles legacy records where businessId
  // may still be encrypted/non-queryable at the DB level).
  const profiles = await BusinessProfile.find({ businesses: { $exists: true, $ne: [] } })
  for (const profile of profiles) {
    const business = profile.businesses.find((b) => isBusinessMatch(b, target))
    if (business) {
      return { profile, business }
    }
  }

  return { profile: null, business: null }
}

function formatRetirementItem(profile, business) {
  const retirementStatus = business.retirementStatus || (business.businessStatus === 'closed' ? 'confirmed' : '')
  const retirementReason = business.retirementApplicationLetter || ''
  return {
    userId: profile.userId,
    businessId: business.businessId || String(business._id || ''),
    businessName: business.businessName || business.registeredBusinessName || 'N/A',
    retirementStatus,
    retirementRequestedAt: business.retirementRequestedAt,
    retirementApplicationLetter: retirementReason,
    retirementReason,
    reason: retirementReason,
    yearsActive: business.yearsActive,
    swornStatementGrossSales: business.swornStatementGrossSales,
    swornStatementGrossSalesDocCid: business.swornStatementGrossSalesDocCid || null,
    cessationTaxAssessment: business.cessationTaxAssessment || null,
    businessPlateNo: business.businessPlateNo || '',
    businessAddress: business.formData?.businessAddress || business.businessAddress || '',
    inspectorVerifiedClosed: business.inspectorVerifiedClosed,
    inspectorVerifiedAt: business.inspectorVerifiedAt,
    retirementConfirmedAt: business.retirementConfirmedAt,
    retirementRejectionReason: business.retirementRejectionReason,
    reviewedBy: business.reviewedBy || null,
    createdAt: business.retirementRequestedAt || business.createdAt || null,
    updatedAt: business.updatedAt || null,
  }
}

function isManagerOrAdmin(role) {
  return role === 'lgu_manager' || role === 'admin'
}

/**
 * POST /api/business/:businessId/retire
 * Business owner submits retirement application
 */
router.post('/:businessId/retire', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.params
    const { applicationLetter, swornStatementGrossSales, swornStatementGrossSalesDocCid, reason } = req.body

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
    const retirementReason = String(reason || applicationLetter || '').trim()
    business.retirementStatus = 'requested'
    business.retirementRequestedAt = new Date()
    business.retirementApplicationLetter = retirementReason
    business.swornStatementGrossSales = swornStatementGrossSales || 0
    if (swornStatementGrossSalesDocCid) {
      business.swornStatementGrossSalesDocCid = swornStatementGrossSalesDocCid
    }

    // Calculate years active
    if (business.businessStartDate || business.yearEstablished) {
      const startYear = business.yearEstablished || new Date(business.businessStartDate).getFullYear()
      business.yearsActive = new Date().getFullYear() - startYear
    }

    await profile.save()
    logAuditEvent('business_retired', req._userId, 'BusinessProfile', profile._id.toString(), { businessId, status: 'requested' })
    return res.json({ data: { businessId, retirementStatus: 'requested', retirementReason, message: 'Retirement application submitted' } })
  } catch (err) {
    console.error('POST /retire error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to submit retirement' } })
  }
})

/**
 * PUT /api/business/retirements/:businessId/review
 * Officer reviews cessation request (confirm or reject)
 */
router.put('/:businessId/review', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { status, reviewNotes } = req.body || {}
    const decision = String(status || '').trim()

    if (!['confirmed', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'status must be confirmed or rejected' } })
    }

    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    if (business.reviewedBy && String(business.reviewedBy) !== String(req._userId) && !isManagerOrAdmin(req._userRole)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the claiming officer can review this cessation request' },
      })
    }

    if (!['requested', 'inspector_verified'].includes(business.retirementStatus || '')) {
      return res.status(400).json({
        error: { code: 'INVALID_STATE', message: 'Cessation request is no longer in a reviewable state' },
      })
    }

    business.reviewedBy = req._userId
    business.reviewedAt = new Date()

    if (decision === 'confirmed') {
      business.retirementStatus = 'confirmed'
      business.retirementConfirmedAt = new Date()
      business.businessStatus = 'closed'
      business.inspectorVerifiedClosed = true
      if (!business.inspectorVerifiedAt) {
        business.inspectorVerifiedAt = new Date()
      }
      business.retirementRejectionReason = ''
    } else {
      business.retirementStatus = 'rejected'
      business.retirementRejectionReason = String(reviewNotes || '').trim() || 'Cessation request was rejected by the reviewing officer'
    }

    await profile.save()
    return res.json({ success: true, application: formatRetirementItem(profile, business) })
  } catch (err) {
    console.error('PUT /retirements/:businessId/review error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to process cessation request' } })
  }
})

/**
 * PUT /api/business/retirements/:businessId/claim
 * Claim cessation request for review
 */
router.put('/:businessId/claim', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    if (business.reviewedBy && String(business.reviewedBy) !== String(req._userId)) {
      return res.status(409).json({
        error: { code: 'ALREADY_CLAIMED', message: 'Cessation request is already claimed by another officer' },
      })
    }

    business.reviewedBy = req._userId
    business.reviewedAt = new Date()
    business.updatedAt = new Date()

    await profile.save()

    // Cross-claim all other requests for this business
    const bizId = business.businessId || String(business._id)
    await crossClaimForBusiness(bizId, req._userId, { skipModel: 'Retirement' })

    return res.json({ success: true, application: formatRetirementItem(profile, business) })
  } catch (err) {
    console.error('PUT /retirements/:businessId/claim error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to claim cessation request' } })
  }
})

/**
 * PUT /api/business/retirements/:businessId/release
 * Release claimed cessation request
 */
router.put('/:businessId/release', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    if (business.reviewedBy && String(business.reviewedBy) !== String(req._userId) && !isManagerOrAdmin(req._userRole)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the claiming officer can release this cessation request' },
      })
    }

    business.reviewedBy = null
    business.reviewedAt = null
    business.updatedAt = new Date()

    await profile.save()

    // Cross-release all other requests for this business
    const bizId = business.businessId || String(business._id)
    await crossClaimForBusiness(bizId, null, { skipModel: 'Retirement' })

    return res.json({ success: true, application: formatRetirementItem(profile, business), message: 'Cessation request released' })
  } catch (err) {
    console.error('PUT /retirements/:businessId/release error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to release cessation request' } })
  }
})

/**
 * PUT /api/business/retirements/:businessId/transfer
 * Transfer cessation request claim to another officer
 */
router.put('/:businessId/transfer', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { targetOfficerId } = req.body || {}

    if (!targetOfficerId) {
      return res.status(400).json({ error: { code: 'MISSING_TARGET', message: 'targetOfficerId is required' } })
    }

    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    if (business.reviewedBy && String(business.reviewedBy) !== String(req._userId) && !isManagerOrAdmin(req._userRole)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the claiming officer can transfer this cessation request' },
      })
    }

    business.reviewedBy = targetOfficerId
    business.reviewedAt = new Date()
    business.updatedAt = new Date()

    await profile.save()

    // Cross-transfer all other requests for this business
    const bizId = business.businessId || String(business._id)
    await crossClaimForBusiness(bizId, targetOfficerId, { skipModel: 'Retirement' })

    return res.json({ success: true, application: formatRetirementItem(profile, business), message: 'Cessation request transferred' })
  } catch (err) {
    console.error('PUT /retirements/:businessId/transfer error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to transfer cessation request' } })
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

    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
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
 * GET /api/business/retirements/:businessId/tax-estimate
 * Auto-calculate cessation LBT using FeeConfiguration + sworn gross sales
 */
router.get('/:businessId/tax-estimate', requireJwt, requireRole(['lgu_officer', 'admin', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile || !business) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    }

    const grossSales = business.swornStatementGrossSales || 0
    const requestedAt = business.retirementRequestedAt || new Date()
    const monthsActive = requestedAt.getMonth() + 1 // Jan=1 through current month

    // Try to find FeeConfiguration by LOB
    const lob = business.formData?.lineOfBusiness || business.lineOfBusiness || ''
    let feeConfig = null
    if (lob) {
      feeConfig = await FeeConfiguration.findOne({ lineOfBusiness: lob, isActive: true }).lean()
    }
    if (!feeConfig && business.formData?.taxCode) {
      feeConfig = await FeeConfiguration.findOne({ taxCode: business.formData.taxCode, isActive: true }).lean()
    }

    let estimatedAnnualLbt = 0
    let rate = null
    let bracket = null
    let bracketKind = null

    if (feeConfig && feeConfig.brackets?.length > 0) {
      bracketKind = feeConfig.bracketKind || 'rate'
      // Find applicable bracket
      for (const b of feeConfig.brackets) {
        const min = b.min || 0
        const max = b.max || Infinity
        if (grossSales >= min && grossSales <= max) {
          bracket = b
          break
        }
      }
      if (bracket) {
        if (bracketKind === 'fixed') {
          estimatedAnnualLbt = bracket.amount || 0
        } else if (bracketKind === 'tiered') {
          // Tiered: rate applied to amount within bracket only
          const taxableInBracket = grossSales - (bracket.min || 0)
          estimatedAnnualLbt = taxableInBracket * (bracket.rate || 0)
        } else {
          // Rate: single rate applied to full gross
          estimatedAnnualLbt = grossSales * (bracket.rate || 0)
          rate = bracket.rate
        }
      }
    }

    const proRatedAmount = Math.round((monthsActive / 12) * estimatedAnnualLbt * 100) / 100

    return res.json({
      data: {
        grossSales,
        monthsActive,
        estimatedAnnualLbt,
        proRatedAmount,
        rate,
        bracket,
        bracketKind,
        feeConfigFound: !!feeConfig,
        lineOfBusiness: lob,
      }
    })
  } catch (err) {
    console.error('GET /retirements/:businessId/tax-estimate error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to estimate tax' } })
  }
})

/**
 * POST /api/business/retirements/:businessId/assess-tax
 * Officer assesses cessation tax and generates payment record
 */
router.post('/:businessId/assess-tax', requireJwt, requireRole(['lgu_officer', 'admin', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { businessId } = req.params
    const { lbtAmount, surcharges, outstandingFees, notes } = req.body

    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile || !business) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    }

    if (business.retirementStatus !== 'inspector_verified') {
      return res.status(400).json({
        error: { code: 'INVALID_STATE', message: 'Business must be inspector-verified to assess tax' }
      })
    }

    const totalAmount = (lbtAmount || 0) + (surcharges || 0) + (outstandingFees || 0)

    // If total is 0, skip payment and go directly to pending confirmation
    if (totalAmount <= 0) {
      business.retirementStatus = 'pending_tax_payment'
      business.cessationTaxAssessment = { lbtAmount: 0, surcharges: 0, outstandingFees: 0, notes: notes || 'Zero tax assessed', assessedAt: new Date(), assessedBy: req._userId }
      profile.markModified('businesses')
      await profile.save()
      return res.json({ data: { retirementStatus: 'pending_tax_payment', totalAmount: 0, message: 'Zero tax assessed. Business can be confirmed.' } })
    }

    // Generate payment record
    const year = new Date().getFullYear()
    const paymentId = `PAY-${year}-${Date.now().toString(36).toUpperCase()}`
    await Payment.create({
      paymentId,
      userId: profile.userId,
      businessId: business.businessId || String(business._id),
      businessProfileId: profile._id,
      amount: totalAmount,
      paymentType: 'cessation_tax',
      description: `Cessation Tax Assessment — LBT: ₱${(lbtAmount || 0).toLocaleString()}, Surcharges: ₱${(surcharges || 0).toLocaleString()}, Outstanding: ₱${(outstandingFees || 0).toLocaleString()}`,
      status: 'pending',
    })

    business.retirementStatus = 'pending_tax_payment'
    business.cessationTaxAssessment = {
      lbtAmount: lbtAmount || 0,
      surcharges: surcharges || 0,
      outstandingFees: outstandingFees || 0,
      totalAmount,
      notes: notes || '',
      assessedAt: new Date(),
      assessedBy: req._userId,
      paymentId,
    }
    profile.markModified('businesses')
    await profile.save()

    logAuditEvent('cessation_tax_assessed', req._userId, 'BusinessProfile', profile._id.toString(), {
      businessId: business.businessId || String(business._id),
      totalAmount,
    })

    return res.json({
      data: {
        retirementStatus: 'pending_tax_payment',
        totalAmount,
        paymentId,
        assessment: business.cessationTaxAssessment,
      }
    })
  } catch (err) {
    console.error('POST /retirements/:businessId/assess-tax error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to assess cessation tax' } })
  }
})

/**
 * POST /api/business/:businessId/retire/confirm
 * Officer confirms retirement (after tax payment or inspector verification)
 */
router.post('/:businessId/retire/confirm', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params

    const { profile, business } = await findProfileAndBusinessByIdentifier(businessId)
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    if (!business) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })

    // Allow confirm from inspector_verified (no tax) or pending_tax_payment (after tax)
    if (!['inspector_verified', 'pending_tax_payment'].includes(business.retirementStatus)) {
      return res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Business must be inspector-verified or pending tax payment' } })
    }

    // If pending_tax_payment, verify all cessation_tax payments are paid
    if (business.retirementStatus === 'pending_tax_payment') {
      const bizId = business.businessId || String(business._id)
      const unpaidCount = await Payment.countDocuments({
        businessId: bizId,
        paymentType: 'cessation_tax',
        status: { $ne: 'paid' },
      })
      if (unpaidCount > 0) {
        return res.status(400).json({
          error: { code: 'UNPAID_TAX', message: `${unpaidCount} cessation tax payment(s) still unpaid` }
        })
      }
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

        retirements.push(formatRetirementItem(profile, business))
      }
    }

    return res.json({ data: retirements })
  } catch (err) {
    console.error('GET /retirements error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch retirements' } })
  }
})

module.exports = router
