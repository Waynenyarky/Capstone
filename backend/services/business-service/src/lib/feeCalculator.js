/**
 * Fee Calculator — reads rates from FeeConfiguration model (MongoDB)
 * instead of hardcoded values. Falls back to renewalAssessmentService
 * for fees not yet in the DB.
 */
const FeeConfiguration = require('../models/FeeConfiguration')

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
 * Compute local business tax from gross sales using brackets.
 * @param {string} lineOfBusiness
 * @param {number} grossSales
 * @returns {number}
 */
async function computeBusinessTax(lineOfBusiness, grossSales) {
  if (!grossSales || grossSales < 0) return 0
  const config = await getFeeConfig(lineOfBusiness)
  if (!config || !config.brackets || config.brackets.length === 0) return 0

  // Sort brackets by min ascending
  const sorted = [...config.brackets].sort((a, b) => a.min - b.min)

  // Find the matching bracket
  for (const bracket of sorted) {
    const max = bracket.max === null || bracket.max === undefined || bracket.max >= 999999999999
      ? Infinity
      : bracket.max
    if (grossSales >= bracket.min && grossSales <= max) {
      return grossSales * (bracket.rate / 100)
    }
  }

  // If no bracket matches, use the last (highest) bracket
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
 * @returns {Object} { mayorsPermitFee, businessTax, total, breakdown, warnings, errors }
 */
async function computeApplicationFees({ businessActivities = [] }) {
  const validation = validateActivities(businessActivities)
  if (!validation.valid) {
    return {
      mayorsPermitFee: 0,
      businessTax: 0,
      total: 0,
      breakdown: [],
      errors: validation.errors,
      calculatedAt: new Date(),
    }
  }

  let totalMayorsPermit = 0
  let totalBusinessTax = 0
  const breakdown = []
  const warnings = []

  for (const activity of businessActivities) {
    const lob = activity.lineOfBusiness || activity.primaryLineOfBusiness || ''
    const gross = Number(activity.grossSales || activity.declaredCapitalInvestment || 0)

    const config = await getFeeConfig(lob)
    if (!config) {
      warnings.push(`FEE_CONFIG_MISSING: No fee configuration found for "${lob}"`)
    }

    const permitFee = await computeMayorsPermitFee(lob)
    const bizTax = await computeBusinessTax(lob, gross)

    totalMayorsPermit += permitFee
    totalBusinessTax += bizTax

    breakdown.push({
      lineOfBusiness: lob,
      grossSales: gross,
      mayorsPermitFee: Math.round(permitFee * 100) / 100,
      businessTax: Math.round(bizTax * 100) / 100,
      configFound: !!config,
    })
  }

  const total = totalMayorsPermit + totalBusinessTax

  return {
    mayorsPermitFee: Math.round(totalMayorsPermit * 100) / 100,
    businessTax: Math.round(totalBusinessTax * 100) / 100,
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
  computeMayorsPermitFee,
  computeBusinessTax,
  computeApplicationFees,
  computePenalty,
  validateActivities,
}
