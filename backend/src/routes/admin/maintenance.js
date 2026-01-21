const express = require('express')
const { requireJwt, requireRole } = require('../../middleware/auth')
const { validateBody, Joi } = require('../../middleware/validation')
const respond = require('../../middleware/respond')
const AdminApproval = require('../../models/AdminApproval')
const MaintenanceWindow = require('../../models/MaintenanceWindow')

const router = express.Router()

async function ensureActiveMaintenanceFromApprovals() {
  const latestApproved = await AdminApproval.findOne({ requestType: 'maintenance_mode', status: 'approved' })
    .sort({ updatedAt: -1 })
    .lean()
  const active = await MaintenanceWindow.findOne({ isActive: true }).sort({ createdAt: -1 })

  if (!latestApproved) return active || null

  const { action, message, expectedResumeAt } = latestApproved.requestDetails || {}
  if (action === 'disable') {
    if (active) {
      await MaintenanceWindow.updateMany(
        { isActive: true },
        { isActive: false, status: 'ended', deactivatedAt: new Date() }
      )
    }
    return null
  }

  if (action !== 'enable') return active || null
  if (active) return active

  const existing = await MaintenanceWindow.findOne({ 'metadata.approvalId': latestApproved.approvalId })
    .sort({ createdAt: -1 })
    .lean()
  if (existing) return existing

  const now = new Date()
  const approvedBy = (latestApproved.approvals || []).map((a) => a.adminId).filter(Boolean)
  const created = await MaintenanceWindow.create({
    status: 'active',
    isActive: true,
    message: message || '',
    expectedResumeAt: expectedResumeAt ? new Date(expectedResumeAt) : null,
    requestedBy: latestApproved.requestedBy,
    approvedBy,
    activatedAt: now,
    metadata: { approvalId: latestApproved.approvalId, recovered: true },
  })

  return created
}

const requestSchema = Joi.object({
  action: Joi.string().valid('enable', 'disable').required(),
  message: Joi.string().max(500).allow('', null).optional(),
  expectedResumeAt: Joi.date().optional(),
})

// POST /api/admin/maintenance/request - create a maintenance request (requires approval)
router.post('/request', requireJwt, requireRole(['admin']), validateBody(requestSchema), async (req, res) => {
  try {
    const { action, message, expectedResumeAt } = req.body || {}
    const requestedBy = req._userId

    const approvalId = AdminApproval.generateApprovalId()
    const approval = await AdminApproval.create({
      approvalId,
      requestType: 'maintenance_mode',
      userId: requestedBy,
      requestedBy,
      requestDetails: {
        action,
        message: message || '',
        expectedResumeAt: expectedResumeAt ? new Date(expectedResumeAt) : null,
      },
      status: 'pending',
      requiredApprovals: 2,
    })

    return res.status(201).json({
      success: true,
      approval: {
        approvalId: approval.approvalId,
        status: approval.status,
        requestType: approval.requestType,
        requestDetails: approval.requestDetails,
      },
    })
  } catch (err) {
    console.error('POST /api/admin/maintenance/request error:', err)
    return respond.error(res, 500, 'maintenance_request_failed', 'Failed to create maintenance request')
  }
})

// GET /api/admin/maintenance/current - admin view of current window
router.get('/current', requireJwt, requireRole(['admin']), async (_req, res) => {
  try {
    const active = await ensureActiveMaintenanceFromApprovals()
    return res.json({
      success: true,
      maintenance: active || null,
    })
  } catch (err) {
    console.error('GET /api/admin/maintenance/current error:', err)
    return respond.error(res, 500, 'maintenance_status_failed', 'Failed to load maintenance status')
  }
})

module.exports = router
