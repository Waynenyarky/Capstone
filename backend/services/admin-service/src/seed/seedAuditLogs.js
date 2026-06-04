/**
 * Seed audit logs for development so the admin dashboard "Recent admin activity" shows data.
 * Creates a few AuditLog entries (login, admin_approval_approved, admin_approval_request, etc.)
 * with createdAt spread over the last 1–2 days.
 *
 * Idempotent: only inserts when no existing log has metadata.seed === true.
 * Run when SEED_DEV=true (after auth seed has created users).
 */

const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const logger = require("../lib/logger");
const crypto = require("crypto");

const SEED_MARKER = { seed: true };

function makeHash() {
  return `seed-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seedAuditLogsIfEmpty() {
  const enabled = process.env.SEED_DEV === "true";
  if (!enabled) {
    return { seeded: false, reason: "SEED_DEV not set" };
  }

  try {
    const existingSeed = await AuditLog.findOne({ metadata: SEED_MARKER })
      .limit(1)
      .lean();
    if (existingSeed) {
      logger.info("Audit logs seed: seed marker found, skipping.");
      return { seeded: false, reason: "already seeded" };
    }

    const admin = await User.findOne({
      email: "admin@example.com",
      isActive: true,
    })
      .select("_id")
      .lean();
    if (!admin) {
      logger.info(
        "Audit logs seed: admin@example.com not found. Run auth SEED_DEV first.",
      );
      return { seeded: false, reason: "missing admin user" };
    }

    const admin2 = await User.findOne({
      email: "admin2@example.com",
      isActive: true,
    })
      .select("_id")
      .lean();
    const userId = admin._id;
    const userId2 = admin2 ? admin2._id : userId;

    const entries = [
      { eventType: "login", role: "admin", createdAt: hoursAgo(1) },
      {
        eventType: "admin_approval_approved",
        role: "admin",
        createdAt: hoursAgo(3),
      },
      {
        eventType: "admin_approval_request",
        role: "admin",
        createdAt: hoursAgo(8),
      },
      { eventType: "login", role: "admin", createdAt: hoursAgo(12) },
      {
        eventType: "admin_approval_rejected",
        role: "admin",
        createdAt: hoursAgo(20),
      },
      {
        eventType: "profile_update",
        role: "admin",
        fieldChanged: "phoneNumber",
        createdAt: hoursAgo(28),
      },
      { eventType: "login", role: "admin", createdAt: hoursAgo(36) },
      {
        eventType: "admin_approval_approved",
        role: "admin",
        createdAt: hoursAgo(42),
      },
    ];

    for (const entry of entries) {
      const { eventType, role, fieldChanged, createdAt } = entry;
      await AuditLog.create({
        userId: Math.random() > 0.5 ? userId : userId2,
        eventType,
        role,
        fieldChanged: fieldChanged || "",
        oldValue: "",
        newValue: "",
        hash: makeHash(),
        metadata: SEED_MARKER,
        createdAt,
        updatedAt: createdAt,
      });
    }

    logger.info("Audit logs seeded", { created: entries.length });
    return { seeded: true, created: entries.length };
  } catch (err) {
    logger.warn("Seed audit logs failed", { error: err.message });
    return { seeded: false, error: err.message };
  }
}

module.exports = { seedAuditLogsIfEmpty };
