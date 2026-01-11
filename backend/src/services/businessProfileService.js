const BusinessProfile = require('../models/BusinessProfile')
const User = require('../models/User')

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

  async updateStep(userId, step, data) {
    let update = {}
    // If Step 2 (Identity), next is 3 (Consent). If Step 3 (Consent), we are done.
    let nextStep = step + 1
    
    switch (step) {
      case 2: // Owner Identity
        // System Action: Basic identity validation (e.g. ID number format)
        update['ownerIdentity'] = { ...data, isSubmitted: true }
        break

      case 3: // Legal Consent (Final Step)
        update['consent'] = { ...data, isSubmitted: true }
        // System Action: Lock submitted data is implied by status change
        update['status'] = 'pending_review'
        break

      default:
        throw new Error('Invalid step')
    }

    // Only advance step if not the final step
    if (step < 3) {
      update['currentStep'] = nextStep
    }

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    
    return profile
  }
}

module.exports = new BusinessProfileService()
