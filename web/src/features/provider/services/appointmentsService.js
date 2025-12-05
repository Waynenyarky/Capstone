import { fetchJsonWithFallback } from '@/lib/http.js'

export const ProviderAppointmentEndpoints = Object.freeze({
  provider: '/api/appointments/provider',
})

/**
 * Fetch current provider's appointments.
 * @param {Object} params
 * @param {Object} headers
 * @returns {Promise<Array<any>>}
 */
export async function getProviderAppointments(params = {}, headers) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  const url = `${ProviderAppointmentEndpoints.provider}${qs.toString() ? `?${qs.toString()}` : ''}`
  return await fetchJsonWithFallback(url, { headers })
}

/**
 * Review an appointment (accept or decline) with optional notes.
 * @param {string} id
 * @param {'accept'|'decline'} decision
 * @param {string=} notes
 * @param {Object} headers
 * @returns {Promise<any>}
 */
export async function reviewProviderAppointment(id, decision, notes = '', headers) {
  const url = `/api/appointments/${id}/review`
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify({ decision, notes }),
  }
  return await fetchJsonWithFallback(url, options)
}