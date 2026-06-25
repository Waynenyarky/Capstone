const express = require("express");
const Fee = require("../models/Fee");
const AuditLog = require("../models/AuditLog");
const {
  requireJwt,
  requireRole,
  requireAdminStepUp,
} = require("../middleware/auth");
const { createAuditLog } = require("../lib/auditLogger");

const router = express.Router();

// GET /api/business/admin/fees — list all fees (excluding drafts)
router.get("/", requireJwt, async (req, res) => {
  try {
    const { category, isActive, includeDrafts } = req.query;
    const filter = { isDraft: { $ne: true } };
    if (includeDrafts === "true") delete filter.isDraft;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const fees = await Fee.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: fees });
  } catch (err) {
    console.error("GET /admin/fees error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch fees",
      },
    });
  }
});

// GET /api/business/admin/fees/:id — get single fee (or draft)
router.get("/:id", requireJwt, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).lean();
    if (!fee) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fee not found",
        },
      });
    }
    return res.json({ data: fee });
  } catch (err) {
    console.error("GET /admin/fees/:id error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch fee",
      },
    });
  }
});

// GET /api/business/admin/fees/:id/audit — get audit history for a fee
router.get("/:id/audit", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fee not found",
        },
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {
      entityType: "fee",
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
    console.error("GET /admin/fees/:id/audit error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch audit history",
      },
    });
  }
});

// GET /api/business/admin/fees/:id/draft — get draft for a fee
router.get("/:id/draft", requireJwt, async (req, res) => {
  try {
    const draft = await Fee.findOne({ draftOf: req.params.id }).lean();
    return res.json({ data: draft || null });
  } catch (err) {
    console.error("GET /admin/fees/:id/draft error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch draft",
      },
    });
  }
});

// POST /api/business/admin/fees/:id/draft — create or update draft
router.post("/:id/draft", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, amount, category } = req.body;

    const originalFee = await Fee.findById(id);
    if (!originalFee) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fee not found",
        },
      });
    }

    // Check if draft already exists
    let draft = await Fee.findOne({ draftOf: id });

    if (draft) {
      // Update existing draft
      if (name !== undefined) draft.name = String(name).trim();
      if (description !== undefined) draft.description = String(description).trim();
      if (amount !== undefined) draft.amount = Number(amount);
      if (category !== undefined) draft.category = category;
      await draft.save();
    } else {
      // Create new draft
      draft = new Fee({
        name: name !== undefined ? String(name).trim() : originalFee.name,
        description: description !== undefined ? String(description).trim() : originalFee.description,
        amount: amount !== undefined ? Number(amount) : originalFee.amount,
        category: category !== undefined ? category : originalFee.category,
        isActive: originalFee.isActive,
        isDraft: true,
        draftOf: id,
        version: originalFee.version,
        effectiveDate: originalFee.effectiveDate,
      });
      await draft.save();
    }

    return res.json({ data: draft });
  } catch (err) {
    console.error("POST /admin/fees/:id/draft error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to save draft",
      },
    });
  }
});

// POST /api/business/admin/fees/:id/publish — publish draft to original fee
router.post("/:id/publish", requireJwt, requireRole(["admin"]), requireAdminStepUp, async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await Fee.findOne({ draftOf: id });
    if (!draft) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Draft not found",
        },
      });
    }

    const originalFee = await Fee.findById(id);
    if (!originalFee) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Original fee not found",
        },
      });
    }

    const oldValues = {
      name: originalFee.name,
      description: originalFee.description,
      amount: originalFee.amount,
      category: originalFee.category,
      isActive: originalFee.isActive,
      version: originalFee.version,
    };

    // Update original fee with draft values
    originalFee.name = draft.name;
    originalFee.description = draft.description;
    originalFee.amount = draft.amount;
    originalFee.category = draft.category;
    originalFee.version += 1;
    originalFee.effectiveDate = new Date();

    await originalFee.save();

    // Delete the draft
    await Fee.deleteOne({ _id: draft._id });

    const changes = {
      name: { from: oldValues.name, to: originalFee.name },
      description: { from: oldValues.description, to: originalFee.description },
      amount: { from: oldValues.amount, to: originalFee.amount },
      category: { from: oldValues.category, to: originalFee.category },
    };

    createAuditLog(
      req._userId,
      "fee_published",
      "fee",
      JSON.stringify(oldValues),
      JSON.stringify({
        name: originalFee.name,
        description: originalFee.description,
        amount: originalFee.amount,
        category: originalFee.category,
        isActive: originalFee.isActive,
        version: originalFee.version,
      }),
      "admin",
      {
        feeId: String(originalFee._id),
        changes,
        version: originalFee.version,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    ).catch((err) => console.error("Failed to create audit log for fee publish", err));

    return res.json({ data: originalFee });
  } catch (err) {
    console.error("POST /admin/fees/:id/publish error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to publish draft",
      },
    });
  }
});

// POST /api/business/admin/fees — create fee
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

      const fee = await Fee.create({
        name: String(name).trim(),
        description: String(description).trim(),
        amount: Number(amount),
        category: category || "permit",
        isActive: true,
        version: 1,
        effectiveDate: new Date(),
      });

      createAuditLog(
        req._userId,
        "fee_created",
        "fee",
        "",
        String(fee._id),
        "admin",
        {
          feeId: String(fee._id),
          name: fee.name,
          amount: fee.amount,
          category: fee.category,
          version: fee.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for fee create", err),
      );

      return res.status(201).json({ data: fee });
    } catch (err) {
      console.error("POST /admin/fees error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to create fee",
        },
      });
    }
  },
);

// PUT /api/business/admin/fees/:id — update fee (creates new version)
router.put(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, amount, category, isActive } = req.body;

      const fee = await Fee.findById(id);
      if (!fee) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fee not found",
          },
        });
      }

      const oldValues = {
        name: fee.name,
        description: fee.description,
        amount: fee.amount,
        category: fee.category,
        isActive: fee.isActive,
        version: fee.version,
      };

      // Track changes
      const changes = {};
      if (name !== undefined && name !== fee.name) {
        fee.name = String(name).trim();
        changes.name = { from: oldValues.name, to: fee.name };
      }
      if (description !== undefined && description !== fee.description) {
        fee.description = String(description).trim();
        changes.description = { from: oldValues.description, to: fee.description };
      }
      if (amount !== undefined && amount !== fee.amount) {
        fee.amount = Number(amount);
        changes.amount = { from: oldValues.amount, to: fee.amount };
      }
      if (category !== undefined && category !== fee.category) {
        fee.category = category;
        changes.category = { from: oldValues.category, to: fee.category };
      }
      if (isActive !== undefined && isActive !== fee.isActive) {
        fee.isActive = isActive;
        changes.isActive = { from: oldValues.isActive, to: fee.isActive };
      }

      // Increment version if there are changes
      if (Object.keys(changes).length > 0) {
        fee.version += 1;
        fee.effectiveDate = new Date();
      }

      await fee.save();

      createAuditLog(
        req._userId,
        "fee_updated",
        "fee",
        JSON.stringify(oldValues),
        JSON.stringify({
          name: fee.name,
          description: fee.description,
          amount: fee.amount,
          category: fee.category,
          isActive: fee.isActive,
          version: fee.version,
        }),
        "admin",
        {
          feeId: String(fee._id),
          changes,
          version: fee.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for fee update", err),
      );

      return res.json({ data: fee });
    } catch (err) {
      console.error("PUT /admin/fees/:id error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update fee",
        },
      });
    }
  },
);

// DELETE /api/business/admin/fees/:id — soft-disable fee
router.delete(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const fee = await Fee.findById(req.params.id);
      if (!fee) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fee not found",
          },
        });
      }

      const feeId = String(fee._id);
      const oldValues = {
        name: fee.name,
        isActive: fee.isActive,
      };

      // Soft-disable instead of hard delete
      fee.isActive = false;
      fee.version += 1;
      fee.effectiveDate = new Date();
      await fee.save();

      createAuditLog(
        req._userId,
        "fee_disabled",
        "fee",
        JSON.stringify(oldValues),
        JSON.stringify({ isActive: false, version: fee.version }),
        "admin",
        {
          feeId,
          name: fee.name,
          deactivated: true,
          version: fee.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for fee disable", err),
      );

      return res.json({ data: { disabled: true } });
    } catch (err) {
      console.error("DELETE /admin/fees/:id error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to disable fee",
        },
      });
    }
  },
);

module.exports = router;
