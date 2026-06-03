import { get, post } from '@/lib/http.js'

const BASE_PATH = '/api/admin/cron-jobs'

/**
 * Get all cron jobs
 */
export async function getCronJobs() {
  return get(BASE_PATH)
}

/**
 * Get cron job by ID
 * @param {string} jobId - Job ID
 */
export async function getCronJob(jobId) {
  return get(`${BASE_PATH}/${jobId}`)
}

/**
 * Create a new cron job
 * @param {object} jobData - Job data
 */
export async function createCronJob(jobData) {
  return post(BASE_PATH, jobData)
}

/**
 * Update a cron job
 * @param {string} jobId - Job ID
 * @param {object} jobData - Job data
 */
export async function updateCronJob(jobId, jobData) {
  return post(`${BASE_PATH}/${jobId}`, jobData)
}

/**
 * Delete a cron job
 * @param {string} jobId - Job ID
 */
export async function deleteCronJob(jobId) {
  return post(`${BASE_PATH}/${jobId}/delete`)
}

/**
 * Enable/disable a cron job
 * @param {string} jobId - Job ID
 * @param {boolean} enabled - Enable status
 */
export async function toggleCronJob(jobId, enabled) {
  return post(`${BASE_PATH}/${jobId}/toggle`, { enabled })
}

/**
 * Run a cron job manually
 * @param {string} jobId - Job ID
 */
export async function runCronJob(jobId) {
  return post(`${BASE_PATH}/${jobId}/run`)
}

/**
 * Get cron job execution history
 * @param {string} jobId - Job ID
 */
export async function getCronJobHistory(jobId) {
  return get(`${BASE_PATH}/${jobId}/history`)
}

/**
 * Get cron job statistics
 */
export async function getCronJobStats() {
  return get(`${BASE_PATH}/stats`)
}

/**
 * Get cron job logs
 * @param {string} jobId - Job ID
 * @param {object} params - Query parameters
 */
export async function getCronJobLogs(jobId, params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${BASE_PATH}/${jobId}/logs?${query}`)
}

// Constants for job types and statuses
export const CRON_JOB_TYPES = {
  BACKUP: 'backup',
  CLEANUP: 'cleanup',
  NOTIFICATION: 'notification',
  REPORT: 'report',
  SYNC: 'sync',
  MAINTENANCE: 'maintenance',
  MONITORING: 'monitoring'
}

export const CRON_JOB_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RUNNING: 'running',
  FAILED: 'failed',
  COMPLETED: 'completed'
}

export const CRON_FREQUENCIES = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  HOURLY: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  DAILY: '0 0 * * *',
  WEEKLY: '0 0 * * 0',
  MONTHLY: '0 0 1 * *',
  YEARLY: '0 0 1 1 *'
}

export const getCronJobTypeLabel = (type) => {
  const labels = {
    [CRON_JOB_TYPES.BACKUP]: 'Backup',
    [CRON_JOB_TYPES.CLEANUP]: 'Cleanup',
    [CRON_JOB_TYPES.NOTIFICATION]: 'Notification',
    [CRON_JOB_TYPES.REPORT]: 'Report',
    [CRON_JOB_TYPES.SYNC]: 'Sync',
    [CRON_JOB_TYPES.MAINTENANCE]: 'Maintenance',
    [CRON_JOB_TYPES.MONITORING]: 'Monitoring'
  }
  return labels[type] || type
}

export const getCronJobStatusLabel = (status) => {
  const labels = {
    [CRON_JOB_STATUSES.ACTIVE]: 'Active',
    [CRON_JOB_STATUSES.INACTIVE]: 'Inactive',
    [CRON_JOB_STATUSES.RUNNING]: 'Running',
    [CRON_JOB_STATUSES.FAILED]: 'Failed',
    [CRON_JOB_STATUSES.COMPLETED]: 'Completed'
  }
  return labels[status] || status
}

export const getCronFrequencyLabel = (frequency) => {
  const labels = {
    [CRON_FREQUENCIES.EVERY_MINUTE]: 'Every Minute',
    [CRON_FREQUENCIES.EVERY_5_MINUTES]: 'Every 5 Minutes',
    [CRON_FREQUENCIES.EVERY_15_MINUTES]: 'Every 15 Minutes',
    [CRON_FREQUENCIES.EVERY_30_MINUTES]: 'Every 30 Minutes',
    [CRON_FREQUENCIES.HOURLY]: 'Hourly',
    [CRON_FREQUENCIES.EVERY_2_HOURS]: 'Every 2 Hours',
    [CRON_FREQUENCIES.EVERY_6_HOURS]: 'Every 6 Hours',
    [CRON_FREQUENCIES.DAILY]: 'Daily',
    [CRON_FREQUENCIES.WEEKLY]: 'Weekly',
    [CRON_FREQUENCIES.MONTHLY]: 'Monthly',
    [CRON_FREQUENCIES.YEARLY]: 'Yearly'
  }
  return labels[frequency] || frequency
}
