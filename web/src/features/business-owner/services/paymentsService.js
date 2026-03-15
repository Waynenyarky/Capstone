import { get, post, put } from '@/lib/http.js'
import { generateReceipt } from '@/features/treasury/services/treasuryService'

const BASE_PATH = '/api/business/payments'

/**
 * Get all payments for the current user
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.paymentType] - Filter by payment type
 * @param {string} [params.businessId] - Filter by business ID
 */
export async function getPayments({ page = 1, limit = 20, status, paymentType, businessId } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  if (paymentType) qs.set('paymentType', paymentType)
  if (businessId) qs.set('businessId', businessId)

  return get(`${BASE_PATH}?${qs.toString()}`)
}

/**
 * Get pending payments for the current user
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 */
export async function getPendingPayments({ page = 1, limit = 20 } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))

  return get(`${BASE_PATH}/pending?${qs.toString()}`)
}

/**
 * Get payment history
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.dateFrom] - Filter from date (YYYY-MM-DD)
 * @param {string} [params.dateTo] - Filter to date (YYYY-MM-DD)
 * @param {string} [params.businessId] - Filter by business ID
 */
export async function getPaymentHistory({ page = 1, limit = 20, dateFrom, dateTo, businessId } = {}) {
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (dateFrom) qs.set('dateFrom', dateFrom)
  if (dateTo) qs.set('dateTo', dateTo)
  if (businessId) qs.set('businessId', businessId)

  return get(`${BASE_PATH}/history?${qs.toString()}`)
}

/**
 * Get payment details
 * @param {string} paymentId - Payment ID
 */
export async function getPayment(paymentId) {
  return get(`${BASE_PATH}/${paymentId}`)
}

/**
 * Create a new payment record
 * @param {object} paymentData - Payment data
 * @param {string} paymentData.businessId - Business ID
 * @param {string} paymentData.paymentType - Payment type
 * @param {number} paymentData.amount - Amount
 * @param {string} [paymentData.description] - Description
 * @param {string} [paymentData.dueDate] - Due date (ISO string)
 * @param {string} [paymentData.relatedEntityType] - Related entity type
 * @param {string} [paymentData.relatedEntityId] - Related entity ID
 * @param {object} [paymentData.breakdown] - Fee breakdown
 * @param {object} [paymentData.metadata] - Additional metadata
 */
export async function createPayment(paymentData) {
  return post(BASE_PATH, paymentData)
}

/**
 * Process a payment
 * @param {string} paymentId - Payment ID
 * @param {object} paymentData - Payment processing data
 * @param {string} paymentData.paymentMethod - Payment method
 * @param {string} [paymentData.transactionId] - Transaction ID from payment gateway
 * @param {string} [paymentData.referenceNumber] - Reference number
 */
export async function processPayment(paymentId, paymentData) {
  let result
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await post(`${BASE_PATH}/${paymentId}/pay`, paymentData)
      lastError = null
      break
    } catch (err) {
      lastError = err
      const status = err?.status
      const transient = status === 502 || status === 503 || status == null
      if (!transient || attempt === 2) {
        throw err
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }

  if (!result && lastError) throw lastError
  
  // Auto-generate receipt after successful payment
  if (result?.payment?.status === 'paid' || result?.status === 'paid') {
    try {
      const receipt = await generateReceipt(paymentId)
      return { ...result, receipt }
    } catch (receiptError) {
      console.error('Failed to generate receipt:', receiptError)
      // Return payment result even if receipt generation fails
      return result
    }
  }
  
  return result
}

/**
 * Generate receipt for a payment
 * @param {string} paymentId - Payment ID
 */
export async function generateReceiptForPayment(paymentId) {
  return generateReceipt(paymentId)
}

/**
 * Cancel a pending payment
 * @param {string} paymentId - Payment ID
 * @param {string} [reason] - Cancellation reason
 */
export async function cancelPayment(paymentId, reason) {
  return put(`${BASE_PATH}/${paymentId}/cancel`, { reason })
}

export const PAYMENT_TYPES = {
  registration_fee: 'Registration Fee',
  renewal_fee: 'Renewal Fee',
  penalty: 'Penalty',
  violation_fine: 'Violation Fine',
  general_permit_fee: 'General Permit Fee',
  occupational_permit_fee: 'Occupational Permit Fee',
  other: 'Other'
}

export const PAYMENT_STATUSES = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled'
}

export const PAYMENT_METHODS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  gcash: 'GCash',
  maya: 'Maya',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  online_banking: 'Online Banking',
  other: 'Other'
}

export function getPaymentTypeLabel(type) {
  return PAYMENT_TYPES[type] || type || '—'
}

export function getPaymentStatusLabel(status) {
  return PAYMENT_STATUSES[status] || status || '—'
}

export function getPaymentMethodLabel(method) {
  return PAYMENT_METHODS[method] || method || '—'
}

export function getStatusColor(status) {
  const colors = {
    pending: 'yellow',
    processing: 'blue',
    paid: 'green',
    failed: 'red',
    refunded: 'purple',
    cancelled: 'gray'
  }
  return colors[status] || 'gray'
}
