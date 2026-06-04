const mongoose = require("mongoose");

const ChecklistItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    result: {
      type: String,
      enum: ["pass", "fail", "na", "pending"],
      default: "pending",
    },
    remarks: { type: String, default: "" },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
  },
  { _id: false },
);

const EvidenceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // photo, document
    url: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true },
);

const InspectionSchema = new mongoose.Schema(
  {
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    businessProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessProfile",
      required: true,
      index: true,
    },
    businessId: { type: String, required: true },
    permitType: {
      type: String,
      enum: ["initial", "renewal"],
      required: true,
    },
    inspectionType: {
      type: String,
      enum: [
        "initial",
        "renewal",
        "follow_up",
        "joint",
        "compliance",
        "complaint",
        "surprise",
        "routine",
      ],
      required: true,
    },
    isSurprise: { type: Boolean, default: false },
    compliancePeriodEnd: { type: Date, default: null },
    permitRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: "" },
    reinspectionDeadline: { type: Date, default: null },
    notes: { type: String, default: "" },
    complianceStatus: {
      type: String,
      enum: ["compliant", "non_compliant", "pending_reinspection", null],
      default: null,
    },
    // Phase 2: Additional fields for joint/compliance/complaint inspections
    complaintDetails: { type: String, default: "" },
    complianceRequirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PostRequirement",
      default: null,
    },
    jointInspectors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    violationsFound: [
      {
        type: { type: String, default: "" },
        description: { type: String, default: "" },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        _id: false,
      },
    ],
    scheduledDate: { type: Date, default: null, index: true },
    scheduledTimeWindow: {
      start: { type: Date },
      end: { type: Date },
    },
    status: {
      type: String,
      enum: ["pending_assignment", "pending", "in_progress", "completed"],
      default: "pending",
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    checklist: {
      type: [ChecklistItemSchema],
      default: [],
    },
    overallResult: {
      type: String,
      enum: ["passed", "failed", "needs_reinspection"],
      default: null,
    },
    evidence: {
      type: [EvidenceSchema],
      default: [],
    },
    gpsAtStart: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date },
    },
    gpsMismatch: { type: Boolean, default: false },
    gpsMismatchReason: { type: String, default: "" },
    parentInspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inspection",
      default: null,
    },
    submittedAt: { type: Date, default: null },
    inspectorSignature: {
      dataUrl: { type: String, default: "" },
      timestamp: { type: Date },
    },
    ownerAcknowledgment: {
      acknowledged: { type: Boolean, default: false },
      timestamp: { type: Date },
    },
    editHistory: [
      {
        changedAt: { type: Date },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        field: { type: String },
        reason: { type: String },
      },
    ],
    isImmutable: { type: Boolean, default: false },
    blockchainHash: { type: String, default: "" },
  },
  { timestamps: true },
);

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
InspectionSchema.plugin(encryptionPlugin, {
  fields: [
    "notes",
    "complaintDetails",
    "revokedReason",
    "gpsMismatchReason",
    "blockchainHash",
  ],
  deterministicFields: ["businessId"],
  nestedPaths: [
    "gpsAtStart",
    "inspectorSignature",
    "ownerAcknowledgment",
    "scheduledTimeWindow",
  ],
  arrayPaths: ["checklist", "evidence", "violationsFound", "editHistory"],
  mixedPaths: [],
});

InspectionSchema.index({ inspectorId: 1, status: 1, scheduledDate: 1 });
InspectionSchema.index({ businessProfileId: 1, businessId: 1 });
InspectionSchema.index({ parentInspectionId: 1 });

module.exports =
  mongoose.models.Inspection || mongoose.model("Inspection", InspectionSchema);
