import { get, post, put } from '@/lib/http.js'
import { generateReceipt } from '@/features/treasury/services/treasuryService'

const BASE_PATH = '/api/business/payments'
const OWNER_BASE_PATH = '/api/business-owner/payments'

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

// Consolidated from paymentService.js
/**
 * Get payment methods for a business
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentMethods(businessId) {
  return get(`${OWNER_BASE_PATH}/${businessId}/methods`)
}

/**
 * Get payment history for a business (owner-specific)
 * @param {string} businessId - The ID of the business
 */
export async function getOwnerPaymentHistory(businessId) {
  return get(`${OWNER_BASE_PATH}/${businessId}/history`)
}

/**
 * Setup recurring payment
 * @param {string} businessId - The ID of the business
 * @param {object} paymentData - The recurring payment data
 */
export async function setupRecurringPayment(businessId, paymentData) {
  return post(`${OWNER_BASE_PATH}/${businessId}/recurring`, paymentData)
}

/**
 * Submit payment dispute
 * @param {string} paymentId - The ID of the payment
 * @param {object} disputeData - The dispute data
 */
export async function submitPaymentDispute(paymentId, disputeData) {
  return post(`${OWNER_BASE_PATH}/payments/${paymentId}/dispute`, disputeData)
}

/**
 * Get payment analytics for a business
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentAnalytics(businessId) {
  return get(`${OWNER_BASE_PATH}/${businessId}/analytics`)
}

/**
 * Get payment trends for a business
 * @param {string} businessId - The ID of the business
 * @param {object} options - Query options (timeframe, date range)
 */
export async function getPaymentTrends(businessId, options = {}) {
  return get(`${OWNER_BASE_PATH}/${businessId}/trends`, { params: options })
}

/**
 * Get cost optimization suggestions for a business
 * @param {string} businessId - The ID of the business
 */
export async function getCostOptimizationSuggestions(businessId) {
  return get(`${OWNER_BASE_PATH}/${businessId}/optimization-suggestions`)
}

/**
 * Add a new payment method
 * @param {string} businessId - The ID of the business
 * @param {object} methodData - The payment method data
 */
export async function addPaymentMethod(businessId, methodData) {
  return post(`${OWNER_BASE_PATH}/${businessId}/methods`, methodData)
}

/**
 * Update payment method
 * @param {string} methodId - The ID of the payment method
 * @param {object} updateData - The update data
 */
export async function updatePaymentMethod(methodId, updateData) {
  return post(`${OWNER_BASE_PATH}/methods/${methodId}/update`, updateData)
}

/**
 * Delete payment method
 * @param {string} methodId - The ID of the payment method
 */
export async function deletePaymentMethod(methodId) {
  return post(`${OWNER_BASE_PATH}/methods/${methodId}/delete`)
}

/**
 * Set default payment method
 * @param {string} methodId - The ID of the payment method
 */
export async function setDefaultPaymentMethod(methodId) {
  return post(`${OWNER_BASE_PATH}/methods/${methodId}/set-default`)
}

/**
 * Get payment schedule
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentSchedule(businessId) {
  return get(`${OWNER_BASE_PATH}/${businessId}/schedule`)
}

/**
 * Make a payment
 * @param {string} businessId - The ID of the business
 * @param {object} paymentData - The payment data
 */
export async function makePayment(businessId, paymentData) {
  return post(`${OWNER_BASE_PATH}/${businessId}/pay`, paymentData)
}

/**
 * Handle partial payment
 * @param {string} businessId - The ID of the business
 * @param {object} paymentData - The partial payment data
 */
export async function makePartialPayment(businessId, paymentData) {
  return post(`${OWNER_BASE_PATH}/${businessId}/partial-pay`, paymentData)
}

/**
 * Get payment status and consistency check
 * @param {string} paymentId - The ID of the payment
 */
export async function getPaymentStatus(paymentId) {
  return get(`${OWNER_BASE_PATH}/payments/${paymentId}/status`)
}

/**
 * Retry failed payment with different method
 * @param {string} paymentId - The ID of the failed payment
 * @param {object} retryData - The retry payment data
 */
export async function retryPayment(paymentId, retryData) {
  return post(`${OWNER_BASE_PATH}/payments/${paymentId}/retry`, retryData)
}

/**
 * Check payment state consistency
 * @param {string} businessId - The ID of the business
 */
export async function checkPaymentConsistency(businessId) {
  return get(`${OWNER_BASE_PATH}/${businessId}/consistency-check`)
}

/**
 * Recover partial payment state
 * @param {string} paymentId - The ID of the payment
 */
export async function recoverPartialPayment(paymentId) {
  return post(`${OWNER_BASE_PATH}/payments/${paymentId}/recover`)
}

/**
 * Get payment recovery options
 * @param {string} paymentId - The ID of the payment
 */
export async function getPaymentRecoveryOptions(paymentId) {
  return get(`${OWNER_BASE_PATH}/payments/${paymentId}/recovery-options`)
}
