const express = require('express')
const { requireJwt, requireRole } = require('../middleware/auth')
const BusinessProfile = require('../models/BusinessProfile')
const { computeApplicationFees } = require('../lib/feeCalculator')
const { logAuditEvent } = require('../lib/auditClient')

const router = express.Router()

/**
 * POST /api/business/walk-in
 * Officer creates an application on behalf of a walk-in business owner.
 */
router.post('/', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const {
      applicantUserId,
      pisData,
      businessData,
      businessActivities,
      draft,
    } = req.body

    if (!businessData) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'businessData is required' } })
    }

    const userId = applicantUserId || req._userId

    // Find or create profile
    let profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      profile = await BusinessProfile.create({
        userId,
        businesses: [],
        status: 'draft',
      })
    }

    // Create business entry
    const businessId = `BP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const newBusiness = {
      businessId,
      isPrimary: profile.businesses.length === 0,
      businessName: businessData.registeredBusinessName || businessData.businessName || 'Walk-in Business',
      businessRegistrationNumber: businessData.businessRegistrationNumber || businessId,
      registrationStatus: 'proposed',
      businessStatus: 'active',
      // Unified form fields
      applicationType: businessData.applicationType || 'new',
      organizationType: businessData.organizationType || '',
      businessPlateNo: businessData.businessPlateNo || '',
      yearEstablished: businessData.yearEstablished || null,
      // Address
      houseBldgNo: businessData.houseBldgNo || '',
      buildingName: businessData.buildingName || '',
      street: businessData.street || '',
      barangay: businessData.barangay || '',
      subdivision: businessData.subdivision || '',
      cityMunicipality: businessData.cityMunicipality || '',
      blockCode: businessData.blockCode || '',
      pin: businessData.pin || '',
      buildingRegistryNo: businessData.buildingRegistryNo || '',
      businessAreaSqm: businessData.businessAreaSqm || 0,
      totalEmployees: businessData.totalEmployees || 0,
      employeesResidingInLgu: businessData.employeesResidingInLgu || 0,
      businessLocationType: businessData.businessLocationType || 'owned',
      // Owner
      ownerAddress: businessData.ownerAddress || {},
      lessorInfo: businessData.lessorInfo || {},
      emergencyContact: businessData.emergencyContact || {},
      presidentName: businessData.presidentName || '',
      treasurerName: businessData.treasurerName || '',
      // Activities
      businessActivities: (businessActivities || []).map((a) => ({
        taxCode: a.taxCode || '',
        lineOfBusiness: a.lineOfBusiness || '',
        detailedLine: a.detailedLine || '',
        psicCode: a.psicCode || '',
        grossSales: a.grossSales || 0,
      })),
      // Capital
      capital: businessData.capital || {},
      accreditations: businessData.accreditations || {},
      oathOfUndertaking: businessData.oathOfUndertaking || false,
      // Legacy fields
      registeredBusinessName: businessData.registeredBusinessName || '',
      businessTradeName: businessData.businessTradeName || '',
      ownerFullName: businessData.ownerFullName || '',
      emailAddress: businessData.emailAddress || '',
      mobileNumber: businessData.mobileNumber || '',
      // Status
      applicationStatus: draft ? 'draft' : 'submitted',
      applicationReferenceNumber: `WI-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      submittedAt: draft ? undefined : new Date(),
      submittedToLguOfficer: !draft,
      isSubmitted: !draft,
    }

    profile.businesses.push(newBusiness)
    await profile.save()

    logAuditEvent('walk_in_registered', req._userId, 'BusinessProfile', profile._id.toString(), { businessId })

    // Compute fees
    let computedFees = null
    try {
      computedFees = await computeApplicationFees({ businessActivities: businessActivities || [] })
    } catch (feeErr) {
      console.warn('Fee computation failed (non-blocking):', feeErr.message)
    }

    return res.status(201).json({
      data: {
        applicationId: newBusiness.applicationReferenceNumber,
        businessId,
        computedFees,
        profile: profile.toObject(),
      },
    })
  } catch (err) {
    console.error('POST /walk-in error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create walk-in application' } })
  }
})

/**
 * GET /api/business/walk-in/search-pis
 * Search for existing PIS records by name or email
 */
router.get('/search-pis', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) {
      return res.json({ data: [] })
    }

    // Search users by name or email (cross-service call to auth)
    const axios = require('axios')
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
    const response = await axios.get(`${authServiceUrl}/api/auth/users/search`, {
      params: { q },
      headers: { Authorization: req.headers.authorization },
      timeout: 5000,
    }).catch(() => ({ data: { data: [] } }))

    return res.json({ data: response.data?.data || [] })
  } catch (err) {
    console.error('GET /walk-in/search-pis error:', err)
    return res.json({ data: [] })
  }
})

/**
 * POST /api/business/walk-in/:businessId/compute-fees
 * Compute fees for a walk-in application
 */
router.post('/:businessId/compute-fees', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const { businessActivities } = req.body
    const fees = await computeApplicationFees({ businessActivities: businessActivities || [] })
    return res.json({ data: fees })
  } catch (err) {
    console.error('POST /walk-in/compute-fees error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to compute fees' } })
  }
})

module.exports = router
