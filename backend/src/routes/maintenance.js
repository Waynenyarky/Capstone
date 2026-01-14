const express = require('express')
const MaintenanceWindow = require('../models/MaintenanceWindow')

const router = express.Router()

// Public status endpoint so frontend can gate dashboards
router.get('/status', async (_req, res) => {
  try {
    const active = await MaintenanceWindow.findOne({ isActive: true }).sort({ createdAt: -1 }).lean()
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
