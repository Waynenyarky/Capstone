import { get, put } from '@/lib/http.js'

const BASE_PATH = '/api/lgu-manager/payments'

/**
 * Get pending payments that need verification
 */
export async function getPendingPayments() {
  try {
    const response = await get(`${BASE_PATH}/pending`)
    return Array.isArray(response) ? response : response?.payments || []
  } catch (error) {
    console.error('Failed to fetch pending payments:', error)
    throw error
  }
}

/**
 * Verify a payment
 */
export async function verifyPayment(paymentId, verificationData) {
  try {
    const response = await put(`${BASE_PATH}/${paymentId}/verify`, verificationData)
    return response
  } catch (error) {
    console.error('Failed to verify payment:', error)
    throw error
  }
}

/**
 * Reject a payment
 */
export async function rejectPayment(paymentId, rejectionData) {
  try {
    const response = await put(`${BASE_PATH}/${paymentId}/reject`, rejectionData)
    return response
  } catch (error) {
    console.error('Failed to reject payment:', error)
    throw error
  }
}

/**
 * Get daily collection report
 */
export async function getDailyCollectionReport(date) {
  try {
    const response = await get(`${BASE_PATH}/reports/daily`, { date })
    return response || { totalCollections: 0, verifiedPayments: 0, pendingPayments: 0 }
  } catch (error) {
    console.error('Failed to fetch daily report:', error)
    return { totalCollections: 0, verifiedPayments: 0, pendingPayments: 0 }
  }
}

/**
 * Download reconciliation report
 */
export async function downloadReconciliationReport(date) {
  try {
    const response = await fetch(`/api/lgu-manager/payments/reports/reconciliation?date=${date}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download report')
    }
    
    return await response.blob()
  } catch (error) {
    console.error('Report download failed:', error)
    throw error
  }
}

/**
 * Get payment verification statistics
 */
export async function getVerificationStatistics(startDate, endDate) {
  try {
    const response = await get(`${BASE_PATH}/statistics`, {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    })
    return response || {}
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
    return {}
  }
}

export default {
  getPendingPayments,
  verifyPayment,
  rejectPayment,
  getDailyCollectionReport,
  downloadReconciliationReport,
  getVerificationStatistics
}
