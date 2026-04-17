/**
 * Seed announcements for development/testing so the landing page shows real entries.
 *
 * Idempotent: inserts only when the announcements collection is empty.
 * Run when SEED_ANNOUNCEMENTS=true or SEED_DEV=true (after auth seed has created users).
 */

const Announcement = require('../models/Announcement');
const User = require('../models/User');
const logger = require('../lib/logger');

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seedAnnouncementsIfEmpty() {
  const enabled = process.env.SEED_ANNOUNCEMENTS === 'true' || process.env.SEED_DEV === 'true';
  if (!enabled) {
    return { seeded: false, reason: 'SEED_ANNOUNCEMENTS or SEED_DEV not set' };
  }

  try {
    const existing = await Announcement.countDocuments();
    if (existing > 0) {
      logger.info('Announcement seed: collection already has documents, skipping.');
      return { seeded: false, reason: 'already has announcements', count: existing };
    }

    const admin = await User.findOne({ email: 'admin@example.com', isActive: true }).select('_id').lean();
    if (!admin) {
      logger.info('Announcement seed: admin@example.com not found. Run auth SEED_DEV first.');
      return { seeded: false, reason: 'missing admin user' };
    }

    const entries = [
      {
        title: 'System Upgrade Notice',
        body: 'Core permit processing components were upgraded to improve stability and response time.',
        priority: 'normal',
        status: 'published',
        isActive: true,
        createdBy: admin._id,
        createdAt: hoursAgo(2),
        updatedAt: hoursAgo(2),
      },
      {
        title: 'Scheduled Maintenance Window',
        body: 'A short maintenance window is scheduled tonight from 10:00 PM to 11:00 PM local time.',
        priority: 'high',
        status: 'published',
        isActive: true,
        createdBy: admin._id,
        createdAt: hoursAgo(8),
        updatedAt: hoursAgo(8),
      },
      {
        title: 'Business Permit Reminder',
        body: 'Please ensure all required supporting documents are uploaded before final submission.',
        priority: 'normal',
        status: 'published',
        isActive: true,
        createdBy: admin._id,
        createdAt: hoursAgo(20),
        updatedAt: hoursAgo(20),
      },
    ];

    await Announcement.insertMany(entries);
    logger.info('Announcements seeded', { created: entries.length });
    return { seeded: true, created: entries.length };
  } catch (err) {
    logger.warn('Seed announcements failed', { error: err.message });
    return { seeded: false, error: err.message };
  }
}

module.exports = { seedAnnouncementsIfEmpty };
