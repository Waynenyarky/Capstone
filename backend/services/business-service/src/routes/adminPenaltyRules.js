const express = require("express");
const PenaltyRule = require("../models/PenaltyRule");
const {
  requireJwt,
  requireRole,
  requireAdminStepUp,
} = require("../middleware/auth");
const { createAuditLog } = require("../lib/auditLogger");

const router = express.Router();

// GET /api/business/admin/penalty-rules — list all penalty rules
router.get("/", requireJwt, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const penaltyRules = await PenaltyRule.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: penaltyRules });
  } catch (err) {
    console.error("GET /admin/penalty-rules error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch penalty rules",
      },
    });
  }
});

// GET /api/business/admin/penalty-rules/:id — get single penalty rule
router.get("/:id", requireJwt, async (req, res) => {
  try {
    const penaltyRule = await PenaltyRule.findById(req.params.id).lean();
    if (!penaltyRule) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Penalty rule not found",
        },
      });
    }
    return res.json({ data: penaltyRule });
  } catch (err) {
    console.error("GET /admin/penalty-rules/:id error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch penalty rule",
      },
    });
  }
});

// POST /api/business/admin/penalty-rules — create penalty rule
router.post(
  "/",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const { name, description, amount, category } = req.body;

      if (!name || !description || amount == null) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "name, description, and amount are required",
          },
        });
      }

      const penaltyRule = await PenaltyRule.create({
        name: String(name).trim(),
        description: String(description).trim(),
        amount: Number(amount),
        category: category || "other",
        isActive: true,
        version: 1,
        effectiveDate: new Date(),
      });

      createAuditLog(
        req._userId,
        "penalty_rule_created",
        "penalty_rule",
        "",
        String(penaltyRule._id),
        "admin",
        {
          penaltyRuleId: String(penaltyRule._id),
          name: penaltyRule.name,
          amount: penaltyRule.amount,
          category: penaltyRule.category,
          version: penaltyRule.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for penalty rule create", err),
      );

      return res.status(201).json({ data: penaltyRule });
    } catch (err) {
      console.error("POST /admin/penalty-rules error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to create penalty rule",
        },
      });
    }
  },
);

// PUT /api/business/admin/penalty-rules/:id — update penalty rule (creates new version)
router.put(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, amount, category, isActive } = req.body;

      const penaltyRule = await PenaltyRule.findById(id);
      if (!penaltyRule) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Penalty rule not found",
          },
        });
      }

      const oldValues = {
        name: penaltyRule.name,
        description: penaltyRule.description,
        amount: penaltyRule.amount,
        category: penaltyRule.category,
        isActive: penaltyRule.isActive,
        version: penaltyRule.version,
      };

      // Track changes
      const changes = {};
      if (name !== undefined && name !== penaltyRule.name) {
        penaltyRule.name = String(name).trim();
        changes.name = { from: oldValues.name, to: penaltyRule.name };
      }
      if (description !== undefined && description !== penaltyRule.description) {
        penaltyRule.description = String(description).trim();
        changes.description = { from: oldValues.description, to: penaltyRule.description };
      }
      if (amount !== undefined && amount !== penaltyRule.amount) {
        penaltyRule.amount = Number(amount);
        changes.amount = { from: oldValues.amount, to: penaltyRule.amount };
      }
      if (category !== undefined && category !== penaltyRule.category) {
        penaltyRule.category = category;
        changes.category = { from: oldValues.category, to: penaltyRule.category };
      }
      if (isActive !== undefined && isActive !== penaltyRule.isActive) {
        penaltyRule.isActive = isActive;
        changes.isActive = { from: oldValues.isActive, to: penaltyRule.isActive };
      }

      // Increment version if there are changes
      if (Object.keys(changes).length > 0) {
        penaltyRule.version += 1;
        penaltyRule.effectiveDate = new Date();
      }

      await penaltyRule.save();

      createAuditLog(
        req._userId,
        "penalty_rule_updated",
        "penalty_rule",
        JSON.stringify(oldValues),
        JSON.stringify({
          name: penaltyRule.name,
          description: penaltyRule.description,
          amount: penaltyRule.amount,
          category: penaltyRule.category,
          isActive: penaltyRule.isActive,
          version: penaltyRule.version,
        }),
        "admin",
        {
          penaltyRuleId: String(penaltyRule._id),
          changes,
          version: penaltyRule.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for penalty rule update", err),
      );

      return res.json({ data: penaltyRule });
    } catch (err) {
      console.error("PUT /admin/penalty-rules/:id error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update penalty rule",
        },
      });
    }
  },
);

// DELETE /api/business/admin/penalty-rules/:id — soft-disable penalty rule
router.delete(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const penaltyRule = await PenaltyRule.findById(req.params.id);
      if (!penaltyRule) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Penalty rule not found",
          },
        });
      }

      const penaltyRuleId = String(penaltyRule._id);
      const oldValues = {
        name: penaltyRule.name,
        isActive: penaltyRule.isActive,
      };

      // Soft-disable instead of hard delete
      penaltyRule.isActive = false;
      penaltyRule.version += 1;
      penaltyRule.effectiveDate = new Date();
      await penaltyRule.save();

      createAuditLog(
        req._userId,
        "penalty_rule_disabled",
        "penalty_rule",
        JSON.stringify(oldValues),
        JSON.stringify({ isActive: false, version: penaltyRule.version }),
        "admin",
        {
          penaltyRuleId,
          name: penaltyRule.name,
          deactivated: true,
          version: penaltyRule.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for penalty rule disable", err),
      );

      return res.json({ data: { disabled: true } });
    } catch (err) {
      console.error("DELETE /admin/penalty-rules/:id error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to disable penalty rule",
        },
      });
    }
  },
);

module.exports = router;
