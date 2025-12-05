import { fetchJsonWithFallback } from '@/lib/http.js'
import { authHeaders } from '@/lib/authHeaders.js'

/**
 * @typedef {import('../types/customerTypes').CustomerProfile} CustomerProfile
 * @typedef {import('../types/customerTypes').CustomerProfileUpdatePayload} CustomerProfileUpdatePayload
 */

/**
 * Load the current user's customer profile.
 * @param {object} currentUser
 * @param {string} role
 * @returns {Promise<CustomerProfile>}
 */
export async function getCustomerProfile(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/auth/me', { headers })
}

/**
 * Update the current user's customer profile.
 * @param {CustomerProfileUpdatePayload} payload
 * @param {object} currentUser
 * @param {string} role
 * @returns {Promise<CustomerProfile|{user: CustomerProfile}>}
 */
export async function updateCustomerProfile(payload, currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/auth/profile', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })
}