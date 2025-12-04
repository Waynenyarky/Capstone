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
 * @property {string} role - 'customer' | 'provider'
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {string} password
 * @property {boolean} termsAccepted
 */

/**
 * @typedef {Object} ProviderSignupExtras
 * @property {string=} businessName
 * @property {string=} businessType
 * @property {number=} yearsInBusiness
 * @property {Array<string>=} servicesCategories
 * @property {Array<string>=} serviceAreas
 * @property {Array<string>=} socialLinks
 * @property {string=} streetAddress
 * @property {string=} city
 * @property {string=} province
 * @property {string=} zipCode
 * @property {string=} businessPhone
 * @property {string=} businessEmail
 * @property {string=} businessDescription
 * @property {boolean=} hasInsurance
 * @property {boolean=} hasLicenses
 * @property {boolean=} consentsToBackgroundCheck
 * @property {boolean=} isSolo
 * @property {Array<Object>=} teamMembers
 */

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