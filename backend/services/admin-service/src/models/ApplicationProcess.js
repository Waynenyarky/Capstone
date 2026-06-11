const mongoose = require("mongoose");

const ProcessStepSchema = new mongoose.Schema(
  {
    stepId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: "" },
    optional: { type: Boolean, default: false },
    estimatedTime: { type: String, default: "" },
    estimatedCost: { type: String, default: "" },
    requirements: [{ type: String, trim: true }],
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const ApplicationProcessSchema = new mongoose.Schema(
  {
    applicationType: {
      type: String,
      required: true,
      unique: true,
      enum: ["permit", "renewal", "cessation", "appeal"],
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    steps: { type: [ProcessStepSchema], default: [] },
    totalEstimatedTime: { type: String, default: "" },
    totalEstimatedCost: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Pre-save: sort steps by order
ApplicationProcessSchema.pre("save", function (next) {
  if (this.steps && this.steps.length > 0) {
    this.steps.sort((a, b) => a.order - b.order);
  }
  next();
});

// Static: find active (published) process by type
ApplicationProcessSchema.statics.findActive = function (applicationType) {
  return this.findOne({ applicationType, status: "published" }).lean();
};

// Validation: ensure at least one step for published processes
ApplicationProcessSchema.pre("save", function (next) {
  if (this.status === "published" && (!this.steps || this.steps.length === 0)) {
    return next(
      new Error("Cannot publish an application process without any steps"),
    );
  }
  next();
});

const { encryptionPlugin } = require("../../../../shared/lib/encryptionPlugin");
ApplicationProcessSchema.plugin(encryptionPlugin, {
  fields: ["title", "description", "totalEstimatedTime", "totalEstimatedCost"],
  deterministicFields: ["applicationType"],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
});

module.exports =
  mongoose.models.ApplicationProcess ||
  mongoose.model("ApplicationProcess", ApplicationProcessSchema);
