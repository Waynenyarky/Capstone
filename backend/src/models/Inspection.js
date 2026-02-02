const mongoose = require('mongoose')

const ChecklistItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    result: {
      type: String,
      enum: ['pass', 'fail', 'na', 'pending'],
      default: 'pending'
    },
    remarks: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  },
  { _id: false }
)

const EvidenceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // photo, document
    url: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: true }
)

const InspectionSchema = new mongoose.Schema(
  {
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    businessProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true
    },
    businessId: { type: String, required: true },
    permitType: {
      type: String,
      enum: ['initial', 'renewal'],
      required: true
    },
    inspectionType: {
      type: String,
      enum: ['initial', 'renewal', 'follow_up'],
      required: true
    },
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTimeWindow: {
      start: { type: Date },
      end: { type: Date }
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    checklist: {
      type: [ChecklistItemSchema],
      default: []
    },
    overallResult: {
      type: String,
      enum: ['passed', 'failed', 'needs_reinspection'],
      default: null
    },
    evidence: {
      type: [EvidenceSchema],
      default: []
    },
    gpsAtStart: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date }
    },
    gpsMismatch: { type: Boolean, default: false },
    gpsMismatchReason: { type: String, default: '' },
    parentInspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection', default: null },
    submittedAt: { type: Date, default: null },
    inspectorSignature: {
      dataUrl: { type: String, default: '' },
      timestamp: { type: Date }
    },
    ownerAcknowledgment: {
      acknowledged: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    editHistory: [{
      changedAt: { type: Date },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      field: { type: String },
      reason: { type: String }
    }],
    isImmutable: { type: Boolean, default: false },
    blockchainHash: { type: String, default: '' }
  },
  { timestamps: true }
)

InspectionSchema.index({ inspectorId: 1, status: 1, scheduledDate: 1 })
InspectionSchema.index({ businessProfileId: 1, businessId: 1 })
InspectionSchema.index({ parentInspectionId: 1 })

module.exports = mongoose.models.Inspection || mongoose.model('Inspection', InspectionSchema)
