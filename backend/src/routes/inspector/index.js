const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const { getEffectiveInspectorId } = require('./resolveInspector')
const inspectionsRouter = require('./inspections')
const violationsRouter = require('./violations')
const notificationsRouter = require('./notifications')
const Inspection = require('../../models/Inspection')
const Violation = require('../../models/Violation')
const Notification = require('../../models/Notification')
const { getOrdinances } = require('../../data/ordinances')
const { searchViolationsCatalog } = require('../../data/violationsCatalog')

router.use('/inspections', inspectionsRouter)
router.use('/violations', violationsRouter)
router.use('/notifications', notificationsRouter)

/**
 * GET /api/inspector/debug
 * Returns userId, email, and counts for the current inspector (for troubleshooting empty data).
 */
router.get('/debug', requireJwt, requireRole(['inspector']), async (req, res) => {
  try {
    const inspectorId = await getEffectiveInspectorId(req)
    const [inspectionCount, violationCount, notificationCount] = await Promise.all([
      Inspection.countDocuments({ inspectorId }),
      Violation.countDocuments({ inspectorId }),
      Notification.countDocuments({ userId: inspectorId, type: { $in: ['inspection_assigned', 'inspection_schedule_changed', 'appeal_outcome'] } })
    ])
    return res.json({
      userId: String(req._userId),
      email: req._userEmail,
      effectiveInspectorId: String(inspectorId),
      inspectionCount,
      violationCount,
      notificationCount
    })
  } catch (err) {
    console.error('GET /api/inspector/debug error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch debug info')
  }
})

/**
 * GET /api/inspector/violations-catalog
 * Searchable violations catalog for legal reference
 */
router.get('/violations-catalog', requireJwt, requireRole(['inspector']), (req, res) => {
  try {
    const { q } = req.query
    const items = searchViolationsCatalog(q)
    return res.json({ violations: items })
  } catch (err) {
    console.error('GET /api/inspector/violations-catalog error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch violations catalog')
  }
})

/**
 * GET /api/inspector/ordinances
 * List ordinances for legal reference
 */
router.get('/ordinances', requireJwt, requireRole(['inspector']), (req, res) => {
  try {
    const items = getOrdinances()
    return res.json({ ordinances: items })
  } catch (err) {
    console.error('GET /api/inspector/ordinances error:', err)
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch ordinances')
  }
})

module.exports = router
