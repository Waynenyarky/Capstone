const mongoose = require('mongoose')

/**
 * Admin Deletion Request Model
 * Tracks admin account deletion requests requiring another admin's approval
 */
const AdminDeletionRequestSchema = new mongoose.Schema(
  {
    requestingAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    approvingAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'completed'],
      default: 'pending',
      index: true,
    },
    mfaVerifiedAt: {
      type: Date,
      default: null,
      // Timestamp when requesting admin verified with MFA
    },
    approvalMfaVerifiedAt: {
      type: Date,
      default: null,
      // Timestamp when approving admin verified with MFA
    },
    highPrivilegeTasksChecked: {
      type: Boolean,
      default: false,
    },
    highPrivilegeTasksFound: {
      type: Boolean,
      default: false,
    },
    highPrivilegeTasksDetails: {
      type: String,
      default: '',
      // Details of high-privilege tasks found
    },
    tasksReassigned: {
      type: Boolean,
      default: false,
    },
    denialReason: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    deniedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      requestingAdminEmail: { type: String, default: '' },
      approvingAdminEmail: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying (approvingAdminId has index: true on field)
AdminDeletionRequestSchema.index({ requestingAdminId: 1, status: 1 })
AdminDeletionRequestSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.models.AdminDeletionRequest || mongoose.model('AdminDeletionRequest', AdminDeletionRequestSchema)
