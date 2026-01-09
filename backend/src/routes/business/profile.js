const express = require('express')
const router = express.Router()
const { requireJwt } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const businessProfileService = require('../../services/businessProfileService')

// GET /api/business/profile - Get current user's business profile
router.get('/profile', requireJwt, async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    res.json(profile)
  } catch (err) {
    console.error('GET /api/business/profile error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch business profile')
  }
})

// POST /api/business/profile - Update business profile (Step 2-8)
router.post('/profile', requireJwt, async (req, res) => {
  try {
    const userId = req._userId
    const { step, data } = req.body

    if (!step || !data) return respond.error(res, 400, 'missing_data', 'Step and data are required')

    const profile = await businessProfileService.updateStep(userId, parseInt(step), data)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/profile error:', err)
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update business profile')
  }
})

module.exports = router
