const BusinessProfile = require('../models/BusinessProfile')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const blockchainService = require('../lib/blockchainService')

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
    // System Action: Flag high-risk businesses automatically
    // Logic: Check hazards or equipment
    if (details.hasHazards) return 'high'
    // Simple heuristic
    return 'low'
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
}

module.exports = new BusinessProfileService()
