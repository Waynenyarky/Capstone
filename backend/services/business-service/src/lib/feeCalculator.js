/**
 * Fee Calculator — reads rates from FeeConfiguration model (MongoDB)
 * instead of hardcoded values. Falls back to renewalAssessmentService
 * for fees not yet in the DB.
 *
 * Charter fees implemented:
 * - Mayor's Permit + Business Tax (Section 4A.01, Annex 1)
 * - Sanitary Inspection Fee (Section 5E.01, by area sq.m.)
 * - Environmental Protection Fee (Section 4W.01, by industry/LOB)
 * - Fire Safety Inspection Fee (15% of BPLO regulatory fees, min P500)
 */
const FeeConfiguration = require('../models/FeeConfiguration')
const RegulatoryFeeConfig = require('../models/RegulatoryFeeConfig')

/** Defaults (Charter) when DB config is missing. */
const DEFAULT_SANITARY_BRACKETS = [
  { minSqm: 0, maxSqm: 24.99, fee: 0 },
  { minSqm: 25, maxSqm: 49.99, fee: 50 },
  { minSqm: 50, maxSqm: 99.99, fee: 60 },
  { minSqm: 100, maxSqm: 199.99, fee: 150 },
  { minSqm: 200, maxSqm: 499.99, fee: 200 },
  { minSqm: 500, maxSqm: 999.99, fee: 250 },
  { minSqm: 1000, maxSqm: null, fee: 400 },
]
const DEFAULT_SANITARY_HOUSE_FOR_RENT = 50
const DEFAULT_FIRE_SAFETY_RATE = 0.15
const DEFAULT_FIRE_SAFETY_MIN = 500

/**
 * Load regulatory fee config from DB (Sanitary brackets, Fire Safety rate/min). Used by calculator; admins edit via Admin → Special fees.
 * @returns {Promise<Object|null>} { sanitaryBrackets, sanitaryHouseForRentFee, fireSafetyRate, fireSafetyMin } or null
 */
async function getRegulatoryFeeConfig() {
  try {
    const doc = await RegulatoryFeeConfig.findById(RegulatoryFeeConfig.SINGLETON_ID).lean()
    return doc || null
  } catch {
    return null
  }
}

/**
 * Look up the active FeeConfiguration for a line of business.
 * @param {string} lineOfBusiness
 * @returns {Object|null} FeeConfiguration document or null
 */
async function getFeeConfig(lineOfBusiness) {
  if (!lineOfBusiness) return null
  return FeeConfiguration.findOne({
    lineOfBusiness: lineOfBusiness.toLowerCase().trim(),
    isActive: true,
  }).lean()
}

/**
 * Compute mayor's permit fee from FeeConfiguration.
 * @param {string} lineOfBusiness
 * @returns {number}
 */
async function computeMayorsPermitFee(lineOfBusiness) {
  const config = await getFeeConfig(lineOfBusiness)
  if (!config) return 0
  return config.mayorsPermitFee || 0
}

/**
 * Charter Section 5E.01 — Sanitary Inspection Fee by floor area (sq.m.).
 * @param {number} areaSqm - Business/establishment area in square meters
 * @param {boolean} [isHouseForRent] - If true, returns house-for-rent fee
 * @param {Object} [regulatoryConfig] - From getRegulatoryFeeConfig(); if omitted, uses built-in charter defaults
 * @returns {number}
 */
function computeSanitaryFee(areaSqm, isHouseForRent = false, regulatoryConfig = null) {
  const houseFee =
    regulatoryConfig?.sanitaryHouseForRentFee ?? DEFAULT_SANITARY_HOUSE_FOR_RENT
  const brackets = regulatoryConfig?.sanitaryBrackets?.length
    ? regulatoryConfig.sanitaryBrackets
    : DEFAULT_SANITARY_BRACKETS
  if (isHouseForRent) return houseFee
  if (areaSqm == null || areaSqm < 0) return 0
  for (let i = brackets.length - 1; i >= 0; i--) {
    const b = brackets[i]
    if (b.minSqm <= areaSqm && (b.maxSqm == null || areaSqm <= b.maxSqm)) return b.fee
  }
  return 0
}

/**
 * Charter — Fire Safety Inspection Fee: rate × BPLO regulatory fees, minimum Php.
 * @param {number} bploRegulatoryFees - Sum of Mayor's Permit + Business Tax (and other BPLO fees if any)
 * @param {Object} [regulatoryConfig] - From getRegulatoryFeeConfig(); if omitted, uses built-in charter defaults
 * @returns {number}
 */
function computeFireSafetyFee(bploRegulatoryFees, regulatoryConfig = null) {
  const min = regulatoryConfig?.fireSafetyMin ?? DEFAULT_FIRE_SAFETY_MIN
  const rate = regulatoryConfig?.fireSafetyRate ?? DEFAULT_FIRE_SAFETY_RATE
  if (bploRegulatoryFees == null || bploRegulatoryFees < 0) return min
  const fee = Math.max(min, bploRegulatoryFees * rate)
  return Math.round(fee * 100) / 100
}

/**
 * Charter Section 4W.01 — Environmental Protection Fee (per LOB when configured).
 * @param {string} lineOfBusiness
 * @returns {Promise<number>}
 */
async function computeEnvironmentalFee(lineOfBusiness) {
  const config = await getFeeConfig(lineOfBusiness)
  if (!config || config.environmentalProtectionFee == null) return 0
  return Number(config.environmentalProtectionFee) || 0
}

/**
 * Compute local business tax from gross sales using brackets.
 * Supports bracketKind: 'rate' (one rate on full amount), 'tiered' (rate per segment), 'fixed' (bracket.amount).
 * @param {string} lineOfBusiness
 * @param {number} grossSales
 * @returns {number}
 */
async function computeBusinessTax(lineOfBusiness, grossSales) {
  if (!grossSales || grossSales < 0) return 0
  const config = await getFeeConfig(lineOfBusiness)
  if (!config || !config.brackets || config.brackets.length === 0) return 0

  const kind = config.bracketKind || 'rate'
  const sorted = [...config.brackets].sort((a, b) => a.min - b.min)

  if (kind === 'fixed') {
    for (const bracket of sorted) {
      const max = bracket.max === null || bracket.max === undefined || bracket.max >= 999999999999
        ? Infinity
        : bracket.max
      if (grossSales >= bracket.min && grossSales <= max) {
        return Number(bracket.amount) || 0
      }
    }
    const last = sorted[sorted.length - 1]
    return last ? (Number(last.amount) || 0) : 0
  }

  if (kind === 'tiered') {
    let tax = 0
    for (const bracket of sorted) {
      const cap = bracket.max === null || bracket.max === undefined || bracket.max >= 999999999999
        ? Infinity
        : bracket.max
      const segmentMin = Math.max(bracket.min, 0)
      const segmentMax = Math.min(cap, grossSales)
      if (segmentMax <= segmentMin) continue
      const segment = segmentMax - segmentMin
      const rate = Number(bracket.rate) || 0
      tax += segment * (rate / 100)
    }
    return tax
  }

  // 'rate' or missing: single bracket's rate applied to full gross sales (legacy)
  for (const bracket of sorted) {
    const max = bracket.max === null || bracket.max === undefined || bracket.max >= 999999999999
      ? Infinity
      : bracket.max
    if (grossSales >= bracket.min && grossSales <= max) {
      return grossSales * ((bracket.rate || 0) / 100)
    }
  }
  const last = sorted[sorted.length - 1]
  return grossSales * ((last?.rate || 0) / 100)
}

/**
 * Validate business activities before fee computation.
 * @param {Array} businessActivities
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateActivities(businessActivities) {
  const errors = []
  if (!businessActivities || businessActivities.length === 0) {
    errors.push('At least one business activity is required')
    return { valid: false, errors }
  }
  for (let i = 0; i < businessActivities.length; i++) {
    const activity = businessActivities[i]
    const lob = activity.lineOfBusiness || activity.primaryLineOfBusiness || ''
    const gross = Number(activity.grossSales || activity.declaredCapitalInvestment || 0)
    if (!lob) {
      errors.push(`Activity ${i + 1}: lineOfBusiness is required`)
    }
    if (gross < 0) {
      errors.push(`Activity ${i + 1}: grossSales cannot be negative`)
    }
  }
  return { valid: errors.length === 0, errors }
}

/**
 * Compute total fees for a business application.
 * @param {Object} params
 * @param {Array} params.businessActivities - [{ lineOfBusiness, grossSales }]
 * @param {number} [params.areaSqm] - Floor area in sq.m. for Sanitary Inspection Fee (Charter 5E.01)
 * @param {boolean} [params.isHouseForRent] - If true, Sanitary fee = Php50 (house for rent)
 * @returns {Object} { mayorsPermitFee, businessTax, sanitaryFee, environmentalFee, fireSafetyFee, total, breakdown, warnings, errors }
 */
async function computeApplicationFees({
  businessActivities = [],
  areaSqm = null,
  isHouseForRent = false,
}) {
  const validation = validateActivities(businessActivities)
  const warnings = []
  if (!validation.valid) {
    return {
      mayorsPermitFee: 0,
      businessTax: 0,
      sanitaryFee: 0,
      environmentalFee: 0,
      fireSafetyFee: 0,
      total: 0,
      breakdown: [],
      errors: validation.errors,
      calculatedAt: new Date(),
    }
  }

  let totalMayorsPermit = 0
  let totalBusinessTax = 0
  let totalEnvironmental = 0
  const breakdown = []

  for (const activity of businessActivities) {
    const lob = activity.lineOfBusiness || activity.primaryLineOfBusiness || ''
    const gross = Number(activity.grossSales || activity.declaredCapitalInvestment || 0)

    const config = await getFeeConfig(lob)
    if (!config) {
      warnings.push(`FEE_CONFIG_MISSING: No fee configuration found for "${lob}"`)
    }

    const permitFee = await computeMayorsPermitFee(lob)
    const bizTax = await computeBusinessTax(lob, gross)
    const envFee = await computeEnvironmentalFee(lob)

    totalMayorsPermit += permitFee
    totalBusinessTax += bizTax
    totalEnvironmental += envFee

    breakdown.push({
      lineOfBusiness: lob,
      grossSales: gross,
      mayorsPermitFee: Math.round(permitFee * 100) / 100,
      businessTax: Math.round(bizTax * 100) / 100,
      environmentalFee: Math.round(envFee * 100) / 100,
      configFound: !!config,
    })
  }

  const bploRegulatory = totalMayorsPermit + totalBusinessTax
  const regulatoryConfig = await getRegulatoryFeeConfig()
  const sanitaryFee =
    areaSqm != null && areaSqm >= 0
      ? computeSanitaryFee(areaSqm, isHouseForRent, regulatoryConfig)
      : 0
  const fireSafetyFee = computeFireSafetyFee(bploRegulatory, regulatoryConfig)
  const total =
    bploRegulatory + sanitaryFee + totalEnvironmental + fireSafetyFee

  return {
    mayorsPermitFee: Math.round(totalMayorsPermit * 100) / 100,
    businessTax: Math.round(totalBusinessTax * 100) / 100,
    sanitaryFee: Math.round(sanitaryFee * 100) / 100,
    environmentalFee: Math.round(totalEnvironmental * 100) / 100,
    fireSafetyFee: Math.round(fireSafetyFee * 100) / 100,
    total: Math.round(total * 100) / 100,
    breakdown,
    warnings: warnings.length > 0 ? warnings : undefined,
    calculatedAt: new Date(),
  }
}

/**
 * Compute penalty on late renewal.
 * Reads PenaltyConfiguration from admin-service (or env fallback).
 * @param {number} baseFees - total fees before penalty
 * @param {Date} submissionDate
 * @param {Object} penaltyConfig - { surchargePercentage, monthlyInterestRate, penaltyStartDay }
 * @returns {Object} { surcharge, interest, totalPenalty, monthsLate }
 */
function computePenalty(baseFees, submissionDate, penaltyConfig = {}) {
  const {
    surchargePercentage = 25,
    monthlyInterestRate = 2,
    penaltyStartDay = 20,
  } = penaltyConfig

  const now = submissionDate || new Date()
  const year = now.getFullYear()
  const penaltyDate = new Date(year, 0, penaltyStartDay, 23, 59, 59) // January <day> 11:59 PM

  if (now <= penaltyDate) {
    return { surcharge: 0, interest: 0, totalPenalty: 0, monthsLate: 0 }
  }

  const surcharge = baseFees * (surchargePercentage / 100)

  // Calculate months late (each calendar month past deadline)
  const monthsLate = Math.max(0, (now.getMonth() - 0)) // months since January
  const interest = (baseFees + surcharge) * (monthlyInterestRate / 100) * monthsLate

  return {
    surcharge: Math.round(surcharge * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    totalPenalty: Math.round((surcharge + interest) * 100) / 100,
    monthsLate,
  }
}

module.exports = {
  getFeeConfig,
  getRegulatoryFeeConfig,
  computeMayorsPermitFee,
  computeBusinessTax,
  computeSanitaryFee,
  computeFireSafetyFee,
  computeEnvironmentalFee,
  computeApplicationFees,
  computePenalty,
  validateActivities,
}
