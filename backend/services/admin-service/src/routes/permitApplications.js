const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../middleware/auth')
const respond = require('../middleware/respond')
// Load permitApplicationService from local services directory
const permitApplicationService = require('../services/permitApplicationService')

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
      applicationReferenceNumber: req.query.applicationReferenceNumber
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

    if (!comments) {
      return respond.error(res, 400, 'missing_data', 'Comments are required')
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
    if (err.message === 'Application is not in a reviewable status') {
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
    if (err.message === 'Application is not in a reviewable status') {
      return respond.error(res, 400, 'invalid_data', err.message)
    }
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update form data')
  }
})

module.exports = router
