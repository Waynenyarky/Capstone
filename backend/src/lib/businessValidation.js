/**
 * Business Validation Utilities
 * Validates business registration numbers, geolocation, and calculates risk levels
 */

/**
 * Validate business registration number format based on agency
 * @param {string} agency - Registration agency
 * @param {string} number - Registration number to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validateBusinessRegistrationNumber(agency, number) {
  if (!agency || !number) {
    return { valid: false, error: 'Agency and registration number are required' }
  }

  const normalizedNumber = String(number).trim().toUpperCase()
  const agencyUpper = String(agency).toUpperCase()

  switch (agencyUpper) {
    case 'DTI':
      // DTI format: DTI-XXXXX-XXXXX (e.g., DTI-12345-67890)
      const dtiPattern = /^DTI-\d{5}-\d{5}$/
      if (!dtiPattern.test(normalizedNumber)) {
        return { valid: false, error: 'DTI format must be DTI-XXXXX-XXXXX (e.g., DTI-12345-67890)' }
      }
      break

    case 'SEC':
      // SEC format: CS-XXXXXX (e.g., CS-123456)
      const secPattern = /^CS-\d{6}$/
      if (!secPattern.test(normalizedNumber)) {
        return { valid: false, error: 'SEC format must be CS-XXXXXX (e.g., CS-123456)' }
      }
      break

    case 'BIR':
      // BIR TIN format: 9 digits (e.g., 123456789)
      const birPattern = /^\d{9}$/
      if (!birPattern.test(normalizedNumber)) {
        return { valid: false, error: 'BIR TIN must be 9 digits (e.g., 123456789)' }
      }
      break

    case 'LGU':
    case 'BARANGAY_OFFICE':
      // LGU/Barangay formats vary, accept alphanumeric with dashes/slashes
      const lguPattern = /^[A-Z0-9\-\/]+$/i
      if (!lguPattern.test(normalizedNumber) || normalizedNumber.length < 3) {
        return { valid: false, error: 'LGU/Barangay registration number must be at least 3 characters' }
      }
      break

    case 'CDA':
      // CDA format: CDA-XXXXX or similar
      const cdaPattern = /^CDA-[A-Z0-9-]+$/i
      if (!cdaPattern.test(normalizedNumber)) {
        return { valid: false, error: 'CDA format must start with CDA-' }
      }
      break

    case 'FDA':
    case 'BFAD':
      // FDA/BFAD format: FDA-XXXXX or BFAD-XXXXX
      const fdaPattern = /^(FDA|BFAD)-[A-Z0-9-]+$/i
      if (!fdaPattern.test(normalizedNumber)) {
        return { valid: false, error: 'FDA/BFAD format must start with FDA- or BFAD-' }
      }
      break

    case 'DA':
    case 'DENR':
    case 'PRC':
    case 'MARITIME_INDUSTRY_AUTHORITY':
      // Other agencies: Accept alphanumeric with dashes
      const otherPattern = /^[A-Z0-9\-\/]+$/i
      if (!otherPattern.test(normalizedNumber) || normalizedNumber.length < 3) {
        return { valid: false, error: 'Registration number must be at least 3 characters' }
      }
      break

    default:
      return { valid: false, error: 'Unknown registration agency' }
  }

  return { valid: true }
}

/**
 * Validate geolocation coordinates (Philippines bounds)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {object} { valid: boolean, error?: string }
 */
function validateGeolocation(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Latitude and longitude must be numbers' }
  }

  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Latitude and longitude must be valid numbers' }
  }

  // Philippines bounds: approximately 4.2°N to 21.1°N, 116.9°E to 126.6°E
  const PHILIPPINES_BOUNDS = {
    minLat: 4.2,
    maxLat: 21.1,
    minLng: 116.9,
    maxLng: 126.6
  }

  if (lat < PHILIPPINES_BOUNDS.minLat || lat > PHILIPPINES_BOUNDS.maxLat) {
    return { 
      valid: false, 
      error: `Latitude must be between ${PHILIPPINES_BOUNDS.minLat} and ${PHILIPPINES_BOUNDS.maxLat} (Philippines bounds)` 
    }
  }

  if (lng < PHILIPPINES_BOUNDS.minLng || lng > PHILIPPINES_BOUNDS.maxLng) {
    return { 
      valid: false, 
      error: `Longitude must be between ${PHILIPPINES_BOUNDS.minLng} and ${PHILIPPINES_BOUNDS.maxLng} (Philippines bounds)` 
    }
  }

  return { valid: true }
}

/**
 * Calculate risk level based on business data
 * @param {object} businessData - Business data object
 * @returns {string} 'low' | 'medium' | 'high'
 */
function calculateRiskLevel(businessData) {
  let riskScore = 0

  // Business size (employees)
  const businessSize = businessData.businessSize || businessData.riskProfile?.businessSize || 0
  if (businessSize < 10) {
    riskScore += 1 // Low risk
  } else if (businessSize >= 10 && businessSize <= 50) {
    riskScore += 2 // Medium risk
  } else {
    riskScore += 3 // High risk
  }

  // Annual revenue (PHP)
  const annualRevenue = businessData.annualRevenue || businessData.riskProfile?.annualRevenue || 0
  if (annualRevenue < 1000000) { // < 1M PHP
    riskScore += 1
  } else if (annualRevenue >= 1000000 && annualRevenue <= 10000000) { // 1M-10M PHP
    riskScore += 2
  } else { // > 10M PHP
    riskScore += 3
  }

  // Business type
  const businessType = businessData.businessType || ''
  const highRiskTypes = ['manufacturing_industrial', 'construction_real_estate_housing', 'transportation_automotive_logistics']
  const mediumRiskTypes = ['services', 'agriculture_fishery_forestry']
  if (highRiskTypes.includes(businessType)) {
    riskScore += 3
  } else if (mediumRiskTypes.includes(businessType)) {
    riskScore += 2
  } else {
    riskScore += 1
  }

  // Registration status
  const registrationStatus = businessData.registrationStatus || 'not_yet_registered'
  if (registrationStatus === 'proposed') {
    riskScore += 2
  } else {
    riskScore += 1
  }

  // Number of branches
  const numberOfBranches = businessData.numberOfBranches || 0
  if (numberOfBranches > 5) {
    riskScore += 2
  } else if (numberOfBranches > 0) {
    riskScore += 1
  }

  // Determine risk level based on score
  // Score range: 5-15
  if (riskScore <= 7) {
    return 'low'
  } else if (riskScore <= 11) {
    return 'medium'
  } else {
    return 'high'
  }
}

module.exports = {
  validateBusinessRegistrationNumber,
  validateGeolocation,
  calculateRiskLevel
}
