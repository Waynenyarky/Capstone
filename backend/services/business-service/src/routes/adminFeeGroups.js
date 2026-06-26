const express = require("express");
const FeeGroup = require("../models/FeeGroup");
const Fee = require("../models/Fee");
const axios = require("axios");
const {
  requireJwt,
  requireRole,
  requireAdminStepUp,
} = require("../middleware/auth");
const { createAuditLog } = require("../lib/auditLogger");

const router = express.Router();

// GET /api/business/admin/fee-groups — list all fee groups (excluding drafts)
router.get("/", requireJwt, async (req, res) => {
  try {
    const { isActive, includeDrafts } = req.query;
    const filter = { isDraft: { $ne: true } };
    if (includeDrafts === "true") delete filter.isDraft;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const feeGroups = await FeeGroup.find(filter)
      .populate("fees")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: feeGroups });
  } catch (err) {
    console.error("GET /admin/fee-groups error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch fee groups",
      },
    });
  }
});

// GET /api/business/admin/fee-groups/:id — get single fee group (or draft)
router.get("/:id", requireJwt, async (req, res) => {
  try {
    const feeGroup = await FeeGroup.findById(req.params.id)
      .populate("fees")
      .lean();
    if (!feeGroup) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fee group not found",
        },
      });
    }
    return res.json({ data: feeGroup });
  } catch (err) {
    console.error("GET /admin/fee-groups/:id error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch fee group",
      },
    });
  }
});

// GET /api/business/admin/fee-groups/:id/audit — get audit history for a fee group
router.get("/:id/audit", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const feeGroup = await FeeGroup.findById(id);
    if (!feeGroup) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fee group not found",
        },
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {
      entityType: "fee_group",
      entityId: id,
    };

    // Query audit-service for logs
    const auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://localhost:3004";
    const headers = { "Content-Type": "application/json" };
    if (process.env.AUDIT_SERVICE_API_KEY)
      headers["X-API-Key"] = process.env.AUDIT_SERVICE_API_KEY;

    const params = {
      skip,
      limit: parseInt(limit),
      sort: "createdAt:-1",
    };

    // Handle complex query objects
    if (filter.eventType && Array.isArray(filter.eventType.$in)) {
      params.eventType = filter.eventType.$in[0];
    }

    const response = await axios.get(`${auditServiceUrl}/api/audit/logs`, {
      headers,
      params,
    });

    const logs = response.data.logs || [];
    const total = response.data.total || 0;
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
    console.error("GET /admin/fee-groups/:id/audit error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch audit history",
      },
    });
  }
});

// GET /api/business/admin/fee-groups/:id/draft — get draft for a fee group
router.get("/:id/draft", requireJwt, async (req, res) => {
  try {
    const draft = await FeeGroup.findOne({ draftOf: req.params.id })
      .populate("fees")
      .lean();
    return res.json({ data: draft || null });
  } catch (err) {
    console.error("GET /admin/fee-groups/:id/draft error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch draft",
      },
    });
  }
});

// POST /api/business/admin/fee-groups/:id/draft — create or update draft
router.post("/:id/draft", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, fees } = req.body;

    const originalFeeGroup = await FeeGroup.findById(id);
    if (!originalFeeGroup) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Fee group not found",
        },
      });
    }

    // Check if draft already exists
    let draft = await FeeGroup.findOne({ draftOf: id });

    if (draft) {
      // Update existing draft
      if (name !== undefined) draft.name = String(name).trim();
      if (description !== undefined) draft.description = String(description).trim();
      if (fees !== undefined) draft.fees = fees;
      await draft.save();
    } else {
      // Create new draft
      draft = new FeeGroup({
        name: name !== undefined ? String(name).trim() : originalFeeGroup.name,
        description: description !== undefined ? String(description).trim() : originalFeeGroup.description,
        fees: fees !== undefined ? fees : originalFeeGroup.fees,
        isActive: originalFeeGroup.isActive,
        isDraft: true,
        draftOf: id,
        version: originalFeeGroup.version,
        effectiveDate: originalFeeGroup.effectiveDate,
      });
      await draft.save();
    }

    return res.json({ data: draft });
  } catch (err) {
    console.error("POST /admin/fee-groups/:id/draft error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to save draft",
      },
    });
  }
});

// POST /api/business/admin/fee-groups/:id/publish — publish draft to original fee group
router.post("/:id/publish", requireJwt, requireRole(["admin"]), requireAdminStepUp, async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await FeeGroup.findOne({ draftOf: id });
    if (!draft) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Draft not found",
        },
      });
    }

    const originalFeeGroup = await FeeGroup.findById(id);
    if (!originalFeeGroup) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Original fee group not found",
        },
      });
    }

    const oldValues = {
      name: originalFeeGroup.name,
      description: originalFeeGroup.description,
      fees: originalFeeGroup.fees,
      isActive: originalFeeGroup.isActive,
      version: originalFeeGroup.version,
    };

    // Update original fee group with draft values
    originalFeeGroup.name = draft.name;
    originalFeeGroup.description = draft.description;
    originalFeeGroup.fees = draft.fees;
    originalFeeGroup.version += 1;
    originalFeeGroup.effectiveDate = new Date();

    await originalFeeGroup.save();

    // Delete the draft
    await FeeGroup.deleteOne({ _id: draft._id });

    const changes = {
      name: { from: oldValues.name, to: originalFeeGroup.name },
      description: { from: oldValues.description, to: originalFeeGroup.description },
      fees: { from: oldValues.fees, to: originalFeeGroup.fees },
    };

    createAuditLog(
      req._userId,
      "fee_group_published",
      "fee_group",
      JSON.stringify(oldValues),
      JSON.stringify({
        name: originalFeeGroup.name,
        description: originalFeeGroup.description,
        fees: originalFeeGroup.fees,
        isActive: originalFeeGroup.isActive,
        version: originalFeeGroup.version,
      }),
      "admin",
      {
        feeGroupId: String(originalFeeGroup._id),
        changes,
        version: originalFeeGroup.version,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    ).catch((err) => console.error("Failed to create audit log for fee group publish", err));

    return res.json({ data: originalFeeGroup });
  } catch (err) {
    console.error("POST /admin/fee-groups/:id/publish error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to publish draft",
      },
    });
  }
});

// POST /api/business/admin/fee-groups — create fee group
router.post(
  "/",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const { name, description, fees } = req.body;

      if (!name || !description || !fees || !Array.isArray(fees)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "name, description, and fees array are required",
          },
        });
      }

      // Validate that all fee IDs exist
      const validFees = await Fee.find({ _id: { $in: fees }, isActive: true });
      if (validFees.length !== fees.length) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "One or more fee IDs are invalid or inactive",
          },
        });
      }

      const feeGroup = await FeeGroup.create({
        name: String(name).trim(),
        description: String(description).trim(),
        fees,
        isActive: true,
        version: 1,
        effectiveDate: new Date(),
      });

      createAuditLog(
        req._userId,
        "fee_group_created",
        "fee_group",
        "",
        String(feeGroup._id),
        "admin",
        {
          feeGroupId: String(feeGroup._id),
          name: feeGroup.name,
          fees: feeGroup.fees,
          version: feeGroup.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for fee group create", err),
      );

      return res.status(201).json({ data: feeGroup });
    } catch (err) {
      console.error("POST /admin/fee-groups error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to create fee group",
        },
      });
    }
  },
);

// PUT /api/business/admin/fee-groups/:id — update fee group (creates new version)
router.put(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, fees, isActive } = req.body;

      const feeGroup = await FeeGroup.findById(id);
      if (!feeGroup) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fee group not found",
          },
        });
      }

      const oldValues = {
        name: feeGroup.name,
        description: feeGroup.description,
        fees: feeGroup.fees,
        isActive: feeGroup.isActive,
        version: feeGroup.version,
      };

      // Track changes
      const changes = {};
      if (name !== undefined && name !== feeGroup.name) {
        feeGroup.name = String(name).trim();
        changes.name = { from: oldValues.name, to: feeGroup.name };
      }
      if (description !== undefined && description !== feeGroup.description) {
        feeGroup.description = String(description).trim();
        changes.description = { from: oldValues.description, to: feeGroup.description };
      }
      if (fees !== undefined && JSON.stringify(fees) !== JSON.stringify(feeGroup.fees)) {
        // Validate that all fee IDs exist
        const validFees = await Fee.find({ _id: { $in: fees }, isActive: true });
        if (validFees.length !== fees.length) {
          return res.status(400).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "One or more fee IDs are invalid or inactive",
            },
          });
        }
        feeGroup.fees = fees;
        changes.fees = { from: oldValues.fees, to: fees };
      }
      if (isActive !== undefined && isActive !== feeGroup.isActive) {
        feeGroup.isActive = isActive;
        changes.isActive = { from: oldValues.isActive, to: feeGroup.isActive };
      }

      // Increment version if there are changes
      if (Object.keys(changes).length > 0) {
        feeGroup.version += 1;
        feeGroup.effectiveDate = new Date();
      }

      await feeGroup.save();

      createAuditLog(
        req._userId,
        "fee_group_updated",
        "fee_group",
        JSON.stringify(oldValues),
        JSON.stringify({
          name: feeGroup.name,
          description: feeGroup.description,
          fees: feeGroup.fees,
          isActive: feeGroup.isActive,
          version: feeGroup.version,
        }),
        "admin",
        {
          feeGroupId: String(feeGroup._id),
          changes,
          version: feeGroup.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for fee group update", err),
      );

      return res.json({ data: feeGroup });
    } catch (err) {
      console.error("PUT /admin/fee-groups/:id error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update fee group",
        },
      });
    }
  },
);

// DELETE /api/business/admin/fee-groups/:id — soft-disable fee group
router.delete(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const feeGroup = await FeeGroup.findById(req.params.id);
      if (!feeGroup) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fee group not found",
          },
        });
      }

      const feeGroupId = String(feeGroup._id);
      const oldValues = {
        name: feeGroup.name,
        isActive: feeGroup.isActive,
      };

      // Soft-disable instead of hard delete
      feeGroup.isActive = false;
      feeGroup.version += 1;
      feeGroup.effectiveDate = new Date();
      await feeGroup.save();

      createAuditLog(
        req._userId,
        "fee_group_disabled",
        "fee_group",
        JSON.stringify(oldValues),
        JSON.stringify({ isActive: false, version: feeGroup.version }),
        "admin",
        {
          feeGroupId,
          name: feeGroup.name,
          deactivated: true,
          version: feeGroup.version,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      ).catch((err) =>
        console.error("Failed to create audit log for fee group disable", err),
      );

      return res.json({ data: { disabled: true } });
    } catch (err) {
      console.error("DELETE /admin/fee-groups/:id error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to disable fee group",
        },
      });
    }
  },
);

module.exports = router;
