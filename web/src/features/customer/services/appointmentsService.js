import { fetchJsonWithFallback } from '@/lib/http.js'

export const AppointmentEndpoints = Object.freeze({
  create: '/api/appointments',
  customer: '/api/appointments/customer',
})

/**
 * @typedef {Object} CreateAppointmentPayload
 * @property {string} offeringId
 * @property {string} serviceId
 * @property {string} providerId
 * @property {string} serviceAddressId
 * @property {string|Date} appointment
 * @property {string} [notes]
 * @property {'fixed'|'hourly'} [pricingSelection]
 * @property {number} [estimatedHours]
 */

/**
 * Create an appointment request.
 * @param {CreateAppointmentPayload} payload
 * @param {Object} headers
 * @returns {Promise<any>}
 */
export async function createAppointment(payload, headers) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(payload),
  }
  return await fetchJsonWithFallback(AppointmentEndpoints.create, options)
}

/**
 * Fetch current customer's appointments.
 * @param {Object} params
 * @param {Object} headers
 * @returns {Promise<Array<any>>}
 */
export async function getCustomerAppointments(params = {}, headers) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  const url = `${AppointmentEndpoints.customer}${qs.toString() ? `?${qs.toString()}` : ''}`
  return await fetchJsonWithFallback(url, { headers })
}