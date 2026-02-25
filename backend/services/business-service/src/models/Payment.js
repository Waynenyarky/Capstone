const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    businessId: {
      type: String,
      required: true,
      index: true
    },
    businessProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true
    },
    paymentType: {
      type: String,
      enum: [
        'registration_fee',
        'renewal_fee',
        'penalty',
        'violation_fine',
        'general_permit_fee',
        'occupational_permit_fee',
        'other'
      ],
      required: true
    },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PHP' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'gcash', 'maya', 'credit_card', 'debit_card', 'online_banking', 'other'],
      default: null
    },
    transactionId: { type: String, default: '' },
    referenceNumber: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    relatedEntityType: {
      type: String,
      enum: ['renewal', 'registration', 'violation', 'general_permit', 'occupational_permit', 'post_requirement', 'other'],
      default: null
    },
    relatedEntityId: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    breakdown: {
      baseFee: { type: Number, default: 0 },
      surcharge: { type: Number, default: 0 },
      penalty: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 }
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: '' },
    failureReason: { type: String, default: '' }
  },
  { timestamps: true }
)

PaymentSchema.index({ userId: 1, status: 1 })
PaymentSchema.index({ businessId: 1, status: 1 })
PaymentSchema.index({ dueDate: 1, status: 1 })

module.exports = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
