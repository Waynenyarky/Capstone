/**
 * Background Jobs
 * Scheduled tasks for account management, cleanup, and notifications
 */

const logger = require('../lib/logger')

// Import job functions
const finalizeAccountDeletions = require('./finalizeAccountDeletions')
const expireTemporaryCredentials = require('./expireTemporaryCredentials')
const cleanupOldSessions = require('./cleanupOldSessions')
const sendDeletionReminders = require('./sendDeletionReminders')
const unlockAccounts = require('./unlockAccounts')
const verifyAuditIntegrity = require('./verifyAuditIntegrity')

// Try to use node-cron, fallback to setInterval if not available
let cron = null
try {
  cron = require('node-cron')
} catch (error) {
  logger.warn('node-cron not available, using setInterval fallback')
}

const jobIntervals = []

/**
 * Schedule a job using cron or setInterval fallback
 */
function scheduleJob(cronExpression, jobFunction, description) {
  if (cron) {
    cron.schedule(cronExpression, jobFunction)
    logger.info(`Scheduled job: ${description} (cron: ${cronExpression})`)
  } else {
    // Fallback: Convert cron expression to interval (simplified)
    // For now, use setInterval with approximate timing
    let intervalMs = 60 * 60 * 1000 // Default 1 hour
    
    if (cronExpression === '*/5 * * * *') {
      intervalMs = 5 * 60 * 1000 // 5 minutes
    } else if (cronExpression === '0 * * * *') {
      intervalMs = 60 * 60 * 1000 // 1 hour
    } else if (cronExpression.startsWith('0 ') && cronExpression.includes(' * * *')) {
      intervalMs = 24 * 60 * 60 * 1000 // Daily
    }
    
    const interval = setInterval(jobFunction, intervalMs)
    jobIntervals.push(interval)
    logger.info(`Scheduled job: ${description} (interval: ${intervalMs}ms)`)
  }
}

/**
 * Initialize and start all background jobs
 */
function startJobs() {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping background jobs in test environment')
    return
  }

  logger.info('Starting background jobs...')

  // Finalize account deletions (run daily at 2 AM)
  scheduleJob('0 2 * * *', async () => {
    try {
      logger.info('Running job: finalizeAccountDeletions')
      await finalizeAccountDeletions()
    } catch (error) {
      logger.error('Error in finalizeAccountDeletions job', { error })
    }
  }, 'finalizeAccountDeletions')

  // Expire temporary credentials (run hourly)
  scheduleJob('0 * * * *', async () => {
    try {
      logger.info('Running job: expireTemporaryCredentials')
      await expireTemporaryCredentials()
    } catch (error) {
      logger.error('Error in expireTemporaryCredentials job', { error })
    }
  }, 'expireTemporaryCredentials')

  // Cleanup old sessions (run daily at 3 AM)
  scheduleJob('0 3 * * *', async () => {
    try {
      logger.info('Running job: cleanupOldSessions')
      await cleanupOldSessions()
    } catch (error) {
      logger.error('Error in cleanupOldSessions job', { error })
    }
  }, 'cleanupOldSessions')

  // Send deletion reminders (run daily at 9 AM)
  scheduleJob('0 9 * * *', async () => {
    try {
      logger.info('Running job: sendDeletionReminders')
      await sendDeletionReminders()
    } catch (error) {
      logger.error('Error in sendDeletionReminders job', { error })
    }
  }, 'sendDeletionReminders')

  // Unlock accounts (run every 5 minutes)
  scheduleJob('*/5 * * * *', async () => {
    try {
      await unlockAccounts()
    } catch (error) {
      logger.error('Error in unlockAccounts job', { error })
    }
  }, 'unlockAccounts')

  // Audit integrity verification (run hourly)
  scheduleJob('0 * * * *', async () => {
    try {
      await verifyAuditIntegrity()
    } catch (error) {
      logger.error('Error in verifyAuditIntegrity job', { error })
    }
  }, 'verifyAuditIntegrity')

  logger.info('Background jobs started successfully')
}

/**
 * Stop all background jobs (for graceful shutdown)
 */
function stopJobs() {
  logger.info('Stopping background jobs...')
  // Clear all intervals if using fallback
  jobIntervals.forEach((interval) => clearInterval(interval))
  jobIntervals.length = 0
  logger.info('Background jobs stopped')
}

module.exports = {
  startJobs,
  stopJobs,
}
