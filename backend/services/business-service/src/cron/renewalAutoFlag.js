/**
 * Renewal Auto-Flag Cron Job
 *
 * Runs every January 1st to flag all active businesses for renewal.
 * Also runs monthly to calculate interest on overdue renewals.
 */
const BusinessProfile = require('../models/BusinessProfile')
const logger = require('../lib/logger')

let PenaltyConfiguration = null
try {
  PenaltyConfiguration = require('../../../../services/admin-service/src/models/PenaltyConfiguration')
} catch (_) {
  logger.warn('[renewalAutoFlag] PenaltyConfiguration model not available — using defaults')
}

/**
 * Flag all active businesses for renewal at the start of each year.
 * Creates a draft renewal entry for each business that doesn't already have one.
 */
async function flagBusinessesForRenewal() {
  const currentYear = new Date().getFullYear()
  logger.info(`[Renewal Cron] Flagging businesses for renewal year ${currentYear}`)

  try {
    const profiles = await BusinessProfile.find({
      'businesses.businessStatus': 'active',
    })

    let flagged = 0
    for (const profile of profiles) {
      for (const business of profile.businesses) {
        if (business.businessStatus !== 'active') continue
        // Check if renewal already exists for this year
        const existingRenewal = (business.renewals || []).find(
          (r) => r.renewalYear === currentYear
        )
        if (existingRenewal) continue

        // Create draft renewal
        business.renewals = business.renewals || []
        business.renewals.push({
          renewalId: `RNW-${currentYear}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          renewalYear: currentYear,
          renewalPeriodStart: new Date(`${currentYear}-01-01`),
          renewalPeriodEnd: new Date(`${currentYear}-01-20`),
          renewalStatus: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        flagged++
      }
      if (flagged > 0) {
        await profile.save()
      }
    }

    logger.info(`[Renewal Cron] Flagged ${flagged} businesses for renewal year ${currentYear}`)
    return { flagged, year: currentYear }
  } catch (err) {
    logger.error('[Renewal Cron] Error flagging businesses:', { error: err.message })
    throw err
  }
}

/**
 * Calculate monthly interest on overdue renewals.
 * Applies 2% monthly interest (configurable via PenaltyConfiguration).
 */
async function calculateMonthlyInterest() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  logger.info(`[Interest Cron] Calculating monthly interest for ${currentYear}-${currentMonth}`)

  try {
    // Get active penalty config
    let penaltyConfig = null
    try {
      if (PenaltyConfiguration) {
        penaltyConfig = await PenaltyConfiguration.findOne({ isActive: true }).lean()
      }
    } catch (_) {
      // PenaltyConfiguration might not be accessible from business-service
    }
    const monthlyRate = penaltyConfig?.monthlyInterestRate || 2 // 2% default
    const surchargeRate = penaltyConfig?.surchargePercentage || 25 // 25% default
    const penaltyStartDay = penaltyConfig?.penaltyStartDay || 20

    // Find all businesses with overdue renewals
    const profiles = await BusinessProfile.find({
      'businesses.renewals.renewalYear': currentYear,
      'businesses.renewals.renewalStatus': 'draft',
    })

    let updated = 0
    const deadlineDate = new Date(`${currentYear}-01-${penaltyStartDay}`)

    for (const profile of profiles) {
      for (const business of profile.businesses) {
        for (const renewal of business.renewals || []) {
          if (renewal.renewalYear !== currentYear) continue
          if (renewal.renewalStatus !== 'draft') continue

          // Calculate months overdue
          const now = new Date()
          if (now <= deadlineDate) continue

          const monthsOverdue = Math.max(0,
            (now.getFullYear() - deadlineDate.getFullYear()) * 12 +
            (now.getMonth() - deadlineDate.getMonth())
          )

          if (monthsOverdue > 0 && renewal.assessment) {
            const baseFees = renewal.assessment.total || 0
            const surcharge = baseFees * (surchargeRate / 100)
            const interest = (baseFees + surcharge) * (monthlyRate / 100) * monthsOverdue

            renewal.assessment.surcharge = Math.round(surcharge * 100) / 100
            renewal.assessment.interest = Math.round(interest * 100) / 100
            renewal.assessment.totalWithPenalty = Math.round((baseFees + surcharge + interest) * 100) / 100
            renewal.updatedAt = new Date()
            updated++
          }
        }
      }
      if (updated > 0) {
        await profile.save()
      }
    }

    logger.info(`[Interest Cron] Updated ${updated} overdue renewals with interest`)
    return { updated, monthlyRate, surchargeRate }
  } catch (err) {
    logger.error('[Interest Cron] Error calculating interest:', { error: err.message })
    throw err
  }
}

module.exports = {
  flagBusinessesForRenewal,
  calculateMonthlyInterest,
}
