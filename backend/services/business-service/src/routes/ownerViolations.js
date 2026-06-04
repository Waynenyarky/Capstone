const express = require("express");
const Violation = require("../models/Violation");
const Inspection = require("../models/Inspection");
const BusinessProfile = require("../models/BusinessProfile");
const { requireJwt, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/business/violations
 * List all violations for the authenticated user's businesses
 */
router.get(
  "/",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, severity, businessId } = req.query;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.json({
          data: [],
          meta: { page: Number(page), limit: Number(limit), total: 0 },
        });
      }

      const businessIds = profile.businesses?.map((b) => b.businessId) || [];
      if (businessIds.length === 0) {
        return res.json({
          data: [],
          meta: { page: Number(page), limit: Number(limit), total: 0 },
        });
      }

      const inspectionFilter = { businessProfileId: profile._id };
      if (businessId) {
        if (!businessIds.includes(businessId)) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Business does not belong to user",
            },
          });
        }
        inspectionFilter.businessId = businessId;
      } else {
        inspectionFilter.businessId = { $in: businessIds };
      }

      const inspections = await Inspection.find(inspectionFilter)
        .select("_id businessId")
        .lean();
      const inspectionIds = inspections.map((i) => i._id);
      const inspectionBusinessMap = {};
      for (const i of inspections) {
        inspectionBusinessMap[i._id.toString()] = i.businessId;
      }

      if (inspectionIds.length === 0) {
        return res.json({
          data: [],
          meta: { page: Number(page), limit: Number(limit), total: 0 },
        });
      }

      const filter = { inspectionId: { $in: inspectionIds } };
      if (status) filter.status = status;
      if (severity) filter.severity = severity;

      const skip = (Number(page) - 1) * Number(limit);
      const [violations, total] = await Promise.all([
        Violation.find(filter)
          .populate("inspectorId", "firstName lastName")
          .sort({ issuedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Violation.countDocuments(filter),
      ]);

      const businessMap = {};
      for (const b of profile.businesses || []) {
        businessMap[b.businessId] =
          b.businessName || b.registeredBusinessName || "Unknown";
      }

      const now = new Date();
      const enriched = violations.map((v) => {
        const bizId = inspectionBusinessMap[v.inspectionId.toString()];
        return {
          ...v,
          businessId: bizId,
          businessName: businessMap[bizId] || "Unknown",
          isOverdue:
            v.status === "open" && new Date(v.complianceDeadline) < now,
          inspector: v.inspectorId
            ? `${v.inspectorId.firstName} ${v.inspectorId.lastName}`
            : null,
        };
      });

      return res.json({
        data: enriched,
        meta: { page: Number(page), limit: Number(limit), total },
      });
    } catch (err) {
      console.error("GET /violations error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to fetch violations" },
      });
    }
  },
);

/**
 * GET /api/business/violations/open
 * List open violations requiring action
 */
router.get(
  "/open",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.json({ data: [] });
      }

      const businessIds = profile.businesses?.map((b) => b.businessId) || [];
      if (businessIds.length === 0) {
        return res.json({ data: [] });
      }

      const inspections = await Inspection.find({
        businessProfileId: profile._id,
        businessId: { $in: businessIds },
      })
        .select("_id businessId")
        .lean();

      const inspectionIds = inspections.map((i) => i._id);
      const inspectionBusinessMap = {};
      for (const i of inspections) {
        inspectionBusinessMap[i._id.toString()] = i.businessId;
      }

      if (inspectionIds.length === 0) {
        return res.json({ data: [] });
      }

      const violations = await Violation.find({
        inspectionId: { $in: inspectionIds },
        status: "open",
      })
        .populate("inspectorId", "firstName lastName")
        .sort({ complianceDeadline: 1 })
        .limit(Number(limit))
        .lean();

      const businessMap = {};
      for (const b of profile.businesses || []) {
        businessMap[b.businessId] =
          b.businessName || b.registeredBusinessName || "Unknown";
      }

      const now = new Date();
      const enriched = violations.map((v) => {
        const bizId = inspectionBusinessMap[v.inspectionId.toString()];
        return {
          ...v,
          businessId: bizId,
          businessName: businessMap[bizId] || "Unknown",
          isOverdue: new Date(v.complianceDeadline) < now,
          daysUntilDeadline: Math.ceil(
            (new Date(v.complianceDeadline) - now) / (1000 * 60 * 60 * 24),
          ),
          inspector: v.inspectorId
            ? `${v.inspectorId.firstName} ${v.inspectorId.lastName}`
            : null,
        };
      });

      return res.json({ data: enriched });
    } catch (err) {
      console.error("GET /violations/open error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to fetch open violations" },
      });
    }
  },
);

/**
 * GET /api/business/violations/summary
 * Get violation summary/counts for dashboard
 */
router.get(
  "/summary",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.json({
          data: {
            total: 0,
            open: 0,
            resolved: 0,
            appealed: 0,
            overdue: 0,
            bySeverity: { minor: 0, major: 0, critical: 0 },
          },
        });
      }

      const businessIds = profile.businesses?.map((b) => b.businessId) || [];
      if (businessIds.length === 0) {
        return res.json({
          data: {
            total: 0,
            open: 0,
            resolved: 0,
            appealed: 0,
            overdue: 0,
            bySeverity: { minor: 0, major: 0, critical: 0 },
          },
        });
      }

      const inspections = await Inspection.find({
        businessProfileId: profile._id,
        businessId: { $in: businessIds },
      })
        .select("_id")
        .lean();

      const inspectionIds = inspections.map((i) => i._id);

      if (inspectionIds.length === 0) {
        return res.json({
          data: {
            total: 0,
            open: 0,
            resolved: 0,
            appealed: 0,
            overdue: 0,
            bySeverity: { minor: 0, major: 0, critical: 0 },
          },
        });
      }

      const now = new Date();
      const [total, open, resolved, appealed, overdue, minor, major, critical] =
        await Promise.all([
          Violation.countDocuments({ inspectionId: { $in: inspectionIds } }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            status: "open",
          }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            status: "resolved",
          }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            status: "appealed",
          }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            status: "open",
            complianceDeadline: { $lt: now },
          }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            severity: "minor",
          }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            severity: "major",
          }),
          Violation.countDocuments({
            inspectionId: { $in: inspectionIds },
            severity: "critical",
          }),
        ]);

      return res.json({
        data: {
          total,
          open,
          resolved,
          appealed,
          overdue,
          bySeverity: { minor, major, critical },
        },
      });
    } catch (err) {
      console.error("GET /violations/summary error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to fetch violation summary",
        },
      });
    }
  },
);

/**
 * GET /api/business/violations/:violationId
 * Get violation details
 */
router.get(
  "/:violationId",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { violationId } = req.params;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
      }

      const violation = await Violation.findOne({ violationId })
        .populate("inspectorId", "firstName lastName email")
        .lean();

      if (!violation) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Violation not found" },
        });
      }

      const inspection = await Inspection.findOne({
        _id: violation.inspectionId,
        businessProfileId: profile._id,
      }).lean();

      if (!inspection) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Violation does not belong to user",
          },
        });
      }

      const business = profile.businesses?.find(
        (b) => b.businessId === inspection.businessId,
      );

      const now = new Date();
      return res.json({
        data: {
          ...violation,
          businessId: inspection.businessId,
          businessName:
            business?.businessName ||
            business?.registeredBusinessName ||
            "Unknown",
          inspectionDate: inspection.scheduledDate,
          isOverdue:
            violation.status === "open" &&
            new Date(violation.complianceDeadline) < now,
          daysUntilDeadline: Math.ceil(
            (new Date(violation.complianceDeadline) - now) /
              (1000 * 60 * 60 * 24),
          ),
          inspector: violation.inspectorId
            ? {
                name: `${violation.inspectorId.firstName} ${violation.inspectorId.lastName}`,
                email: violation.inspectorId.email,
              }
            : null,
        },
      });
    } catch (err) {
      console.error("GET /violations/:violationId error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to fetch violation" },
      });
    }
  },
);

/**
 * POST /api/business/violations/:violationId/acknowledge
 * Business owner acknowledges receipt of violation notice
 */
router.post(
  "/:violationId/acknowledge",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { violationId } = req.params;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
      }

      const violation = await Violation.findOne({ violationId });
      if (!violation) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Violation not found" },
        });
      }

      const inspection = await Inspection.findOne({
        _id: violation.inspectionId,
        businessProfileId: profile._id,
      }).lean();

      if (!inspection) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Violation does not belong to user",
          },
        });
      }

      if (violation.acknowledgedAt) {
        return res.status(400).json({
          error: {
            code: "ALREADY_ACKNOWLEDGED",
            message: "Violation has already been acknowledged",
          },
        });
      }

      violation.acknowledgedAt = new Date();
      violation.acknowledgedBy = req._userId;
      await violation.save();

      return res.json({
        data: violation,
        message: "Violation acknowledged successfully",
      });
    } catch (err) {
      console.error("POST /violations/:violationId/acknowledge error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to acknowledge violation" },
      });
    }
  },
);

module.exports = router;
