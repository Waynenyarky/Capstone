import { post } from '@/lib/http.js'
import { LINE_OF_BUSINESS_BY_CATEGORY } from '@/constants/lineOfBusiness'

const BASE_PATH = '/api/business/fees'

/**
 * Business size multipliers based on capital investment
 */
const CAPITAL_MULTIPLIERS = {
  micro: { min: 0, max: 3000000, multiplier: 1.0 },
  small: { min: 3000001, max: 15000000, multiplier: 1.2 },
  medium: { min: 15000001, max: 100000000, multiplier: 1.5 },
  large: { min: 100000001, max: Infinity, multiplier: 2.0 }
}

/**
 * Gross receipts brackets for progressive fees
 */
const GROSS_RECEIPTS_BRACKETS = [
  { min: 0, max: 500000, rate: 0.01 },
  { min: 500001, max: 2000000, rate: 0.015 },
  { min: 2000001, max: 5000000, rate: 0.02 },
  { min: 5000001, max: Infinity, rate: 0.025 }
]

/**
 * Special fee categories
 */
const SPECIAL_FEES = {
  environmental: {
    applicable: ['manufacturing', 'mining', 'utilities'],
    baseFee: 5000,
    description: 'Environmental Compliance Fee'
  },
  health_zone: {
    applicable: ['food_service', 'retail'],
    baseFee: 2000,
    description: 'Health Zone Clearance Fee'
  },
  hazardous_materials: {
    applicable: ['manufacturing', 'mining', 'construction'],
    baseFee: 8000,
    description: 'Hazardous Materials Handling Fee'
  }
}

/**
 * Get business size category based on capital investment
 */
export function getBusinessSizeCategory(capital) {
  if (!capital || capital <= 0) return 'micro'
  
  for (const [category, range] of Object.entries(CAPITAL_MULTIPLIERS)) {
    if (capital >= range.min && capital <= range.max) {
      return category
    }
  }
  return 'large'
}

/**
 * Get capital-based multiplier
 */
export function getCapitalMultiplier(capital) {
  const category = getBusinessSizeCategory(capital)
  return CAPITAL_MULTIPLIERS[category].multiplier
}

/**
 * Calculate gross receipts fee
 */
export function calculateGrossReceiptsFee(grossReceipts) {
  if (!grossReceipts || grossReceipts <= 0) return 0
  
  for (const bracket of GROSS_RECEIPTS_BRACKETS) {
    if (grossReceipts >= bracket.min && grossReceipts <= bracket.max) {
      return grossReceipts * bracket.rate
    }
  }
  return grossReceipts * 0.025 // Default highest rate
}

/**
 * Get applicable special fees for a business
 */
export function getApplicableSpecialFees(lineOfBusiness) {
  const applicableFees = []
  
  for (const [feeType, config] of Object.entries(SPECIAL_FEES)) {
    if (config.applicable.includes(lineOfBusiness)) {
      applicableFees.push({
        type: feeType,
        amount: config.baseFee,
        description: config.description
      })
    }
  }
  
  return applicableFees
}

/**
 * Calculate dynamic fees with all adjustments
 */
export function calculateDynamicFees(businessData) {
  const {
    primaryLineOfBusiness,
    lineOfBusiness,
    capitalInvestment = 0,
    grossReceipts = 0,
    baseFees = {}
  } = businessData
  
  const lob = primaryLineOfBusiness || lineOfBusiness
  const lobCategory = LINE_OF_BUSINESS_BY_CATEGORY[lob]?.lineOfBusiness || lob
  
  // Get capital multiplier
  const capitalMultiplier = getCapitalMultiplier(capitalInvestment)
  
  // Apply multiplier to base fees
  const adjustedFees = {}
  for (const [feeType, amount] of Object.entries(baseFees)) {
    adjustedFees[feeType] = Math.round(amount * capitalMultiplier)
  }
  
  // Add gross receipts fee if applicable
  const grossReceiptsFee = calculateGrossReceiptsFee(grossReceipts)
  if (grossReceiptsFee > 0) {
    adjustedFees.grossReceiptsFee = Math.round(grossReceiptsFee)
  }
  
  // Add special fees
  const specialFees = getApplicableSpecialFees(lobCategory)
  specialFees.forEach(fee => {
    adjustedFees[fee.type] = fee.amount
  })
  
  return {
    fees: adjustedFees,
    metadata: {
      businessSize: getBusinessSizeCategory(capitalInvestment),
      capitalMultiplier,
      specialFeesApplied: specialFees.map(f => f.type),
      totalAmount: Object.values(adjustedFees).reduce((sum, amt) => sum + amt, 0)
    }
  }
}

/**
 * Get fee assessment from server with dynamic calculation
 */
export async function getFeeAssessment(businessData) {
  try {
    const response = await post(`${BASE_PATH}/assessment`, businessData)
    return response
  } catch (error) {
    console.error('Server fee assessment failed, using local calculation:', error)
    // Fallback to local calculation
    return calculateDynamicFees(businessData)
  }
}

/**
 * Validate fee calculation
 */
export function validateFees(fees) {
  const errors = []
  
  if (!fees || typeof fees !== 'object') {
    errors.push('Invalid fees object')
    return { valid: false, errors }
  }
  
  for (const [feeType, amount] of Object.entries(fees)) {
    if (typeof amount !== 'number' || amount < 0) {
      errors.push(`Invalid amount for ${feeType}: ${amount}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  getBusinessSizeCategory,
  getCapitalMultiplier,
  calculateGrossReceiptsFee,
  getApplicableSpecialFees,
  calculateDynamicFees,
  getFeeAssessment,
  validateFees
}
