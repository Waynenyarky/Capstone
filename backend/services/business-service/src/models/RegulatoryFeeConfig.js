const mongoose = require('mongoose')

/** Single bracket for Sanitary Inspection Fee (Charter 5E.01): fee by area range (sq.m.). */
const SanitaryBracketSchema = new mongoose.Schema(
  {
    minSqm: { type: Number, required: true },
    maxSqm: { type: Number, default: null },
    fee: { type: Number, required: true },
  },
  { _id: false }
)

/**
 * Single-document config for special/regulatory fees: Sanitary (by area) and Fire Safety (rate + min).
 * Charter: Section 5E.01 (Sanitary), Fire Safety 15% of BPLO min P500.
 * One document per deployment; admins edit via Admin Fee Configuration → Special fees.
 */
const RegulatoryFeeConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'default' },
    /** Sanitary Inspection Fee brackets (area sq.m. → fee). */
    sanitaryBrackets: {
      type: [SanitaryBracketSchema],
      default: [
        { minSqm: 0, maxSqm: 24.99, fee: 0 },
        { minSqm: 25, maxSqm: 49.99, fee: 50 },
        { minSqm: 50, maxSqm: 99.99, fee: 60 },
        { minSqm: 100, maxSqm: 199.99, fee: 150 },
        { minSqm: 200, maxSqm: 499.99, fee: 200 },
        { minSqm: 500, maxSqm: 999.99, fee: 250 },
        { minSqm: 1000, maxSqm: null, fee: 400 },
      ],
    },
    /** Sanitary fee for house for rent (Charter: Php50). */
    sanitaryHouseForRentFee: { type: Number, default: 50 },
    /** Fire Safety: rate applied to BPLO regulatory fees (Charter: 0.15 = 15%). */
    fireSafetyRate: { type: Number, default: 0.15 },
    /** Fire Safety: minimum fee in pesos (Charter: 500). */
    fireSafetyMin: { type: Number, default: 500 },
  },
  { timestamps: true }
)

const SINGLETON_ID = 'default'

const model =
  mongoose.models.RegulatoryFeeConfig ||
  mongoose.model('RegulatoryFeeConfig', RegulatoryFeeConfigSchema)

/** Id of the single config document. */
model.SINGLETON_ID = SINGLETON_ID
module.exports = model
