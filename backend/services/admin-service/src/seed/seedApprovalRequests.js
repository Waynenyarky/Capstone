/**
 * Seed approval requests for development/testing.
 * Creates pending, approved, and rejected AdminApproval records using
 * dev users (admin@example.com, admin2@example.com, officer@example.com, etc.).
 *
 * Idempotent: uses fixed approvalIds and only inserts when missing.
 * Run when SEED_APPROVAL_REQUESTS=true or SEED_DEV=true (after auth seed has created users).
 */

const AdminApproval = require('../models/AdminApproval');
const User = require('../models/User');
const logger = require('../lib/logger');

const SEED_APPROVAL_IDS = {
  PENDING_1: 'SEED-PENDING-1',
  PENDING_2: 'SEED-PENDING-2',
  PENDING_3: 'SEED-PENDING-3',
  APPROVED_1: 'SEED-APPROVED-1',
  APPROVED_2: 'SEED-APPROVED-2',
  APPROVED_3: 'SEED-APPROVED-3',
  REJECTED_1: 'SEED-REJECTED-1',
  REJECTED_2: 'SEED-REJECTED-2',
  REJECTED_3: 'SEED-REJECTED-3',
};

async function seedApprovalRequestsIfEmpty() {
  const enabled = process.env.SEED_APPROVAL_REQUESTS === 'true' || process.env.SEED_DEV === 'true';
  if (!enabled) {
    return { seeded: false, reason: 'SEED_APPROVAL_REQUESTS or SEED_DEV not set' };
  }

  try {
    const admins = await User.find({ email: { $in: ['admin@example.com', 'admin2@example.com', 'admin3@example.com'] } })
      .select('_id email firstName lastName')
      .lean();
    const staff = await User.find({ email: { $in: ['officer@example.com', 'inspector@example.com'] } })
      .select('_id email firstName lastName')
      .lean();

    if (admins.length < 2 || staff.length < 1) {
      logger.info('Seed approval requests: need at least 2 admins and 1 staff (e.g. officer@example.com). Run auth SEED_DEV first.');
      return { seeded: false, reason: 'missing users' };
    }

    const [admin1, admin2, admin3] = admins;
    const [officer, inspector] = staff;

    let created = 0;

    const ensureApproval = async (approvalId, doc) => {
      const existing = await AdminApproval.findOne({ approvalId });
      if (existing) return;
      await AdminApproval.create({ approvalId, ...doc });
      created++;
    };

    // Pending: admin1 requests personal_info_change for officer
    await ensureApproval(SEED_APPROVAL_IDS.PENDING_1, {
      requestType: 'personal_info_change',
      userId: officer._id,
      requestedBy: admin1._id,
      requestDetails: {
        newValues: { firstName: 'Larry', lastName: 'Officer Updated', phoneNumber: '+1-555-0303' },
        oldValues: {},
      },
      status: 'pending',
      requiredApprovals: 2,
      approvals: [],
    });

    // Pending: admin2 requests role_change for inspector
    await ensureApproval(SEED_APPROVAL_IDS.PENDING_2, {
      requestType: 'role_change',
      userId: inspector._id,
      requestedBy: admin2._id,
      requestDetails: {
        newValues: { role: 'lgu_manager' },
        oldValues: { role: 'inspector' },
      },
      status: 'pending',
      requiredApprovals: 2,
      approvals: [],
    });

    // Pending: admin1 requests password_reset for inspector
    await ensureApproval(SEED_APPROVAL_IDS.PENDING_3, {
      requestType: 'password_reset',
      userId: inspector._id,
      requestedBy: admin1._id,
      requestDetails: { newValues: { passwordReset: true }, oldValues: {} },
      status: 'pending',
      requiredApprovals: 2,
      approvals: [],
    });

    // Approved: admin1 requested personal_info for officer, admin2 & admin3 approved
    if (admin2 && admin3 && officer) {
      await ensureApproval(SEED_APPROVAL_IDS.APPROVED_1, {
        requestType: 'email_change',
        userId: officer._id,
        requestedBy: admin1._id,
        requestDetails: {
          newValues: { email: 'officer.updated@example.com' },
          oldValues: { email: 'officer@example.com' },
        },
        status: 'approved',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin2._id, approved: true, comment: 'Looks good.', timestamp: new Date() },
          { adminId: admin3._id, approved: true, comment: '', timestamp: new Date() },
        ],
      });
    }

    // Rejected: admin2 requested account_status_change for officer, admin1 & admin3 rejected
    if (admin1 && admin3 && officer) {
      await ensureApproval(SEED_APPROVAL_IDS.REJECTED_1, {
        requestType: 'account_status_change',
        userId: officer._id,
        requestedBy: admin2._id,
        requestDetails: {
          newValues: { isActive: false },
          oldValues: { isActive: true },
        },
        status: 'rejected',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin1._id, approved: false, comment: 'Not justified.', timestamp: new Date() },
          { adminId: admin3._id, approved: false, comment: '', timestamp: new Date() },
        ],
      });
    }

    // Additional approved (old)
    if (admin1 && admin2 && admin3 && inspector) {
      await ensureApproval(SEED_APPROVAL_IDS.APPROVED_2, {
        requestType: 'personal_info_change',
        userId: inspector._id,
        requestedBy: admin2._id,
        requestDetails: {
          newValues: { firstName: 'Ian', lastName: 'Inspector', phoneNumber: '+1-555-0505' },
          oldValues: {},
        },
        status: 'approved',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin1._id, approved: true, comment: 'Approved.', timestamp: new Date() },
          { adminId: admin3._id, approved: true, comment: '', timestamp: new Date() },
        ],
      });

      await ensureApproval(SEED_APPROVAL_IDS.APPROVED_3, {
        requestType: 'maintenance_mode',
        userId: officer._id,
        requestedBy: admin1._id,
        requestDetails: {
          newValues: { enabled: true, message: 'Scheduled maintenance' },
          oldValues: {},
        },
        status: 'approved',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin2._id, approved: true, comment: '', timestamp: new Date() },
          { adminId: admin3._id, approved: true, comment: 'OK for window.', timestamp: new Date() },
        ],
      });
    }

    // Additional rejected (old)
    if (admin1 && admin2 && admin3 && inspector) {
      await ensureApproval(SEED_APPROVAL_IDS.REJECTED_2, {
        requestType: 'role_change',
        userId: inspector._id,
        requestedBy: admin3._id,
        requestDetails: {
          newValues: { role: 'admin' },
          oldValues: { role: 'inspector' },
        },
        status: 'rejected',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin1._id, approved: false, comment: 'Insufficient justification.', timestamp: new Date() },
          { adminId: admin2._id, approved: false, comment: '', timestamp: new Date() },
        ],
      });

      await ensureApproval(SEED_APPROVAL_IDS.REJECTED_3, {
        requestType: 'password_reset',
        userId: officer._id,
        requestedBy: admin3._id,
        requestDetails: { newValues: { passwordReset: true }, oldValues: {} },
        status: 'rejected',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin1._id, approved: false, comment: 'Ask user to use forgot password.', timestamp: new Date() },
          { adminId: admin2._id, approved: false, comment: '', timestamp: new Date() },
        ],
      });
    }

    if (created > 0) {
      logger.info('Seed approval requests completed', { created });
    }
    return { seeded: created > 0, created };
  } catch (err) {
    logger.warn('Seed approval requests failed', { error: err.message });
    return { seeded: false, error: err.message };
  }
}

module.exports = { seedApprovalRequestsIfEmpty, SEED_APPROVAL_IDS };
