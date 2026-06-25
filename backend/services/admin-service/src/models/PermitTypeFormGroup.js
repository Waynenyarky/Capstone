const mongoose = require("mongoose");

const PermitTypeVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
    },
    sections: {
      type: Array,
      default: [],
    },
    feeGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeGroup",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true },
);

const PermitTypeFormGroupSchema = new mongoose.Schema(
  {
    cardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    formType: {
      type: String,
      default: "permit",
    },
    industryScope: {
      type: String,
      default: "all",
    },
    versions: {
      type: [PermitTypeVersionSchema],
      default: [],
    },
    retiredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

PermitTypeFormGroupSchema.index({ cardId: 1 });
PermitTypeFormGroupSchema.index({ retiredAt: 1 });

PermitTypeFormGroupSchema.methods.getNextVersionNumber = function () {
  if (!this.versions || this.versions.length === 0) {
    return 1;
  }
  return Math.max(...this.versions.map((v) => v.version)) + 1;
};

PermitTypeFormGroupSchema.methods.getLatestPublishedVersion = function () {
  if (!this.versions || this.versions.length === 0) {
    return null;
  }
  const published = this.versions
    .filter((v) => v.status === "published")
    .sort((a, b) => b.version - a.version);
  return published.length > 0 ? published[0] : null;
};

module.exports =
  mongoose.models.PermitTypeFormGroup ||
  mongoose.model("PermitTypeFormGroup", PermitTypeFormGroupSchema);
