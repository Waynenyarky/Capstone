/**
 * Background Jobs for Audit Service
 * Scheduled tasks for audit integrity verification
 */

const logger = require('../lib/logger')

// Import job functions
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
    let intervalMs = 60 * 60 * 1000 // Default 1 hour
    
    if (cronExpression === '0 * * * *') {
      intervalMs = 60 * 60 * 1000 // 1 hour
    }
    
    const interval = setInterval(jobFunction, intervalMs)
    jobIntervals.push(interval)
    logger.info(`Scheduled job: ${description} (interval: ${intervalMs}ms)`)
  }
}

/**
 * Initialize and start all background jobs for Audit Service
 */
function startJobs() {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping background jobs in test environment')
    return
  }

  logger.info('Starting Audit Service background jobs...')

  // Audit integrity verification (run hourly)
  scheduleJob('0 * * * *', async () => {
    try {
      await verifyAuditIntegrity()
    } catch (error) {
      logger.error('Error in verifyAuditIntegrity job', { error })
    }
  }, 'verifyAuditIntegrity')

  logger.info('Audit Service background jobs started successfully')
}

/**
 * Stop all background jobs (for graceful shutdown)
 */
function stopJobs() {
  logger.info('Stopping Audit Service background jobs...')
  jobIntervals.forEach((interval) => clearInterval(interval))
  jobIntervals.length = 0
  logger.info('Audit Service background jobs stopped')
}

module.exports = {
  startJobs,
  stopJobs,
}
