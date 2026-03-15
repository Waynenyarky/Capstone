import { get } from '@/lib/http.js'

/**
 * Poll payment status
 */
export async function pollPaymentStatus(paymentId) {
  try {
    const response = await get(`/api/webhooks/payment-status/${paymentId}`)
    return response
  } catch (error) {
    console.error('Failed to poll payment status:', error)
    throw error
  }
}

/**
 * Start polling payment status with interval
 */
export function startPaymentStatusPolling(paymentId, onStatusChange, interval = 5000, maxAttempts = 60) {
  let attempts = 0
  
  const pollInterval = setInterval(async () => {
    attempts++
    
    try {
      const status = await pollPaymentStatus(paymentId)
      
      // Call callback with status
      onStatusChange(status)
      
      // Stop polling if payment is completed or failed
      if (['paid', 'failed', 'cancelled'].includes(status.status)) {
        clearInterval(pollInterval)
      }
      
      // Stop after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval)
        onStatusChange({ ...status, timeout: true })
      }
    } catch (error) {
      console.error('Polling error:', error)
      
      // Stop on error after 3 consecutive failures
      if (attempts >= 3) {
        clearInterval(pollInterval)
      }
    }
  }, interval)
  
  // Return function to stop polling
  return () => clearInterval(pollInterval)
}

export default {
  pollPaymentStatus,
  startPaymentStatusPolling
}
