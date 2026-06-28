import { get, post } from '@/lib/http.js'

const BASE_PATH = '/api/business/payments'

/**
 * Mock payment for testing purposes
 * @param {object} paymentData - Payment data
 * @returns {Promise<object>} Mock payment response
 */
export async function mockPayment(paymentData) {
  return post(`${BASE_PATH}/mock`, paymentData)
}

/**
 * Get payments for a business
 * @param {object} params - Query parameters
 * @param {string} params.businessId - Business ID
 * @param {string} [params.paymentType] - Filter by payment type
 * @param {string} [params.status] - Filter by status
 * @param {number} [params.limit] - Limit results
 */
export async function getPayments({ businessId, paymentType, status, limit } = {}) {
  const qs = new URLSearchParams()
  if (businessId) qs.set('businessId', businessId)
  if (paymentType) qs.set('paymentType', paymentType)
  if (status) qs.set('status', status)
  if (limit) qs.set('limit', String(limit))

  return get(`${BASE_PATH}?${qs.toString()}`)
}
