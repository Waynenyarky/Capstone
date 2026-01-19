/**
 * Role Helper Utilities
 * Provides utilities for checking user roles and permissions
 */

/**
 * Staff role slugs (all 4 staff roles)
 */
const STAFF_ROLES = ['lgu_officer', 'lgu_manager', 'inspector', 'cso']

/**
 * Check if a role is a staff role
 * @param {string} roleSlug - Role slug to check
 * @returns {boolean} - True if role is a staff role
 */
function isStaffRole(roleSlug) {
  if (!roleSlug || typeof roleSlug !== 'string') {
    return false
  }
  return STAFF_ROLES.includes(roleSlug.toLowerCase())
}

/**
 * Get all staff role slugs
 * @returns {string[]} - Array of staff role slugs
 */
function getStaffRoles() {
  return [...STAFF_ROLES]
}

/**
 * Check if a field is restricted for staff users
 * @param {string} field - Field name to check
 * @returns {boolean} - True if field is restricted for staff
 */
function isRestrictedFieldForStaff(field) {
  const restrictedFields = ['password', 'role', 'office', 'department']
  return restrictedFields.includes(field.toLowerCase())
}

/**
 * Check if user is admin
 * @param {string} roleSlug - Role slug to check
 * @returns {boolean} - True if role is admin
 */
function isAdminRole(roleSlug) {
  if (!roleSlug || typeof roleSlug !== 'string') {
    return false
  }
  return roleSlug.toLowerCase() === 'admin'
}

/**
 * Check if user is business owner
 * @param {string} roleSlug - Role slug to check
 * @returns {boolean} - True if role is business owner
 */
function isBusinessOwnerRole(roleSlug) {
  if (!roleSlug || typeof roleSlug !== 'string') {
    return false
  }
  return roleSlug.toLowerCase() === 'business_owner'
}

module.exports = {
  isStaffRole,
  getStaffRoles,
  isRestrictedFieldForStaff,
  isAdminRole,
  isBusinessOwnerRole,
  STAFF_ROLES,
}
