const mongoose = require('mongoose')

const BracketSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true },
    max: { type: Number, default: null }, // null = open-ended/unlimited
    rate: { type: Number, required: true },
  },
  { _id: false }
)

const FeeConfigurationSchema = new mongoose.Schema(
  {
    lineOfBusiness: {
      type: String,
      required: true,
    },
    mayorsPermitFee: {
      type: Number,
      required: true,
    },
    businessTaxCategory: {
      type: String,
      default: '',
    },
    brackets: {
      type: [BracketSchema],
      default: [],
    },
    effectiveDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Unique constraint: only one active config per line of business
FeeConfigurationSchema.index(
  { lineOfBusiness: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
)

module.exports =
  mongoose.models.FeeConfiguration ||
  mongoose.model('FeeConfiguration', FeeConfigurationSchema)
