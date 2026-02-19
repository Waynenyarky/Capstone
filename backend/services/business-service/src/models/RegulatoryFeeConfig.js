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

/** Single bracket for Weights and Measures (Charter 4J.01): max value + fee per unit. */
const WeightsMeasureBracketSchema = new mongoose.Schema(
  {
    maxValue: { type: Number, required: true },
    feePerUnit: { type: Number, required: true },
  },
  { _id: false }
)

const defaultWeightsLinear = [
  { maxValue: 1, feePerUnit: 132 },
  { maxValue: null, feePerUnit: 264 },
]
const defaultWeightsCapacity = [
  { maxValue: 10, feePerUnit: 100 },
  { maxValue: null, feePerUnit: 132 },
]
const defaultWeightsWeights = [
  { maxValue: 30, feePerUnit: 66 },
  { maxValue: 300, feePerUnit: 132 },
  { maxValue: 3000, feePerUnit: 264 },
  { maxValue: null, feePerUnit: 660 },
]

const WeightsAndMeasuresSchema = new mongoose.Schema(
  {
    /** Linear metric measures (meters). Charter: not over 1m = 132, over 1m = 264. */
    linear: { type: [WeightsMeasureBracketSchema], default: defaultWeightsLinear },
    /** Capacity (liters). Charter: not over 10L = 100, over 10L = 132. */
    capacity: { type: [WeightsMeasureBracketSchema], default: defaultWeightsCapacity },
    /** Weights (kg). Charter: ≤30kg=66, 30–300=132, 300–3000=264, >3000=660. */
    weights: { type: [WeightsMeasureBracketSchema], default: defaultWeightsWeights },
    retestingPerUnit: { type: Number, default: 20 },
    gasolinePerNozzle: { type: Number, default: 132 },
  },
  { _id: false }
)

const CommunityTaxSchema = new mongoose.Schema(
  {
    individualBase: { type: Number, default: 5 },
    individualRatePer1000: { type: Number, default: 1 },
    individualCap: { type: Number, default: 5000 },
    juridicalBase: { type: Number, default: 500 },
    juridicalRatePer5000: { type: Number, default: 2 },
    juridicalCap: { type: Number, default: 10000 },
  },
  { _id: false }
)

const SpecialPermitSchema = new mongoose.Schema(
  {
    streamerPerSqYard: { type: Number, default: 25 },
    streamerDays: { type: Number, default: 15 },
    motorcadePerDay: { type: Number, default: 200 },
  },
  { _id: false }
)

const CertificationFeeSchema = new mongoose.Schema(
  {
    fee: { type: Number, default: 60 },
    documentaryStamp: { type: Number, default: 30 },
  },
  { _id: false }
)

/**
 * Single-document config for special/regulatory fees.
 * Charter: 5E.01 (Sanitary), Fire Safety 15% min P500, 4A.01 (Business Plate), 4J.01 (Weights/Measures),
 * 3.x (Community Tax), Special Permit, Certification/Certified Copy.
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
    /** Business Plate/Sticker (Charter 4A.01). Cost determined by BPLO, not to exceed acquisition. */
    businessPlate: {
      type: new mongoose.Schema({ feePerUnit: Number, note: String }, { _id: false }),
      default: () => ({}),
    },
    /** Fee for Sealing and Licensing of Weights and Measures (Charter 4J.01). */
    weightsAndMeasures: {
      type: WeightsAndMeasuresSchema,
      default: () => ({
        linear: defaultWeightsLinear,
        capacity: defaultWeightsCapacity,
        weights: defaultWeightsWeights,
        retestingPerUnit: 20,
        gasolinePerNozzle: 132,
      }),
    },
    /** Community Tax (Charter Section 3.01–3.07). */
    communityTax: {
      type: CommunityTaxSchema,
      default: () => ({
        individualBase: 5,
        individualRatePer1000: 1,
        individualCap: 5000,
        juridicalBase: 500,
        juridicalRatePer5000: 2,
        juridicalCap: 10000,
      }),
    },
    /** Special Permit: Streamer, Motorcade (Charter table). */
    specialPermit: {
      type: SpecialPermitSchema,
      default: () => ({ streamerPerSqYard: 25, streamerDays: 15, motorcadePerDay: 200 }),
    },
    /** Certification of Business Record (Charter: P60 + P30 documentary stamp). */
    certificationOfBusinessRecord: { type: CertificationFeeSchema, default: () => ({ fee: 60, documentaryStamp: 30 }) },
    /** Certified True Copy of Business Permit (Charter: P60 per document + P30). */
    certifiedTrueCopyPerDocument: { type: CertificationFeeSchema, default: () => ({ fee: 60, documentaryStamp: 30 }) },
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
