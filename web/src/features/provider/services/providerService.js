import { fetchJsonWithFallback } from '@/lib/http.js'
import { ProviderEndpoints } from './endpoints.js'

/**
 * @typedef {Object} Category
 * @property {string} [id]
 * @property {string} name
 */

/**
 * @typedef {Object} ProviderProfile
 * @property {string} [businessName]
 * @property {string} [businessType]
 * @property {number} [yearsInBusiness]
 * @property {string[]} [servicesCategories]
 * @property {string[]} [serviceAreas]
 * @property {string} [streetAddress]
 * @property {string} [province]
 * @property {string} [city]
 * @property {string} [zipCode]
 * @property {string} [businessPhone]
 * @property {string} [businessEmail]
 * @property {string} [businessDescription]
 * @property {boolean} [hasInsurance]
 * @property {boolean} [hasLicenses]
 * @property {boolean} [consentsToBackgroundCheck]
 * @property {boolean} [isSolo]
 * @property {Array<Object>} [teamMembers]
 * @property {AccountStatusChange[]} [accountStatusHistory]
 * @property {AccountAppeal[]} [accountAppeals]
 * @property {ProviderStatusValue} [status]
*/

/**
 * @typedef {'in_progress'|'skipped'|'completed'} OnboardingStatus
 */

/**
 * @typedef {Object} ProviderAppealPayload
 * @property {string} appealReason
 */

/**
 * @typedef {Object} AccountAppeal
 * @property {string} [appealReason]
 * @property {string} [status]
 * @property {string} [submittedAt]
 * @property {string} [decidedAt]
 * @property {string} [decidedByEmail]
 * @property {string} [decisionNotes]
 */

/**
 * @typedef {Object} AccountStatusChange
 * @property {string} [changedAt]
 * @property {string} [from]
 * @property {string} [to]
 * @property {string} [reason]
 */

/**
 * @typedef {'pending'|'rejected'|'inactive'|'active'} ProviderStatusValue
 */

// Categories
/**
 * @returns {Promise<Category[]>}
 */
export async function getCategories() {
  return await fetchJsonWithFallback(ProviderEndpoints.categories)
}

// Provider profile
/**
 * @param {Object} headers
 * @returns {Promise<ProviderProfile>}
 */
export async function getProviderProfile(headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.profile, { headers })
}

/**
 * @param {Partial<ProviderProfile>} payload
 * @param {Object} headers
 * @returns {Promise<ProviderProfile>}
 */
export async function updateProviderProfile(payload, headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.profile, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })
}

// Application
/**
 * @param {Object} headers
 * @returns {Promise<{resubmitted: boolean}>}
 */
export async function resubmitProviderApplication(headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.resubmitApplication, {
    method: 'POST',
    headers,
  })
}

// Onboarding & welcome acknowledgement
/**
 * @param {Object} headers
 * @returns {Promise<any>}
 */
export async function acknowledgeWelcome(headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.welcomeAck, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ ack: true }),
  })
}

/**
 * @param {OnboardingStatus} status
 * @param {Object} headers
 * @returns {Promise<any>}
 */
export async function setOnboardingStatus(status, headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.onboardingStatus, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  })
}

/**
 * Submit a provider appeal.
 * @param {ProviderAppealPayload} payload
 * @param {Object} [headers]
 * @returns {Promise<{submitted: boolean}>}
 */
export async function submitProviderAppeal(payload, headers) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(payload),
  }
  return await fetchJsonWithFallback(ProviderEndpoints.appeals, options)
}

// Offerings
/**
 * @param {Object} headers
 * @returns {Promise<Array<any>>}
 */
export async function getProviderOfferings(headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.offerings, { headers })
}

/**
 * @param {Object} headers
 * @returns {Promise<Array<any>>}
 */
export async function getProviderAllowedServices(headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.allowedServices, { headers })
}

/**
 * @param {string[]} serviceIds
 * @param {Object} headers
 * @returns {Promise<{ initialized: string[] }>}
 */
export async function initializeProviderOfferings(serviceIds, headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.offeringsInitialize, {
    method: 'POST',
    headers,
    body: JSON.stringify({ serviceIds }),
  })
}

/**
 * @param {string} id
 * @param {Object} payload
 * @param {Object} headers
 * @returns {Promise<any>}
 */
export async function updateProviderOffering(id, payload, headers) {
  return await fetchJsonWithFallback(`${ProviderEndpoints.offerings}/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })
}

/**
 * @param {Object} headers
 * @returns {Promise<{ completed: boolean }>}
 */
export async function completeProviderOnboarding(headers) {
  return await fetchJsonWithFallback(ProviderEndpoints.offeringsComplete, {
    method: 'POST',
    headers,
  })
}