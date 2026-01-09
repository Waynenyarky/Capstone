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
    let nextStep = step + 1
    let extraData = {}

    switch (step) {
      case 2: // Owner Identity
        // System Action: Basic identity validation (e.g. ID number format)
        update['ownerIdentity'] = { ...data, isSubmitted: true }
        break

      case 3: // Business Registration
        this.validateRegistration(data)
        update['businessRegistration'] = { ...data, isSubmitted: true }
        break

      case 4: // Location
        const jurisdiction = this.determineJurisdiction(data)
        const inspections = this.determineInspections(data.natureOfBusiness, data.riskCategory)
        
        // Merge system-determined data into location (or separate field)
        // For Clean Arch, we might store this in a separate 'administrative' field, 
        // but for now we'll append to location or log it.
        update['location'] = { 
          ...data, 
          isSubmitted: true,
          _assignedLgu: jurisdiction,
          _requiredInspections: inspections
        }
        break

      case 5: // Compliance
        update['compliance'] = { ...data, isSubmitted: true }
        break

      case 6: // Profile Details
        const riskLevel = this.assessRisk(data)
        update['profileDetails'] = { 
          ...data, 
          isSubmitted: true,
          _assessedRisk: riskLevel
        }
        break

      case 7: // Notifications
        update['notifications'] = { ...data, isSubmitted: true }
        break

      case 8: // Consent
        update['consent'] = { ...data, isSubmitted: true }
        update['status'] = 'pending_review'
        // System Action: Lock submitted data is implied by status change
        break

      default:
        throw new Error('Invalid step')
    }

    if (step < 8) {
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
