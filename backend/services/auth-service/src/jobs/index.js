/**
 * Background Jobs for Auth Service
 * Scheduled tasks for account management and cleanup
 */

const logger = require('../lib/logger')

// Import job functions
const expireTemporaryCredentials = require('./expireTemporaryCredentials')
const cleanupOldSessions = require('./cleanupOldSessions')
const unlockAccounts = require('./unlockAccounts')

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
 * Initialize and start all background jobs for Auth Service
 */
function startJobs() {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping background jobs in test environment')
    return
  }

  logger.info('Starting Auth Service background jobs...')

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

  // Unlock accounts (run every 5 minutes)
  scheduleJob('*/5 * * * *', async () => {
    try {
      await unlockAccounts()
    } catch (error) {
      logger.error('Error in unlockAccounts job', { error })
    }
  }, 'unlockAccounts')

  logger.info('Auth Service background jobs started successfully')
}

/**
 * Stop all background jobs (for graceful shutdown)
 */
function stopJobs() {
  logger.info('Stopping Auth Service background jobs...')
  jobIntervals.forEach((interval) => clearInterval(interval))
  jobIntervals.length = 0
  logger.info('Auth Service background jobs stopped')
}

module.exports = {
  startJobs,
  stopJobs,
}
