const mongoose = require('mongoose');

const InspectionSlotSchema = new mongoose.Schema({
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Slot timing
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String, // HH:mm format
    required: true
  },
  endTime: {
    type: String, // HH:mm format
    required: true
  },
  
  // Slot status
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED', 'CANCELLED', 'COMPLETED'],
    default: 'AVAILABLE',
    index: true
  },
  
  // If booked
  booking: {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile'
    },
    bookedAt: Date,
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    inspectionType: {
      type: String,
      enum: ['INITIAL', 'RENEWAL', 'COMPLIANCE', 'FOLLOW_UP', 'COMPLAINT']
    },
    notes: String
  },
  
  // Location details for inspection
  location: {
    address: String,
    barangay: String,
    city: String,
    province: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Inspector notes after completion
  completion: {
    completedAt: Date,
    findings: String,
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'NEEDS_FOLLOW_UP']
    },
    violations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Violation'
    }],
    documents: [{
      type: String, // URLs to inspection photos/documents
      uploadedAt: Date
    }],
    notes: String,
    signature: String // Inspector digital signature
  },
  
  // Cancellation details
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    isRescheduled: Boolean,
    newSlotId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // Reminders sent
  remindersSent: [{
    type: {
      type: String,
      enum: ['EMAIL', 'SMS', 'PUSH']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'FAILED']
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
InspectionSlotSchema.plugin(encryptionPlugin, {
  fields: ['startTime', 'endTime'],
  deterministicFields: [],
  nestedPaths: ['booking', 'location', 'completion', 'cancellation'],
  arrayPaths: ['remindersSent'],
  mixedPaths: [],
})

// Indexes for efficient queries
InspectionSlotSchema.index({ inspectorId: 1, date: 1, status: 1 });
InspectionSlotSchema.index({ date: 1, status: 1 });
InspectionSlotSchema.index({ 'booking.businessId': 1 });
InspectionSlotSchema.index({ status: 1, date: 1 });

// Virtual for slot duration in minutes
InspectionSlotSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
});

// Check if slot is available
InspectionSlotSchema.methods.isAvailable = function() {
  return this.status === 'AVAILABLE' && new Date(this.date) >= new Date();
};

// Check if can be cancelled (e.g., at least 24 hours before)
InspectionSlotSchema.methods.canCancel = function() {
  if (this.status !== 'BOOKED') return false;
  const slotDate = new Date(this.date);
  const cutoffTime = new Date(slotDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  return new Date() < cutoffTime;
};

module.exports = mongoose.model('InspectionSlot', InspectionSlotSchema);
