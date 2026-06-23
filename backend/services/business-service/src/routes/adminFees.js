const express = require("express");
const Fee = require("../models/Fee");
const {
  requireJwt,
  requireRole,
  requireAdminStepUp,
} = require("../middleware/auth");
const { createAuditLog } = require("../lib/auditLogger");

const router = express.Router();

// GET /api/business/admin/fees — list all fees
router.get("/", requireJwt, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
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

// GET /api/business/admin/fees/:id — get single fee
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
  requireAdminStepUp,
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
