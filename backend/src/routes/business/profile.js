const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const businessProfileService = require('../../services/businessProfileService')

// GET /api/business/profile - Get current user's business profile
router.get('/profile', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    res.json(profile)
  } catch (err) {
    console.error('GET /api/business/profile error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch business profile')
  }
})

// POST /api/business/profile - Update business profile (Step 2-8)
router.post('/profile', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { step, data } = req.body

    if (!step || !data) return respond.error(res, 400, 'missing_data', 'Step and data are required')

    // Extract metadata for audit logging
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    const metadata = { ip, userAgent }

    const profile = await businessProfileService.updateStep(userId, parseInt(step), data, metadata)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/profile error:', err)
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update business profile')
  }
})

// GET /api/business/businesses - Get all businesses
router.get('/businesses', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    const businesses = profile.businesses || []
    res.json({ businesses })
  } catch (err) {
    console.error('GET /api/business/businesses error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch businesses')
  }
})

// GET /api/business/businesses/primary - Get primary business
router.get('/businesses/primary', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    const primaryBusiness = profile.businesses?.find(b => b.isPrimary) || null
    res.json({ business: primaryBusiness })
  } catch (err) {
    console.error('GET /api/business/businesses/primary error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch primary business')
  }
})

// POST /api/business/businesses - Add new business
router.post('/businesses', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const businessData = req.body

    const profile = await businessProfileService.addBusiness(userId, businessData)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/businesses error:', err)
    return respond.error(res, 400, 'add_error', err.message || 'Failed to add business')
  }
})

// PUT /api/business/businesses/:businessId - Update business
router.put('/businesses/:businessId', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const businessData = req.body

    const profile = await businessProfileService.updateBusiness(userId, businessId, businessData)
    res.json(profile)
  } catch (err) {
    console.error('PUT /api/business/businesses/:businessId error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to update business')
  }
})

// DELETE /api/business/businesses/:businessId - Delete business
router.delete('/businesses/:businessId', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    const profile = await businessProfileService.deleteBusiness(userId, businessId)
    res.json(profile)
  } catch (err) {
    console.error('DELETE /api/business/businesses/:businessId error:', err)
    return respond.error(res, 400, 'delete_error', err.message || 'Failed to delete business')
  }
})

// POST /api/business/businesses/:businessId/primary - Set business as primary
router.post('/businesses/:businessId/primary', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    const profile = await businessProfileService.setPrimaryBusiness(userId, businessId)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/businesses/:businessId/primary error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to set primary business')
  }
})

// PUT /api/business/businesses/:businessId/risk-profile - Update risk profile
router.put('/businesses/:businessId/risk-profile', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const riskProfileData = req.body

    const profile = await businessProfileService.updateBusinessRiskProfile(userId, businessId, riskProfileData)
    res.json(profile)
  } catch (err) {
    console.error('PUT /api/business/businesses/:businessId/risk-profile error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to update risk profile')
  }
})

module.exports = router
