const mongoose = require('mongoose')

const BracketSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true },
    max: { type: Number, default: null }, // null = open-ended/unlimited
    rate: { type: Number, default: null }, // required when bracketKind is 'rate' or 'tiered'
    amount: { type: Number, default: null }, // fixed tax in pesos when bracketKind is 'fixed'
  },
  { _id: false }
)

const FeeConfigurationSchema = new mongoose.Schema(
  {
    taxCode: {
      type: String,
      default: '',
    },
    lineOfBusiness: {
      type: String,
      required: true,
    },
    mayorsPermitFee: {
      type: Number,
      required: true,
    },
    /** Charter Section 4W.01 — Environmental Protection Fee per annum (optional, by industry). */
    environmentalProtectionFee: {
      type: Number,
      default: null,
    },
    businessTaxCategory: {
      type: String,
      default: '',
    },
    // 'rate' = one rate applied to full gross (current); 'tiered' = rate per bracket segment; 'fixed' = bracket.amount
    bracketKind: {
      type: String,
      enum: ['rate', 'tiered', 'fixed'],
      default: 'rate',
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
