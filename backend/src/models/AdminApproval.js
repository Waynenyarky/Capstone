const mongoose = require('mongoose');

const AdminApprovalSchema = new mongoose.Schema(
  {
    approvalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    requestType: {
      type: String,
      required: true,
      enum: [
        'email_change',
        'password_change',
        'personal_info_change',
        'id_verification',
        'account_status_change',
        'role_change',
        'maintenance_mode',
        'other',
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Admin who requested the change
    },
    requestDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      // Contains the change details (field, oldValue, newValue, etc.)
    },
    approvals: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        approved: {
          type: Boolean,
          required: true,
        },
        comment: {
          type: String,
          default: '',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    requiredApprovals: {
      type: Number,
      default: 2,
      // Number of approvals required (default: 2)
    },
    txHash: {
      type: String,
      default: '',
      index: true,
      // Blockchain transaction hash (for on-chain storage)
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
AdminApprovalSchema.index({ userId: 1, createdAt: -1 });
AdminApprovalSchema.index({ status: 1, createdAt: -1 });
AdminApprovalSchema.index({ requestedBy: 1 });

// Method to check if approval is complete
AdminApprovalSchema.methods.isComplete = function () {
  const approvedCount = this.approvals.filter((a) => a.approved === true).length;
  return approvedCount >= this.requiredApprovals;
};

// Method to check if request is rejected
AdminApprovalSchema.methods.isRejected = function () {
  const rejectedCount = this.approvals.filter((a) => a.approved === false).length;
  // If 2+ rejections, consider it rejected
  return rejectedCount >= 2;
};

// Method to check if admin has already approved/rejected
AdminApprovalSchema.methods.hasAdminVoted = function (adminId) {
  return this.approvals.some((a) => String(a.adminId) === String(adminId));
};

// Static method to generate unique approval ID
AdminApprovalSchema.statics.generateApprovalId = function () {
  return `APPROVAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

module.exports = mongoose.models.AdminApproval || mongoose.model('AdminApproval', AdminApprovalSchema);
