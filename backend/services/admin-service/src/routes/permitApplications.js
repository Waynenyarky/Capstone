const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../middleware/auth')
const respond = require('../middleware/respond')
// Load permitApplicationService from local services directory
const permitApplicationService = require('../services/permitApplicationService')
const BusinessProfile = require('../models/BusinessProfile')
const logger = require('../lib/logger')

// Cross-claim: when claiming an application, also claim related requests for the same business
let crossClaimForBusiness = null
try {
  crossClaimForBusiness = require('../../business-service/src/lib/crossClaimService').crossClaimForBusiness
} catch (err) {
  // Fallback: cross-claim not available (separate deployment)
  console.warn('[permitApplications] crossClaimService not available:', err.message)
}

// Socket service for realtime updates (lazy-loaded)
let socketService = null
function getSocketService() {
  if (!socketService) {
    try {
      socketService = require('../../../../shared/lib/socketService')
    } catch (err) {
      // Socket service may not be available in admin-service (runs on different port)
      // Events will be emitted from business-service instead
    }
  }
  return socketService
}

/**
 * GET /api/lgu-officer/permit-applications
 * List permit applications with filters and pagination
 */
router.get('/', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      businessName: req.query.businessName,
      applicationType: req.query.applicationType,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      applicationReferenceNumber: req.query.applicationReferenceNumber,
      ownerId: req.query.ownerId,
      reviewedBy: req.query.reviewedBy,
    }

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10
    }

    const result = await permitApplicationService.getApplications(filters, pagination)

    return res.json(result)
  } catch (err) {
    console.error('GET /api/lgu-officer/permit-applications error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch permit applications')
  }
})

/**
 * GET /api/lgu-officer/permit-applications/pending
 * Get pending applications (submitted or under_review)
 */
router.get('/pending', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'submitted' // Default to submitted, but can filter
    }

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 50 // More for pending list
    }

    const result = await permitApplicationService.getApplications(filters, pagination)

    return res.json(result)
  } catch (err) {
    console.error('GET /api/lgu-officer/permit-applications/pending error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch pending applications')
  }
})

/**
 * GET /api/lgu-officer/permit-applications/:applicationId
 * Get single application details
 */
router.get('/:applicationId', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { businessId } = req.query

    const application = await permitApplicationService.getApplicationById(applicationId, businessId)
    return res.json(application)
  } catch (err) {
    console.error('GET /api/lgu-officer/permit-applications/:applicationId error:', err)
    if (err.message === 'Application not found') {
      return respond.error(res, 404, 'not_found', err.message)
    }
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch application')
  }
})

/**
 * POST /api/lgu-officer/permit-applications/:applicationId/start-review
 * Start reviewing an application (set status to under_review)
 */
router.post('/:applicationId/start-review', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { businessId } = req.body
    const officerId = req._userId

    console.log(`[POST /start-review] LGU Officer ${officerId} starting review for applicationId=${applicationId}, businessId=${businessId || 'N/A'}`)

    const updatedApplication = await permitApplicationService.startReview(
      applicationId,
      businessId,
      officerId
    )

    console.log(`[POST /start-review] Review started successfully for applicationId=${applicationId}, newStatus=${updatedApplication?.status || 'N/A'}`)

    return res.json({
      success: true,
      application: updatedApplication,
      message: 'Review started successfully'
    })
  } catch (err) {
    console.error(`[POST /start-review] Error starting review for applicationId=${req.params.applicationId}:`, err)
    
    if (err.message.includes('Unauthorized') || err.message.includes('not found')) {
      return respond.error(res, 403, 'forbidden', err.message)
    }

    return respond.error(res, 500, 'start_review_error', err.message || 'Failed to start review')
  }
})

/**
 * POST /api/lgu-officer/permit-applications/:applicationId/review
 * Review application (approve/reject/request_changes)
 */
router.post('/:applicationId/review', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { decision, comments, rejectionReason, businessId } = req.body
    const officerId = req._userId

    if (!decision) {
      return respond.error(res, 400, 'missing_data', 'Decision is required')
    }

    const validDecisions = ['approve', 'reject', 'request_changes']
    if (!validDecisions.includes(decision)) {
      return respond.error(res, 400, 'invalid_data', `Decision must be one of: ${validDecisions.join(', ')}`)
    }

    if (decision === 'reject' && !rejectionReason) {
      return respond.error(res, 400, 'missing_data', 'Rejection reason is required when rejecting an application')
    }

    const updatedApplication = await permitApplicationService.reviewApplication(
      applicationId,
      businessId,
      officerId,
      decision,
      comments,
      rejectionReason
    )

    // Emit realtime event for application status change
    const socket = getSocketService()
    if (socket && updatedApplication) {
      const ownerId = updatedApplication.userId || updatedApplication.ownerId
      socket.emitApplicationUpdated(updatedApplication, ownerId, { decision, status: updatedApplication.applicationStatus })
    }

    return res.json({
      success: true,
      application: updatedApplication,
      message: `Application ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent for revision'} successfully`
    })
  } catch (err) {
    console.error('POST /api/lgu-officer/permit-applications/:applicationId/review error:', err)
    
    if (err.message.includes('Unauthorized') || err.message.includes('not found')) {
      return respond.error(res, 403, 'forbidden', err.message)
    }
    
    if (err.message.includes('Invalid status transition') || err.message.includes('Invalid decision')) {
      return respond.error(res, 400, 'invalid_data', err.message)
    }

    return respond.error(res, 500, 'review_error', err.message || 'Failed to review application')
  }
})

/**
 * PATCH /api/lgu-officer/permit-applications/:applicationId/field-decisions
 * Update field-level review decision(s) (accept/reject per field)
 */
router.patch('/:applicationId/field-decisions', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { businessId, fieldKey, status, reasonCode, reasonOther, decisions } = req.body
    const officerId = req._userId

    const payload = decisions && Array.isArray(decisions)
      ? decisions
      : (fieldKey && status ? [{ fieldKey, status, reasonCode, reasonOther }] : null)
    if (!payload || payload.length === 0) {
      return respond.error(res, 400, 'missing_data', 'fieldKey and status, or decisions array, required')
    }

    const updatedApplication = await permitApplicationService.updateFieldDecisions(
      applicationId,
      businessId,
      officerId,
      payload
    )
    return res.json(updatedApplication)
  } catch (err) {
    console.error('PATCH /api/lgu-officer/permit-applications/:applicationId/field-decisions error:', err)
    if (err.message === 'Application not found') {
      return respond.error(res, 404, 'not_found', err.message)
    }
    if (err.message === 'Application is not in a reviewable status' || err.message === 'Application is not in an active review state') {
      return respond.error(res, 400, 'invalid_data', err.message)
    }
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update field decisions')
  }
})

/**
 * PATCH /api/lgu-officer/permit-applications/:applicationId/form-data
 * Update LOB formData (businessDescriptionText, businessActivities) for officer edit
 */
router.patch('/:applicationId/form-data', requireJwt, requireRole(['lgu_officer', 'staff', 'lgu_manager']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { businessId, businessDescriptionText, businessActivities } = req.body
    const officerId = req._userId

    const updatedApplication = await permitApplicationService.updateLobFormData(
      applicationId,
      businessId,
      officerId,
      { businessDescriptionText, businessActivities }
    )
    return res.json(updatedApplication)
  } catch (err) {
    console.error('PATCH /api/lgu-officer/permit-applications/:applicationId/form-data error:', err)
    if (err.message === 'Application not found') {
      return respond.error(res, 404, 'not_found', err.message)
    }
    if (err.message === 'Application is not in a reviewable status' || err.message === 'Application is not in an active review state') {
      return respond.error(res, 400, 'invalid_data', err.message)
    }
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update form data')
  }
})

/**
 * POST /api/lgu-officer/permit-applications/:applicationId/reset-status
 * Revoke decision - reset application status back to under_review within 24-hour window
 */
router.post('/:applicationId/reset-status', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'admin', 'staff']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { newStatus } = req.body || {}
    const officerId = req.user?.id || req.user?._id

    if (!newStatus) {
      return respond.error(res, 400, 'validation_error', 'New status is required')
    }

    const mongoose = require('mongoose')
    // Build query that matches either businessId or subdoc _id
    const lookupClauses = [{ 'businesses.businessId': applicationId }]
    if (mongoose.Types.ObjectId.isValid(applicationId)) {
      lookupClauses.push({ 'businesses._id': new mongoose.Types.ObjectId(applicationId) })
    }
    const profile = await BusinessProfile.findOne({ $or: lookupClauses })

    if (!profile) {
      return respond.error(res, 404, 'not_found', 'Application not found')
    }

    const businessIndex = profile.businesses.findIndex((b) => b.businessId === applicationId || String(b._id) === applicationId)
    if (businessIndex === -1) {
      return respond.error(res, 404, 'not_found', 'Application not found in profile')
    }

    const business = profile.businesses[businessIndex]
    const oldStatus = business.applicationStatus
    const businessName = business.businessName || business.registeredBusinessName || 'your business'

    // Check 24-hour window for revocation
    const reviewedAt = business.reviewedAt || business.updatedAt
    if (reviewedAt) {
      const reviewedTime = new Date(reviewedAt).getTime()
      const currentTime = new Date().getTime()
      const hoursSinceReview = (currentTime - reviewedTime) / (1000 * 60 * 60)
      if (hoursSinceReview > 24) {
        return respond.error(res, 400, 'revocation_expired', 'The 24-hour window to revoke this decision has expired')
      }
    }

    // Update status
    profile.businesses[businessIndex].applicationStatus = newStatus
    profile.businesses[businessIndex].updatedAt = new Date()

    // Clear review-related fields (clean slate approach)
    profile.businesses[businessIndex].reviewComments = null
    profile.businesses[businessIndex].rejectionReason = null
    profile.businesses[businessIndex].reviewedBy = null
    profile.businesses[businessIndex].reviewedAt = null
    profile.businesses[businessIndex].fieldReviewDecisions = {}

    profile.markModified('businesses')
    await profile.save()

    // Revoke auto-issued permit if previous status was 'approved'
    if (oldStatus === 'approved') {
      try {
        const mongoose = require('mongoose')
        let Permit
        try {
          Permit = mongoose.model('Permit')
        } catch (_) {
          // Permit model not registered, skip permit revocation
        }
        if (Permit) {
          const permit = await Permit.findOne({ businessId: applicationId, status: 'active' })
          if (permit) {
            permit.status = 'revoked'
            permit.revokedAt = new Date()
            permit.revokedBy = officerId
            permit.revocationReason = 'Decision revoked by reviewing officer'
            await permit.save()
            console.log(`[reset-status] Revoked permit ${permit.permitNumber} for business ${applicationId}`)
          }
        }
      } catch (permitError) {
        console.error('[reset-status] Error revoking permit:', permitError)
        // Don't fail the request if permit revocation fails
      }
    }

    // Create notification for business owner
    try {
      const notificationService = require('../services/notificationService')
      await notificationService.createNotification(
        profile.userId,
        'decision_revoked',
        'Application Decision Revoked',
        `The decision on your application "${businessName}" has been revoked by the reviewing officer. Your application is now back under review.`,
        'business_application',
        applicationId,
        {
          oldStatus,
          newStatus: 'under_review',
          revokedAt: new Date().toISOString()
        }
      )
    } catch (notifError) {
      console.error('[reset-status] Failed to create notification:', notifError)
      // Don't fail the request if notification fails
    }

    // Send email notification to business owner
    try {
      await permitApplicationService.sendPermitDecisionNotification(
        profile.userId,
        {
          applicationReferenceNumber: business.applicationReferenceNumber || `APP-${applicationId.slice(-8)}`,
          businessName,
          status: 'under_review',
          decision: 'revoked',
          comments: 'The previous decision has been revoked by the reviewing officer. Your application is now back under review.'
        },
        'revoked'
      )
    } catch (emailError) {
      console.error('[reset-status] Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    // Create audit log
    try {
      const AuditLog = require('../models/AuditLog')
      const crypto = require('crypto')
      const auditData = {
        userId: profile.userId,
        eventType: 'decision_revoked',
        fieldChanged: 'applicationStatus',
        oldValue: oldStatus,
        newValue: newStatus,
        role: req.user?.role?.slug || 'lgu_officer',
        metadata: {
          applicationId,
          businessId: applicationId,
          officerId,
          revokedAt: new Date().toISOString()
        }
      }
      const hashableData = {
        userId: String(auditData.userId),
        eventType: auditData.eventType,
        fieldChanged: auditData.fieldChanged,
        oldValue: auditData.oldValue,
        newValue: auditData.newValue,
        role: auditData.role,
        metadata: JSON.stringify(auditData.metadata),
        timestamp: new Date().toISOString()
      }
      auditData.hash = crypto.createHash('sha256').update(JSON.stringify(hashableData)).digest('hex')
      await AuditLog.create(auditData)
    } catch (auditError) {
      console.error('[reset-status] Failed to create audit log:', auditError)
      // Don't fail the request if audit logging fails
    }

    return respond.success(res, 200, {
      message: 'Decision revoked successfully. Application is now back under review.',
      application: profile.businesses[businessIndex],
    })
  } catch (err) {
    console.error('POST /api/lgu-officer/permit-applications/:applicationId/reset-status error:', err)
    return respond.error(res, 500, 'reset_error', err.message || 'Failed to reset application status')
  }
})

/**
 * PUT /api/lgu-officer/permit-applications/:applicationId/claim
 * Claim an application for review (sets reviewedBy, transitions to under_review)
 */
router.put('/:applicationId/claim', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const officerId = req._userId

    const profile = await BusinessProfile.findOne({
      $or: [
        { 'businesses.businessId': applicationId },
        { 'businesses._id': applicationId },
      ]
    })
    if (!profile) return respond.error(res, 404, 'not_found', 'Application not found')

    const businessIndex = profile.businesses.findIndex(
      b => String(b.businessId) === applicationId || String(b._id) === applicationId
    )
    if (businessIndex === -1) return respond.error(res, 404, 'not_found', 'Business not found')

    const business = profile.businesses[businessIndex]

    // Check if already claimed by someone else
    if (business.reviewedBy && String(business.reviewedBy) !== String(officerId)) {
      return respond.error(res, 409, 'already_claimed', 'Application is already claimed by another officer')
    }

    // Set reviewer and transition to under_review if currently submitted/resubmit
    const claimUpdate = {
      $set: {
        [`businesses.${businessIndex}.reviewedBy`]: officerId,
        [`businesses.${businessIndex}.reviewedAt`]: new Date(),
        [`businesses.${businessIndex}.updatedAt`]: new Date(),
      }
    }
    if (['submitted', 'resubmit'].includes(business.applicationStatus)) {
      claimUpdate.$set[`businesses.${businessIndex}.applicationStatus`] = 'under_review'
    }

    await BusinessProfile.updateOne({ _id: profile._id }, claimUpdate)

    // Re-fetch to get updated data
    const updatedProfile = await BusinessProfile.findById(profile._id)
    const updatedBusiness = updatedProfile?.businesses?.[businessIndex]

    // Audit log
    try {
      const AuditLog = require('../models/AuditLog')
      const crypto = require('crypto')
      const auditData = {
        userId: officerId,
        eventType: 'application_claimed',
        fieldChanged: 'reviewedBy',
        oldValue: '',
        newValue: officerId,
        role: req.user?.role?.slug || 'lgu_officer',
        metadata: { applicationId, businessName: business.businessName || business.registeredBusinessName }
      }
      const hashableData = {
        userId: String(auditData.userId),
        eventType: auditData.eventType,
        fieldChanged: auditData.fieldChanged,
        oldValue: auditData.oldValue,
        newValue: auditData.newValue,
        role: auditData.role,
        metadata: JSON.stringify(auditData.metadata),
        timestamp: new Date().toISOString()
      }
      auditData.hash = crypto.createHash('sha256').update(JSON.stringify(hashableData)).digest('hex')
      await AuditLog.create(auditData)
    } catch (auditErr) {
      console.error('[claim] Failed to create audit log:', auditErr)
    }

    // Emit realtime event for claim
    const socket = getSocketService()
    if (socket) {
      socket.emitApplicationClaimed(updatedBusiness || profile.businesses[businessIndex], officerId)
    }

    // Cross-claim all other requests for this business
    if (crossClaimForBusiness) {
      const bizId = business.businessId || String(business._id)
      await crossClaimForBusiness(bizId, officerId, { skipModel: 'PermitApplication' })
    }

    return res.json({ success: true, application: updatedBusiness || profile.businesses[businessIndex] })
  } catch (err) {
    console.error('PUT /api/lgu-officer/permit-applications/:applicationId/claim error:', err)
    return respond.error(res, 500, 'claim_error', err.message || 'Failed to claim application')
  }
})

/**
 * PUT /api/lgu-officer/permit-applications/:applicationId/release
 * Release a claimed application (clears reviewedBy)
 */
router.put('/:applicationId/release', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const officerId = req._userId

    const profile = await BusinessProfile.findOne({
      $or: [
        { 'businesses.businessId': applicationId },
        { 'businesses._id': applicationId },
      ]
    })
    if (!profile) return respond.error(res, 404, 'not_found', 'Application not found')

    const businessIndex = profile.businesses.findIndex(
      b => String(b.businessId) === applicationId || String(b._id) === applicationId
    )
    if (businessIndex === -1) return respond.error(res, 404, 'not_found', 'Business not found')

    const business = profile.businesses[businessIndex]

    // Only the claiming officer can release (or admin/manager)
    const userRole = req.user?.role?.slug || req._userRole
    if (business.reviewedBy && String(business.reviewedBy) !== String(officerId) && userRole !== 'lgu_manager' && userRole !== 'admin') {
      return respond.error(res, 403, 'forbidden', 'Only the claiming officer can release this application')
    }

    // Revert to submitted if under_review
    const releaseUpdate = {
      $set: {
        [`businesses.${businessIndex}.reviewedBy`]: null,
        [`businesses.${businessIndex}.reviewedAt`]: null,
        [`businesses.${businessIndex}.updatedAt`]: new Date(),
      }
    }
    if (business.applicationStatus === 'under_review') {
      releaseUpdate.$set[`businesses.${businessIndex}.applicationStatus`] = 'submitted'
    }

    await BusinessProfile.updateOne({ _id: profile._id }, releaseUpdate)

    // Emit realtime event for release
    const socket = getSocketService()
    if (socket) {
      socket.emitApplicationReleased(business, officerId)
    }

    // Cross-release all other requests for this business
    if (crossClaimForBusiness) {
      const bizId = business.businessId || String(business._id)
      await crossClaimForBusiness(bizId, null, { skipModel: 'PermitApplication' })
    }

    return res.json({ success: true, message: 'Application released' })
  } catch (err) {
    console.error('PUT /api/lgu-officer/permit-applications/:applicationId/release error:', err)
    return respond.error(res, 500, 'release_error', err.message || 'Failed to release application')
  }
})

/**
 * PUT /api/lgu-officer/permit-applications/:applicationId/transfer
 * Transfer a claimed application to another officer
 */
router.put('/:applicationId/transfer', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff']), async (req, res) => {
  try {
    const { applicationId } = req.params
    const { targetOfficerId } = req.body
    const officerId = req._userId

    if (!targetOfficerId) {
      return respond.error(res, 400, 'missing_target', 'targetOfficerId is required')
    }

    const profile = await BusinessProfile.findOne({
      $or: [
        { 'businesses.businessId': applicationId },
        { 'businesses._id': applicationId },
      ]
    })
    if (!profile) return respond.error(res, 404, 'not_found', 'Application not found')

    const businessIndex = profile.businesses.findIndex(
      b => String(b.businessId) === applicationId || String(b._id) === applicationId
    )
    if (businessIndex === -1) return respond.error(res, 404, 'not_found', 'Business not found')

    const business = profile.businesses[businessIndex]

    // Only the claiming officer or manager can transfer
    const userRole = req.user?.role?.slug || req._userRole
    if (business.reviewedBy && String(business.reviewedBy) !== String(officerId) && userRole !== 'lgu_manager' && userRole !== 'admin') {
      return respond.error(res, 403, 'forbidden', 'Only the claiming officer can transfer this application')
    }

    await BusinessProfile.updateOne({ _id: profile._id }, {
      $set: {
        [`businesses.${businessIndex}.reviewedBy`]: targetOfficerId,
        [`businesses.${businessIndex}.reviewedAt`]: new Date(),
        [`businesses.${businessIndex}.updatedAt`]: new Date(),
      }
    })

    // Cross-transfer all other requests for this business
    if (crossClaimForBusiness) {
      const bizId = business.businessId || String(business._id)
      await crossClaimForBusiness(bizId, targetOfficerId, { skipModel: 'PermitApplication' })
    }

    return res.json({ success: true, message: 'Application transferred' })
  } catch (err) {
    console.error('PUT /api/lgu-officer/permit-applications/:applicationId/transfer error:', err)
    return respond.error(res, 500, 'transfer_error', err.message || 'Failed to transfer application')
  }
})

module.exports = router
