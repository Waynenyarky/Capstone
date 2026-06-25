const express = require("express");
const PenaltyRule = require("../models/PenaltyRule");
const AuditLog = require("../models/AuditLog");
const {
  requireJwt,
  requireRole,
  requireAdminStepUp,
} = require("../middleware/auth");
const { createAuditLog } = require("../lib/auditLogger");

const router = express.Router();

// GET /api/business/admin/penalty-rules — list all penalty rules (excluding drafts)
router.get("/", requireJwt, async (req, res) => {
  try {
    const { category, isActive, includeDrafts } = req.query;
    const filter = { isDraft: { $ne: true } };
    if (includeDrafts === "true") delete filter.isDraft;
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

// GET /api/business/admin/penalty-rules/:id — get single penalty rule (or draft)
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

// GET /api/business/admin/penalty-rules/:id/audit — get audit history for a penalty rule
router.get("/:id/audit", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const penaltyRule = await PenaltyRule.findById(id);
    if (!penaltyRule) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Penalty rule not found",
        },
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {
      entityType: "penalty_rule",
      entityId: id,
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    return res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error("GET /admin/penalty-rules/:id/audit error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch audit history",
      },
    });
  }
});

// GET /api/business/admin/penalty-rules/:id/draft — get draft for a penalty rule
router.get("/:id/draft", requireJwt, async (req, res) => {
  try {
    const draft = await PenaltyRule.findOne({ draftOf: req.params.id }).lean();
    return res.json({ data: draft || null });
  } catch (err) {
    console.error("GET /admin/penalty-rules/:id/draft error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch draft",
      },
    });
  }
});

// POST /api/business/admin/penalty-rules/:id/draft — create or update draft
router.post("/:id/draft", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, amount, category } = req.body;

    const originalRule = await PenaltyRule.findById(id);
    if (!originalRule) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Penalty rule not found",
        },
      });
    }

    // Check if draft already exists
    let draft = await PenaltyRule.findOne({ draftOf: id });

    if (draft) {
      // Update existing draft
      if (name !== undefined) draft.name = String(name).trim();
      if (description !== undefined) draft.description = String(description).trim();
      if (amount !== undefined) draft.amount = Number(amount);
      if (category !== undefined) draft.category = category;
      await draft.save();
    } else {
      // Create new draft
      draft = new PenaltyRule({
        name: name !== undefined ? String(name).trim() : originalRule.name,
        description: description !== undefined ? String(description).trim() : originalRule.description,
        amount: amount !== undefined ? Number(amount) : originalRule.amount,
        category: category !== undefined ? category : originalRule.category,
        isActive: originalRule.isActive,
        isDraft: true,
        draftOf: id,
        version: originalRule.version,
        effectiveDate: originalRule.effectiveDate,
      });
      await draft.save();
    }

    return res.json({ data: draft });
  } catch (err) {
    console.error("POST /admin/penalty-rules/:id/draft error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to save draft",
      },
    });
  }
});

// POST /api/business/admin/penalty-rules/:id/publish — publish draft to original penalty rule
router.post("/:id/publish", requireJwt, requireRole(["admin"]), requireAdminStepUp, async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await PenaltyRule.findOne({ draftOf: id });
    if (!draft) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Draft not found",
        },
      });
    }

    const originalRule = await PenaltyRule.findById(id);
    if (!originalRule) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Original penalty rule not found",
        },
      });
    }

    const oldValues = {
      name: originalRule.name,
      description: originalRule.description,
      amount: originalRule.amount,
      category: originalRule.category,
      isActive: originalRule.isActive,
      version: originalRule.version,
    };

    // Update original rule with draft values
    originalRule.name = draft.name;
    originalRule.description = draft.description;
    originalRule.amount = draft.amount;
    originalRule.category = draft.category;
    originalRule.version += 1;
    originalRule.effectiveDate = new Date();

    await originalRule.save();

    // Delete the draft
    await PenaltyRule.deleteOne({ _id: draft._id });

    const changes = {
      name: { from: oldValues.name, to: originalRule.name },
      description: { from: oldValues.description, to: originalRule.description },
      amount: { from: oldValues.amount, to: originalRule.amount },
      category: { from: oldValues.category, to: originalRule.category },
    };

    createAuditLog(
      req._userId,
      "penalty_rule_published",
      "penalty_rule",
      JSON.stringify(oldValues),
      JSON.stringify({
        name: originalRule.name,
        description: originalRule.description,
        amount: originalRule.amount,
        category: originalRule.category,
        isActive: originalRule.isActive,
        version: originalRule.version,
      }),
      "admin",
      {
        penaltyRuleId: String(originalRule._id),
        changes,
        version: originalRule.version,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    ).catch((err) => console.error("Failed to create audit log for penalty rule publish", err));

    return res.json({ data: originalRule });
  } catch (err) {
    console.error("POST /admin/penalty-rules/:id/publish error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to publish draft",
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
