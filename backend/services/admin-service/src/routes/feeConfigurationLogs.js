/**
 * GET /api/admin/fee-configuration-logs
 * Returns recent fee configuration and penalty configuration change activity.
 * Query: limit (default 20, max 500), startDate, endDate (ISO) for filtering.
 * Response: { logs: Array<{ action, resourceType?, lineOfBusiness?, user?, at, _id?, changes? }> }
 */
const express = require("express");
const { requireJwt, requireRole } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

const router = express.Router();

const FEE_AND_PENALTY_EVENT_TYPES = [
  "fee_config_created",
  "fee_config_updated",
  "fee_config_deleted",
  "regulatory_fee_config_updated",
  "penalty_config_created",
  "penalty_config_updated",
  "penalty_config_reset",
];

router.get("/", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 500);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const query = { eventType: { $in: FEE_AND_PENALTY_EVENT_TYPES } };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const rawLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const userIds = [
      ...new Set(rawLogs.map((l) => String(l.userId)).filter(Boolean)),
    ];
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select("_id email firstName lastName")
          .lean()
      : [];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const logs = rawLogs.map((log) => {
      const user = userMap.get(String(log.userId));
      const resourceType =
        log.eventType &&
        (log.eventType.startsWith("fee_config") ||
          log.eventType === "regulatory_fee_config_updated")
          ? "fee"
          : "penalty";
      const lineOfBusiness =
        (log.metadata && log.metadata.lineOfBusiness) || null;
      let changes = null;
      if (log.oldValue || log.newValue) {
        try {
          changes = {};
          if (log.oldValue)
            changes.old =
              typeof log.oldValue === "string" &&
              (log.oldValue.startsWith("{") || log.oldValue.startsWith("["))
                ? JSON.parse(log.oldValue)
                : log.oldValue;
          if (log.newValue)
            changes.new =
              typeof log.newValue === "string" &&
              (log.newValue.startsWith("{") || log.newValue.startsWith("["))
                ? JSON.parse(log.newValue)
                : log.newValue;
        } catch {
          changes = { old: log.oldValue, new: log.newValue };
        }
      }

      return {
        _id: log._id,
        id: String(log._id),
        action: log.eventType,
        resourceType,
        lineOfBusiness,
        user: user
          ? {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
        at: log.createdAt,
        changes:
          changes ||
          (log.metadata &&
            (log.metadata.changedCategories || log.metadata.configId))
            ? { ...log.metadata }
            : undefined,
      };
    });

    return res.json({ logs });
  } catch (err) {
    console.error("GET /api/admin/fee-configuration-logs error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch fee configuration logs",
      },
    });
  }
});

module.exports = router;
