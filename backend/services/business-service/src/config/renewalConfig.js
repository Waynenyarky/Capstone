/**
 * Renewal Period Configuration Service
 * Reads renewal period settings from environment variables (not hardcoded)
 */

/**
 * Get the current renewal period - automatically calculates based on current year
 * Falls back to environment variables if set, otherwise uses automatic calculation
 * @returns {Object} { start: Date, end: Date, penaltyStart: Date, penaltyRate: number, year: number }
 */
function getCurrentRenewalPeriod() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11 (January = 0)
  const currentDay = now.getDate()

  // Determine the renewal year:
  // - If we're past January 20, renewal period is for NEXT year
  // - Otherwise, renewal period is for current year
  let renewalYear = currentYear
  if (currentMonth > 0 || (currentMonth === 0 && currentDay > 20)) {
    renewalYear = currentYear + 1
  }

  // Build date strings for the calculated year (format: YYYY-MM-DD)
  const autoStartDateStr = `${renewalYear}-01-01`
  const autoEndDateStr = `${renewalYear}-01-20`
  const autoPenaltyStartStr = `${renewalYear}-01-21`

  // Read from environment variables if set, otherwise use automatic calculation
  const startDateStr = process.env.RENEWAL_PERIOD_START || autoStartDateStr
  const endDateStr = process.env.RENEWAL_PERIOD_END || autoEndDateStr
  const penaltyStartStr = process.env.RENEWAL_PENALTY_START_DATE || autoPenaltyStartStr
  const penaltyRate = parseFloat(process.env.RENEWAL_PENALTY_RATE || '0.25') // 25% default

  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const penaltyStart = new Date(penaltyStartStr)

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(penaltyStart.getTime())) {
    throw new Error('Invalid renewal period dates in environment variables')
  }

  if (start >= end) {
    throw new Error('Renewal period start date must be before end date')
  }

  if (end >= penaltyStart) {
    throw new Error('Penalty start date must be after renewal period end date')
  }

  return {
    start,
    end,
    penaltyStart,
    penaltyRate,
    year: start.getFullYear()
  }
}

/**
 * Check if current date is within the renewal period
 * @param {Date} date - Optional date to check (defaults to now)
 * @returns {boolean}
 */
function isWithinRenewalPeriod(date = new Date()) {
  const period = getCurrentRenewalPeriod()
  return date >= period.start && date <= period.end
}

/**
 * Check if current date is past the renewal period (penalties apply)
 * @param {Date} date - Optional date to check (defaults to now)
 * @returns {boolean}
 */
function isPastRenewalPeriod(date = new Date()) {
  const period = getCurrentRenewalPeriod()
  return date > period.end
}

/**
 * Get penalty information for late renewal
 * @param {Date} submissionDate - Date when renewal is being submitted
 * @returns {Object} { hasPenalty: boolean, penaltyRate: number, penaltyAmount: number, daysLate: number }
 */
function getPenaltyInfo(submissionDate = new Date(), baseAmount = 0) {
  const period = getCurrentRenewalPeriod()
  const hasPenalty = submissionDate > period.end

  if (!hasPenalty) {
    return {
      hasPenalty: false,
      penaltyRate: 0,
      penaltyAmount: 0,
      daysLate: 0
    }
  }

  // Calculate days late
  const daysLate = Math.ceil((submissionDate - period.end) / (1000 * 60 * 60 * 24))

  // Calculate penalty amount
  const penaltyAmount = baseAmount * period.penaltyRate

  return {
    hasPenalty: true,
    penaltyRate: period.penaltyRate,
    penaltyAmount,
    daysLate,
    penaltyStartDate: period.penaltyStart
  }
}

/**
 * Format renewal period for display
 * @returns {string} Formatted period string (e.g., "January 1–20, 2026")
 */
function getFormattedRenewalPeriod() {
  const period = getCurrentRenewalPeriod()
  const startMonth = period.start.toLocaleString('en-US', { month: 'long' })
  const startDay = period.start.getDate()
  const endDay = period.end.getDate()
  const year = period.start.getFullYear()

  return `${startMonth} ${startDay}–${endDay}, ${year}`
}

module.exports = {
  getCurrentRenewalPeriod,
  isWithinRenewalPeriod,
  isPastRenewalPeriod,
  getPenaltyInfo,
  getFormattedRenewalPeriod
}
