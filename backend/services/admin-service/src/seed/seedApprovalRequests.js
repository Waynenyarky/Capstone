/**
 * Seed approval requests for development/testing.
 * Creates pending, approved, and rejected AdminApproval records using
 * dev users (admin@example.com, admin2@example.com, officer@example.com, etc.).
 * Uses realistic createdAt/updatedAt: pending = recent, approved/rejected = 1–4 weeks ago.
 *
 * Idempotent: uses fixed approvalIds and only inserts when missing.
 * Run when SEED_APPROVAL_REQUESTS=true or SEED_DEV=true (after auth seed has created users).
 */

const AdminApproval = require('../models/AdminApproval');
const User = require('../models/User');
const logger = require('../lib/logger');

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

const SEED_APPROVAL_IDS = {
  PENDING_1: 'SEED-PENDING-1',
  PENDING_2: 'SEED-PENDING-2',
  PENDING_3: 'SEED-PENDING-3',
  PENDING_4: 'SEED-PENDING-4',
  PENDING_MAINT_1: 'SEED-PENDING-MAINT-1',
  PENDING_MAINT_2: 'SEED-PENDING-MAINT-2',
  APPROVED_1: 'SEED-APPROVED-1',
  APPROVED_2: 'SEED-APPROVED-2',
  APPROVED_3: 'SEED-APPROVED-3',
  APPROVED_MAINT: 'SEED-APPROVED-MAINT',
  REJECTED_1: 'SEED-REJECTED-1',
  REJECTED_2: 'SEED-REJECTED-2',
  REJECTED_3: 'SEED-REJECTED-3',
  REJECTED_MAINT: 'SEED-REJECTED-MAINT',
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

    // —— Pending (recent: today / yesterday so "Active only" shows actionable work) ——
    const pendingCreated1 = hoursAgo(2);
    const pendingCreated2 = hoursAgo(24);
    const pendingCreated3 = hoursAgo(5);
    const pendingCreated4 = hoursAgo(12);

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
      createdAt: pendingCreated1,
      updatedAt: pendingCreated1,
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
      createdAt: pendingCreated2,
      updatedAt: pendingCreated2,
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
      createdAt: pendingCreated3,
      updatedAt: pendingCreated3,
    });

    // Optional: one more pending for variety (personal_info for officer)
    await ensureApproval(SEED_APPROVAL_IDS.PENDING_4, {
      requestType: 'personal_info_change',
      userId: officer._id,
      requestedBy: admin2._id,
      requestDetails: {
        newValues: { firstName: 'Larry', lastName: 'Officer', phoneNumber: '+1-555-0304' },
        oldValues: {},
      },
      status: 'pending',
      requiredApprovals: 2,
      approvals: [],
      createdAt: pendingCreated4,
      updatedAt: pendingCreated4,
    });

    // —— Maintenance_mode: 2 pending (recent), 1 approved (old), 1 rejected (old) ——
    await ensureApproval(SEED_APPROVAL_IDS.PENDING_MAINT_1, {
      requestType: 'maintenance_mode',
      userId: admin1._id,
      requestedBy: admin2._id,
      requestDetails: {
        action: 'enable',
        message: 'Database backup window tonight 22:00–23:00',
        expectedResumeAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      status: 'pending',
      requiredApprovals: 2,
      approvals: [],
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
    });
    await ensureApproval(SEED_APPROVAL_IDS.PENDING_MAINT_2, {
      requestType: 'maintenance_mode',
      userId: admin1._id,
      requestedBy: admin3._id,
      requestDetails: {
        action: 'disable',
        message: '',
      },
      status: 'pending',
      requiredApprovals: 2,
      approvals: [],
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
    });

    const approvedAt1 = daysAgo(10);
    const approvedAt2 = daysAgo(21);
    const approvedAt3 = daysAgo(14);
    const rejectedAt1 = daysAgo(7);
    const rejectedAt2 = daysAgo(25);
    const rejectedAt3 = daysAgo(18);

    // Approved (old: 1–2 weeks ago so "Include old" shows history)
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
          { adminId: admin2._id, approved: true, comment: 'Looks good.', timestamp: approvedAt1 },
          { adminId: admin3._id, approved: true, comment: '', timestamp: approvedAt1 },
        ],
        createdAt: daysAgo(11),
        updatedAt: approvedAt1,
      });
    }

    // Rejected (old)
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
          { adminId: admin1._id, approved: false, comment: 'Not justified.', timestamp: rejectedAt1 },
          { adminId: admin3._id, approved: false, comment: '', timestamp: rejectedAt1 },
        ],
        createdAt: daysAgo(8),
        updatedAt: rejectedAt1,
      });
    }

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
          { adminId: admin1._id, approved: true, comment: 'Approved.', timestamp: approvedAt2 },
          { adminId: admin3._id, approved: true, comment: '', timestamp: approvedAt2 },
        ],
        createdAt: daysAgo(22),
        updatedAt: approvedAt2,
      });

      // Approved maintenance (old) — for Maintenance page "Approved" card
      await ensureApproval(SEED_APPROVAL_IDS.APPROVED_3, {
        requestType: 'maintenance_mode',
        userId: officer._id,
        requestedBy: admin1._id,
        requestDetails: {
          action: 'enable',
          message: 'Scheduled maintenance',
          expectedResumeAt: daysAgo(13),
        },
        status: 'approved',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin2._id, approved: true, comment: '', timestamp: approvedAt3 },
          { adminId: admin3._id, approved: true, comment: 'OK for window.', timestamp: approvedAt3 },
        ],
        createdAt: daysAgo(15),
        updatedAt: approvedAt3,
      });

      // Rejected maintenance (old) — for Maintenance page "Rejected" card
      const rejectedMaintAt = daysAgo(20);
      await ensureApproval(SEED_APPROVAL_IDS.REJECTED_MAINT, {
        requestType: 'maintenance_mode',
        userId: officer._id,
        requestedBy: admin2._id,
        requestDetails: {
          action: 'enable',
          message: 'Emergency patch deployment',
        },
        status: 'rejected',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin1._id, approved: false, comment: 'Postpone to weekend.', timestamp: rejectedMaintAt },
          { adminId: admin3._id, approved: false, comment: '', timestamp: rejectedMaintAt },
        ],
        createdAt: daysAgo(21),
        updatedAt: rejectedMaintAt,
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
          { adminId: admin1._id, approved: false, comment: 'Insufficient justification.', timestamp: rejectedAt2 },
          { adminId: admin2._id, approved: false, comment: '', timestamp: rejectedAt2 },
        ],
        createdAt: daysAgo(26),
        updatedAt: rejectedAt2,
      });

      await ensureApproval(SEED_APPROVAL_IDS.REJECTED_3, {
        requestType: 'password_reset',
        userId: officer._id,
        requestedBy: admin3._id,
        requestDetails: { newValues: { passwordReset: true }, oldValues: {} },
        status: 'rejected',
        requiredApprovals: 2,
        approvals: [
          { adminId: admin1._id, approved: false, comment: 'Ask user to use forgot password.', timestamp: rejectedAt3 },
          { adminId: admin2._id, approved: false, comment: '', timestamp: rejectedAt3 },
        ],
        createdAt: daysAgo(19),
        updatedAt: rejectedAt3,
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
