const mongoose = require('mongoose')

const ViolationSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
      index: true
    },
    violationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    violationType: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      required: true
    },
    complianceDeadline: { type: Date, required: true },
    legalBasis: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'resolved', 'appealed'],
      default: 'open',
      index: true
    },
    businessId: { type: String, default: '', index: true },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    issuedAt: { type: Date, default: Date.now },
    resolution: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: { type: String, default: '' },
    blockchainHash: { type: String, default: '' },
    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
)

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
ViolationSchema.plugin(encryptionPlugin, {
  fields: ['violationType', 'description', 'legalBasis', 'blockchainHash', 'resolution', 'notes'],
  deterministicFields: ['violationId', 'businessId'],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
})

ViolationSchema.index({ inspectorId: 1, status: 1 })

module.exports = mongoose.models.Violation || mongoose.model('Violation', ViolationSchema)
