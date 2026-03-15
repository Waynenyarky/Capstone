import apiClient from '@/services/apiClient';

/**
 * Get pending payment verifications (treasury staff only)
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
export async function getPendingVerifications(page = 1, limit = 20) {
  const response = await apiClient.get('/api/treasury/payments/pending', {
    params: { page, limit }
  });
  return response.data;
}

/**
 * Verify a payment (treasury staff only)
 * @param {string} paymentId
 * @param {string} verificationNotes
 * @returns {Promise<Object>}
 */
export async function verifyPayment(paymentId, verificationNotes) {
  const response = await apiClient.post('/api/treasury/payments/verify', {
    paymentId,
    verificationNotes
  });
  return response.data;
}

/**
 * Get daily collection report
 * @param {string} date - ISO date string
 * @returns {Promise<Object>}
 */
export async function getDailyCollectionReport(date) {
  const response = await apiClient.get('/api/treasury/collections/daily', {
    params: { date }
  });
  return response.data;
}

/**
 * Generate official receipt
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
export async function generateReceipt(paymentId) {
  // Try business owner endpoint first (accessible to all authenticated users)
  try {
    const response = await apiClient.post(`/api/business/payments/${paymentId}/receipt`);
    return response.data;
  } catch (err) {
    // Fallback to treasury endpoint for staff
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      const response = await apiClient.post('/api/treasury/receipts/generate', { paymentId });
      return response.data;
    }
    throw err;
  }
}

/**
 * Create GCash payment
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createGCashPayment(data) {
  const response = await apiClient.post('/api/treasury/payments/gcash/create', data);
  return response.data;
}

/**
 * Create Maya payment
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createMayaPayment(data) {
  const response = await apiClient.post('/api/treasury/payments/maya/create', data);
  return response.data;
}

/**
 * Create card payment
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createCardPayment(data) {
  const response = await apiClient.post('/api/treasury/payments/card/create', data);
  return response.data;
}

/**
 * Record bank transfer
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function recordBankTransfer(data) {
  const response = await apiClient.post('/api/treasury/payments/bank-transfer/record', data);
  return response.data;
}

// Payment method labels
export const PAYMENT_METHOD_LABELS = {
  gcash: 'GCash',
  maya: 'Maya',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  online_banking: 'Online Banking'
};

// Payment status labels
export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled'
};

// Fee type labels
export const FEE_TYPE_LABELS = {
  MAYOR_PERMIT: "Mayor's Permit Fee",
  BUSINESS_TAX: 'Business Tax',
  SANITARY_FEE: 'Sanitary Fee',
  FIRE_SAFETY_FEE: 'Fire Safety Fee',
  ENVIRONMENTAL_FEE: 'Environmental Fee',
  INSPECTION_FEE: 'Inspection Fee',
  RENEWAL_FEE: 'Renewal Fee',
  PENALTY: 'Penalty',
  OTHER: 'Other'
};
