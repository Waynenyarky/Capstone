const mongoose = require("mongoose");

const FeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ["permit", "regulatory", "penalty", "appeal", "other"],
      default: "permit",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    draftOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
FeeSchema.plugin(encryptionPlugin, {
  fields: ["name", "description"],
  deterministicFields: [],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
});

// Index for faster queries
FeeSchema.index({ isActive: 1, category: 1 });
FeeSchema.index({ version: 1 });

module.exports = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
