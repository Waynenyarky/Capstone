/**
 * Notify admins of new tamper incidents (email + in-app).
 * Only notifies for important incidents: severity high, or (severity medium and verificationStatus tamper_detected).
 * Runs periodically; marks incidents with adminNotifiedAt to avoid duplicate notifications.
 */

const TamperIncident = require('../models/TamperIncident')
const { notifyAdminsOfTamperIncident } = require('../lib/notificationService')
const logger = require('../lib/logger')

async function runNotifyTamperIncidents() {
  try {
    const query = {
      status: 'new',
      adminNotifiedAt: null,
      $or: [
        { severity: 'high' },
        { severity: 'medium', verificationStatus: 'tamper_detected' },
        { severity: 'medium', verificationStatus: 'security_event' },
      ],
    }
    const incidents = await TamperIncident.find(query).lean()
    if (incidents.length === 0) return { notified: 0 }

    let notified = 0
    for (const incident of incidents) {
      try {
        const result = await notifyAdminsOfTamperIncident(incident)
        if (result.notified) {
          await TamperIncident.updateOne(
            { _id: incident._id },
            { $set: { adminNotifiedAt: new Date() } }
          )
          notified++
          logger.info('Tamper incident admin notification sent', {
            incidentId: String(incident._id),
            severity: incident.severity,
            verificationStatus: incident.verificationStatus,
          })
        }
      } catch (err) {
        logger.error('Failed to notify admins of tamper incident', {
          incidentId: String(incident._id),
          error: err.message,
        })
      }
    }
    return { notified }
  } catch (err) {
    logger.error('notifyTamperIncidents job error', { error: err.message })
    return { notified: 0 }
  }
}

module.exports = runNotifyTamperIncidents
