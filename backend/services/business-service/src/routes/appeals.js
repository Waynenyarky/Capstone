const express = require('express')
const mongoose = require('mongoose')
const Appeal = require('../models/Appeal')
const BusinessProfile = require('../models/BusinessProfile')
const Violation = require('../models/Violation')
const { requireJwt, requireRole } = require('../middleware/auth')
const { logAuditEvent } = require('../lib/auditClient')
const { crossClaimForBusiness } = require('../lib/crossClaimService')

const router = express.Router()

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
  if (!profile?.businesses) return null
  const target = String(identifier)
  return profile.businesses.find(b => 
    b.businessId === target || String(b._id) === target
  )
}

// Appeal deadline: 30 days from rejection
const APPEAL_DEADLINE_DAYS = 30

// GET /api/business/appeals
router.get('/', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, businessId } = req.query
    let filter = {}
    // Staff sees all; owner sees only their own
    if (role !== 'staff' && req._userRole === 'business_owner') {
      filter.requestedBy = req._userId
    }
    if (status) filter.status = status
    if (businessId) filter.businessId = businessId
    const skip = (Number(page) - 1) * Number(limit)
    const [appeals, total] = await Promise.all([
      Appeal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Appeal.countDocuments(filter),
    ])
    return res.json({ data: appeals, meta: { page: Number(page), limit: Number(limit), total } })
  } catch (err) {
    console.error('GET /appeals error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch appeals' } })
  }
})

// GET /api/business/appeals/by-business/:businessId - Get appeals for a specific business
router.get('/by-business/:businessId', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.params
    const appeals = await Appeal.find({ businessId }).sort({ createdAt: -1 }).lean()
    return res.json({ data: appeals })
  } catch (err) {
    console.error('GET /appeals/by-business error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch appeals' } })
  }
})

// POST /api/business/appeals — submit appeal
router.post('/', requireJwt, async (req, res) => {
  try {
    const { businessId, applicationId, appealType, description, evidence, violationId, inspectionId } = req.body

    // Validation
    if (!appealType || !description) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'appealType and description are required' },
      })
    }

    if (!businessId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'businessId is required' },
      })
    }

    // Validate appealType is a known type
    const validTypes = ['wrong_fees', 'wrong_violations', 'wrong_assessment', 'rejection_appeal', 'other']
    if (!validTypes.includes(appealType)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid appealType. Must be one of: ${validTypes.join(', ')}`,
        },
      })
    }

    // For rejection appeals, check if within 30-day deadline and if appeal already exhausted
    if (appealType === 'rejection_appeal' || appealType === 'wrong_assessment') {
      // Find the business profile to check rejection date and appeal status
      const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
      if (profile) {
        const business = findBusinessInProfile(profile, businessId)
        if (business) {
          // Check if appeal is exhausted (previous appeal was rejected)
          if (business.appealExhausted) {
            return res.status(400).json({
              error: { code: 'APPEAL_EXHAUSTED', message: 'You have already used your appeal for this application. No further appeals are allowed.' },
            })
          }

          // Check 30-day deadline from rejection date
          if (business.reviewedAt && business.applicationStatus === 'rejected') {
            const rejectionDate = new Date(business.reviewedAt)
            const deadlineDate = new Date(rejectionDate)
            deadlineDate.setDate(deadlineDate.getDate() + APPEAL_DEADLINE_DAYS)
            
            if (new Date() > deadlineDate) {
              return res.status(400).json({
                error: { code: 'APPEAL_DEADLINE_PASSED', message: `The ${APPEAL_DEADLINE_DAYS}-day deadline to file an appeal has passed.` },
              })
            }
          }
        }
      }
    }

    // Check for duplicate open appeal on same business
    const existingFilter = {
      businessId,
      status: { $in: ['submitted', 'under_review'] },
    }
    if (violationId) {
      existingFilter.violationId = violationId
    }
    const existing = await Appeal.findOne(existingFilter)
    if (existing) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_APPEAL', message: 'An open appeal already exists for this business' },
      })
    }

    // Check if there's already a rejected appeal for this business (appeal exhausted)
    const rejectedAppeal = await Appeal.findOne({
      businessId,
      status: 'rejected',
      appealType: { $in: ['rejection_appeal', 'wrong_assessment'] }
    })
    if (rejectedAppeal && (appealType === 'rejection_appeal' || appealType === 'wrong_assessment')) {
      return res.status(400).json({
        error: { code: 'APPEAL_EXHAUSTED', message: 'You have already used your appeal for this application. No further appeals are allowed.' },
      })
    }

    const appeal = await Appeal.create({
      businessId,
      applicationId: applicationId || businessId,
      appealType,
      description,
      evidence: evidence || [],
      violationId: violationId || undefined,
      inspectionId: inspectionId || undefined,
      requestedBy: req._userId,
      status: 'submitted',
    })

    // Update business profile to mark that an appeal is active and change status to appeal_pending
    try {
      await BusinessProfile.updateOne(
        buildBusinessLookupQuery(businessId),
        { 
          $set: { 
            'businesses.$.hasActiveAppeal': true, 
            'businesses.$.appealId': appeal._id.toString(),
            'businesses.$.applicationStatus': 'appeal_pending'
          } 
        }
      )
    } catch (updateErr) {
      console.error('Failed to update business profile with appeal flag:', updateErr)
    }

    logAuditEvent('appeal_submitted', req._userId, 'Appeal', appeal._id.toString(), { businessId: appeal.businessId })
    return res.status(201).json({ data: appeal })
  } catch (err) {
    console.error('POST /appeals error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to submit appeal' } })
  }
})

// PUT /api/business/appeals/:id — resolve (LGU Manager/Officer)
router.put('/:id', requireJwt, async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id)
    if (!appeal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Appeal not found' } })
    }

    // Cannot update already resolved appeals
    if (appeal.status === 'approved' || appeal.status === 'rejected') {
      return res.status(400).json({
        error: { code: 'ALREADY_RESOLVED', message: 'This appeal has already been resolved' },
      })
    }

    const { status, resolution } = req.body
    if (status) {
      appeal.status = status
      if (status === 'approved' || status === 'rejected') {
        appeal.reviewedBy = req._userId
        appeal.resolution = resolution || ''
        appeal.resolvedAt = new Date()

        // Update business profile based on appeal outcome
        const businessId = appeal.businessId
        const isRejectionAppeal = appeal.appealType === 'rejection_appeal' || appeal.appealType === 'wrong_assessment'

        if (status === 'approved' && isRejectionAppeal) {
          // Appeal approved: Reset application to under_review for re-review
          try {
            const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
            if (profile) {
              const businessIndex = profile.businesses.findIndex(b => b.businessId === businessId || String(b._id) === businessId)
              if (businessIndex !== -1) {
                profile.businesses[businessIndex].applicationStatus = 'under_review'
                profile.businesses[businessIndex].hasActiveAppeal = false
                profile.businesses[businessIndex].appealId = ''
                // Clear rejection fields
                profile.businesses[businessIndex].rejectionReason = ''
                profile.businesses[businessIndex].reviewComments = ''
                profile.markModified('businesses')
                await profile.save()
                console.log(`[Appeal Approved] Application ${businessId} reset to under_review for re-review`)
              }
            }
          } catch (updateErr) {
            console.error('Failed to reset application status after appeal approval:', updateErr)
          }
        } else if (status === 'rejected' && isRejectionAppeal) {
          // Appeal rejected: Mark appeal as exhausted, set status back to rejected
          try {
            await BusinessProfile.updateOne(
              buildBusinessLookupQuery(businessId),
              { 
                $set: { 
                  'businesses.$.hasActiveAppeal': false, 
                  'businesses.$.appealId': '',
                  'businesses.$.appealExhausted': true,
                  'businesses.$.applicationStatus': 'rejected'
                } 
              }
            )
            console.log(`[Appeal Rejected] Application ${businessId} marked as appealExhausted, status set to rejected`)
          } catch (updateErr) {
            console.error('Failed to mark appeal as exhausted:', updateErr)
          }
        } else {
          // Non-rejection appeal resolved, just clear the active flag
          try {
            await BusinessProfile.updateOne(
              buildBusinessLookupQuery(businessId),
              { $set: { 'businesses.$.hasActiveAppeal': false, 'businesses.$.appealId': '' } }
            )
          } catch (updateErr) {
            console.error('Failed to clear appeal flag:', updateErr)
          }
        }
      }
    }
    await appeal.save()
    logAuditEvent('appeal_resolved', req._userId, 'Appeal', appeal._id.toString(), { status: appeal.status })
    return res.json({ data: appeal })
  } catch (err) {
    console.error('PUT /appeals error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update appeal' } })
  }
})

// PUT /api/business/appeals/:id/claim
router.put('/:id/claim', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager', 'admin']), async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id)
    if (!appeal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Appeal not found' } })
    }

    if (appeal.status === 'approved' || appeal.status === 'rejected') {
      return res.status(400).json({
        error: { code: 'ALREADY_RESOLVED', message: 'Cannot claim a resolved appeal' },
      })
    }

    if (appeal.reviewedBy && String(appeal.reviewedBy) !== String(req._userId)) {
      return res.status(409).json({
        error: { code: 'ALREADY_CLAIMED', message: 'Appeal is already claimed by another officer' },
      })
    }

    appeal.reviewedBy = req._userId
    await appeal.save()

    // Cross-claim all other requests for this business
    await crossClaimForBusiness(appeal.businessId, req._userId, { skipModel: 'Appeal', skipId: appeal._id })

    return res.json({ success: true, application: appeal })
  } catch (err) {
    console.error('PUT /appeals/:id/claim error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to claim appeal' } })
  }
})

// PUT /api/business/appeals/:id/release
router.put('/:id/release', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager', 'admin']), async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id)
    if (!appeal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Appeal not found' } })
    }

    const userRole = req._userRole
    const isManagerOrAdmin = userRole === 'lgu_manager' || userRole === 'admin'
    if (
      appeal.reviewedBy &&
      String(appeal.reviewedBy) !== String(req._userId) &&
      !isManagerOrAdmin
    ) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the claiming officer can release this appeal' },
      })
    }

    appeal.reviewedBy = null
    await appeal.save()

    // Cross-release all other requests for this business
    await crossClaimForBusiness(appeal.businessId, null, { skipModel: 'Appeal', skipId: appeal._id })

    return res.json({ success: true, application: appeal, message: 'Appeal released' })
  } catch (err) {
    console.error('PUT /appeals/:id/release error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to release appeal' } })
  }
})

// PUT /api/business/appeals/:id/transfer
router.put('/:id/transfer', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager', 'admin']), async (req, res) => {
  try {
    const { targetOfficerId } = req.body
    if (!targetOfficerId) {
      return res.status(400).json({
        error: { code: 'MISSING_TARGET', message: 'targetOfficerId is required' },
      })
    }

    const appeal = await Appeal.findById(req.params.id)
    if (!appeal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Appeal not found' } })
    }

    const userRole = req._userRole
    const isManagerOrAdmin = userRole === 'lgu_manager' || userRole === 'admin'
    if (
      appeal.reviewedBy &&
      String(appeal.reviewedBy) !== String(req._userId) &&
      !isManagerOrAdmin
    ) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only the claiming officer can transfer this appeal' },
      })
    }

    appeal.reviewedBy = targetOfficerId
    await appeal.save()

    // Cross-transfer all other requests for this business
    await crossClaimForBusiness(appeal.businessId, targetOfficerId, { skipModel: 'Appeal', skipId: appeal._id })

    return res.json({ success: true, application: appeal, message: 'Appeal transferred' })
  } catch (err) {
    console.error('PUT /appeals/:id/transfer error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to transfer appeal' } })
  }
})

module.exports = router
