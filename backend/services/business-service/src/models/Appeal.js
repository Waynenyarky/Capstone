const mongoose = require('mongoose')

const AppealSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      required: true,
    },
    appealType: {
      type: String,
      enum: ['incorrect_fees', 'wrong_fees', 'wrong_violations', 'wrong_assessment', 'processing_errors', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidence: {
      type: [String],
      default: [],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolution: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    violationId: {
      type: String,
      default: '',
    },
    inspectionId: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

module.exports =
  mongoose.models.Appeal ||
  mongoose.model('Appeal', AppealSchema)
