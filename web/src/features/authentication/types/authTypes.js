/**
 * Central JSDoc typedefs for authentication payloads and shapes.
 * Use these in hooks/services via `@typedef` and `@param` annotations.
 */

/**
 * @typedef {Object} LoginPayload
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} SignupPayload
 * @property {string} role - 'user'
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {string} password
 * @property {boolean} termsAccepted
 */

// Provider-specific signup extras have been removed in favor of a unified user model

/**
 * @typedef {Object} VerificationPayload
 * @property {string} email
 * @property {string} code
 */

/**
 * @typedef {Object} ChangePasswordPayload
 * @property {string} email
 * @property {string} resetToken
 * @property {string} password
 */

/**
 * @typedef {Object} ChangeEmailPayload
 * @property {string} email
 * @property {string} resetToken
 * @property {string} newEmail
 */
