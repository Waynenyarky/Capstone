const BusinessProfile = require('../models/BusinessProfile')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const Role = require('../models/Role') // Ensure Role model is registered
const blockchainService = require('../lib/blockchainService')
const crypto = require('crypto')
const sendEmail = require('../lib/mailer').sendEmail

class PermitApplicationService {
  /**
   * Get permit applications with filters and pagination
   * @param {object} filters - Filter criteria
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} Applications list with pagination info
   */
  async getApplications(filters = {}, pagination = {}) {
    const {
      status,
      businessName,
      applicationType,
      dateFrom,
      dateTo,
      applicationReferenceNumber
    } = filters

    const page = parseInt(pagination.page) || 1
    const limit = parseInt(pagination.limit) || 10
    const skip = (page - 1) * limit

    // Build aggregation pipeline
    const pipeline = [
      // First match documents that have businesses array
      { $match: { businesses: { $exists: true, $ne: [] } } },
      // Unwind the businesses array
      { $unwind: '$businesses' },
      // Match on business fields after unwind
      {
        $match: {
          'businesses.applicationStatus': { $exists: true, $ne: null },
          ...(status && { 'businesses.applicationStatus': status }),
          ...(businessName && {
            'businesses.businessName': { $regex: businessName, $options: 'i' }
          }),
          ...(applicationReferenceNumber && {
            'businesses.applicationReferenceNumber': applicationReferenceNumber
          }),
          ...(dateFrom || dateTo ? {
            'businesses.submittedAt': {
              ...(dateFrom && { $gte: new Date(dateFrom) }),
              ...(dateTo && { $lte: new Date(dateTo) })
            }
          } : {})
        }
      },
      {
        $project: {
          userId: 1,
          businessId: '$businesses.businessId',
          businessName: '$businesses.businessName',
          applicationStatus: '$businesses.applicationStatus',
          applicationReferenceNumber: '$businesses.applicationReferenceNumber',
          submittedAt: '$businesses.submittedAt',
          ownerFullName: '$businesses.ownerFullName',
          applicationType: { 
            $cond: [
              { $ne: ['$businesses.applicationStatus', null] }, 
              'new_registration', 
              'renewal'
            ] 
          },
          aiValidation: '$businesses.aiValidation',
          createdAt: '$businesses.createdAt',
          updatedAt: '$businesses.updatedAt'
        }
      },
      { $sort: { submittedAt: -1, createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }]
        }
      }
    ]

    const result = await BusinessProfile.aggregate(pipeline)
    const data = result[0]?.data || []
    const total = result[0]?.total[0]?.count || 0

    // Populate user information for each application
    const applications = await Promise.all(
      data.map(async (app) => {
        try {
          const user = await User.findById(app.userId).select('email firstName lastName').lean()
          
          // Get business owner full name with priority:
          // 1. ownerFullName from business registration (already in app data)
          // 2. User's firstName + lastName (fallback)
          // Note: For list view, we don't fetch full profile to avoid performance issues
          // Full ownerIdentity.fullName is available in getApplicationById detail view
          const ownerFullName = 
            (app.ownerFullName && app.ownerFullName.trim()) ||
            (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') ||
            (user?.email || 'N/A')
          
          return {
            applicationId: app.businessId,
            businessId: app.businessId,
            userId: app.userId,
            businessName: app.businessName,
            applicationReferenceNumber: app.applicationReferenceNumber || `APP-${String(app.businessId).slice(-8)}`,
            status: app.applicationStatus || 'draft',
            applicationType: app.applicationType,
            submittedAt: app.submittedAt,
            aiValidation: app.aiValidation || { completed: false },
            businessOwner: user ? {
              email: user.email,
              name: ownerFullName,
              firstName: user.firstName,
              lastName: user.lastName
            } : null,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
          }
        } catch (err) {
          console.error(`Error processing application ${app.businessId}:`, err)
          // Return basic info even if user lookup fails
          return {
            applicationId: app.businessId,
            businessId: app.businessId,
            userId: app.userId,
            businessName: app.businessName,
            applicationReferenceNumber: app.applicationReferenceNumber || `APP-${String(app.businessId).slice(-8)}`,
            status: app.applicationStatus || 'draft',
            applicationType: app.applicationType,
            submittedAt: app.submittedAt,
            aiValidation: app.aiValidation || { completed: false },
            businessOwner: null,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
          }
        }
      })
    )

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get single application by ID
   * @param {string} applicationId - Application/Business ID
   * @param {string} businessId - Business ID (optional, same as applicationId for new registrations)
   * @returns {Promise<object>} Application details
   */
  async getApplicationById(applicationId, businessId = null) {
    const targetBusinessId = businessId || applicationId

    const profile = await BusinessProfile.findOne({
      'businesses.businessId': targetBusinessId
    }).lean()

    if (!profile) {
      throw new Error('Application not found')
    }

    const business = profile.businesses.find(b => b.businessId === targetBusinessId)
    if (!business) {
      throw new Error('Application not found')
    }

    const user = await User.findById(profile.userId)
      .select('email firstName lastName phoneNumber')
      .lean()

    // Get business owner full name with priority:
    // 1. ownerIdentity.fullName (from BusinessProfile - most accurate)
    // 2. businessRegistration.ownerFullName (from business registration form)
    // 3. User's firstName + lastName (fallback)
    const ownerFullName = 
      (profile.ownerIdentity?.fullName && profile.ownerIdentity.fullName.trim()) ||
      (business.ownerFullName && business.ownerFullName.trim()) ||
      (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') ||
      'N/A'

    // Helper function to get document URL (prioritize IPFS CID)
    const getDocumentUrl = (legacyUrl, ipfsCid, gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://localhost:8080/ipfs/') => {
      if (ipfsCid && ipfsCid.trim()) {
        const cleanGateway = gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`
        return `${cleanGateway}${ipfsCid.trim()}`
      }
      return legacyUrl || ''
    }

    const lguDocs = business.lguDocuments || {}
    const birReg = business.birRegistration || {}
    const otherAgencies = business.otherAgencyRegistrations || {}

    return {
      applicationId: business.businessId,
      businessId: business.businessId,
      userId: profile.userId,
      businessName: business.businessName,
      applicationReferenceNumber: business.applicationReferenceNumber || `APP-${String(business.businessId).slice(-8)}`,
      status: business.applicationStatus || 'draft',
      applicationType: business.applicationStatus ? 'new_registration' : 'renewal',
      submittedAt: business.submittedAt,
      submittedToLguOfficer: business.submittedToLguOfficer || false,
      isSubmitted: business.isSubmitted || false,
      reviewedBy: business.reviewedBy,
      reviewedAt: business.reviewedAt,
      reviewComments: business.reviewComments,
      rejectionReason: business.rejectionReason,
      // Owner Identity from BusinessProfile
      ownerIdentity: profile.ownerIdentity || {},
      // Complete Business Registration Data
      businessRegistration: {
        registeredBusinessName: business.registeredBusinessName || business.businessName,
        businessTradeName: business.businessTradeName,
        businessRegistrationType: business.businessRegistrationType,
        businessRegistrationNumber: business.businessRegistrationNumber,
        businessRegistrationDate: business.businessRegistrationDate,
        registrationAgency: business.registrationAgency,
        businessType: business.businessType,
        businessClassification: business.businessClassification,
        industryCategory: business.industryCategory,
        primaryLineOfBusiness: business.primaryLineOfBusiness,
        declaredCapitalInvestment: business.declaredCapitalInvestment || 0,
        numberOfBusinessUnits: business.numberOfBusinessUnits || 0,
        ownerFullName: business.ownerFullName,
        ownerPosition: business.ownerPosition,
        ownerNationality: business.ownerNationality,
        ownerResidentialAddress: business.ownerResidentialAddress,
        ownerTin: business.ownerTin,
        governmentIdType: business.governmentIdType,
        governmentIdNumber: business.governmentIdNumber,
        emailAddress: business.emailAddress,
        mobileNumber: business.mobileNumber,
        numberOfEmployees: business.numberOfEmployees || 0,
        withFoodHandlers: business.withFoodHandlers,
        declarantName: business.declarantName,
        declarationDate: business.declarationDate,
        certificationAccepted: business.certificationAccepted || false,
        businessStartDate: business.businessStartDate,
        industryClassification: business.industryClassification
      },
      // Complete Location Data
      location: {
        ...business.location,
        businessAddress: business.businessAddress,
        unitBuildingName: business.unitBuildingName,
        street: business.street,
        barangay: business.barangay,
        cityMunicipality: business.cityMunicipality,
        businessLocationType: business.businessLocationType
      },
      // Risk Profile
      riskProfile: business.riskProfile || {},
      // BIR Registration (with IPFS URL resolution)
      birRegistration: {
        ...birReg,
        certificateUrl: getDocumentUrl(birReg.certificateUrl, birReg.certificateIpfsCid),
        booksOfAccountsUrl: getDocumentUrl(birReg.booksOfAccountsUrl, birReg.booksOfAccountsIpfsCid),
        authorityToPrintUrl: getDocumentUrl(birReg.authorityToPrintUrl, birReg.authorityToPrintIpfsCid),
        paymentReceiptUrl: getDocumentUrl(birReg.paymentReceiptUrl, birReg.paymentReceiptIpfsCid)
      },
      // Other Agency Registrations (with IPFS URL resolution)
      otherAgencyRegistrations: {
        ...otherAgencies,
        hasEmployees: otherAgencies.hasEmployees || false,
        sss: {
          ...otherAgencies.sss,
          proofUrl: getDocumentUrl(otherAgencies.sss?.proofUrl, otherAgencies.sss?.proofIpfsCid)
        },
        philhealth: {
          ...otherAgencies.philhealth,
          proofUrl: getDocumentUrl(otherAgencies.philhealth?.proofUrl, otherAgencies.philhealth?.proofIpfsCid)
        },
        pagibig: {
          ...otherAgencies.pagibig,
          proofUrl: getDocumentUrl(otherAgencies.pagibig?.proofUrl, otherAgencies.pagibig?.proofIpfsCid)
        }
      },
      // Requirements Checklist
      requirementsChecklist: business.requirementsChecklist || {},
      // Documents (with IPFS URL resolution)
      documents: {
        idPicture: getDocumentUrl(lguDocs.idPicture, lguDocs.idPictureIpfsCid),
        ctc: getDocumentUrl(lguDocs.ctc, lguDocs.ctcIpfsCid),
        barangayClearance: getDocumentUrl(lguDocs.barangayClearance, lguDocs.barangayClearanceIpfsCid),
        dtiSecCda: getDocumentUrl(lguDocs.dtiSecCda, lguDocs.dtiSecCdaIpfsCid),
        leaseOrLandTitle: getDocumentUrl(lguDocs.leaseOrLandTitle, lguDocs.leaseOrLandTitleIpfsCid),
        occupancyPermit: getDocumentUrl(lguDocs.occupancyPermit, lguDocs.occupancyPermitIpfsCid),
        healthCertificate: getDocumentUrl(lguDocs.healthCertificate, lguDocs.healthCertificateIpfsCid)
      },
      // AI Validation
      aiValidation: business.aiValidation || { completed: false },
      // Business Owner (with correct full name priority)
      businessOwner: user ? {
        email: user.email,
        name: ownerFullName,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName
      } : null,
      // Legacy businessDetails for backward compatibility
      businessDetails: {
        businessName: business.businessName,
        registeredBusinessName: business.registeredBusinessName || business.businessName,
        businessTradeName: business.businessTradeName,
        businessRegistrationType: business.businessRegistrationType,
        businessRegistrationNumber: business.businessRegistrationNumber,
        taxIdentificationNumber: business.taxIdentificationNumber,
        location: business.location,
        businessType: business.businessType,
        numberOfEmployees: business.numberOfEmployees,
        withFoodHandlers: business.withFoodHandlers
      },
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    }
  }

  /**
   * Start reviewing an application (set status to under_review)
   * @param {string} applicationId - Application ID
   * @param {string} businessId - Business ID
   * @param {string} officerId - LGU Officer user ID
   * @returns {Promise<object>} Updated application
   */
  async startReview(applicationId, businessId, officerId) {
    // Get officer info - try to populate role, fallback to direct query if needed
    let officer
    try {
      officer = await User.findById(officerId).populate('role').lean()
    } catch (populateError) {
      // If populate fails, get user and role separately
      officer = await User.findById(officerId).lean()
      if (officer && officer.role) {
        const role = await Role.findById(officer.role).lean()
        officer.role = role
      }
    }
    
    if (!officer) {
      throw new Error('Officer not found')
    }

    // Check officer role
    const roleSlug = officer.role?.slug || ''
    if (!['lgu_officer', 'staff', 'lgu_manager'].includes(roleSlug)) {
      throw new Error('Unauthorized: Only LGU officers can review applications')
    }

    // Get current application
    const profile = await BusinessProfile.findOne({
      'businesses.businessId': businessId || applicationId
    })

    if (!profile) {
      throw new Error('Application not found')
    }

    const businessIndex = profile.businesses.findIndex(b => b.businessId === (businessId || applicationId))
    if (businessIndex === -1) {
      throw new Error('Application not found')
    }

    const business = profile.businesses[businessIndex]
    const oldStatus = business.applicationStatus || 'draft'

    // Only allow starting review if status is 'submitted'
    if (oldStatus !== 'submitted') {
      // If already under review or final decision, just return current state
      return this.getApplicationById(applicationId, businessId)
    }

    // Update status to under_review
    profile.businesses[businessIndex].applicationStatus = 'under_review'
    profile.businesses[businessIndex].reviewedBy = officerId
    profile.businesses[businessIndex].reviewedAt = new Date()

    // Mark the businesses array as modified so Mongoose knows to save it
    profile.markModified('businesses')

    console.log(`[startReview] Updating status from '${oldStatus}' to 'under_review' for business ${businessId || applicationId}, userId: ${profile.userId}`)
    
    // Save the profile
    try {
      await profile.save()
      console.log(`[startReview] Profile saved successfully`)
      
      // Create notification for business owner
      try {
        const notificationService = require('../../../src/services/notificationService')
        await notificationService.createNotification(
          profile.userId,
          'application_review_started',
          'Application Review Started',
          `Your application "${business.businessName}" is now being reviewed by an LGU Officer.`,
          'business_application',
          businessId || applicationId
        )
      } catch (notifError) {
        console.error(`[startReview] Failed to create notification:`, notifError)
        // Don't throw - notification failure shouldn't break the review process
      }
    } catch (saveError) {
      console.error(`[startReview] Failed to save profile:`, saveError)
      throw new Error(`Failed to save status update: ${saveError.message}`)
    }
    
    // Re-fetch to verify status was saved correctly
    const verifyProfile = await BusinessProfile.findOne({
      'businesses.businessId': businessId || applicationId
    }).lean()
    
    if (!verifyProfile) {
      console.error(`[startReview] Verification failed: Profile not found after save`)
      throw new Error('Failed to verify status update: Profile not found')
    }
    
    const verifyBusiness = verifyProfile.businesses?.find(b => b.businessId === (businessId || applicationId))
    if (!verifyBusiness) {
      console.error(`[startReview] Verification failed: Business not found after save`)
      throw new Error('Failed to verify status update: Business not found')
    }
    
    if (verifyBusiness.applicationStatus !== 'under_review') {
      console.error(`[startReview] Status verification failed: expected 'under_review', got '${verifyBusiness.applicationStatus}'`)
      throw new Error(`Failed to verify status update: Expected 'under_review', got '${verifyBusiness.applicationStatus}'`)
    }
    
    console.log(`[startReview] Status verified successfully: 'under_review' saved for business ${businessId || applicationId}, userId: ${profile.userId}`)

    // Create audit log
    const auditData = {
      userId: profile.userId,
      eventType: 'permit_review_started',
      fieldChanged: 'applicationStatus',
      oldValue: oldStatus,
      newValue: 'under_review',
      role: roleSlug,
      metadata: {
        applicationId: businessId || applicationId,
        businessId: businessId || applicationId,
        officerId,
        officerName: `${officer.firstName} ${officer.lastName}`,
        applicationReferenceNumber: business.applicationReferenceNumber || `APP-${(businessId || applicationId).slice(-8)}`
      }
    }

    // Generate hash
    const hashableData = {
      userId: String(auditData.userId),
      eventType: auditData.eventType,
      fieldChanged: auditData.fieldChanged,
      oldValue: auditData.oldValue,
      newValue: auditData.newValue,
      timestamp: new Date().toISOString(),
      role: auditData.role,
      metadata: JSON.stringify(auditData.metadata || {})
    }
    const dataString = JSON.stringify(hashableData)
    const hash = crypto.createHash('sha256').update(dataString).digest('hex')

    auditData.hash = hash

    // Create audit log
    const auditLog = await AuditLog.create(auditData)

    // Log to blockchain (non-blocking)
    if (blockchainService.isAvailable()) {
      const blockchainQueue = require('../lib/blockchainQueue')
      blockchainQueue.queueBlockchainOperation(
        'logAuditHash',
        [hash, 'permit_review_started'],
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

    // Return updated application
    return this.getApplicationById(applicationId, businessId)
  }

  /**
   * Review permit application
   * @param {string} applicationId - Application ID
   * @param {string} businessId - Business ID
   * @param {string} officerId - LGU Officer user ID
   * @param {string} decision - Decision: 'approve', 'reject', 'request_changes'
   * @param {string} comments - Review comments
   * @param {string} rejectionReason - Rejection reason (required if reject)
   * @returns {Promise<object>} Updated application
   */
  async reviewApplication(applicationId, businessId, officerId, decision, comments, rejectionReason = null) {
    // Validate decision
    const validDecisions = ['approve', 'reject', 'request_changes']
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid decision. Must be one of: ${validDecisions.join(', ')}`)
    }

    // Validate rejection reason if rejecting
    if (decision === 'reject' && !rejectionReason) {
      throw new Error('Rejection reason is required when rejecting an application')
    }

    // Get officer info - try to populate role, fallback to direct query if needed
    let officer
    try {
      officer = await User.findById(officerId).populate('role').lean()
    } catch (populateError) {
      // If populate fails, get user and role separately
      officer = await User.findById(officerId).lean()
      if (officer && officer.role) {
        const role = await Role.findById(officer.role).lean()
        officer.role = role
      }
    }
    
    if (!officer) {
      throw new Error('Officer not found')
    }

    // Check officer role
    const roleSlug = officer.role?.slug || ''
    if (!['lgu_officer', 'staff', 'lgu_manager'].includes(roleSlug)) {
      throw new Error('Unauthorized: Only LGU officers can review applications')
    }

    // Get current application
    const profile = await BusinessProfile.findOne({
      'businesses.businessId': businessId || applicationId
    })

    if (!profile) {
      throw new Error('Application not found')
    }

    const businessIndex = profile.businesses.findIndex(b => b.businessId === (businessId || applicationId))
    if (businessIndex === -1) {
      throw new Error('Application not found')
    }

    const business = profile.businesses[businessIndex]
    const oldStatus = business.applicationStatus || 'draft'

    // Prevent reviewing already finalized applications
    if (oldStatus === 'approved' || oldStatus === 'rejected') {
      throw new Error(`Cannot review application that is already ${oldStatus}. Application has reached a final decision.`)
    }

    // Validate status transition
    const validTransitions = {
      'submitted': ['under_review', 'approved', 'rejected', 'needs_revision'],
      'under_review': ['approved', 'rejected', 'needs_revision'],
      'needs_revision': ['submitted', 'under_review', 'approved', 'rejected', 'needs_revision'] // Allow updating needs_revision with new comments
    }

    const targetStatus = decision === 'approve' ? 'approved' :
                        decision === 'reject' ? 'rejected' :
                        'needs_revision'

    if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${targetStatus}. Allowed transitions from ${oldStatus}: ${validTransitions[oldStatus]?.join(', ') || 'none'}`)
    }

    // Determine new status
    let newStatus
    if (decision === 'approve') {
      newStatus = 'approved'
    } else if (decision === 'reject') {
      newStatus = 'rejected'
    } else {
      newStatus = 'needs_revision'
    }

    // Update application status
    profile.businesses[businessIndex].applicationStatus = newStatus
    profile.businesses[businessIndex].reviewedBy = officerId
    profile.businesses[businessIndex].reviewedAt = new Date()
    // Save comments only if explicitly provided; preserve empty string if provided
    if (comments !== undefined && comments !== null) {
      const normalizedComments = typeof comments === 'string' ? comments.trim() : String(comments).trim()
      profile.businesses[businessIndex].reviewComments = normalizedComments
    }
    // Save rejection reason only if explicitly provided; preserve empty string if provided
    if (rejectionReason !== undefined && rejectionReason !== null) {
      const normalizedReason = typeof rejectionReason === 'string' ? rejectionReason.trim() : String(rejectionReason).trim()
      profile.businesses[businessIndex].rejectionReason = normalizedReason
    }
    
    console.log(`[reviewApplication] Saved reviewComments for businessId=${businessId || applicationId}:`, {
      comments: profile.businesses[businessIndex].reviewComments,
      rejectionReason: profile.businesses[businessIndex].rejectionReason,
      newStatus,
      decision
    })

    // Mark the businesses array as modified so Mongoose knows to save it
    profile.markModified('businesses')

    // Determine notification type and message based on new status
    let notificationType = 'application_status_update'
    let notificationTitle = 'Application Status Updated'
    let notificationMessage = `Your application "${business.businessName}" has been ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'marked as needing revision'}`
    
    if (newStatus === 'approved') {
      notificationType = 'application_approved'
      notificationTitle = 'Application Approved'
      notificationMessage = `Congratulations! Your application "${business.businessName}" has been approved.`
    } else if (newStatus === 'rejected') {
      notificationType = 'application_rejected'
      notificationTitle = 'Application Rejected'
      notificationMessage = `Your application "${business.businessName}" has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
    } else if (newStatus === 'needs_revision') {
      notificationType = 'application_needs_revision'
      notificationTitle = 'Application Needs Revision'
      notificationMessage = `Your application "${business.businessName}" needs revision.${comments ? ` Comments: ${comments}` : ''}`
    }

    // If transitioning to under_review, set it
    if (oldStatus === 'submitted' && newStatus !== 'submitted') {
      // Status will be set to the decision status
    }

    await profile.save()

    // Create notification for business owner
    try {
      const notificationService = require('./notificationService')
      await notificationService.createNotification(
        profile.userId,
        notificationType,
        notificationTitle,
        notificationMessage,
        'business_application',
        businessId || applicationId,
        {
          oldStatus,
          newStatus,
          comments: comments || null,
          rejectionReason: rejectionReason || null
        }
      )
    } catch (notifError) {
      console.error(`[reviewApplication] Failed to create notification:`, notifError)
      // Don't throw - notification failure shouldn't break the review process
    }

    // Create audit log
    const auditData = {
      userId: profile.userId,
      eventType: 'permit_review',
      fieldChanged: 'applicationStatus',
      oldValue: oldStatus,
      newValue: newStatus,
      role: roleSlug,
      metadata: {
        applicationId: businessId || applicationId,
        businessId: businessId || applicationId,
        officerId,
        officerName: `${officer.firstName} ${officer.lastName}`,
        decision,
        comments,
        rejectionReason: rejectionReason || null,
        applicationReferenceNumber: business.applicationReferenceNumber || `APP-${(businessId || applicationId).slice(-8)}`
      }
    }

    // Generate hash
    const hashableData = {
      userId: String(auditData.userId),
      eventType: auditData.eventType,
      fieldChanged: auditData.fieldChanged || '',
      oldValue: auditData.oldValue || '',
      newValue: auditData.newValue || '',
      role: auditData.role,
      metadata: JSON.stringify(auditData.metadata || {}),
      timestamp: new Date().toISOString()
    }
    const dataString = JSON.stringify(hashableData)
    const hash = crypto.createHash('sha256').update(dataString).digest('hex')

    auditData.hash = hash

    // Create audit log
    const auditLog = await AuditLog.create(auditData)

    // Log to blockchain (non-blocking)
    if (blockchainService.isAvailable()) {
      const blockchainQueue = require('../lib/blockchainQueue')
      blockchainQueue.queueBlockchainOperation(
        'logAuditHash',
        [hash, 'permit_review'],
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

    // Send notification email
    try {
      await this.sendPermitDecisionNotification(
        profile.userId,
        {
          applicationReferenceNumber: business.applicationReferenceNumber || `APP-${(businessId || applicationId).slice(-8)}`,
          businessName: business.businessName,
          status: newStatus,
          decision,
          comments,
          rejectionReason
        },
        decision
      )
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the review if email fails
    }

    // Return updated application
    return this.getApplicationById(applicationId, businessId)
  }

  /**
   * Send permit decision notification email
   * @param {string} userId - Business owner user ID
   * @param {object} application - Application details
   * @param {string} decision - Decision made
   */
  async sendPermitDecisionNotification(userId, application, decision) {
    const user = await User.findById(userId).lean()
    if (!user || !user.email) {
      throw new Error('User email not found')
    }

    const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
    const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
    const from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER || 'noreply@bizclear.com'

    let subject, text, html

    if (decision === 'approve') {
      subject = `Permit Application ${application.applicationReferenceNumber} - Approved`
      text = [
        `Hello ${user.firstName || 'Business Owner'},`,
        '',
        `We are pleased to inform you that your permit application ${application.applicationReferenceNumber} for ${application.businessName} has been APPROVED.`,
        '',
        'Your application has been reviewed and meets all requirements. You can now proceed with the next steps.',
        '',
        `View your application: ${appUrl}/owner/permits`,
        '',
        'Thank you for using BizClear Business Center.',
        '',
        'Best regards,',
        'LGU Office'
      ].join('\n')

      html = `
        <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
          <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
            <div style="background:#003a70;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Application Approved</h2>
              <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
                Hello ${user.firstName || 'Business Owner'},
              </p>
              <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
                We are pleased to inform you that your permit application <strong>${application.applicationReferenceNumber}</strong> for <strong>${application.businessName}</strong> has been <strong style="color:#52c41a;">APPROVED</strong>.
              </p>
              <div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;color:#389e0d;font-size:14px;font-weight:600;">✓ Your application has been reviewed and meets all requirements.</p>
              </div>
              <p style="margin:24px 0;color:#595959;font-size:16px;line-height:1.6;">
                You can now proceed with the next steps in your business registration process.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${appUrl}/owner/permits" style="display:inline-block;background:#003a70;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;">View Application</a>
              </div>
            </div>
            <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;color:#8c8c8c;font-size:12px;">This is an automated notification from ${brandName}</p>
            </div>
          </div>
        </div>
      `
    } else if (decision === 'reject') {
      subject = `Permit Application ${application.applicationReferenceNumber} - Action Required`
      text = [
        `Hello ${user.firstName || 'Business Owner'},`,
        '',
        `Your permit application ${application.applicationReferenceNumber} for ${application.businessName} has been REJECTED.`,
        '',
        `Reason: ${application.rejectionReason || 'Not specified'}`,
        '',
        application.comments ? `Additional comments: ${application.comments}` : '',
        '',
        'Please review the requirements and submit a new application if needed.',
        '',
        `View your application: ${appUrl}/owner/permits`,
        '',
        'Thank you for using BizClear Business Center.',
        '',
        'Best regards,',
        'LGU Office'
      ].join('\n')

      html = `
        <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
          <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
            <div style="background:#003a70;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Application Rejected</h2>
              <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
                Hello ${user.firstName || 'Business Owner'},
              </p>
              <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
                Your permit application <strong>${application.applicationReferenceNumber}</strong> for <strong>${application.businessName}</strong> has been <strong style="color:#ff4d4f;">REJECTED</strong>.
              </p>
              <div style="background:#fff2f0;border:1px solid #ffccc7;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0 0 8px;color:#cf1322;font-size:14px;font-weight:600;">Rejection Reason:</p>
                <p style="margin:0;color:#595959;font-size:14px;">${application.rejectionReason || 'Not specified'}</p>
                ${application.comments ? `<p style="margin:16px 0 0;color:#595959;font-size:14px;"><strong>Additional Comments:</strong> ${application.comments}</p>` : ''}
              </div>
              <p style="margin:24px 0;color:#595959;font-size:16px;line-height:1.6;">
                Please review the requirements and submit a new application if needed. You may also file an appeal if you believe this decision was made in error.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${appUrl}/owner/permits" style="display:inline-block;background:#003a70;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;">View Application</a>
              </div>
            </div>
            <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;color:#8c8c8c;font-size:12px;">This is an automated notification from ${brandName}</p>
            </div>
          </div>
        </div>
      `
    } else {
      // request_changes
      subject = `Permit Application ${application.applicationReferenceNumber} - Corrections Required`
      text = [
        `Hello ${user.firstName || 'Business Owner'},`,
        '',
        `Your permit application ${application.applicationReferenceNumber} for ${application.businessName} requires corrections.`,
        '',
        `Comments: ${application.comments || 'Please review and correct the indicated items.'}`,
        '',
        'Please make the necessary corrections and resubmit your application.',
        '',
        `View your application: ${appUrl}/owner/permits`,
        '',
        'Thank you for using BizClear Business Center.',
        '',
        'Best regards,',
        'LGU Office'
      ].join('\n')

      html = `
        <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
          <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
            <div style="background:#003a70;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
            </div>
            <div style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Corrections Required</h2>
              <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
                Hello ${user.firstName || 'Business Owner'},
              </p>
              <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
                Your permit application <strong>${application.applicationReferenceNumber}</strong> for <strong>${application.businessName}</strong> requires corrections before it can be approved.
              </p>
              <div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0 0 8px;color:#d48806;font-size:14px;font-weight:600;">Required Corrections:</p>
                <p style="margin:0;color:#595959;font-size:14px;">${application.comments || 'Please review and correct the indicated items.'}</p>
              </div>
              <p style="margin:24px 0;color:#595959;font-size:16px;line-height:1.6;">
                Please make the necessary corrections and resubmit your application for review.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${appUrl}/owner/permits" style="display:inline-block;background:#003a70;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;">View Application</a>
              </div>
            </div>
            <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;color:#8c8c8c;font-size:12px;">This is an automated notification from ${brandName}</p>
            </div>
          </div>
        </div>
      `
    }

    await sendEmail({
      to: user.email,
      from,
      subject,
      text,
      html
    })
  }
}

module.exports = new PermitApplicationService()
