const BusinessProfile = require('../models/BusinessProfile')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
// Register Role model to enable populate('role')
require('../models/Role')
const blockchainService = require('../lib/blockchainService')
const { validateBusinessRegistrationNumber, validateGeolocation, calculateRiskLevel } = require('../lib/businessValidation')
const mongoose = require('mongoose')

let cachedAuthUserModel
let cachedAuthRoleModel
let cachedNotificationService

function getAuthUserModel() {
  if (cachedAuthUserModel) return cachedAuthUserModel
  try {
    cachedAuthUserModel = require('../../../auth-service/src/models/User')
  } catch (error) {
    cachedAuthUserModel = require('../models/User')
  }
  return cachedAuthUserModel
}

function getAuthRoleModel() {
  if (cachedAuthRoleModel) return cachedAuthRoleModel
  try {
    cachedAuthRoleModel = require('../../../auth-service/src/models/Role')
  } catch (error) {
    cachedAuthRoleModel = require('../models/Role')
  }
  return cachedAuthRoleModel
}

function getNotificationService() {
  if (cachedNotificationService) return cachedNotificationService
  try {
    cachedNotificationService = require('../../../auth-service/src/services/notificationService')
  } catch (error) {
    cachedNotificationService = require('./notificationService')
  }
  return cachedNotificationService
}

class BusinessProfileService {
  async getProfile(userId) {
    let profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      // Create default structure if not exists
      return {
        userId,
        currentStep: 2,
        ownerIdentity: {},
        businessRegistration: {},
        location: {},
        compliance: {},
        profileDetails: {},
        notifications: {},
        consent: {},
        status: 'draft'
      }
    }
    return profile
  }

  // --- Business Logic / System Actions ---

  validateRegistration(data) {
    // System Action: Validate format of registration number
    const regNum = data.registrationNumber || ''
    const isValid = /^[A-Z0-9-]+$/i.test(regNum)
    if (!isValid) {
      throw new Error('Invalid registration number format')
    }
    // In a real system, we might call an external API (DTI/SEC) here
    return true
  }

  determineJurisdiction(location) {
    // System Action: Auto-assign LGU
    // Logic: Map lat/lng or City/Barangay to LGU ID
    // For now, return a placeholder LGU assignment
    return {
      lguId: 'LGU-001',
      lguName: `${location.city} LGU`,
      inspectorPoolId: 'POOL-A'
    }
  }

  determineInspections(nature, risk) {
    // System Action: Auto-determine required inspections
    const inspections = ['Business Permit']
    if (risk === 'high') inspections.push('Fire Safety', 'Sanitary', 'Environmental')
    if (risk === 'medium') inspections.push('Fire Safety', 'Sanitary')
    return inspections
  }

  assessRisk(details) {
    // Use the comprehensive risk calculation from businessValidation
    return calculateRiskLevel(details)
  }

  async updateStep(userId, step, data, metadata = {}) {
    let update = {}
    // Step flow: 2 (Identity) → 3 (MFA) → 4 (Consent) → Complete
    let nextStep = step + 1
    
    // Get user role for audit logging
    const user = await User.findById(userId).populate('role').lean()
    const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
    
    // Get old profile for comparison
    const oldProfile = await BusinessProfile.findOne({ userId }).lean()
    
    switch (step) {
      case 2: // Owner Identity
        // System Action: Basic identity validation (e.g. ID number format)
        update['ownerIdentity'] = { ...data, isSubmitted: true }
        break

      case 3: // MFA Setup (no data saved to BusinessProfile, MFA is stored in User model)
        // Just mark step as complete - MFA setup is handled separately via User model
        // No data to save here, just progression
        break

      case 4: // Legal Consent (Final Step)
        update['consent'] = { ...data, isSubmitted: true }
        // System Action: Lock submitted data is implied by status change
        update['status'] = 'pending_review'
        break

      case 5: // Business Registration (Step 3)
        // This is now handled by addBusiness/updateBusiness methods
        // Keep for backward compatibility but redirect to addBusiness
        throw new Error('Use addBusiness or updateBusiness methods for step 5')

      case 6: // Risk Profile (Step 4)
        // This is now handled by updateBusinessRiskProfile method
        throw new Error('Use updateBusinessRiskProfile method for step 6')

      default:
        throw new Error('Invalid step')
    }

    // Only advance step if not the final step
    if (step < 4) {
      update['currentStep'] = nextStep
    }

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    
    // Create audit log for business profile update
    try {
      const stepName = step === 2 ? 'ownerIdentity' : step === 3 ? 'mfa' : step === 4 ? 'consent' : `step_${step}`
      const oldValue = oldProfile ? JSON.stringify(oldProfile[stepName] || {}) : ''
      const newValue = JSON.stringify(data)
      
      const auditLog = await AuditLog.create({
        userId,
        eventType: 'profile_update',
        fieldChanged: stepName,
        oldValue,
        newValue,
        role: roleSlug,
        metadata: {
          ...metadata,
          step,
          profileType: 'business',
        },
      })

      // Log hash to blockchain (non-blocking)
      if (blockchainService.isAvailable()) {
        // Use blockchain queue for non-blocking operations
        const blockchainQueue = require('../lib/blockchainQueue')
        blockchainQueue.queueBlockchainOperation(
          'logAuditHash',
          [auditLog.hash, 'profile_update'],
          String(auditLog._id)
        )
          .then((result) => {
            if (result.success) {
              auditLog.txHash = result.txHash
              auditLog.blockNumber = result.blockNumber
              auditLog.save().catch((err) => {
                console.error('Failed to update audit log with txHash:', err)
              })
            }
          })
          .catch((err) => {
            console.error('Error logging to blockchain:', err)
          })
      }
    } catch (error) {
      // Don't throw - audit logging failure shouldn't break profile updates
      console.error('Error creating audit log for business profile:', error)
    }
    
    return profile
  }

  // --- Multiple Business Management Methods ---

  /**
   * Add new business to businesses array
   * @param {string} userId - User ID
   * @param {object} businessData - Business registration data
   * @returns {Promise<object>} Updated profile
   */
  async addBusiness(userId, businessData) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    // Validate business registration number format
    const legacyFieldsPresent = businessData.registrationAgency || businessData.location || businessData.businessName
    if (legacyFieldsPresent) {
      const regValidation = validateBusinessRegistrationNumber(
        businessData.registrationAgency,
        businessData.businessRegistrationNumber
      )
      if (!regValidation.valid) {
        throw new Error(regValidation.error)
      }

      // Validate geolocation
      const geoValidation = validateGeolocation(
        businessData.location?.geolocation?.lat,
        businessData.location?.geolocation?.lng
      )
      if (!geoValidation.valid) {
        throw new Error(geoValidation.error)
      }

      // Check for duplicate registration number (same agency)
      const existingBusiness = profile.businesses?.find(
        b => b.businessRegistrationNumber === businessData.businessRegistrationNumber &&
             b.registrationAgency === businessData.registrationAgency
      )
      if (existingBusiness) {
        throw new Error('Business registration number already exists for this agency')
      }
    }

    // Generate unique business ID using mongoose ObjectId
    const businessId = new mongoose.Types.ObjectId().toString()

    // Determine if this should be primary (first business)
    const isFirstBusiness = !profile.businesses || profile.businesses.length === 0
    const isPrimary = isFirstBusiness

    // If setting as primary, unset current primary
    if (isPrimary && profile.businesses && profile.businesses.length > 0) {
      profile.businesses.forEach(b => {
        b.isPrimary = false
      })
    }

    // Calculate initial risk level
    const riskLevel = calculateRiskLevel(businessData)

    // Create new business object
    const newBusiness = {
      businessId,
      isPrimary,
      businessName: businessData.businessName || businessData.registeredBusinessName,
      registrationStatus: businessData.registrationStatus || 'not_yet_registered',
      location: businessData.location || {},
      businessType: businessData.businessType,
      registrationAgency: businessData.registrationAgency,
      businessRegistrationNumber: businessData.businessRegistrationNumber,
      businessStartDate: businessData.businessStartDate ? new Date(businessData.businessStartDate) : null,
      numberOfBranches: businessData.numberOfBranches || 0,
      industryClassification: businessData.industryClassification || '',
      taxIdentificationNumber: businessData.taxIdentificationNumber || '',
      contactNumber: businessData.contactNumber || businessData.mobileNumber || '',
      riskProfile: {
        businessSize: businessData.riskProfile?.businessSize || null,
        annualRevenue: businessData.riskProfile?.annualRevenue || null,
        businessActivitiesDescription: businessData.riskProfile?.businessActivitiesDescription || '',
        riskLevel
      },
      // Initialize new Business Registration Application fields
      applicationStatus: 'draft',
      applicationReferenceNumber: '',
      requirementsChecklist: {
        confirmed: false,
        confirmedAt: null,
        pdfDownloaded: false,
        pdfDownloadedAt: null
      },
      registeredBusinessName: businessData.registeredBusinessName || '',
      businessTradeName: businessData.businessTradeName || '',
      businessRegistrationType: businessData.businessRegistrationType || '',
      businessRegistrationDate: businessData.businessRegistrationDate ? new Date(businessData.businessRegistrationDate) : null,
      businessAddress: businessData.businessAddress || '',
      unitBuildingName: businessData.unitBuildingName || '',
      street: businessData.street || '',
      barangay: businessData.barangay || '',
      cityMunicipality: businessData.cityMunicipality || '',
      businessLocationType: businessData.businessLocationType || '',
      primaryLineOfBusiness: businessData.primaryLineOfBusiness || '',
      businessClassification: businessData.businessClassification || '',
      industryCategory: businessData.industryCategory || '',
      declaredCapitalInvestment: businessData.declaredCapitalInvestment || 0,
      numberOfBusinessUnits: businessData.numberOfBusinessUnits || 0,
      ownerFullName: businessData.ownerFullName || '',
      ownerPosition: businessData.ownerPosition || '',
      ownerNationality: businessData.ownerNationality || '',
      ownerResidentialAddress: businessData.ownerResidentialAddress || '',
      ownerTin: businessData.ownerTin || '',
      governmentIdType: businessData.governmentIdType || '',
      governmentIdNumber: businessData.governmentIdNumber || '',
      emailAddress: businessData.emailAddress || '',
      mobileNumber: businessData.mobileNumber || '',
      numberOfEmployees: businessData.numberOfEmployees || 0,
      withFoodHandlers: businessData.withFoodHandlers || '',
      certificationAccepted: businessData.certificationAccepted || false,
      declarantName: businessData.declarantName || '',
      declarationDate: businessData.declarationDate ? new Date(businessData.declarationDate) : null,
      lguDocuments: {
        idPicture: '',
        ctc: '',
        barangayClearance: '',
        dtiSecCda: '',
        leaseOrLandTitle: '',
        occupancyPermit: '',
        healthCertificate: ''
      },
      birRegistration: {
        registrationNumber: '',
        certificateUrl: '',
        registrationFee: 500,
        documentaryStampTax: 0,
        businessCapital: 0,
        booksOfAccountsUrl: '',
        authorityToPrintUrl: '',
        paymentReceiptUrl: ''
      },
      otherAgencyRegistrations: {
        hasEmployees: false,
        sss: {
          registered: false,
          proofUrl: ''
        },
        philhealth: {
          registered: false,
          proofUrl: ''
        },
        pagibig: {
          registered: false,
          proofUrl: ''
        }
      },
      submittedAt: null,
      submittedToLguOfficer: false,
      isSubmitted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to businesses array
    if (!profile.businesses) {
      profile.businesses = []
    }
    profile.businesses.push(newBusiness)
    
    // Mark the array as modified for Mongoose
    profile.markModified('businesses')
    await profile.save()

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'business_added',
        fieldChanged: 'businesses',
        oldValue: '',
        newValue: JSON.stringify(newBusiness),
        role: roleSlug,
        metadata: {
          businessId,
          businessName: businessData.businessName,
          isPrimary
        }
      })
    } catch (error) {
      console.error('Error creating audit log for business add:', error)
    }

    return profile
  }

  /**
   * Update existing business
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {object} businessData - Updated business data
   * @returns {Promise<object>} Updated profile
   */
  async updateBusiness(userId, businessId, businessData) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const businessIndex = profile.businesses?.findIndex(b => b.businessId === businessId)
    if (businessIndex === -1 || businessIndex === undefined) {
      throw new Error('Business not found')
    }

    const existingBusiness = profile.businesses[businessIndex]

    const legacyFieldsPresent = businessData.registrationAgency || businessData.location || businessData.businessName
    if (legacyFieldsPresent) {
      // Validate registration number if changed
      if (businessData.businessRegistrationNumber && 
          businessData.businessRegistrationNumber !== existingBusiness.businessRegistrationNumber) {
        const regValidation = validateBusinessRegistrationNumber(
          businessData.registrationAgency || existingBusiness.registrationAgency,
          businessData.businessRegistrationNumber
        )
        if (!regValidation.valid) {
          throw new Error(regValidation.error)
        }

        // Check for duplicate (excluding current business)
        const duplicate = profile.businesses.find(
          (b, idx) => b.businessId !== businessId &&
                      b.businessRegistrationNumber === businessData.businessRegistrationNumber &&
                      b.registrationAgency === (businessData.registrationAgency || existingBusiness.registrationAgency)
        )
        if (duplicate) {
          throw new Error('Business registration number already exists for this agency')
        }
      }

      // Validate geolocation if changed
      if (businessData.location?.geolocation) {
        const geoValidation = validateGeolocation(
          businessData.location.geolocation.lat,
          businessData.location.geolocation.lng
        )
        if (!geoValidation.valid) {
          throw new Error(geoValidation.error)
        }
      }
    }

    // Check if risk-relevant fields changed
    const riskFieldsChanged = 
      businessData.businessSize !== undefined ||
      businessData.annualRevenue !== undefined ||
      businessData.businessType !== undefined ||
      businessData.registrationStatus !== undefined ||
      businessData.numberOfBranches !== undefined ||
      businessData.riskProfile?.businessSize !== undefined ||
      businessData.riskProfile?.annualRevenue !== undefined

    // Update business fields
    // Convert mongoose document to plain object if needed
    const existingBusinessObj = existingBusiness.toObject ? existingBusiness.toObject() : existingBusiness
    
    const updatedBusiness = {
      ...existingBusinessObj,
      ...businessData,
      businessId: existingBusinessObj.businessId, // Don't allow changing ID
      isPrimary: existingBusinessObj.isPrimary, // Don't allow changing primary here (use setPrimaryBusiness)
      updatedAt: new Date()
    }
    
    // Handle nested location update properly
    if (businessData.location) {
      updatedBusiness.location = {
        ...existingBusinessObj.location,
        ...businessData.location
      }
    }
    
    // Handle nested riskProfile update properly
    if (businessData.riskProfile) {
      updatedBusiness.riskProfile = {
        ...existingBusinessObj.riskProfile,
        ...businessData.riskProfile
      }
    }

    // Recalculate risk level if relevant fields changed
    if (riskFieldsChanged) {
      const combinedData = {
        ...updatedBusiness,
        businessSize: businessData.businessSize ?? businessData.riskProfile?.businessSize ?? updatedBusiness.riskProfile?.businessSize ?? null,
        annualRevenue: businessData.annualRevenue ?? businessData.riskProfile?.annualRevenue ?? updatedBusiness.riskProfile?.annualRevenue ?? null,
        businessType: businessData.businessType ?? updatedBusiness.businessType,
        registrationStatus: businessData.registrationStatus ?? updatedBusiness.registrationStatus,
        numberOfBranches: businessData.numberOfBranches ?? updatedBusiness.numberOfBranches ?? 0
      }
      const newRiskLevel = calculateRiskLevel(combinedData)
      updatedBusiness.riskProfile = {
        ...updatedBusiness.riskProfile,
        ...(businessData.riskProfile || {}),
        riskLevel: newRiskLevel
      }
    } else if (businessData.riskProfile) {
      // If risk profile is updated but risk fields didn't change, just merge the risk profile
      updatedBusiness.riskProfile = {
        ...updatedBusiness.riskProfile,
        ...businessData.riskProfile
      }
    }

    const wasResubmit = existingBusinessObj?.applicationStatus === 'resubmit'
    if (updatedBusiness.applicationStatus === 'resubmit') {
      updatedBusiness.submittedAt = new Date()
      updatedBusiness.submittedToLguOfficer = true
      updatedBusiness.isSubmitted = true
    }

    // Update the business in the array
    profile.businesses[businessIndex] = updatedBusiness
    
    // Mark the array as modified for Mongoose
    profile.markModified('businesses')
    await profile.save()

    if (updatedBusiness.applicationStatus === 'resubmit' && !wasResubmit) {
      try {
        const notificationService = getNotificationService()
        const UserModel = getAuthUserModel()
        const RoleModel = getAuthRoleModel()
        const referenceNumber = updatedBusiness.applicationReferenceNumber || `APP-${String(businessId).slice(-8)}`

        const lguOfficerRole = await RoleModel.findOne({ slug: 'lgu_officer' }).lean()
        if (lguOfficerRole) {
          const lguOfficers = await UserModel.find({
            role: lguOfficerRole._id,
            isActive: true
          }).lean()

          const notificationPromises = lguOfficers.map((officer) =>
            notificationService.createNotification(
              officer._id,
              'application_status_update',
              'Application Resubmitted',
              `A business application "${updatedBusiness.businessName}" (Reference: ${referenceNumber}) has been resubmitted and is ready for review.`,
              'business_application',
              businessId,
              {
                businessName: updatedBusiness.businessName,
                referenceNumber,
                businessId,
                submittedAt: updatedBusiness.submittedAt
              }
            ).catch((err) => {
              console.error(`Failed to create notification for LGU Officer ${officer._id}:`, err)
              return null
            })
          )

          await Promise.all(notificationPromises)
          console.log(`[updateBusiness] Created resubmission notifications for ${lguOfficers.length} LGU Officer(s)`)
        }
      } catch (notifError) {
        console.error('[updateBusiness] Failed to create LGU Officer resubmission notifications:', notifError)
      }
    }

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'business_updated',
        fieldChanged: 'businesses',
        oldValue: JSON.stringify(existingBusiness),
        newValue: JSON.stringify(updatedBusiness),
        role: roleSlug,
        metadata: {
          businessId,
          businessName: updatedBusiness.businessName
        }
      })
    } catch (error) {
      console.error('Error creating audit log for business update:', error)
    }

    return profile
  }

  /**
   * Delete business
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @returns {Promise<object>} Updated profile
   */
  async deleteBusiness(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    if (!profile.businesses || profile.businesses.length === 0) {
      throw new Error('No businesses found')
    }

    // Prevent deletion if it's the only business
    if (profile.businesses.length === 1) {
      throw new Error('Cannot delete the only business. At least one business must exist.')
    }

    const businessIndex = profile.businesses.findIndex(b => b.businessId === businessId)
    if (businessIndex === -1) {
      throw new Error('Business not found')
    }

    const businessToDelete = profile.businesses[businessIndex]
    const wasPrimary = businessToDelete.isPrimary

    // Remove business
    profile.businesses.splice(businessIndex, 1)

    // If deleted business was primary, set first remaining business as primary
    if (wasPrimary && profile.businesses.length > 0) {
      profile.businesses[0].isPrimary = true
    }
    
    // Mark the array as modified for Mongoose
    profile.markModified('businesses')
    await profile.save()

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'business_deleted',
        fieldChanged: 'businesses',
        oldValue: JSON.stringify(businessToDelete),
        newValue: '',
        role: roleSlug,
        metadata: {
          businessId,
          businessName: businessToDelete.businessName,
          wasPrimary,
          newPrimaryBusinessId: wasPrimary && profile.businesses.length > 0 ? profile.businesses[0].businessId : null
        }
      })
    } catch (error) {
      console.error('Error creating audit log for business delete:', error)
    }

    return profile
  }

  /**
   * Set business as primary
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID to set as primary
   * @returns {Promise<object>} Updated profile
   */
  async setPrimaryBusiness(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    if (business.isPrimary) {
      return profile // Already primary
    }

    // Unset current primary
    if (profile.businesses) {
      profile.businesses.forEach(b => {
        b.isPrimary = false
      })
    }

    // Set new primary
    business.isPrimary = true
    business.updatedAt = new Date()
    
    // Mark the array as modified for Mongoose
    profile.markModified('businesses')
    await profile.save()

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'primary_business_changed',
        fieldChanged: 'businesses',
        oldValue: '',
        newValue: JSON.stringify(business),
        role: roleSlug,
        metadata: {
          businessId,
          businessName: business.businessName
        }
      })
    } catch (error) {
      console.error('Error creating audit log for primary business change:', error)
    }

    return profile
  }

  /**
   * Update risk profile for specific business
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {object} riskProfileData - Risk profile data
   * @returns {Promise<object>} Updated profile
   */
  async updateBusinessRiskProfile(userId, businessId, riskProfileData) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    // Combine business data with risk profile for calculation
    const combinedData = {
      ...business.toObject(),
      riskProfile: {
        ...business.riskProfile,
        ...riskProfileData
      },
      businessSize: riskProfileData.businessSize ?? business.riskProfile?.businessSize,
      annualRevenue: riskProfileData.annualRevenue ?? business.riskProfile?.annualRevenue
    }

    // Recalculate risk level
    const riskLevel = calculateRiskLevel(combinedData)

    // Update risk profile
    business.riskProfile = {
      ...business.riskProfile,
      ...riskProfileData,
      riskLevel
    }
    business.updatedAt = new Date()
    
    // Mark the array as modified for Mongoose
    profile.markModified('businesses')
    await profile.save()

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'risk_profile_updated',
        fieldChanged: 'riskProfile',
        oldValue: JSON.stringify(business.riskProfile),
        newValue: JSON.stringify(business.riskProfile),
        role: roleSlug,
        metadata: {
          businessId,
          businessName: business.businessName,
          riskLevel
        }
      })
    } catch (error) {
      console.error('Error creating audit log for risk profile update:', error)
    }

    return profile
  }

  /**
   * Get businesses array from profile
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of businesses
   */
  async getBusinesses(userId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      return []
    }
    return profile.businesses || []
  }

  /**
   * Get single business by ID
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @returns {Promise<object|null>} Business object or null
   */
  async getBusiness(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }
    const business = profile.businesses?.find(b => b.businessId === businessId)
    return business || null
  }

  /**
   * Confirm requirements checklist viewed
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @returns {Promise<object>} Updated profile
   */
  async confirmRequirementsChecklist(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    if (!business.requirementsChecklist.viewedAt) {
      business.requirementsChecklist.viewedAt = new Date()
    }
    if (!business.requirementsChecklist.confirmed) {
      business.requirementsChecklist.confirmed = true
      business.requirementsChecklist.confirmedAt = new Date()
    }
    if (business.applicationStatus === 'draft') {
      business.applicationStatus = 'requirements_viewed'
    }
    business.updatedAt = new Date()
    
    profile.markModified('businesses')
    await profile.save()

    return profile
  }

  /**
   * Mark requirements PDF as downloaded
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @returns {Promise<object>} Updated profile
   */
  async markRequirementsPdfDownloaded(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    business.requirementsChecklist.pdfDownloaded = true
    business.requirementsChecklist.pdfDownloadedAt = new Date()
    business.updatedAt = new Date()
    
    profile.markModified('businesses')
    await profile.save()

    return profile
  }

  /**
   * Update LGU documents
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {object} documents - Document URLs
   * @returns {Promise<object>} Updated profile
   */
  async updateLGUDocuments(userId, businessId, documents) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    business.lguDocuments = {
      ...business.lguDocuments,
      ...documents
    }
    const lguProgressStatuses = ['draft', 'requirements_viewed', 'form_completed', 'documents_uploaded']
    if (lguProgressStatuses.includes(business.applicationStatus)) {
      business.applicationStatus = 'documents_uploaded'
    }
    business.updatedAt = new Date()
    
    profile.markModified('businesses')
    await profile.save()

    return profile
  }

  /**
   * Update BIR registration information
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {object} birData - BIR registration data
   * @returns {Promise<object>} Updated profile
   */
  async updateBIRRegistration(userId, businessId, birData) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    business.birRegistration = {
      ...business.birRegistration,
      ...birData
    }
    const hasBirData = Boolean(
      birData?.paymentReceiptUrl ||
      birData?.registrationNumber ||
      birData?.certificateUrl ||
      birData?.booksOfAccountsUrl ||
      birData?.authorityToPrintUrl
    )
    const birProgressStatuses = ['draft', 'requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered']
    if (hasBirData && birProgressStatuses.includes(business.applicationStatus)) {
      business.applicationStatus = 'bir_registered'
    }
    business.updatedAt = new Date()
    
    profile.markModified('businesses')
    await profile.save()

    return profile
  }

  /**
   * Update other agency registrations
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {object} agencyData - Agency registration data
   * @returns {Promise<object>} Updated profile
   */
  async updateOtherAgencyRegistrations(userId, businessId, agencyData) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    business.otherAgencyRegistrations = {
      ...business.otherAgencyRegistrations,
      ...agencyData
    }
    if (business.applicationStatus === 'bir_registered' && agencyData.hasEmployees) {
      business.applicationStatus = 'agencies_registered'
    } else if (business.applicationStatus === 'bir_registered' && !agencyData.hasEmployees) {
      // If no employees, skip to ready for submission
      business.applicationStatus = 'agencies_registered'
    }
    business.updatedAt = new Date()
    
    profile.markModified('businesses')
    await profile.save()

    return profile
  }

  /**
   * Submit business application to LGU
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @returns {Promise<object>} Updated profile with reference number
   */
  async submitBusinessApplication(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    // Validate that all required steps are completed
    if (business.applicationStatus !== 'agencies_registered' && 
        business.applicationStatus !== 'bir_registered') {
      throw new Error('Cannot submit: application is not complete. Please complete all required steps.')
    }

    // Generate reference number: BR-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSeq = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
    const referenceNumber = `BR-${dateStr}-${randomSeq}`

    business.applicationReferenceNumber = referenceNumber
    business.applicationStatus = 'submitted'
    business.submittedAt = new Date()
    business.submittedToLguOfficer = true
    business.isSubmitted = true
    business.updatedAt = new Date()
    
    profile.markModified('businesses')
    await profile.save()

    // Create notifications for LGU Officers when business owner submits documents
    try {
      const notificationService = getNotificationService()
      const UserModel = getAuthUserModel()
      const RoleModel = getAuthRoleModel()
      
      // Get LGU Officer role
      const lguOfficerRole = await RoleModel.findOne({ slug: 'lgu_officer' }).lean()
      if (lguOfficerRole) {
        // Get all active LGU Officers
        const lguOfficers = await UserModel.find({ 
          role: lguOfficerRole._id, 
          isActive: true 
        }).lean()
        
        // Create notification for each LGU Officer
        const notificationPromises = lguOfficers.map(officer => 
          notificationService.createNotification(
            officer._id,
            'application_status_update',
            'New Application Submitted',
            `A new business application "${business.businessName}" (Reference: ${referenceNumber}) has been submitted and is ready for review.`,
            'business_application',
            businessId,
            {
              businessName: business.businessName,
              referenceNumber,
              businessId,
              submittedAt: business.submittedAt
            }
          ).catch(err => {
            console.error(`Failed to create notification for LGU Officer ${officer._id}:`, err)
            return null
          })
        )
        
        await Promise.all(notificationPromises)
        console.log(`[submitBusinessApplication] Created notifications for ${lguOfficers.length} LGU Officer(s)`)
      }
    } catch (notifError) {
      console.error(`[submitBusinessApplication] Failed to create LGU Officer notifications:`, notifError)
      // Don't throw - notification failure shouldn't break the submission process
    }

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'business_application_submitted',
        fieldChanged: 'applicationStatus',
        oldValue: business.applicationStatus,
        newValue: 'submitted',
        role: roleSlug,
        metadata: {
          businessId,
          businessName: business.businessName,
          referenceNumber
        }
      })
    } catch (error) {
      console.error('Error creating audit log for application submission:', error)
    }

    return profile
  }

  /**
   * Get business application status
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @returns {Promise<object>} Application status information
   */
  async getBusinessApplicationStatus(userId, businessId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    return {
      businessId: business.businessId,
      businessName: business.businessName,
      applicationStatus: business.applicationStatus,
      applicationReferenceNumber: business.applicationReferenceNumber,
      submittedAt: business.submittedAt,
      submittedToLguOfficer: business.submittedToLguOfficer,
      reviewedBy: business.reviewedBy,
      reviewedAt: business.reviewedAt,
      reviewComments: business.reviewComments,
      rejectionReason: business.rejectionReason,
      requirementsConfirmed: business.requirementsChecklist?.confirmed || false,
      documentsUploaded: !!business.lguDocuments,
      birRegistered: !!business.birRegistration?.certificateUrl,
      agenciesRegistered: business.otherAgencyRegistrations?.hasEmployees 
        ? (business.otherAgencyRegistrations.sss?.registered || 
           business.otherAgencyRegistrations.philhealth?.registered ||
           business.otherAgencyRegistrations.pagibig?.registered)
        : true // If no employees, considered registered
    }
  }

  // ========== BUSINESS RENEWAL METHODS ==========

  /**
   * Calculate gross receipts calendar year based on renewal year (BPLO standard)
   * When renewing for year X, gross receipts should be for calendar year (X - 1)
   * @param {number} renewalYear - Year being renewed (e.g., 2026)
   * @returns {number} Calendar year for gross receipts (e.g., 2025)
   */
  getGrossReceiptsCalendarYear(renewalYear) {
    return renewalYear - 1
  }

  /**
   * Migrate legacy gross receipts structure (cy2025) to new structure (amount + calendarYear)
   * This ensures backward compatibility with existing records
   * @param {object} renewal - Renewal object
   * @returns {object} Renewal with migrated gross receipts (if needed)
   */
  migrateGrossReceiptsIfNeeded(renewal) {
    if (!renewal || !renewal.grossReceipts) {
      return renewal
    }

    const grossReceipts = renewal.grossReceipts

    // If new structure already exists, no migration needed
    if (grossReceipts.amount !== undefined && grossReceipts.calendarYear !== undefined) {
      return renewal
    }

    // If legacy cy2025 exists but new structure doesn't, migrate it
    if (grossReceipts.cy2025 !== undefined && grossReceipts.cy2025 !== null) {
      grossReceipts.amount = grossReceipts.cy2025
      grossReceipts.calendarYear = this.getGrossReceiptsCalendarYear(renewal.renewalYear)
      // Keep cy2025 for backward compatibility during transition
    }

    return renewal
  }

  /**
   * Get current renewal period from configuration
   * @returns {Promise<object>} Renewal period information
   */
  async getRenewalPeriod() {
    const renewalConfig = require('../config/renewalConfig')
    const period = renewalConfig.getCurrentRenewalPeriod()
    const penaltyInfo = renewalConfig.getPenaltyInfo(new Date(), 0)
    
    return {
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      penaltyStart: period.penaltyStart.toISOString(),
      penaltyRate: period.penaltyRate,
      year: period.year,
      formatted: renewalConfig.getFormattedRenewalPeriod(),
      isWithinPeriod: renewalConfig.isWithinRenewalPeriod(),
      penaltyInfo
    }
  }

  /**
   * Start a new renewal application
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {number} renewalYear - Year being renewed (e.g., 2026)
   * @returns {Promise<object>} Created renewal application
   */
  async startRenewal(userId, businessId, renewalYear) {
    // First verify business exists and is eligible
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    // Check if business is approved/registered (can only renew registered businesses)
    if (business.applicationStatus !== 'approved' && business.applicationStatus !== 'submitted') {
      throw new Error('Business must be approved before renewal')
    }

    // Get renewal period
    const renewalConfig = require('../config/renewalConfig')
    const period = renewalConfig.getCurrentRenewalPeriod()

    // Generate renewal ID
    const renewalId = `REN-${renewalYear}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Calculate gross receipts calendar year (BPLO standard: renewalYear - 1)
    const calendarYear = this.getGrossReceiptsCalendarYear(renewalYear)

    // Create renewal object
    const renewal = {
      renewalId,
      renewalYear,
      renewalPeriodStart: period.start,
      renewalPeriodEnd: period.end,
      periodAcknowledged: false,
      grossReceipts: {
        amount: 0,
        calendarYear: calendarYear,
        excludesVat: true,
        excludesReturns: true,
        excludesUncollected: true,
        branchAllocations: []
      },
      renewalDocuments: {},
      assessment: {
        localBusinessTax: 0,
        mayorsPermitFee: 0,
        barangayClearanceFee: 0,
        communityTax: 0,
        fireSafetyInspectionFee: 0,
        sanitaryPermitFee: 0,
        garbageFee: 0,
        environmentalFee: 0,
        otherFees: 0,
        total: 0
      },
      payment: {
        status: 'pending',
        amount: 0,
        paymentMethod: '',
        transactionId: ''
      },
      renewalStatus: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Use atomic update to add renewal to the businesses array
    // This prevents version conflicts
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      { 
        userId,
        'businesses.businessId': businessId
      },
      {
        $push: {
          'businesses.$.renewals': renewal
        },
        $set: {
          'businesses.$.updatedAt': new Date()
        }
      },
      { new: true }
    )

    if (!updatedProfile) {
      throw new Error('Failed to create renewal - business not found or update failed')
    }

    // Find the updated business to return
    const updatedBusiness = updatedProfile.businesses?.find(b => b.businessId === businessId)
    if (!updatedBusiness) {
      throw new Error('Business not found after update')
    }

    // Find the renewal we just added
    const addedRenewal = updatedBusiness.renewals?.find(r => r.renewalId === renewalId)
    if (!addedRenewal) {
      throw new Error('Renewal was not added successfully')
    }

    return { renewal: addedRenewal, business: updatedBusiness }
  }

  /**
   * Acknowledge renewal period (Step 2)
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @returns {Promise<object>} Updated profile
   */
  async acknowledgeRenewalPeriod(userId, businessId, renewalId) {
    // Use atomic update to prevent version conflicts
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      {
        userId,
        'businesses.businessId': businessId,
        'businesses.renewals.renewalId': renewalId
      },
      {
        $set: {
          'businesses.$[business].renewals.$[renewal].periodAcknowledged': true,
          'businesses.$[business].renewals.$[renewal].periodAcknowledgedAt': new Date(),
          'businesses.$[business].renewals.$[renewal].updatedAt': new Date(),
          'businesses.$[business].updatedAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 'business.businessId': businessId },
          { 'renewal.renewalId': renewalId }
        ],
        new: true
      }
    )

    if (!updatedProfile) {
      // Try to find the profile to provide better error message
      const profile = await BusinessProfile.findOne({ userId })
      if (!profile) {
        throw new Error('Business profile not found')
      }

      const business = profile.businesses?.find(b => b.businessId === businessId)
      if (!business) {
        throw new Error(`Business not found: ${businessId}`)
      }

      if (!business.renewals || business.renewals.length === 0) {
        throw new Error(`No renewals found for business ${businessId}`)
      }

      const renewalIds = business.renewals.map(r => r.renewalId).join(', ')
      throw new Error(`Renewal application not found: ${renewalId}. Available renewals: ${renewalIds}`)
    }

    return updatedProfile
  }

  /**
   * Update gross receipts declaration (Step 5)
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @param {object} grossReceiptsData - Gross receipts data
   * @returns {Promise<object>} Updated profile
   */
  async updateGrossReceipts(userId, businessId, renewalId, grossReceiptsData) {
    // First, get the renewal to determine renewalYear
    const profile = await BusinessProfile.findOne({
      userId,
      'businesses.businessId': businessId,
      'businesses.renewals.renewalId': renewalId
    }).lean()

    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    const renewal = business.renewals?.find(r => r.renewalId === renewalId)
    if (!renewal) {
      throw new Error('Renewal application not found')
    }

    const renewalYear = renewal.renewalYear
    const expectedCalendarYear = this.getGrossReceiptsCalendarYear(renewalYear)

    // Support both new structure (amount) and legacy (cy2025) for backward compatibility
    let amount = grossReceiptsData.amount
    if (amount === undefined || amount === null) {
      // Fallback to legacy cy2025 field
      amount = grossReceiptsData.cy2025
    }

    // Convert to number if it's a string
    if (typeof amount === 'string') {
      amount = parseFloat(amount)
    }
    
    // Ensure it's a valid number
    if (amount === null || amount === undefined || isNaN(amount)) {
      throw new Error(`Gross receipts for CY ${expectedCalendarYear} must be a valid number`)
    }
    
    // Validate that it's greater than 0
    if (amount <= 0) {
      throw new Error(`Gross receipts for CY ${expectedCalendarYear} must be greater than 0`)
    }
    
    // Validate that it's not negative (additional check)
    if (amount < 0) {
      throw new Error('Gross receipts cannot be negative')
    }

    // Validate calendarYear if provided, or use calculated value
    let calendarYear = grossReceiptsData.calendarYear
    if (calendarYear === undefined || calendarYear === null) {
      calendarYear = expectedCalendarYear
    } else if (calendarYear !== expectedCalendarYear) {
      throw new Error(`Calendar year mismatch: expected CY ${expectedCalendarYear} (for renewal year ${renewalYear}), but got CY ${calendarYear}`)
    }

    // Ensure amount is a valid number
    const amountValue = Number(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      throw new Error(`Gross receipts for CY ${expectedCalendarYear} must be a valid number greater than 0`)
    }
    
    // Build gross receipts object - ensure all fields are explicitly set
    const grossReceipts = {
      amount: amountValue, // Explicitly set as number
      calendarYear: Number(calendarYear), // Ensure calendarYear is a number
      cy2025: amountValue, // Always set cy2025 to the same value for backward compatibility
      excludesVat: grossReceiptsData.excludesVat !== false, // Default true
      excludesReturns: grossReceiptsData.excludesReturns !== false, // Default true
      excludesUncollected: grossReceiptsData.excludesUncollected !== false, // Default true
      branchAllocations: Array.isArray(grossReceiptsData.branchAllocations) ? grossReceiptsData.branchAllocations : []
    }
    
    // Debug log before saving
    console.log('DEBUG - Saving gross receipts:', {
      renewalId,
      renewalYear,
      amount: grossReceipts.amount,
      calendarYear: grossReceipts.calendarYear,
      cy2025: grossReceipts.cy2025,
      amountType: typeof grossReceipts.amount,
      cy2025Type: typeof grossReceipts.cy2025
    })

    // Use atomic update to prevent version conflicts
    // First ensure grossReceipts object exists, then set all fields
    // This two-step approach ensures the object structure is correct
    let updatedProfile = await BusinessProfile.findOneAndUpdate(
      {
        userId,
        'businesses.businessId': businessId,
        'businesses.renewals.renewalId': renewalId
      },
      {
        $set: {
          // Ensure grossReceipts object exists first
          'businesses.$[business].renewals.$[renewal].grossReceipts': grossReceipts,
          'businesses.$[business].renewals.$[renewal].updatedAt': new Date(),
          'businesses.$[business].updatedAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 'business.businessId': businessId },
          { 'renewal.renewalId': renewalId }
        ],
        new: true,
        runValidators: true,
        upsert: false
      }
    )
    
    // Immediately follow up with explicit field updates to ensure amount is saved
    // This double-update ensures the amount field is definitely persisted
    if (updatedProfile) {
      updatedProfile = await BusinessProfile.findOneAndUpdate(
        {
          userId,
          'businesses.businessId': businessId,
          'businesses.renewals.renewalId': renewalId
        },
        {
          $set: {
            // Explicitly set amount and cy2025 to ensure they're saved
            'businesses.$[business].renewals.$[renewal].grossReceipts.amount': amountValue,
            'businesses.$[business].renewals.$[renewal].grossReceipts.cy2025': amountValue,
            'businesses.$[business].renewals.$[renewal].grossReceipts.calendarYear': Number(calendarYear)
          }
        },
        {
          arrayFilters: [
            { 'business.businessId': businessId },
            { 'renewal.renewalId': renewalId }
          ],
          new: true
        }
      )
    }

    if (!updatedProfile) {
      // Try to find the profile to provide better error message
      const profile = await BusinessProfile.findOne({ userId })
      if (!profile) {
        throw new Error('Business profile not found')
      }

      const business = profile.businesses?.find(b => b.businessId === businessId)
      if (!business) {
        throw new Error(`Business not found: ${businessId}`)
      }

      if (!business.renewals || business.renewals.length === 0) {
        throw new Error(`No renewals found for business ${businessId}`)
      }

      const renewalIds = business.renewals.map(r => r.renewalId).join(', ')
      throw new Error(`Renewal application not found: ${renewalId}. Available renewals: ${renewalIds}`)
    }

    // Verify the data was saved correctly
    const savedRenewal = updatedProfile.businesses
      ?.find(b => b.businessId === businessId)
      ?.renewals?.find(r => r.renewalId === renewalId)
    
    if (!savedRenewal) {
      throw new Error(`Failed to verify gross receipts save: renewal not found in updated profile`)
    }

    // Verify that gross receipts were actually saved
    const savedAmount = savedRenewal.grossReceipts?.amount
    const savedCy2025 = savedRenewal.grossReceipts?.cy2025
    const savedCalendarYear = savedRenewal.grossReceipts?.calendarYear
    
    // Convert to numbers if they're strings
    const savedAmountNum = savedAmount !== undefined && savedAmount !== null ? Number(savedAmount) : null
    const savedCy2025Num = savedCy2025 !== undefined && savedCy2025 !== null ? Number(savedCy2025) : null
    
    // Check if either amount or cy2025 is saved with a valid value
    const savedValue = savedAmountNum || savedCy2025Num
    if (!savedValue || savedValue === 0 || isNaN(savedValue)) {
      console.error('DEBUG - Gross receipts save verification failed:', {
        renewalId,
        expectedAmount: amountValue,
        savedAmount: savedAmount,
        savedAmountType: typeof savedAmount,
        savedAmountNum: savedAmountNum,
        savedCy2025: savedCy2025,
        savedCy2025Type: typeof savedCy2025,
        savedCy2025Num: savedCy2025Num,
        savedValue: savedValue,
        grossReceiptsObject: JSON.stringify(savedRenewal.grossReceipts, null, 2)
      })
      throw new Error(`Failed to save gross receipts: amount not persisted correctly. Expected: ${amountValue}, Saved amount: ${savedAmount} (${typeof savedAmount}), Saved cy2025: ${savedCy2025} (${typeof savedCy2025})`)
    }
    
    // Verify the saved value matches what we tried to save (allowing for small floating point differences)
    if (Math.abs(Number(savedValue) - Number(amountValue)) > 0.01) {
      console.warn(`Gross receipts value mismatch: Expected ${amountValue}, Got ${savedValue}`)
    }
    
    // Ensure amount field is explicitly set (not just cy2025)
    if (!savedAmountNum || savedAmountNum === 0 || isNaN(savedAmountNum)) {
      console.error('DEBUG - Amount field not saved correctly, attempting to fix:', {
        renewalId,
        savedAmount: savedAmount,
        savedAmountNum: savedAmountNum
      })
      // Try to update just the amount field if it's missing
      await BusinessProfile.findOneAndUpdate(
        {
          userId,
          'businesses.businessId': businessId,
          'businesses.renewals.renewalId': renewalId
        },
        {
          $set: {
            'businesses.$[business].renewals.$[renewal].grossReceipts.amount': amountValue
          }
        },
        {
          arrayFilters: [
            { 'business.businessId': businessId },
            { 'renewal.renewalId': renewalId }
          ]
        }
      )
      console.log('DEBUG - Attempted to fix amount field')
    }
    
    // Verify calendar year is saved
    if (!savedCalendarYear) {
      console.warn(`Calendar year not saved for renewal ${renewalId}`)
    }

    // Final verification - read from database one more time to ensure persistence
    const finalCheck = await BusinessProfile.findOne({
      userId,
      'businesses.businessId': businessId,
      'businesses.renewals.renewalId': renewalId
    }).lean()
    
    const finalRenewal = finalCheck?.businesses
      ?.find(b => b.businessId === businessId)
      ?.renewals?.find(r => r.renewalId === renewalId)
    
    const finalAmount = finalRenewal?.grossReceipts?.amount || finalRenewal?.grossReceipts?.cy2025
    
    console.log('DEBUG - Gross receipts saved successfully:', {
      renewalId,
      businessId,
      amount: savedRenewal.grossReceipts?.amount,
      calendarYear: savedRenewal.grossReceipts?.calendarYear,
      cy2025: savedRenewal.grossReceipts?.cy2025,
      finalAmountFromDB: finalAmount,
      savedGrossReceiptsObject: JSON.stringify(savedRenewal.grossReceipts, null, 2),
      finalGrossReceiptsObject: finalRenewal?.grossReceipts ? JSON.stringify(finalRenewal.grossReceipts, null, 2) : 'not found'
    })
    
    // If final check shows amount is missing, update it one more time
    if (!finalAmount || finalAmount === 0) {
      console.error('DEBUG - Amount still missing after all updates, performing final fix')
      const fixedProfile = await BusinessProfile.findOneAndUpdate(
        {
          userId,
          'businesses.businessId': businessId,
          'businesses.renewals.renewalId': renewalId
        },
        {
          $set: {
            'businesses.$[business].renewals.$[renewal].grossReceipts.amount': amountValue,
            'businesses.$[business].renewals.$[renewal].grossReceipts.cy2025': amountValue
          }
        },
        {
          arrayFilters: [
            { 'business.businessId': businessId },
            { 'renewal.renewalId': renewalId }
          ],
          new: true
        }
      )
      
      if (fixedProfile) {
        updatedProfile = fixedProfile
        console.log('DEBUG - Final fix applied, amount should now be saved')
      }
    }

    // Return the final updated profile (use the one with fixes if available)
    return updatedProfile
  }

  /**
   * Upload renewal documents (Step 6)
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @param {object} documents - Document URLs/CIDs
   * @returns {Promise<object>} Updated profile
   */
  async uploadRenewalDocuments(userId, businessId, renewalId, documents) {
    // First, get existing documents if any
    const profile = await BusinessProfile.findOne({
      userId,
      'businesses.businessId': businessId,
      'businesses.renewals.renewalId': renewalId
    }).lean()

    let existingDocuments = {}
    if (profile) {
      const business = profile.businesses?.find(b => b.businessId === businessId)
      const renewal = business?.renewals?.find(r => r.renewalId === renewalId)
      if (renewal?.renewalDocuments) {
        existingDocuments = renewal.renewalDocuments
      }
    }

    // Merge existing documents with new ones
    const documentFields = [
      'previousMayorsPermit', 'previousOfficialReceipt', 'auditedFinancialStatements',
      'incomeTaxReturn', 'barangayClearance', 'ctc', 'fireSafetyInspection',
      'sanitaryPermit', 'healthCertificate', 'businessInsurance', 'swornDeclaration'
    ]

    const updatedDocuments = { ...existingDocuments }
    documentFields.forEach(field => {
      if (documents[field] !== undefined) {
        updatedDocuments[field] = documents[field] || ''
      }
    })

    // Use atomic update to prevent version conflicts
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      {
        userId,
        'businesses.businessId': businessId,
        'businesses.renewals.renewalId': renewalId
      },
      {
        $set: {
          'businesses.$[business].renewals.$[renewal].renewalDocuments': updatedDocuments,
          'businesses.$[business].renewals.$[renewal].updatedAt': new Date(),
          'businesses.$[business].updatedAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 'business.businessId': businessId },
          { 'renewal.renewalId': renewalId }
        ],
        new: true
      }
    )

    if (!updatedProfile) {
      // Try to find the profile to provide better error message
      const profile = await BusinessProfile.findOne({ userId })
      if (!profile) {
        throw new Error('Business profile not found')
      }

      const business = profile.businesses?.find(b => b.businessId === businessId)
      if (!business) {
        throw new Error(`Business not found: ${businessId}`)
      }

      if (!business.renewals || business.renewals.length === 0) {
        throw new Error(`No renewals found for business ${businessId}`)
      }

      const renewalIds = business.renewals.map(r => r.renewalId).join(', ')
      throw new Error(`Renewal application not found: ${renewalId}. Available renewals: ${renewalIds}`)
    }

    return updatedProfile
  }

  /**
   * Calculate renewal assessment (Step 7)
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @returns {Promise<object>} Updated profile with calculated assessment
   */
  async calculateRenewalAssessment(userId, businessId, renewalId) {
    // First verify renewal exists and has gross receipts using the same query pattern
    const profile = await BusinessProfile.findOne({
      userId,
      'businesses.businessId': businessId,
      'businesses.renewals.renewalId': renewalId
    }).lean()

    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    const renewal = business.renewals?.find(r => r.renewalId === renewalId)
    if (!renewal) {
      // Provide better error message
      if (!business.renewals || business.renewals.length === 0) {
        throw new Error(`No renewals found for business ${businessId}`)
      }
      const renewalIds = business.renewals.map(r => r.renewalId).join(', ')
      console.error('DEBUG - Renewal not found in assessment calculation:', {
        requestedRenewalId: renewalId,
        availableRenewalIds: renewalIds,
        businessId,
        userId
      })
      throw new Error(`Renewal application not found: ${renewalId}. Available renewals: ${renewalIds}`)
    }

    // Log renewal data for debugging
    console.log('DEBUG - Renewal found for assessment calculation:', {
      renewalId: renewal.renewalId,
      renewalYear: renewal.renewalYear,
      hasGrossReceipts: !!renewal.grossReceipts,
      grossReceiptsAmount: renewal.grossReceipts?.amount,
      grossReceiptsCy2025: renewal.grossReceipts?.cy2025,
      grossReceiptsKeys: renewal.grossReceipts ? Object.keys(renewal.grossReceipts) : []
    })

    // Validate that gross receipts are declared
    // Support both new structure (amount) and legacy (cy2025) for backward compatibility
    if (!renewal.grossReceipts || typeof renewal.grossReceipts !== 'object' || Object.keys(renewal.grossReceipts).length === 0) {
      const calendarYear = this.getGrossReceiptsCalendarYear(renewal.renewalYear)
      
      // Check if gross receipts exist in other renewals
      const renewalsWithGrossReceipts = business.renewals?.filter(r => {
        if (!r.grossReceipts || typeof r.grossReceipts !== 'object') return false
        const amount = r.grossReceipts.amount || r.grossReceipts.cy2025
        return amount && amount > 0
      })
      
      if (renewalsWithGrossReceipts && renewalsWithGrossReceipts.length > 0) {
        const otherRenewalIds = renewalsWithGrossReceipts.map(r => r.renewalId).join(', ')
        console.error('DEBUG - Gross receipts found in other renewals:', {
          requestedRenewalId: renewalId,
          renewalsWithGrossReceipts: otherRenewalIds,
          calendarYear
        })
        throw new Error(`Gross receipts for CY ${calendarYear} are not declared in renewal ${renewalId}. However, gross receipts are found in other renewals: ${otherRenewalIds}. Please use the correct renewal or declare gross receipts for this renewal.`)
      }
      
      console.error('DEBUG - Gross receipts object is missing or empty:', {
        renewalId: renewal.renewalId,
        renewalYear: renewal.renewalYear,
        calendarYear,
        hasGrossReceipts: !!renewal.grossReceipts,
        grossReceiptsType: typeof renewal.grossReceipts,
        grossReceiptsKeys: renewal.grossReceipts ? Object.keys(renewal.grossReceipts) : [],
        renewalKeys: Object.keys(renewal)
      })
      throw new Error(`Gross receipts for CY ${calendarYear} must be declared before calculating assessment. Please complete the Gross Receipts step first.`)
    }

    // Get gross receipts value - try new structure first, then legacy
    // Check both amount and cy2025, preferring amount
    let grossReceiptsValue = undefined
    if (renewal.grossReceipts.amount !== undefined && renewal.grossReceipts.amount !== null) {
      grossReceiptsValue = renewal.grossReceipts.amount
    } else if (renewal.grossReceipts.cy2025 !== undefined && renewal.grossReceipts.cy2025 !== null) {
      // Fallback to legacy cy2025 field
      grossReceiptsValue = renewal.grossReceipts.cy2025
    }

    // Check if gross receipts value exists and is greater than 0
    // Note: We allow 0 to pass the existence check but will fail the > 0 check later
    if (grossReceiptsValue === undefined || grossReceiptsValue === null) {
      const calendarYear = renewal.grossReceipts?.calendarYear || this.getGrossReceiptsCalendarYear(renewal.renewalYear)
      
      // Check if gross receipts exist in other renewals
      const renewalsWithGrossReceipts = business.renewals?.filter(r => {
        if (!r.grossReceipts || typeof r.grossReceipts !== 'object') return false
        const amount = r.grossReceipts.amount || r.grossReceipts.cy2025
        return amount && amount > 0
      })
      
      if (renewalsWithGrossReceipts && renewalsWithGrossReceipts.length > 0) {
        const otherRenewalIds = renewalsWithGrossReceipts.map(r => r.renewalId).join(', ')
        console.error('DEBUG - Gross receipts value missing but found in other renewals:', {
          requestedRenewalId: renewalId,
          renewalsWithGrossReceipts: otherRenewalIds,
          calendarYear
        })
        throw new Error(`Gross receipts value for CY ${calendarYear} is missing in renewal ${renewalId}. However, gross receipts are found in other renewals: ${otherRenewalIds}. Please use the correct renewal or declare gross receipts for this renewal.`)
      }
      
      console.error('DEBUG - Gross receipts validation failed (value is undefined/null):', {
        renewalId: renewal.renewalId,
        renewalYear: renewal.renewalYear,
        calendarYear,
        grossReceipts: renewal.grossReceipts,
        amount: renewal.grossReceipts?.amount,
        cy2025: renewal.grossReceipts?.cy2025,
        grossReceiptsValue: grossReceiptsValue,
        grossReceiptsType: typeof renewal.grossReceipts?.amount,
        cy2025Type: typeof renewal.grossReceipts?.cy2025,
        fullGrossReceiptsObject: JSON.stringify(renewal.grossReceipts, null, 2)
      })
      throw new Error(`Gross receipts for CY ${calendarYear} must be declared before calculating assessment. Please complete the Gross Receipts step first.`)
    }
    
    // Convert to number if it's a string
    if (typeof grossReceiptsValue === 'string') {
      grossReceiptsValue = parseFloat(grossReceiptsValue)
    }
    
    // Validate that it's a valid number and greater than 0
    if (isNaN(grossReceiptsValue) || grossReceiptsValue <= 0) {
      const calendarYear = renewal.grossReceipts?.calendarYear || this.getGrossReceiptsCalendarYear(renewal.renewalYear)
      throw new Error(`Invalid gross receipts value for CY ${calendarYear}. Gross receipts must be a valid number greater than 0. Current value: ${renewal.grossReceipts.amount || renewal.grossReceipts.cy2025}`)
    }

    // Validate calendar year matches renewal year (BPLO standard)
    const expectedCalendarYear = this.getGrossReceiptsCalendarYear(renewal.renewalYear)
    const actualCalendarYear = renewal.grossReceipts?.calendarYear
    if (actualCalendarYear && actualCalendarYear !== expectedCalendarYear) {
      throw new Error(`Calendar year mismatch: gross receipts calendar year (${actualCalendarYear}) does not match expected year (${expectedCalendarYear}) for renewal year ${renewal.renewalYear}`)
    }

    // Import assessment service
    const assessmentService = require('./renewalAssessmentService')

    // Prepare business data for calculation
    const businessData = {
      businessType: business.businessType,
      location: business.location,
      numberOfEmployees: business.numberOfEmployees || 0,
      withFoodHandlers: business.withFoodHandlers,
      barangay: business.barangay || business.location?.barangay || '',
      hasSignage: false, // Can be added to business data if needed
      requiresZoningClearance: false // Can be added to business data if needed
    }

    // Calculate assessment with the validated and converted gross receipts value
    const assessment = assessmentService.calculateTotalAssessment(
      Number(grossReceiptsValue), // Ensure it's a number
      businessData
    )

    // Add calculated timestamp
    assessment.calculatedAt = new Date()

    // Use atomic update to set assessment in the nested renewal
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      {
        userId,
        'businesses.businessId': businessId,
        'businesses.renewals.renewalId': renewalId
      },
      {
        $set: {
          'businesses.$[business].renewals.$[renewal].assessment': assessment,
          'businesses.$[business].renewals.$[renewal].updatedAt': new Date(),
          'businesses.$[business].updatedAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 'business.businessId': businessId },
          { 'renewal.renewalId': renewalId }
        ],
        new: true
      }
    )

    if (!updatedProfile) {
      throw new Error('Failed to update assessment - renewal not found or update failed')
    }

    return { assessment, profile: updatedProfile }
  }

  /**
   * Process renewal payment (Step 8)
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @param {object} paymentData - Payment information
   * @returns {Promise<object>} Updated profile
   */
  async processRenewalPayment(userId, businessId, renewalId, paymentData) {
    // First verify assessment exists and get the amount
    const profile = await BusinessProfile.findOne({
      userId,
      'businesses.businessId': businessId,
      'businesses.renewals.renewalId': renewalId
    }).lean()

    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    const renewal = business.renewals?.find(r => r.renewalId === renewalId)
    if (!renewal) {
      throw new Error('Renewal application not found')
    }

    // Validate that assessment is calculated
    if (!renewal.assessment || renewal.assessment.total <= 0) {
      throw new Error('Assessment must be calculated before payment')
    }

    const paymentAmount = renewal.assessment.total

    // Update payment information using atomic update
    const payment = {
      status: paymentData.status || 'paid',
      amount: paymentAmount,
      paymentMethod: paymentData.paymentMethod || '',
      transactionId: paymentData.transactionId || '',
      paidAt: paymentData.status === 'paid' ? new Date() : null
    }

    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      {
        userId,
        'businesses.businessId': businessId,
        'businesses.renewals.renewalId': renewalId
      },
      {
        $set: {
          'businesses.$[business].renewals.$[renewal].payment': payment,
          'businesses.$[business].renewals.$[renewal].updatedAt': new Date(),
          'businesses.$[business].updatedAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 'business.businessId': businessId },
          { 'renewal.renewalId': renewalId }
        ],
        new: true
      }
    )

    if (!updatedProfile) {
      throw new Error('Failed to update payment - renewal not found or update failed')
    }

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'renewal_payment_processed',
        fieldChanged: 'payment.status',
        oldValue: 'pending',
        newValue: paymentData.status || 'paid',
        role: roleSlug,
        metadata: {
          businessId,
          renewalId,
          amount: paymentAmount,
          paymentMethod: paymentData.paymentMethod
        }
      })
    } catch (error) {
      console.error('Error creating audit log for renewal payment:', error)
    }

    return updatedProfile
  }

  /**
   * Submit renewal application (Final Step)
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @returns {Promise<object>} Updated profile with reference number
   */
  async submitRenewal(userId, businessId, renewalId) {
    // First verify all requirements are met
    const profile = await BusinessProfile.findOne({
      userId,
      'businesses.businessId': businessId,
      'businesses.renewals.renewalId': renewalId
    }).lean()

    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    const renewal = business.renewals?.find(r => r.renewalId === renewalId)
    if (!renewal) {
      throw new Error('Renewal application not found')
    }

    // Validate that all steps are completed
    if (!renewal.periodAcknowledged) {
      throw new Error('Renewal period must be acknowledged')
    }
    
    // Support both new structure (amount) and legacy (cy2025) for backward compatibility
    const grossReceiptsAmount = renewal.grossReceipts?.amount || renewal.grossReceipts?.cy2025
    if (!renewal.grossReceipts || !grossReceiptsAmount || grossReceiptsAmount <= 0) {
      const calendarYear = renewal.grossReceipts?.calendarYear || this.getGrossReceiptsCalendarYear(renewal.renewalYear)
      throw new Error(`Gross receipts for CY ${calendarYear} must be declared`)
    }
    if (!renewal.assessment || renewal.assessment.total <= 0) {
      throw new Error('Assessment must be calculated')
    }
    if (!renewal.payment || renewal.payment.status !== 'paid') {
      throw new Error('Payment must be completed before submission')
    }

    // Generate reference number: REN-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSeq = Math.floor(1000 + Math.random() * 9000)
    const referenceNumber = `REN-${dateStr}-${randomSeq}`
    const submittedAt = new Date()

    // Use atomic update to submit the renewal
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      {
        userId,
        'businesses.businessId': businessId,
        'businesses.renewals.renewalId': renewalId
      },
      {
        $set: {
          'businesses.$[business].renewals.$[renewal].referenceNumber': referenceNumber,
          'businesses.$[business].renewals.$[renewal].renewalStatus': 'submitted',
          'businesses.$[business].renewals.$[renewal].submittedAt': submittedAt,
          'businesses.$[business].renewals.$[renewal].updatedAt': submittedAt,
          'businesses.$[business].updatedAt': submittedAt
        }
      },
      {
        arrayFilters: [
          { 'business.businessId': businessId },
          { 'renewal.renewalId': renewalId }
        ],
        new: true
      }
    )

    if (!updatedProfile) {
      throw new Error('Failed to submit renewal - renewal not found or update failed')
    }

    // Audit log
    try {
      const user = await User.findById(userId).populate('role').lean()
      const roleSlug = (user && user.role && user.role.slug) ? user.role.slug : 'business_owner'
      
      await AuditLog.create({
        userId,
        eventType: 'renewal_submitted',
        fieldChanged: 'renewalStatus',
        oldValue: 'draft',
        newValue: 'submitted',
        role: roleSlug,
        metadata: {
          businessId,
          renewalId,
          renewalYear: renewal.renewalYear,
          referenceNumber
        }
      })
    } catch (error) {
      console.error('Error creating audit log for renewal submission:', error)
    }

    return { profile: updatedProfile, referenceNumber }
  }

  /**
   * Get renewal status
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {string} renewalId - Renewal ID
   * @returns {Promise<object>} Renewal status information
   */
  async getRenewalStatus(userId, businessId, renewalId) {
    const profile = await BusinessProfile.findOne({ userId })
    if (!profile) {
      throw new Error('Business profile not found')
    }

    const business = profile.businesses?.find(b => b.businessId === businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    const renewal = business.renewals?.find(r => r.renewalId === renewalId)
    if (!renewal) {
      throw new Error('Renewal application not found')
    }

    return {
      renewalId: renewal.renewalId,
      renewalYear: renewal.renewalYear,
      renewalStatus: renewal.renewalStatus,
      referenceNumber: renewal.referenceNumber,
      submittedAt: renewal.submittedAt,
      periodAcknowledged: renewal.periodAcknowledged,
      grossReceiptsDeclared: (renewal.grossReceipts?.amount || renewal.grossReceipts?.cy2025) > 0,
      documentsUploaded: Object.values(renewal.renewalDocuments || {}).some(url => url && url.trim() !== ''),
      assessmentCalculated: renewal.assessment?.total > 0,
      paymentStatus: renewal.payment?.status || 'pending',
      assessment: renewal.assessment
    }
  }
}

module.exports = new BusinessProfileService()
