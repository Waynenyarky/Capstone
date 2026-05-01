/**
 * Expire Pending Maintenance Approvals Job
 * Marks pending maintenance approvals as expired after 48 hours.
 */

const AdminApproval = require('../models/AdminApproval')
const logger = require('../lib/logger')

const EXPIRY_HOURS = 48

async function expirePendingApprovals() {
  try {
    const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000)

    const result = await AdminApproval.updateMany(
      {
        requestType: 'maintenance_mode',
        status: 'pending',
        createdAt: { $lte: cutoff },
      },
      {
        $set: { status: 'expired' },
      }
    )

    const modified = Number(result?.modifiedCount || 0)
    if (modified > 0) {
      logger.info('Expired pending maintenance approvals', {
        modified,
        cutoff: cutoff.toISOString(),
      })
    }

    return { expired: modified }
  } catch (error) {
    logger.error('Error in expirePendingApprovals job', { error })
    throw error
  }
}

module.exports = expirePendingApprovals
