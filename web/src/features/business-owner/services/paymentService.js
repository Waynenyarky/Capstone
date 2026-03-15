import { get, post } from '@/lib/http.js';

const BASE_PATH = '/api/business-owner/payments';

/**
 * Get payment methods for a business
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentMethods(businessId) {
  return get(`${BASE_PATH}/${businessId}/methods`);
}

/**
 * Get payment history for a business
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentHistory(businessId) {
  return get(`${BASE_PATH}/${businessId}/history`);
}

/**
 * Setup recurring payment
 * @param {string} businessId - The ID of the business
 * @param {object} paymentData - The recurring payment data
 */
export async function setupRecurringPayment(businessId, paymentData) {
  return post(`${BASE_PATH}/${businessId}/recurring`, paymentData);
}

/**
 * Submit payment dispute
 * @param {string} paymentId - The ID of the payment
 * @param {object} disputeData - The dispute data
 */
export async function submitPaymentDispute(paymentId, disputeData) {
  return post(`${BASE_PATH}/payments/${paymentId}/dispute`, disputeData);
}

/**
 * Get payment analytics for a business
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentAnalytics(businessId) {
  return get(`${BASE_PATH}/${businessId}/analytics`);
}

/**
 * Get payment trends for a business
 * @param {string} businessId - The ID of the business
 * @param {object} options - Query options (timeframe, date range)
 */
export async function getPaymentTrends(businessId, options = {}) {
  return get(`${BASE_PATH}/${businessId}/trends`, { params: options });
}

/**
 * Get cost optimization suggestions for a business
 * @param {string} businessId - The ID of the business
 */
export async function getCostOptimizationSuggestions(businessId) {
  return get(`${BASE_PATH}/${businessId}/optimization-suggestions`);
}

/**
 * Add a new payment method
 * @param {string} businessId - The ID of the business
 * @param {object} methodData - The payment method data
 */
export async function addPaymentMethod(businessId, methodData) {
  return post(`${BASE_PATH}/${businessId}/methods`, methodData);
}

/**
 * Update payment method
 * @param {string} methodId - The ID of the payment method
 * @param {object} updateData - The update data
 */
export async function updatePaymentMethod(methodId, updateData) {
  return post(`${BASE_PATH}/methods/${methodId}/update`, updateData);
}

/**
 * Delete payment method
 * @param {string} methodId - The ID of the payment method
 */
export async function deletePaymentMethod(methodId) {
  return post(`${BASE_PATH}/methods/${methodId}/delete`);
}

/**
 * Set default payment method
 * @param {string} methodId - The ID of the payment method
 */
export async function setDefaultPaymentMethod(methodId) {
  return post(`${BASE_PATH}/methods/${methodId}/set-default`);
}

/**
 * Get payment schedule
 * @param {string} businessId - The ID of the business
 */
export async function getPaymentSchedule(businessId) {
  return get(`${BASE_PATH}/${businessId}/schedule`);
}

/**
 * Make a payment
 * @param {string} businessId - The ID of the business
 * @param {object} paymentData - The payment data
 */
export async function makePayment(businessId, paymentData) {
  return post(`${BASE_PATH}/${businessId}/pay`, paymentData);
}

/**
 * Handle partial payment
 * @param {string} businessId - The ID of the business
 * @param {object} paymentData - The partial payment data
 */
export async function makePartialPayment(businessId, paymentData) {
  return post(`${BASE_PATH}/${businessId}/partial-pay`, paymentData);
}

/**
 * Get payment status and consistency check
 * @param {string} paymentId - The ID of the payment
 */
export async function getPaymentStatus(paymentId) {
  return get(`${BASE_PATH}/payments/${paymentId}/status`);
}

/**
 * Retry failed payment with different method
 * @param {string} paymentId - The ID of the failed payment
 * @param {object} retryData - The retry payment data
 */
export async function retryPayment(paymentId, retryData) {
  return post(`${BASE_PATH}/payments/${paymentId}/retry`, retryData);
}

/**
 * Check payment state consistency
 * @param {string} businessId - The ID of the business
 */
export async function checkPaymentConsistency(businessId) {
  return get(`${BASE_PATH}/${businessId}/consistency-check`);
}

/**
 * Recover partial payment state
 * @param {string} paymentId - The ID of the payment
 */
export async function recoverPartialPayment(paymentId) {
  return post(`${BASE_PATH}/payments/${paymentId}/recover`);
}

/**
 * Get payment recovery options
 * @param {string} paymentId - The ID of the payment
 */
export async function getPaymentRecoveryOptions(paymentId) {
  return get(`${BASE_PATH}/payments/${paymentId}/recovery-options`);
}
