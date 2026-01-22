const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'application_status_update',
        'application_review_started',
        'application_approved',
        'application_rejected',
        'application_needs_revision',
        'system_alert',
        'general'
      ],
      default: 'general'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedEntityType: {
      type: String,
      enum: ['business_application', 'business_renewal', 'payment', 'system', null],
      default: null
    },
    relatedEntityId: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)
