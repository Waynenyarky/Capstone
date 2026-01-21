const express = require('express')
const MaintenanceWindow = require('../models/MaintenanceWindow')
const AdminApproval = require('../models/AdminApproval')

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

// Public status endpoint so frontend can gate dashboards
router.get('/status', async (_req, res) => {
  try {
    const active = await ensureActiveMaintenanceFromApprovals()
    if (!active) return res.json({ active: false })

    return res.json({
      active: true,
      message: active.message || '',
      expectedResumeAt: active.expectedResumeAt,
      activatedAt: active.activatedAt,
    })
  } catch (err) {
    console.error('GET /api/maintenance/status error:', err)
    return res.status(500).json({ active: false, error: 'status_unavailable' })
  }
})

module.exports = router
