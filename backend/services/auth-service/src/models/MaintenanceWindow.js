const mongoose = require('mongoose')

const MaintenanceWindowSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'rejected'],
      default: 'pending',
      index: true,
    },
    message: { type: String, default: '' },
    expectedResumeAt: { type: Date, default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    metadata: { type: Object, default: {} },
    activatedAt: { type: Date, default: null },
    deactivatedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('MaintenanceWindow', MaintenanceWindowSchema)
