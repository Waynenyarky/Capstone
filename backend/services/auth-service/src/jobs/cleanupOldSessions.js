/**
 * Cleanup Old Sessions Job
 * Removes sessions older than 30 days
 */

const Session = require('../models/Session')
const logger = require('../lib/logger')

async function cleanupOldSessions() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    // Delete sessions older than 30 days
    const result = await Session.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    })

    logger.info(`Cleaned up ${result.deletedCount} old session(s)`, { deletedCount: result.deletedCount })

    return { deleted: result.deletedCount }
  } catch (error) {
    logger.error('Error in cleanupOldSessions job', { error })
    throw error
  }
}

module.exports = cleanupOldSessions
