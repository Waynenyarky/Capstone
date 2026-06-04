const mongoose = require("mongoose");

const DeficiencySchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  raisedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolutionNotes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["open", "resolved", "waived"],
    default: "open",
  },
  requiredDocuments: [
    {
      type: String,
    },
  ],
  uploadedDocuments: [
    {
      name: String,
      url: String,
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const AgencyClearanceSchema = new mongoose.Schema({
  agency: {
    type: String,
    required: true,
    enum: [
      "ZONING",
      "SANITARY",
      "FIRE_SAFETY",
      "BARANGAY",
      "BUILDING",
      "BFP",
      "TREASURY",
      "MAYORS_OFFICE",
    ],
  },
  status: {
    type: String,
    enum: [
      "PENDING",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "WAIVED",
      "CONDITIONAL",
    ],
    default: "PENDING",
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewStartedAt: {
    type: Date,
  },
  reviewedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
  reviewComments: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  deficiencies: [DeficiencySchema],
  certificateNumber: {
    type: String,
  },
  certificateUrl: {
    type: String,
  },
  certificateCid: {
    type: String,
  },
  inspectionRequired: {
    type: Boolean,
    default: false,
  },
  inspectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspection",
  },
  fees: [
    {
      description: String,
      amount: Number,
      paid: {
        type: Boolean,
        default: false,
      },
      paidAt: Date,
    },
  ],
});

const ClearanceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "BusinessProfile",
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  clearances: [AgencyClearanceSchema],
  overallStatus: {
    type: String,
    enum: ["IN_PROGRESS", "ALL_APPROVED", "HAS_REJECTION", "COMPLETED"],
    default: "IN_PROGRESS",
  },
  currentAgency: {
    type: String,
    enum: [
      "ZONING",
      "SANITARY",
      "FIRE_SAFETY",
      "BARANGAY",
      "BUILDING",
      "BFP",
      "TREASURY",
      "MAYORS_OFFICE",
      null,
    ],
    default: null,
  },
  queuePosition: {
    type: Number,
    default: null,
  },
  estimatedCompletionDate: {
    type: Date,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  stageHistory: [
    {
      stage: String,
      agency: String,
      startedAt: Date,
      completedAt: Date,
      duration: Number, // in hours
    },
  ],
  notificationsSent: [
    {
      type: {
        type: String,
        enum: ["EMAIL", "SMS", "PORTAL", "PUSH"],
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
      content: String,
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
ClearanceSchema.plugin(encryptionPlugin, {
  fields: ["referenceNumber"],
  deterministicFields: [],
  nestedPaths: [],
  arrayPaths: ["clearances", "stageHistory", "notificationsSent"],
  mixedPaths: [],
});

// Indexes for performance
ClearanceSchema.index({ businessId: 1, applicationId: 1 });
ClearanceSchema.index({ overallStatus: 1 });
ClearanceSchema.index({ "clearances.agency": 1, "clearances.status": 1 });
ClearanceSchema.index({ currentAgency: 1, queuePosition: 1 });

// Pre-save middleware to update timestamps
ClearanceSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Virtual for calculating completion percentage
ClearanceSchema.virtual("completionPercentage").get(function () {
  if (!this.clearances || this.clearances.length === 0) return 0;
  const approved = this.clearances.filter(
    (c) => c.status === "APPROVED" || c.status === "WAIVED",
  ).length;
  return Math.round((approved / this.clearances.length) * 100);
});

// Method to get next pending agency
ClearanceSchema.methods.getNextPendingAgency = function () {
  const agencyOrder = [
    "BARANGAY",
    "ZONING",
    "SANITARY",
    "FIRE_SAFETY",
    "BFP",
    "TREASURY",
    "MAYORS_OFFICE",
  ];

  for (const agency of agencyOrder) {
    const clearance = this.clearances.find((c) => c.agency === agency);
    if (!clearance || clearance.status === "PENDING") {
      return agency;
    }
  }
  return null;
};

// Method to check if all clearances are approved
ClearanceSchema.methods.checkAllApproved = function () {
  const requiredAgencies = ["BARANGAY", "ZONING", "SANITARY", "FIRE_SAFETY"];
  const approved = this.clearances.filter(
    (c) => c.status === "APPROVED" || c.status === "WAIVED",
  );

  return requiredAgencies.every((agency) =>
    approved.some((c) => c.agency === agency),
  );
};

module.exports = mongoose.model("Clearance", ClearanceSchema);
