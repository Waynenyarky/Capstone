const Violation = require('../models/Violation');
const BusinessProfile = require('../models/BusinessProfile');
const logger = require('../lib/logger');

/**
 * Check for overdue violations and escalate them
 * Runs daily at 9:00 AM
 */
async function escalateOverdueViolations() {
  try {
    logger.info('[CRON] Checking for overdue violations...');
    
    const now = new Date();
    
    // Find violations that are past deadline and still pending
    const overdueViolations = await Violation.find({
      status: { $in: ['PENDING', 'APPEALED'] },
      deadline: { $lt: now },
      'escalation.escalatedAt': { $exists: false } // Not yet escalated
    }).populate('businessId', 'businessName userId');
    
    let escalated = 0;
    
    for (const violation of overdueViolations) {
      // Calculate days overdue
      const daysOverdue = Math.floor((now - violation.deadline) / (1000 * 60 * 60 * 24));
      
      // Determine escalation level
      let escalationLevel = 'WARNING';
      let newStatus = 'ESCALATED';
      
      if (daysOverdue >= 30) {
        escalationLevel = 'CLOSURE_RECOMMENDED';
      } else if (daysOverdue >= 14) {
        escalationLevel = 'SUSPENSION_RECOMMENDED';
      } else if (daysOverdue >= 7) {
        escalationLevel = 'FINAL_NOTICE';
      } else if (daysOverdue >= 1) {
        escalationLevel = 'FIRST_NOTICE';
      }
      
      // Update violation with escalation
      violation.status = newStatus;
      violation.escalation = {
        escalatedAt: now,
        level: escalationLevel,
        daysOverdue,
        noticesSent: violation.escalation?.noticesSent || 0
      };
      
      // Add to history
      violation.enforcementActions.push({
        action: escalationLevel,
        issuedAt: now,
        issuedBy: 'SYSTEM',
        status: 'PENDING',
        notes: `Auto-escalated after ${daysOverdue} days overdue`
      });
      
      await violation.save();
      escalated++;
      
      // Send notification (mock - integrate with notification service)
      logger.info(`[CRON] Escalated violation ${violation._id} to level ${escalationLevel}`);
      
      // TODO: Send email/SMS notification to business owner
      // await notificationService.sendViolationEscalationNotice(violation);
    }
    
    logger.info(`[CRON] Escalated ${escalated} overdue violations`);
    return { escalated };
  } catch (error) {
    logger.error('[CRON] Error escalating violations:', error);
    throw error;
  }
}

/**
 * Send violation reminders before deadline
 * Runs daily at 8:00 AM
 */
async function sendViolationReminders() {
  try {
    logger.info('[CRON] Sending violation reminders...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Find violations due in 3 days
    const approachingDeadline = await Violation.find({
      status: 'PENDING',
      deadline: {
        $gte: now,
        $lte: threeDaysFromNow
      },
      'remindersSent.3day': { $exists: false } // 3-day reminder not yet sent
    }).populate('businessId', 'businessName userId');
    
    let remindersSent = 0;
    
    for (const violation of approachingDeadline) {
      // Mark reminder as sent
      if (!violation.remindersSent) violation.remindersSent = {};
      violation.remindersSent['3day'] = now;
      await violation.save();
      
      remindersSent++;
      
      // TODO: Send reminder notification
      logger.info(`[CRON] Sent 3-day reminder for violation ${violation._id}`);
    }
    
    // Also find violations due in 7 days
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const weekAway = await Violation.find({
      status: 'PENDING',
      deadline: {
        $gte: threeDaysFromNow,
        $lte: sevenDaysFromNow
      },
      'remindersSent.7day': { $exists: false }
    }).populate('businessId', 'businessName userId');
    
    for (const violation of weekAway) {
      if (!violation.remindersSent) violation.remindersSent = {};
      violation.remindersSent['7day'] = now;
      await violation.save();
      
      remindersSent++;
      logger.info(`[CRON] Sent 7-day reminder for violation ${violation._id}`);
    }
    
    logger.info(`[CRON] Sent ${remindersSent} violation reminders`);
    return { remindersSent };
  } catch (error) {
    logger.error('[CRON] Error sending violation reminders:', error);
    throw error;
  }
}

/**
 * Check for businesses with critical violations and flag them
 * Runs daily at 10:00 AM
 */
async function flagCriticalViolators() {
  try {
    logger.info('[CRON] Checking for critical violators...');
    
    // Find businesses with multiple critical violations
    const criticalViolators = await Violation.aggregate([
      {
        $match: {
          severity: 'CRITICAL',
          status: { $in: ['PENDING', 'OVERDUE', 'ESCALATED'] }
        }
      },
      {
        $group: {
          _id: '$businessId',
          criticalCount: { $sum: 1 }
        }
      },
      {
        $match: {
          criticalCount: { $gte: 2 }
        }
      }
    ]);
    
    let flagged = 0;
    
    for (const record of criticalViolators) {
      await BusinessProfile.findByIdAndUpdate(record._id, {
        complianceStatus: 'HIGH_RISK',
        lastFlaggedAt: new Date(),
        flagReason: `Multiple critical violations (${record.criticalCount})`
      });
      
      flagged++;
      logger.info(`[CRON] Flagged business ${record._id} as high risk`);
    }
    
    logger.info(`[CRON] Flagged ${flagged} businesses as high risk`);
    return { flagged };
  } catch (error) {
    logger.error('[CRON] Error flagging critical violators:', error);
    throw error;
  }
}

/**
 * Send inspection reminders 24 hours before
 * Runs every hour
 */
async function sendInspectionReminders() {
  try {
    const InspectionSlot = require('../models/InspectionSlot');
    
    logger.info('[CRON] Sending inspection reminders...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const upcomingInspections = await InspectionSlot.find({
      status: 'BOOKED',
      date: {
        $gte: tomorrow,
        $lt: dayAfter
      },
      'remindersSent.email': { $exists: false }
    }).populate('booking.businessId', 'businessName userId email')
      .populate('inspectorId', 'firstName lastName');
    
    let remindersSent = 0;
    
    for (const inspection of upcomingInspections) {
      // Mark reminder as sent
      inspection.remindersSent.push({
        type: 'EMAIL',
        sentAt: new Date(),
        status: 'SENT'
      });
      
      await inspection.save();
      remindersSent++;
      
      // TODO: Send actual email notification
      logger.info(`[CRON] Sent inspection reminder for ${inspection._id}`);
    }
    
    logger.info(`[CRON] Sent ${remindersSent} inspection reminders`);
    return { remindersSent };
  } catch (error) {
    logger.error('[CRON] Error sending inspection reminders:', error);
    throw error;
  }
}

/**
 * Cancel expired inspection bookings (no-show policy)
 * Runs daily at midnight
 */
async function cancelExpiredBookings() {
  try {
    const InspectionSlot = require('../models/InspectionSlot');
    
    logger.info('[CRON] Checking for expired inspection bookings...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const expiredBookings = await InspectionSlot.find({
      status: 'BOOKED',
      date: { $lt: yesterday },
      'completion.completedAt': { $exists: false }
    });
    
    let cancelled = 0;
    
    for (const booking of expiredBookings) {
      booking.status = 'CANCELLED';
      booking.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: 'SYSTEM',
        reason: 'No-show - inspection was not completed',
        isRescheduled: false
      };
      
      await booking.save();
      cancelled++;
      
      logger.info(`[CRON] Auto-cancelled expired booking ${booking._id}`);
    }
    
    logger.info(`[CRON] Cancelled ${cancelled} expired bookings`);
    return { cancelled };
  } catch (error) {
    logger.error('[CRON] Error cancelling expired bookings:', error);
    throw error;
  }
}

module.exports = {
  escalateOverdueViolations,
  sendViolationReminders,
  flagCriticalViolators,
  sendInspectionReminders,
  cancelExpiredBookings
};
