const express = require('express')
const { requireJwt, requireRole } = require('../middleware/auth')
const BusinessProfile = require('../models/BusinessProfile')
const GeneralPermit = require('../models/GeneralPermit')
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
      ownerId,
      pisData,
      businessData,
      businessActivities,
      draft,
      registrationType,
      permitType, // 'permit' (regular) or 'general_permit' (temporary)
      permitCategory, // For general_permit: food_stall, event, etc.
    } = req.body

    const userId = applicantUserId || ownerId || req._userId
    if (!userId) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'ownerId is required' } })
    }

    // Handle Temporary (General Permit) applications
    if (permitType === 'general_permit') {
      const generalPermit = await GeneralPermit.create({
        permitCategory: permitCategory || 'food_stall',
        requirements: [],
        businessPlateNo: '',
        applicantId: userId,
        status: 'draft',
      })

      logAuditEvent('walk_in_general_permit_created', req._userId, 'GeneralPermit', generalPermit._id.toString(), {
        permitCategory: generalPermit.permitCategory,
        ownerId: userId,
      })

      return res.status(201).json({
        data: {
          applicationId: generalPermit._id.toString(),
          permitType: 'general_permit',
          permitCategory: generalPermit.permitCategory,
          status: generalPermit.status,
          generalPermit: generalPermit.toObject(),
        },
      })
    }

    // Handle Regular (Business Permit) applications
    // Support simplified walk-in creation (just ownerId + registrationType)
    // or full businessData payload
    const effectiveBusinessData = businessData || {
      applicationType: registrationType || 'new',
      businessName: 'Walk-in Business (Draft)',
    }

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
      businessName: effectiveBusinessData.registeredBusinessName || effectiveBusinessData.businessName || 'Walk-in Business',
      businessRegistrationNumber: effectiveBusinessData.businessRegistrationNumber || businessId,
      registrationStatus: 'proposed',
      businessStatus: 'active',
      // Unified form fields
      applicationType: effectiveBusinessData.applicationType || 'new',
      organizationType: effectiveBusinessData.organizationType || '',
      businessPlateNo: effectiveBusinessData.businessPlateNo || '',
      yearEstablished: effectiveBusinessData.yearEstablished || null,
      // Address
      houseBldgNo: effectiveBusinessData.houseBldgNo || '',
      buildingName: effectiveBusinessData.buildingName || '',
      street: effectiveBusinessData.street || '',
      barangay: effectiveBusinessData.barangay || '',
      subdivision: effectiveBusinessData.subdivision || '',
      cityMunicipality: effectiveBusinessData.cityMunicipality || '',
      blockCode: effectiveBusinessData.blockCode || '',
      pin: effectiveBusinessData.pin || '',
      buildingRegistryNo: effectiveBusinessData.buildingRegistryNo || '',
      businessAreaSqm: effectiveBusinessData.businessAreaSqm || 0,
      totalEmployees: effectiveBusinessData.totalEmployees || 0,
      employeesResidingInLgu: effectiveBusinessData.employeesResidingInLgu || 0,
      businessLocationType: effectiveBusinessData.businessLocationType || 'owned',
      // Owner
      ownerAddress: effectiveBusinessData.ownerAddress || {},
      lessorInfo: effectiveBusinessData.lessorInfo || {},
      emergencyContact: effectiveBusinessData.emergencyContact || {},
      presidentName: effectiveBusinessData.presidentName || '',
      treasurerName: effectiveBusinessData.treasurerName || '',
      // Activities
      businessActivities: (businessActivities || []).map((a) => ({
        taxCode: a.taxCode || '',
        lineOfBusiness: a.lineOfBusiness || '',
        detailedLine: a.detailedLine || '',
        psicCode: a.psicCode || '',
        grossSales: a.grossSales || 0,
      })),
      // Capital
      capital: effectiveBusinessData.capital || {},
      accreditations: effectiveBusinessData.accreditations || {},
      oathOfUndertaking: effectiveBusinessData.oathOfUndertaking || false,
      // Legacy fields
      registeredBusinessName: effectiveBusinessData.registeredBusinessName || '',
      businessTradeName: effectiveBusinessData.businessTradeName || '',
      ownerFullName: effectiveBusinessData.ownerFullName || '',
      emailAddress: effectiveBusinessData.emailAddress || '',
      mobileNumber: effectiveBusinessData.mobileNumber || '',
      // Status - simplified walk-in always creates draft
      applicationStatus: (businessData ? (draft ? 'draft' : 'submitted') : 'draft'),
      applicationReferenceNumber: `WI-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      submittedAt: (businessData && !draft) ? new Date() : undefined,
      submittedToLguOfficer: businessData ? !draft : false,
      isSubmitted: businessData ? !draft : false,
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
        permitType: 'permit',
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
