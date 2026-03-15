const express = require('express')
const { requireJwt, requireRole, requireAdminStepUp } = require('../middleware/auth')
const { validateBody, Joi } = require('../middleware/validation')
const respond = require('../middleware/respond')
const AdminApproval = require('../models/AdminApproval')
const MaintenanceWindow = require('../models/MaintenanceWindow')
const { createAuditLog } = require('../lib/auditLogger')

const router = express.Router()

async function ensureActiveMaintenanceFromApprovals() {
  const latestApproved = await AdminApproval.findOne({ requestType: 'maintenance_mode', status: 'approved' })
    .sort({ updatedAt: -1 })
    .lean()
  const active = await MaintenanceWindow.findOne({ isActive: true }).sort({ createdAt: -1 })
  if (active) return active

  const pending = await MaintenanceWindow.findOne({ status: 'pending' }).sort({ createdAt: -1 })
  if (pending) {
    const pendingScheduledStart = pending?.metadata?.scheduledStartAt ? new Date(pending.metadata.scheduledStartAt) : null
    const hasPendingSchedule = !!(pendingScheduledStart && !Number.isNaN(pendingScheduledStart.getTime()))
    const shouldActivatePending = !hasPendingSchedule || pendingScheduledStart <= new Date()
    if (shouldActivatePending) {
      pending.status = 'active'
      pending.isActive = true
      pending.activatedAt = pending.activatedAt || new Date()
      await pending.save()
      return pending
    }
  }

  if (!latestApproved) return null

  const { action, message, expectedResumeAt, scheduledStartAt } = latestApproved.requestDetails || {}
  if (action === 'disable') {
    await MaintenanceWindow.updateMany(
      {
        $or: [
          { isActive: true },
          { status: 'pending' },
        ],
      },
      { isActive: false, status: 'ended', deactivatedAt: new Date() }
    )
    return null
  }

  if (action !== 'enable') return null

  const existing = await MaintenanceWindow.findOne({ 'metadata.approvalId': latestApproved.approvalId })
    .sort({ createdAt: -1 })
    .lean()
  if (existing) {
    return existing.isActive ? existing : null
  }

  const now = new Date()
  const scheduledDate = scheduledStartAt ? new Date(scheduledStartAt) : null
  const hasValidSchedule = !!(scheduledDate && !Number.isNaN(scheduledDate.getTime()))
  const shouldActivateNow = !hasValidSchedule || scheduledDate <= now

  const approvedBy = (latestApproved.approvals || []).map((a) => a.adminId).filter(Boolean)
  const created = await MaintenanceWindow.create({
    status: shouldActivateNow ? 'active' : 'pending',
    isActive: shouldActivateNow,
    message: message || '',
    expectedResumeAt: expectedResumeAt ? new Date(expectedResumeAt) : null,
    requestedBy: latestApproved.requestedBy,
    approvedBy,
    activatedAt: shouldActivateNow ? now : null,
    metadata: {
      approvalId: latestApproved.approvalId,
      recovered: true,
      scheduledStartAt: hasValidSchedule ? scheduledDate : null,
    },
  })

  return shouldActivateNow ? created : null
}

const requestSchema = Joi.object({
  action: Joi.string().valid('enable', 'disable').required(),
  message: Joi.string().max(500).allow('', null).optional(),
  expectedResumeAt: Joi.date().allow(null).optional(),
  scheduledStartAt: Joi.date().allow(null).optional(),
})

// POST /api/admin/maintenance/request - create a maintenance request (requires approval)
router.post('/request', requireJwt, requireRole(['admin']), requireAdminStepUp, validateBody(requestSchema), async (req, res) => {
  try {
    const { action, message, expectedResumeAt, scheduledStartAt } = req.body || {}
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
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      },
      status: 'pending',
      requiredApprovals: 2,
    })

    createAuditLog(
      requestedBy,
      'maintenance_mode',
      'maintenance_request',
      '',
      action,
      'admin',
      {
        approvalId: approval.approvalId,
        action,
        message: message || '',
        expectedResumeAt: expectedResumeAt ? new Date(expectedResumeAt).toISOString() : null,
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : null,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }
    ).catch((err) => console.error('Failed to create audit log for maintenance request', err))

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

// GET /api/maintenance/status - Public status endpoint (no auth required)
router.get('/status', async (_req, res) => {
  try {
    const active = await ensureActiveMaintenanceFromApprovals()
    if (active) {
      return res.json({
        active: true,
        message: active.message || '',
        expectedResumeAt: active.expectedResumeAt,
        activatedAt: active.activatedAt,
      })
    }

    const pending = await MaintenanceWindow.findOne({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean()
    const scheduledStartAt = pending?.metadata?.scheduledStartAt || null
    if (pending && scheduledStartAt) {
      return res.json({
        active: false,
        scheduled: true,
        message: pending.message || '',
        expectedResumeAt: pending.expectedResumeAt,
        scheduledStartAt,
      })
    }

    return res.json({ active: false })
  } catch (err) {
    console.error('GET /api/maintenance/status error:', err)
    return res.status(500).json({ active: false, error: 'status_unavailable' })
  }
})

module.exports = router
