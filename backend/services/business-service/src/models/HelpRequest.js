const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["officer", "business_owner"],
      required: true,
    },
    senderName: { type: String, default: "" },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true },
);

const InternalNoteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedByName: { type: String, default: "" },
  },
  { timestamps: true },
);

const HelpRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    contactEmail: { type: String, required: true },
    businessPermitNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "needs_response",
        "waiting_for_business_owner",
        "closed",
        "invalid",
      ],
      default: "open",
      index: true,
    },
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "low",
      index: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedByName: { type: String, default: "" },
    claimedAt: { type: Date, default: null },
    attachments: { type: [String], default: [] },
    messages: { type: [MessageSchema], default: [] },
    internalNotes: { type: [InternalNoteSchema], default: [] },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
HelpRequestSchema.plugin(encryptionPlugin, {
  fields: ["subject", "message"],
  deterministicFields: ["requestId", "contactEmail", "businessPermitNumber"],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: ["metadata"],
});

module.exports =
  mongoose.models.HelpRequest ||
  mongoose.model("HelpRequest", HelpRequestSchema);
