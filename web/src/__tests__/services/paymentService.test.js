import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPaymentMethods,
  getPaymentHistory,
  setupRecurringPayment,
  submitPaymentDispute,
  getPaymentAnalytics,
  getPaymentTrends,
  getCostOptimizationSuggestions,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentSchedule,
  makePayment,
  makePartialPayment,
  getPaymentStatus,
  retryPayment,
  checkPaymentConsistency,
  recoverPartialPayment,
  getPaymentRecoveryOptions
} from '@/features/business-owner/services/paymentsService.js'

// Mock the HTTP lib
vi.mock('@/lib/http.js', () => ({
  get: vi.fn(),
  post: vi.fn()
}))

import { get, post } from '@/lib/http.js'

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Payment Methods Management', () => {
    it('should call getPaymentMethods with correct endpoint', async () => {
      const mockResponse = { methods: [{ id: '1', type: 'credit_card' }] }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getPaymentMethods(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/methods')
      expect(result).toBe(mockResponse)
    })

    it('should call addPaymentMethod with correct parameters', async () => {
      const mockResponse = { method: { id: 'new-method', type: 'credit_card' } }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const methodData = { type: 'credit_card', lastFour: '1234' }
      const result = await addPaymentMethod(businessId, methodData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/business-123/methods', methodData)
      expect(result).toBe(mockResponse)
    })

    it('should call updatePaymentMethod with correct parameters', async () => {
      const mockResponse = { method: { id: 'method-123', updated: true } }
      post.mockResolvedValue(mockResponse)

      const methodId = 'method-123'
      const updateData = { expirationDate: '2025-12-31' }
      const result = await updatePaymentMethod(methodId, updateData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/methods/method-123/update', updateData)
      expect(result).toBe(mockResponse)
    })

    it('should call deletePaymentMethod with correct parameters', async () => {
      const mockResponse = { success: true }
      post.mockResolvedValue(mockResponse)

      const methodId = 'method-123'
      const result = await deletePaymentMethod(methodId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/methods/method-123/delete')
      expect(result).toBe(mockResponse)
    })

    it('should call setDefaultPaymentMethod with correct parameters', async () => {
      const mockResponse = { method: { id: 'method-123', isDefault: true } }
      post.mockResolvedValue(mockResponse)

      const methodId = 'method-123'
      const result = await setDefaultPaymentMethod(methodId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/methods/method-123/set-default')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Payment History and Analytics', () => {
    it('should call getPaymentHistory with correct endpoint', async () => {
      const mockResponse = { 
        payments: [
          { id: '1', amount: 100, status: 'completed' },
          { id: '2', amount: 50, status: 'pending' }
        ],
        pagination: { total: 2, page: 1 }
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getPaymentHistory(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/history')
      expect(result).toBe(mockResponse)
    })

    it('should call getPaymentAnalytics with correct endpoint', async () => {
      const mockResponse = {
        totalRevenue: 10000,
        averagePayment: 250,
        paymentMethods: { credit_card: 60, bank_transfer: 40 },
        trends: { monthly: [1000, 1200, 1100] }
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getPaymentAnalytics(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/analytics')
      expect(result).toBe(mockResponse)
    })

    it('should call getPaymentTrends with correct parameters', async () => {
      const mockResponse = {
        trends: {
          daily: [100, 150, 120],
          weekly: [700, 800, 750],
          monthly: [3000, 3200, 3100]
        }
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const options = { timeframe: 'monthly', startDate: '2024-01-01', endDate: '2024-12-31' }
      const result = await getPaymentTrends(businessId, options)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/trends', { params: options })
      expect(result).toBe(mockResponse)
    })

    it('should call getCostOptimizationSuggestions with correct endpoint', async () => {
      const mockResponse = {
        suggestions: [
          { type: 'payment_method', savings: 50, description: 'Switch to ACH for lower fees' },
          { type: 'timing', savings: 25, description: 'Pay earlier to avoid late fees' }
        ]
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getCostOptimizationSuggestions(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/optimization-suggestions')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Payment Processing', () => {
    it('should call makePayment with correct parameters', async () => {
      const mockResponse = { payment: { id: 'payment-123', status: 'completed', amount: 100 } }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const paymentData = { amount: 100, methodId: 'method-123' }
      const result = await makePayment(businessId, paymentData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/business-123/pay', paymentData)
      expect(result).toBe(mockResponse)
    })

    it('should call makePartialPayment with correct parameters', async () => {
      const mockResponse = { payment: { id: 'payment-123', status: 'partial', amount: 50 } }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const paymentData = { amount: 50, methodId: 'method-123', originalPaymentId: 'payment-456' }
      const result = await makePartialPayment(businessId, paymentData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/business-123/partial-pay', paymentData)
      expect(result).toBe(mockResponse)
    })

    it('should call setupRecurringPayment with correct parameters', async () => {
      const mockResponse = { recurring: { id: 'rec-123', active: true, amount: 100 } }
      post.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const paymentData = { amount: 100, frequency: 'monthly', methodId: 'method-123' }
      const result = await setupRecurringPayment(businessId, paymentData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/business-123/recurring', paymentData)
      expect(result).toBe(mockResponse)
    })

    it('should call getPaymentSchedule with correct endpoint', async () => {
      const mockResponse = {
        schedule: [
          { dueDate: '2024-02-01', amount: 100, status: 'pending' },
          { dueDate: '2024-03-01', amount: 100, status: 'scheduled' }
        ]
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await getPaymentSchedule(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/schedule')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Payment Disputes and Recovery', () => {
    it('should call submitPaymentDispute with correct parameters', async () => {
      const mockResponse = { dispute: { id: 'dispute-123', status: 'submitted' } }
      post.mockResolvedValue(mockResponse)

      const paymentId = 'payment-123'
      const disputeData = { reason: 'unauthorized_charge', description: 'Did not authorize this payment' }
      const result = await submitPaymentDispute(paymentId, disputeData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/payments/payment-123/dispute', disputeData)
      expect(result).toBe(mockResponse)
    })

    it('should call getPaymentStatus with correct endpoint', async () => {
      const mockResponse = {
        payment: { id: 'payment-123', status: 'completed', amount: 100 },
        consistency: { valid: true, checks: ['amount_match', 'status_valid'] }
      }
      get.mockResolvedValue(mockResponse)

      const paymentId = 'payment-123'
      const result = await getPaymentStatus(paymentId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/payments/payment-123/status')
      expect(result).toBe(mockResponse)
    })

    it('should call retryPayment with correct parameters', async () => {
      const mockResponse = { payment: { id: 'payment-123', status: 'retrying', attempt: 2 } }
      post.mockResolvedValue(mockResponse)

      const paymentId = 'payment-123'
      const retryData = { methodId: 'method-456', reason: 'insufficient_funds' }
      const result = await retryPayment(paymentId, retryData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/payments/payment-123/retry', retryData)
      expect(result).toBe(mockResponse)
    })

    it('should call checkPaymentConsistency with correct endpoint', async () => {
      const mockResponse = {
        consistent: true,
        issues: [],
        recommendations: []
      }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const result = await checkPaymentConsistency(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/consistency-check')
      expect(result).toBe(mockResponse)
    })

    it('should call recoverPartialPayment with correct parameters', async () => {
      const mockResponse = { payment: { id: 'payment-123', status: 'recovered', amount: 75 } }
      post.mockResolvedValue(mockResponse)

      const paymentId = 'payment-123'
      const result = await recoverPartialPayment(paymentId)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/payments/payment-123/recover')
      expect(result).toBe(mockResponse)
    })

    it('should call getPaymentRecoveryOptions with correct endpoint', async () => {
      const mockResponse = {
        options: [
          { type: 'retry', description: 'Retry with same method', available: true },
          { type: 'alternative', description: 'Use different payment method', available: true },
          { type: 'partial', description: 'Make partial payment', available: false }
        ]
      }
      get.mockResolvedValue(mockResponse)

      const paymentId = 'payment-123'
      const result = await getPaymentRecoveryOptions(paymentId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/payments/payment-123/recovery-options')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors in getPaymentMethods', async () => {
      const networkError = new Error('Network error')
      get.mockRejectedValue(networkError)

      await expect(getPaymentMethods('business-123')).rejects.toThrow('Network error')
    })

    it('should handle API errors in makePayment', async () => {
      const apiError = new Error('Payment failed')
      post.mockRejectedValue(apiError)

      const paymentData = { amount: 100, methodId: 'method-123' }
      await expect(makePayment('business-123', paymentData)).rejects.toThrow('Payment failed')
    })

    it('should handle errors in addPaymentMethod', async () => {
      const error = new Error('Invalid payment method')
      post.mockRejectedValue(error)

      const methodData = { type: 'invalid_type' }
      await expect(addPaymentMethod('business-123', methodData)).rejects.toThrow('Invalid payment method')
    })

    it('should handle errors in deletePaymentMethod', async () => {
      const error = new Error('Cannot delete default method')
      post.mockRejectedValue(error)

      await expect(deletePaymentMethod('method-123')).rejects.toThrow('Cannot delete default method')
    })
  })

  describe('Parameter Validation', () => {
    it('should validate businessId parameter in getPaymentMethods', async () => {
      const mockResponse = { methods: [] }
      get.mockResolvedValue(mockResponse)

      const businessId = 'test-business-id'
      await getPaymentMethods(businessId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/test-business-id/methods')
    })

    it('should validate methodId parameter in updatePaymentMethod', async () => {
      const mockResponse = { method: { id: 'test-method-id' } }
      post.mockResolvedValue(mockResponse)

      const methodId = 'test-method-id'
      const updateData = { expirationDate: '2025-12-31' }
      await updatePaymentMethod(methodId, updateData)

      expect(post).toHaveBeenCalledWith('/api/business-owner/payments/methods/test-method-id/update', updateData)
    })

    it('should validate paymentId parameter in getPaymentStatus', async () => {
      const mockResponse = { payment: { id: 'test-payment-id' } }
      get.mockResolvedValue(mockResponse)

      const paymentId = 'test-payment-id'
      await getPaymentStatus(paymentId)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/payments/test-payment-id/status')
    })

    it('should validate options parameter in getPaymentTrends', async () => {
      const mockResponse = { trends: [] }
      get.mockResolvedValue(mockResponse)

      const businessId = 'business-123'
      const options = { timeframe: 'weekly', startDate: '2024-01-01' }
      await getPaymentTrends(businessId, options)

      expect(get).toHaveBeenCalledWith('/api/business-owner/payments/business-123/trends', { params: options })
    })
  })

  describe('Data Transformation', () => {
    it('should transform payment history response correctly', async () => {
      const mockResponse = {
        payments: [
          { id: '1', amount: 100, status: 'completed', date: '2024-01-01' },
          { id: '2', amount: 50, status: 'pending', date: '2024-01-02' }
        ],
        pagination: { total: 2, page: 1, totalPages: 1 }
      }
      get.mockResolvedValue(mockResponse)

      const result = await getPaymentHistory('business-123')

      expect(result).toEqual(mockResponse)
      expect(result.payments).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
    })

    it('should transform analytics response correctly', async () => {
      const mockResponse = {
        totalRevenue: 15000,
        averagePayment: 300,
        paymentMethods: { credit_card: 70, bank_transfer: 25, digital_wallet: 5 },
        trends: { monthly: [1000, 1200, 1100, 1300] },
        metrics: { onTimePaymentRate: 95, averageProcessingTime: 2.5 }
      }
      get.mockResolvedValue(mockResponse)

      const result = await getPaymentAnalytics('business-123')

      expect(result.totalRevenue).toBe(15000)
      expect(result.averagePayment).toBe(300)
      expect(result.paymentMethods.credit_card).toBe(70)
      expect(result.trends.monthly).toHaveLength(4)
    })

    it('should transform recovery options response correctly', async () => {
      const mockResponse = {
        options: [
          { type: 'retry', description: 'Retry with same method', available: true, estimatedSuccess: 80 },
          { type: 'alternative', description: 'Use different payment method', available: true, estimatedSuccess: 95 },
          { type: 'partial', description: 'Make partial payment', available: false, reason: 'Amount too small' }
        ]
      }
      get.mockResolvedValue(mockResponse)

      const result = await getPaymentRecoveryOptions('payment-123')

      expect(result.options).toHaveLength(3)
      expect(result.options[0].available).toBe(true)
      expect(result.options[2].available).toBe(false)
    })

    it('should handle empty responses gracefully', async () => {
      get.mockResolvedValue({})

      const result = await getPaymentMethods('business-123')

      expect(result).toEqual({})
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle payment method lifecycle', async () => {
      // Add payment method
      const addResponse = { method: { id: 'method-123', type: 'credit_card' } }
      post.mockResolvedValue(addResponse)

      const methodData = { type: 'credit_card', lastFour: '1234' }
      const addedMethod = await addPaymentMethod('business-123', methodData)

      expect(addedMethod.method.id).toBe('method-123')

      // Set as default
      const defaultResponse = { method: { id: 'method-123', isDefault: true } }
      post.mockResolvedValue(defaultResponse)

      const defaultMethod = await setDefaultPaymentMethod('method-123')
      expect(defaultMethod.method.isDefault).toBe(true)

      // Update method
      const updateResponse = { method: { id: 'method-123', updated: true } }
      post.mockResolvedValue(updateResponse)

      const updateData = { expirationDate: '2025-12-31' }
      const updatedMethod = await updatePaymentMethod('method-123', updateData)
      expect(updatedMethod.method.updated).toBe(true)
    })

    it('should handle payment processing workflow', async () => {
      // Get payment schedule
      const scheduleResponse = {
        schedule: [
          { dueDate: '2024-02-01', amount: 100, status: 'pending' }
        ]
      }
      get.mockResolvedValue(scheduleResponse)

      const schedule = await getPaymentSchedule('business-123')
      expect(schedule.schedule[0].amount).toBe(100)

      // Make payment
      const paymentResponse = { payment: { id: 'payment-123', status: 'completed' } }
      post.mockResolvedValue(paymentResponse)

      const paymentData = { amount: 100, methodId: 'method-123' }
      const payment = await makePayment('business-123', paymentData)
      expect(payment.payment.status).toBe('completed')

      // Check payment status
      const statusResponse = {
        payment: { id: 'payment-123', status: 'completed' },
        consistency: { valid: true }
      }
      get.mockResolvedValue(statusResponse)

      const status = await getPaymentStatus('payment-123')
      expect(status.payment.status).toBe('completed')
      expect(status.consistency.valid).toBe(true)
    })

    it('should handle payment recovery workflow', async () => {
      // Get recovery options
      const optionsResponse = {
        options: [
          { type: 'retry', available: true },
          { type: 'alternative', available: true }
        ]
      }
      get.mockResolvedValue(optionsResponse)

      const options = await getPaymentRecoveryOptions('payment-123')
      expect(options.options).toHaveLength(2)

      // Retry payment
      const retryResponse = { payment: { id: 'payment-123', status: 'retrying' } }
      post.mockResolvedValue(retryResponse)

      const retryData = { methodId: 'method-456' }
      const retry = await retryPayment('payment-123', retryData)
      expect(retry.payment.status).toBe('retrying')

      // Check consistency
      const consistencyResponse = { consistent: true, issues: [] }
      get.mockResolvedValue(consistencyResponse)

      const consistency = await checkPaymentConsistency('business-123')
      expect(consistency.consistent).toBe(true)
    })
  })
})
