/**
 * Gas Budget Tracker
 * Tracks cumulative gas usage per month and alerts when thresholds are approached.
 * Supports configurable monthly budget caps and warning thresholds.
 *
 * V3 MAINNET-$1K MODE: Adds hard/soft stops for strict budget enforcement
 * - Soft stop: Increase digest window, reduce immediate writes
 * - Hard stop: Reject non-critical immediate anchors entirely
 */

const logger = require('./logger')

// In-memory tracking (resets on restart; persistent tracking via AuditLog aggregation)
let currentMonthKey = null
let gasUsedThisMonth = 0
let txCountThisMonth = 0
let currentDayKey = null
let gasUsedToday = 0
let txCountToday = 0

// Configurable via environment
const MONTHLY_GAS_BUDGET = Number(process.env.GAS_MONTHLY_BUDGET) || 25_000_000 // ~$1,000/month target
const WARNING_THRESHOLD_PCT = Number(process.env.GAS_WARNING_THRESHOLD_PCT) || 80
const CRITICAL_THRESHOLD_PCT = Number(process.env.GAS_CRITICAL_THRESHOLD_PCT) || 95

// V3: Hard/soft stop thresholds for mainnet_budget mode
const SOFT_STOP_THRESHOLD_PCT = Number(process.env.GAS_SOFT_STOP_PCT) || 85
const HARD_STOP_THRESHOLD_PCT = Number(process.env.GAS_HARD_STOP_PCT) || 98

// Daily budget slice (monthly / 30 days, with 10% buffer)
const DAILY_GAS_BUDGET = Math.floor((MONTHLY_GAS_BUDGET / 30) * 1.1)

/**
 * Get current month key (YYYY-MM)
 */
function _monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get current day key (YYYY-MM-DD)
 */
function _dayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Record gas usage for a transaction.
 * @param {number} gasUsed - Gas consumed by the transaction
 * @param {string} operation - Operation name for logging
 */
function recordGasUsage(gasUsed, operation = 'unknown') {
  const mk = _monthKey()
  const dk = _dayKey()

  if (mk !== currentMonthKey) {
    // New month — reset counters
    currentMonthKey = mk
    gasUsedThisMonth = 0
    txCountThisMonth = 0
  }

  if (dk !== currentDayKey) {
    // New day — reset daily counters
    currentDayKey = dk
    gasUsedToday = 0
    txCountToday = 0
  }

  gasUsedThisMonth += gasUsed
  txCountThisMonth += 1
  gasUsedToday += gasUsed
  txCountToday += 1

  const pctUsed = ((gasUsedThisMonth / MONTHLY_GAS_BUDGET) * 100).toFixed(1)

  if (gasUsedThisMonth >= MONTHLY_GAS_BUDGET * (HARD_STOP_THRESHOLD_PCT / 100)) {
    logger.error(`[GasBudget] HARD STOP: ${pctUsed}% of monthly gas budget used - rejecting non-critical anchors`, { operation })
  } else if (gasUsedThisMonth >= MONTHLY_GAS_BUDGET * (SOFT_STOP_THRESHOLD_PCT / 100)) {
    logger.warn(`[GasBudget] SOFT STOP: ${pctUsed}% of monthly gas budget used - increasing digest window`, { operation })
  } else if (gasUsedThisMonth >= MONTHLY_GAS_BUDGET * (CRITICAL_THRESHOLD_PCT / 100)) {
    logger.error(`[GasBudget] CRITICAL: ${pctUsed}% of monthly gas budget used (${gasUsedThisMonth.toLocaleString()} / ${MONTHLY_GAS_BUDGET.toLocaleString()})`, { operation })
  } else if (gasUsedThisMonth >= MONTHLY_GAS_BUDGET * (WARNING_THRESHOLD_PCT / 100)) {
    logger.warn(`[GasBudget] WARNING: ${pctUsed}% of monthly gas budget used (${gasUsedThisMonth.toLocaleString()} / ${MONTHLY_GAS_BUDGET.toLocaleString()})`, { operation })
  }
}

/**
 * Check if the budget allows another transaction of estimated gas.
 * @param {number} estimatedGas - Estimated gas for the next transaction
 * @param {boolean} isCritical - Whether this is a critical/legal-required anchor
 * @returns {{ allowed: boolean, pctUsed: number, remaining: number, stopLevel: string }}
 */
function checkBudget(estimatedGas = 0, isCritical = false) {
  const mk = _monthKey()
  const dk = _dayKey()

  if (mk !== currentMonthKey) {
    currentMonthKey = mk
    gasUsedThisMonth = 0
    txCountThisMonth = 0
  }

  if (dk !== currentDayKey) {
    currentDayKey = dk
    gasUsedToday = 0
    txCountToday = 0
  }

  const remaining = MONTHLY_GAS_BUDGET - gasUsedThisMonth
  const pctUsed = ((gasUsedThisMonth / MONTHLY_GAS_BUDGET) * 100)

  // Determine stop level
  let stopLevel = 'none'
  if (pctUsed >= HARD_STOP_THRESHOLD_PCT) {
    stopLevel = 'hard'
  } else if (pctUsed >= SOFT_STOP_THRESHOLD_PCT) {
    stopLevel = 'soft'
  }

  // In hard stop, only critical anchors are allowed
  // In soft stop, all anchors allowed but digest window should be increased
  let allowed = true
  if (stopLevel === 'hard' && !isCritical) {
    allowed = false
  } else {
    allowed = (gasUsedThisMonth + estimatedGas) <= MONTHLY_GAS_BUDGET
  }

  return {
    allowed,
    pctUsed: Math.round(pctUsed * 10) / 10,
    remaining,
    gasUsedThisMonth,
    txCountThisMonth,
    stopLevel,
    dailyGasUsed: gasUsedToday,
    dailyTxCount: txCountToday,
    dailyBudget: DAILY_GAS_BUDGET,
  }
}

/**
 * Get full budget status for dashboard/API.
 */
function getStatus() {
  const mk = _monthKey()
  const dk = _dayKey()

  if (mk !== currentMonthKey) {
    currentMonthKey = mk
    gasUsedThisMonth = 0
    txCountThisMonth = 0
  }

  if (dk !== currentDayKey) {
    currentDayKey = dk
    gasUsedToday = 0
    txCountToday = 0
  }

  const pctUsed = Math.round((gasUsedThisMonth / MONTHLY_GAS_BUDGET) * 1000) / 10

  // Determine stop level
  let stopLevel = 'none'
  if (pctUsed >= HARD_STOP_THRESHOLD_PCT) {
    stopLevel = 'hard'
  } else if (pctUsed >= SOFT_STOP_THRESHOLD_PCT) {
    stopLevel = 'soft'
  }

  // Determine status
  let status = 'ok'
  if (stopLevel === 'hard') {
    status = 'hard_stop'
  } else if (stopLevel === 'soft') {
    status = 'soft_stop'
  } else if (pctUsed >= CRITICAL_THRESHOLD_PCT) {
    status = 'critical'
  } else if (pctUsed >= WARNING_THRESHOLD_PCT) {
    status = 'warning'
  }

  // Daily burn rate forecast
  const daysInMonth = 30
  const dayOfMonth = new Date().getDate()
  const projectedMonthlyGas = dayOfMonth > 0 ? Math.round((gasUsedThisMonth / dayOfMonth) * daysInMonth) : 0
  const projectedOverBudget = projectedMonthlyGas > MONTHLY_GAS_BUDGET

  return {
    month: currentMonthKey,
    day: currentDayKey,
    gasUsed: gasUsedThisMonth,
    gasBudget: MONTHLY_GAS_BUDGET,
    txCount: txCountThisMonth,
    pctUsed,
    warningThresholdPct: WARNING_THRESHOLD_PCT,
    criticalThresholdPct: CRITICAL_THRESHOLD_PCT,
    softStopThresholdPct: SOFT_STOP_THRESHOLD_PCT,
    hardStopThresholdPct: HARD_STOP_THRESHOLD_PCT,
    status,
    stopLevel,
    // Daily tracking
    dailyGasUsed: gasUsedToday,
    dailyTxCount: txCountToday,
    dailyBudget: DAILY_GAS_BUDGET,
    dailyPctUsed: Math.round((gasUsedToday / DAILY_GAS_BUDGET) * 1000) / 10,
    // Forecast
    projectedMonthlyGas,
    projectedOverBudget,
    daysRemaining: daysInMonth - dayOfMonth,
  }
}

/**
 * V3: Get burn rate forecast for mainnet_budget mode
 */
function getBurnForecast() {
  const status = getStatus()
  const daysInMonth = 30
  const dayOfMonth = new Date().getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  // Average daily burn
  const avgDailyBurn = dayOfMonth > 0 ? Math.round(status.gasUsed / dayOfMonth) : 0

  // Remaining budget
  const remainingBudget = MONTHLY_GAS_BUDGET - status.gasUsed

  // Days until budget exhausted at current rate
  const daysUntilExhausted = avgDailyBurn > 0 ? Math.floor(remainingBudget / avgDailyBurn) : Infinity

  // Safe daily budget for remaining days
  const safeDailyBudget = daysRemaining > 0 ? Math.floor(remainingBudget / daysRemaining) : 0

  return {
    ...status,
    avgDailyBurn,
    remainingBudget,
    daysUntilExhausted: daysUntilExhausted === Infinity ? null : daysUntilExhausted,
    safeDailyBudget,
    recommendation: daysUntilExhausted < daysRemaining
      ? 'reduce_burn'
      : daysUntilExhausted === daysRemaining
        ? 'on_track'
        : 'under_budget',
  }
}

/**
 * Reset counters (for testing)
 */
function reset() {
  currentMonthKey = null
  gasUsedThisMonth = 0
  txCountThisMonth = 0
  currentDayKey = null
  gasUsedToday = 0
  txCountToday = 0
}

module.exports = {
  recordGasUsage,
  checkBudget,
  getStatus,
  getBurnForecast,
  reset,
  // Export constants for testing
  MONTHLY_GAS_BUDGET,
  DAILY_GAS_BUDGET,
  SOFT_STOP_THRESHOLD_PCT,
  HARD_STOP_THRESHOLD_PCT,
}
