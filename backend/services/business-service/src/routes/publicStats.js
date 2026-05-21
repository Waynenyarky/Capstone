const express = require('express')
const router = express.Router()
const respond = require('../middleware/respond')
const BusinessProfile = require('../models/BusinessProfile')

// Public endpoint for landing page transparency statistics
router.get('/stats', async (req, res) => {
  try {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1)

    const [registeredThisYear, processedThisYear, pendingResult] = await Promise.all([
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        { $match: { 'businesses.businessStatus': 'active', 'businesses.createdAt': { $gte: yearStart, $lt: yearEnd } } },
        { $count: 'count' },
      ]),
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        { $match: { 'businesses.applicationStatus': { $in: ['approved', 'rejected'] }, 'businesses.reviewedAt': { $gte: yearStart, $lt: yearEnd } } },
        { $count: 'count' },
      ]),
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        { $match: { 'businesses.applicationStatus': { $in: ['submitted', 'under_review'] } } },
        { $count: 'count' },
      ]),
    ])

    const totalRegisteredThisYear = registeredThisYear[0]?.count || 0
    const applicationsProcessedThisYear = processedThisYear[0]?.count || 0
    const pendingApplications = pendingResult[0]?.count || 0

    return respond.success(res, 200, {
      totalRegisteredThisYear,
      applicationsProcessedThisYear,
      pendingApplications,
    })
  } catch (err) {
    console.error('GET /api/public/business/stats error:', err)
    return respond.error(res, 500, 'stats_error', 'Failed to fetch public stats')
  }
})

module.exports = router
