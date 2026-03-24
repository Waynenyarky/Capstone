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
      // Form definition type (required for AddBusinessForm to load the correct definition)
      formType: effectiveBusinessData.formType || 'permit',
      formData: effectiveBusinessData.formData || {},
      // Walk-in flag so business-owner listing can hide officer-created drafts
      createdByOfficer: true,
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
 * PUT /api/business/walk-in/:businessId
 * Officer updates a walk-in draft (save draft or final submit).
 * On final submit, auto-approves since the officer filled it out.
 */
router.put('/:businessId', requireJwt, requireRole(['lgu_officer', 'admin']), async (req, res) => {
  try {
    const { businessId } = req.params
    const officerId = req._userId
    const businessData = req.body

    // Find the profile containing this business
    const mongoose = require('mongoose')
    const lookupClauses = [{ 'businesses.businessId': businessId }]
    if (mongoose.Types.ObjectId.isValid(businessId)) {
      lookupClauses.push({ 'businesses._id': new mongoose.Types.ObjectId(businessId) })
    }
    const profile = await BusinessProfile.findOne({ $or: lookupClauses })
    if (!profile) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found' } })
    }

    const businessIndex = profile.businesses.findIndex(
      b => String(b.businessId) === businessId || String(b._id) === businessId
    )
    if (businessIndex === -1) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Business not found in profile' } })
    }

    const existing = profile.businesses[businessIndex].toObject
      ? profile.businesses[businessIndex].toObject()
      : profile.businesses[businessIndex]

    // Determine if this is a final submit
    const isFinalSubmit = (businessData.applicationStatus || '').toLowerCase() === 'submitted'

    // Extract business name from formData if not provided directly
    const extractedBusinessName = businessData.businessName ||
      (businessData.formData && (
        businessData.formData.businessName ||
        businessData.formData.registeredBusinessName ||
        businessData.formData['Business / trade name'] ||
        businessData.formData.businessTradeName ||
        businessData.formData.activityName
      ))

    // Merge updates
    const updated = {
      ...existing,
      ...businessData,
      businessId: existing.businessId,
      isPrimary: existing.isPrimary,
      createdByOfficer: true,
      updatedAt: new Date(),
    }

    // Update business name if extracted
    if (extractedBusinessName) {
      updated.businessName = extractedBusinessName
    }

    // Merge documentCids into lguDocuments
    const existingLgu = (existing.lguDocuments && typeof existing.lguDocuments === 'object')
      ? existing.lguDocuments : {}
    const mergedLgu = { ...existingLgu }
    if (businessData.documentCids && typeof businessData.documentCids === 'object') {
      Object.keys(businessData.documentCids).forEach((key) => {
        const cid = businessData.documentCids[key]
        if (cid && typeof cid === 'string' && cid.trim()) {
          const ipfsKey = key.endsWith('IpfsCid') ? key : `${key}IpfsCid`
          mergedLgu[ipfsKey] = cid.trim()
        }
      })
    }
    updated.lguDocuments = mergedLgu

    if (isFinalSubmit) {
      // Officer-submitted walk-in: auto-approve (skip review cycle)
      updated.applicationStatus = 'approved'
      updated.submittedAt = new Date()
      updated.submittedToLguOfficer = true
      updated.isSubmitted = true
      updated.reviewedBy = officerId
      updated.reviewedAt = new Date()

      logAuditEvent('walk_in_submitted_and_approved', officerId, 'BusinessProfile', profile._id.toString(), {
        businessId: existing.businessId,
        businessName: updated.businessName,
      })
    }

    profile.businesses[businessIndex] = updated
    profile.markModified('businesses')
    await profile.save()

    // If auto-approved, issue permit via admin-service's shared MongoDB
    if (isFinalSubmit) {
      try {
        const mongoose = require('mongoose')
        let Permit
        try {
          Permit = mongoose.model('Permit')
        } catch (_) {
          const permitSchema = new mongoose.Schema({
            permitNumber: { type: String, required: true, unique: true, index: true },
            businessId: { type: String, required: true, index: true },
            businessName: { type: String, required: true },
            ownerName: { type: String, required: true },
            address: { type: String, required: true },
            lineOfBusiness: { type: String, required: true },
            permitType: { type: String, enum: ['initial', 'renewal'], default: 'initial' },
            issuedDate: { type: Date, required: true, default: Date.now },
            expiryDate: { type: Date, required: true },
            status: { type: String, enum: ['active', 'expired', 'suspended', 'revoked'], default: 'active', index: true },
            qrCode: { type: String },
            issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
          }, { timestamps: true })
          Permit = mongoose.model('Permit', permitSchema)
        }

        const bId = existing.businessId
        const year = new Date().getFullYear()
        const ts = Date.now().toString().slice(-5)
        const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const permitNumber = `MP-${year}-${ts}${rnd}`
        const issuedDate = new Date()
        const expiryDate = new Date(issuedDate)
        expiryDate.setFullYear(expiryDate.getFullYear() + 1)

        const bName = updated.businessName || updated.registeredBusinessName || 'N/A'
        const ownerName = updated.ownerFullName || 'N/A'
        const address = typeof updated.businessAddress === 'string'
          ? updated.businessAddress
          : [updated.houseBldgNo, updated.street, updated.barangay, updated.cityMunicipality].filter(Boolean).join(', ') || 'N/A'
        const lob = updated.primaryLineOfBusiness || updated.lineOfBusiness || 'N/A'

        await Permit.create({
          permitNumber, businessId: bId, businessName: bName, ownerName,
          address, lineOfBusiness: lob, permitType: 'initial',
          issuedDate, expiryDate, status: 'active', issuedBy: officerId,
        })

        // Update business with permit reference
        profile.businesses[businessIndex].permitNumber = permitNumber
        profile.businesses[businessIndex].permitIssuedDate = issuedDate
        profile.businesses[businessIndex].permitExpiryDate = expiryDate
        profile.businesses[businessIndex].permitStatus = 'active'
        profile.markModified('businesses')
        await profile.save()

        console.log(`[walk-in] Auto-issued permit ${permitNumber} for business ${bId}`)
      } catch (permitErr) {
        console.warn('[walk-in] Permit auto-issuance failed (non-blocking):', permitErr.message)
      }
    }

    return res.json({
      success: true,
      businessId: existing.businessId,
      applicationStatus: updated.applicationStatus,
      businesses: profile.businesses,
      profile: profile.toObject(),
    })
  } catch (err) {
    console.error('PUT /walk-in/:businessId error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Failed to update walk-in application' } })
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
