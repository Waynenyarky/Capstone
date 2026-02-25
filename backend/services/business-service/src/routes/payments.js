const express = require('express')
const Payment = require('../models/Payment')
const BusinessProfile = require('../models/BusinessProfile')
const { requireJwt, requireRole } = require('../middleware/auth')

const router = express.Router()

async function generatePaymentId() {
  const year = new Date().getFullYear()
  const prefix = `PAY-${year}-`
  const last = await Payment.findOne({ paymentId: new RegExp(`^${prefix}`) })
    .sort({ paymentId: -1 })
    .lean()
  let seq = 1
  if (last && last.paymentId) {
    const match = last.paymentId.match(/-(\d+)$/)
    if (match) seq = parseInt(match[1], 10) + 1
  }
  return `${prefix}${String(seq).padStart(6, '0')}`
}

/**
 * GET /api/business/payments
 * List all payments for the authenticated user
 */
router.get('/', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentType, businessId } = req.query
    const filter = { userId: req._userId }

    if (status) filter.status = status
    if (paymentType) filter.paymentType = paymentType
    if (businessId) filter.businessId = businessId

    const skip = (Number(page) - 1) * Number(limit)
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter)
    ])

    return res.json({
      data: payments,
      meta: { page: Number(page), limit: Number(limit), total }
    })
  } catch (err) {
    console.error('GET /payments error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to fetch payments' }
    })
  }
})

/**
 * GET /api/business/payments/pending
 * List pending payments for the authenticated user
 */
router.get('/pending', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const filter = {
      userId: req._userId,
      status: 'pending'
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter)
    ])

    const now = new Date()
    const enriched = payments.map((p) => ({
      ...p,
      isOverdue: p.dueDate && new Date(p.dueDate) < now
    }))

    return res.json({
      data: enriched,
      meta: { page: Number(page), limit: Number(limit), total }
    })
  } catch (err) {
    console.error('GET /payments/pending error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to fetch pending payments' }
    })
  }
})

/**
 * GET /api/business/payments/history
 * Payment history with filters
 */
router.get('/history', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, dateFrom, dateTo, businessId } = req.query
    const filter = {
      userId: req._userId,
      status: { $in: ['paid', 'refunded'] }
    }

    if (businessId) filter.businessId = businessId
    if (dateFrom || dateTo) {
      filter.paidAt = {}
      if (dateFrom) filter.paidAt.$gte = new Date(dateFrom)
      if (dateTo) filter.paidAt.$lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ paidAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter)
    ])

    return res.json({
      data: payments,
      meta: { page: Number(page), limit: Number(limit), total }
    })
  } catch (err) {
    console.error('GET /payments/history error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to fetch payment history' }
    })
  }
})

/**
 * GET /api/business/payments/:paymentId
 * Get payment details
 */
router.get('/:paymentId', requireJwt, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
      userId: req._userId
    }).lean()

    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Payment not found' }
      })
    }

    return res.json({ data: payment })
  } catch (err) {
    console.error('GET /payments/:paymentId error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to fetch payment' }
    })
  }
})

/**
 * POST /api/business/payments
 * Create a payment record (for fees, penalties, etc.)
 */
router.post('/', requireJwt, async (req, res) => {
  try {
    const {
      businessId,
      paymentType,
      description,
      amount,
      dueDate,
      relatedEntityType,
      relatedEntityId,
      breakdown,
      metadata
    } = req.body

    if (!businessId || !paymentType || !amount) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'businessId, paymentType, and amount are required'
        }
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Amount must be greater than 0' }
      })
    }

    const profile = await BusinessProfile.findOne({ userId: req._userId })
    if (!profile) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Business profile not found' }
      })
    }

    const business = profile.businesses.find((b) => b.businessId === businessId)
    if (!business) {
      return res.status(404).json({
        error: { code: 'BUSINESS_NOT_FOUND', message: 'Business not found' }
      })
    }

    const paymentId = await generatePaymentId()
    const payment = await Payment.create({
      paymentId,
      userId: req._userId,
      businessId,
      businessProfileId: profile._id,
      paymentType,
      description: description || '',
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || '',
      breakdown: breakdown || {},
      metadata: metadata || {},
      status: 'pending'
    })

    return res.status(201).json({ data: payment })
  } catch (err) {
    console.error('POST /payments error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to create payment' }
    })
  }
})

/**
 * POST /api/business/payments/:paymentId/pay
 * Process payment
 */
router.post('/:paymentId/pay', requireJwt, async (req, res) => {
  try {
    const { paymentMethod, transactionId, referenceNumber } = req.body

    if (!paymentMethod) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'paymentMethod is required' }
      })
    }

    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
      userId: req._userId
    })

    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Payment not found' }
      })
    }

    if (payment.status === 'paid') {
      return res.status(400).json({
        error: { code: 'ALREADY_PAID', message: 'Payment has already been processed' }
      })
    }

    if (payment.status === 'cancelled') {
      return res.status(400).json({
        error: { code: 'CANCELLED', message: 'Payment has been cancelled' }
      })
    }

    payment.status = 'paid'
    payment.paymentMethod = paymentMethod
    payment.transactionId = transactionId || ''
    payment.referenceNumber = referenceNumber || ''
    payment.paidAt = new Date()
    payment.receiptNumber = `RCP-${Date.now()}`

    await payment.save()

    return res.json({
      data: payment,
      message: 'Payment processed successfully'
    })
  } catch (err) {
    console.error('POST /payments/:paymentId/pay error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to process payment' }
    })
  }
})

/**
 * PUT /api/business/payments/:paymentId/cancel
 * Cancel a pending payment
 */
router.put('/:paymentId/cancel', requireJwt, async (req, res) => {
  try {
    const { reason } = req.body

    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
      userId: req._userId
    })

    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Payment not found' }
      })
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only pending payments can be cancelled'
        }
      })
    }

    payment.status = 'cancelled'
    payment.notes = reason || 'Cancelled by user'
    await payment.save()

    return res.json({ data: payment })
  } catch (err) {
    console.error('PUT /payments/:paymentId/cancel error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to cancel payment' }
    })
  }
})

module.exports = router
