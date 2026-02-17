/**
 * Post-Requirement Types per Permit Category
 *
 * Defines the post-requirements that must be fulfilled after a business
 * permit is issued, separated by new permit vs renewal applications.
 */

const POST_REQUIREMENT_TYPES = {
  real_property_tax: { value: 'real_property_tax', label: 'Real Property Tax Clearance' },
  garbage_fee: { value: 'garbage_fee', label: 'Garbage Fee Receipt' },
  sanitary: { value: 'sanitary', label: 'Sanitary Permit' },
  zoning: { value: 'zoning', label: 'Zoning Clearance' },
  fsic: { value: 'fsic', label: 'Fire Safety Inspection Certificate (FSIC)' },
  building_clearance: { value: 'building_clearance', label: 'Building Clearance / Occupancy Permit' },
}

// Post-requirements for NEW business permit applications
const NEW_PERMIT_REQUIREMENTS = [
  POST_REQUIREMENT_TYPES.real_property_tax,
  POST_REQUIREMENT_TYPES.garbage_fee,
  POST_REQUIREMENT_TYPES.sanitary,
  POST_REQUIREMENT_TYPES.zoning,
  POST_REQUIREMENT_TYPES.fsic,
]

// Post-requirements for RENEWAL business permit applications
const RENEWAL_PERMIT_REQUIREMENTS = [
  POST_REQUIREMENT_TYPES.sanitary,
  POST_REQUIREMENT_TYPES.building_clearance,
  POST_REQUIREMENT_TYPES.fsic,
]

// All unique requirement type values for MongoDB enum validation
const POST_REQUIREMENT_TYPE_VALUES = Object.keys(POST_REQUIREMENT_TYPES)

// Values only arrays for convenience
const NEW_PERMIT_REQUIREMENT_VALUES = NEW_PERMIT_REQUIREMENTS.map((r) => r.value)
const RENEWAL_PERMIT_REQUIREMENT_VALUES = RENEWAL_PERMIT_REQUIREMENTS.map((r) => r.value)

/**
 * Get the applicable post-requirements based on permit type
 * @param {boolean} isNewPermit - true for new, false for renewal
 * @returns {Array} - Array of requirement objects
 */
function getRequirementsForPermitType(isNewPermit) {
  return isNewPermit ? NEW_PERMIT_REQUIREMENTS : RENEWAL_PERMIT_REQUIREMENTS
}

module.exports = {
  POST_REQUIREMENT_TYPES,
  POST_REQUIREMENT_TYPE_VALUES,
  NEW_PERMIT_REQUIREMENTS,
  NEW_PERMIT_REQUIREMENT_VALUES,
  RENEWAL_PERMIT_REQUIREMENTS,
  RENEWAL_PERMIT_REQUIREMENT_VALUES,
  getRequirementsForPermitType,
}
