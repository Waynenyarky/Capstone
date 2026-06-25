const mongoose = require("mongoose");

const FeeGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Fee",
      },
    ],
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
      ref: "FeeGroup",
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
FeeGroupSchema.plugin(encryptionPlugin, {
  fields: ["name", "description"],
  deterministicFields: [],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
});

// Index for faster queries
FeeGroupSchema.index({ isActive: 1 });
FeeGroupSchema.index({ version: 1 });

module.exports = mongoose.models.FeeGroup || mongoose.model("FeeGroup", FeeGroupSchema);
