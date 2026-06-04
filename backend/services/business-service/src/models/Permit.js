const mongoose = require("mongoose");

const permitSchema = new mongoose.Schema(
  {
    permitNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    businessId: {
      type: String,
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    lineOfBusiness: {
      type: String,
      required: true,
    },
    permitType: {
      type: String,
      enum: ["initial", "renewal"],
      default: "initial",
    },
    issuedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "suspended", "revoked"],
      default: "active",
      index: true,
    },
    qrCode: {
      type: String,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    suspendedAt: Date,
    suspensionReason: String,
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    revokedAt: Date,
    revocationReason: String,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
permitSchema.plugin(encryptionPlugin, {
  fields: [
    "businessName",
    "ownerName",
    "address",
    "lineOfBusiness",
    "qrCode",
    "suspensionReason",
    "revocationReason",
  ],
  deterministicFields: ["permitNumber", "businessId"],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: ["metadata"],
});

// Index for verification queries
permitSchema.index({ permitNumber: 1, status: 1 });
permitSchema.index({ businessId: 1, status: 1 });
permitSchema.index({ expiryDate: 1 });

// Virtual for checking if permit is valid
permitSchema.virtual("isValid").get(function () {
  return this.status === "active" && new Date() < this.expiryDate;
});

// Method to check if permit is expired
permitSchema.methods.isExpired = function () {
  return new Date() > this.expiryDate;
};

// Auto-update status to expired if expiry date has passed
permitSchema.pre("save", async function () {
  if (this.isExpired() && this.status === "active") {
    this.status = "expired";
  }
});

module.exports = mongoose.model("Permit", permitSchema);
