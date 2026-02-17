const mongoose = require('mongoose')

const FieldChangeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
)

const EditRequestSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Single-field edit request (Phase 2 pattern)
    fieldName: {
      type: String,
      default: '',
    },
    currentValue: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    requestedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    supportingDocuments: {
      type: [String],
      default: [],
    },
    // Legacy multi-field pattern (kept for backward compatibility)
    fieldsToChange: {
      type: [FieldChangeSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Review fields
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Legacy fields (kept for backward compatibility)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

module.exports =
  mongoose.models.EditRequest ||
  mongoose.model('EditRequest', EditRequestSchema)
