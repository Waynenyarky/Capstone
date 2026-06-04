const express = require("express");
const Inspection = require("../models/Inspection");
const Violation = require("../models/Violation");
const BusinessProfile = require("../models/BusinessProfile");
const { requireJwt, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/business/inspections
 * List inspections for the authenticated user's businesses
 */
router.get(
  "/",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        businessId,
        dateFrom,
        dateTo,
      } = req.query;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.json({
          data: [],
          meta: { page: Number(page), limit: Number(limit), total: 0 },
        });
      }

      // Collect both businessId and subdoc _id for each business so either alias matches
      const businessIds = [];
      const businessIdSet = new Set();
      for (const b of profile.businesses || []) {
        if (b.businessId) {
          businessIds.push(b.businessId);
          businessIdSet.add(b.businessId);
        }
        if (b._id) {
          const sid = String(b._id);
          businessIds.push(sid);
          businessIdSet.add(sid);
        }
      }
      if (businessIds.length === 0) {
        return res.json({
          data: [],
          meta: { page: Number(page), limit: Number(limit), total: 0 },
        });
      }

      const filter = { businessProfileId: profile._id };

      if (businessId) {
        if (!businessIdSet.has(businessId)) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Business does not belong to user",
            },
          });
        }
        // Find the matching business and query with all its aliases
        const matchedBiz = (profile.businesses || []).find(
          (b) => b.businessId === businessId || String(b._id) === businessId,
        );
        if (matchedBiz) {
          const aliases = [
            matchedBiz.businessId,
            String(matchedBiz._id),
          ].filter(Boolean);
          filter.businessId =
            aliases.length > 1 ? { $in: [...new Set(aliases)] } : aliases[0];
        } else {
          filter.businessId = businessId;
        }
      } else {
        filter.businessId = { $in: [...new Set(businessIds)] };
      }

      if (status) filter.status = status;
      if (dateFrom || dateTo) {
        filter.scheduledDate = {};
        if (dateFrom) filter.scheduledDate.$gte = new Date(dateFrom);
        if (dateTo)
          filter.scheduledDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [inspections, total] = await Promise.all([
        Inspection.find(filter)
          .populate("inspectorId", "firstName lastName")
          .populate("assignedBy", "firstName lastName")
          .sort({ scheduledDate: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Inspection.countDocuments(filter),
      ]);

      const businessMap = {};
      for (const b of profile.businesses || []) {
        const name = b.businessName || b.registeredBusinessName || "Unknown";
        if (b.businessId) businessMap[b.businessId] = name;
        if (b._id) businessMap[String(b._id)] = name;
      }

      const items = inspections.map((i) => ({
        _id: i._id,
        businessId: i.businessId,
        businessName: businessMap[i.businessId] || "Unknown",
        inspectionType: i.inspectionType,
        permitType: i.permitType,
        scheduledDate: i.scheduledDate,
        scheduledTimeWindow: i.scheduledTimeWindow,
        status: i.status,
        overallResult: i.overallResult,
        completedAt: i.completedAt,
        inspector: i.inspectorId
          ? `${i.inspectorId.firstName} ${i.inspectorId.lastName}`
          : null,
        assignedBy: i.assignedBy
          ? `${i.assignedBy.firstName} ${i.assignedBy.lastName}`
          : null,
      }));

      return res.json({
        data: items,
        meta: { page: Number(page), limit: Number(limit), total },
      });
    } catch (err) {
      console.error("GET /inspections error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to fetch inspections" },
      });
    }
  },
);

/**
 * GET /api/business/inspections/upcoming
 * List upcoming scheduled inspections for the user's businesses
 */
router.get(
  "/upcoming",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.json({ data: [] });
      }

      const businessIds = [];
      for (const b of profile.businesses || []) {
        if (b.businessId) businessIds.push(b.businessId);
        if (b._id) businessIds.push(String(b._id));
      }
      if (businessIds.length === 0) {
        return res.json({ data: [] });
      }

      const now = new Date();
      const inspections = await Inspection.find({
        businessProfileId: profile._id,
        businessId: { $in: [...new Set(businessIds)] },
        status: "pending",
        scheduledDate: { $gte: now },
      })
        .populate("inspectorId", "firstName lastName")
        .sort({ scheduledDate: 1 })
        .limit(Number(limit))
        .lean();

      const businessMap = {};
      for (const b of profile.businesses || []) {
        const name = b.businessName || b.registeredBusinessName || "Unknown";
        if (b.businessId) businessMap[b.businessId] = name;
        if (b._id) businessMap[String(b._id)] = name;
      }

      const items = inspections.map((i) => ({
        _id: i._id,
        businessId: i.businessId,
        businessName: businessMap[i.businessId] || "Unknown",
        inspectionType: i.inspectionType,
        scheduledDate: i.scheduledDate,
        scheduledTimeWindow: i.scheduledTimeWindow,
        inspector: i.inspectorId
          ? `${i.inspectorId.firstName} ${i.inspectorId.lastName}`
          : null,
      }));

      return res.json({ data: items });
    } catch (err) {
      console.error("GET /inspections/upcoming error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to fetch upcoming inspections",
        },
      });
    }
  },
);

/**
 * GET /api/business/inspections/:inspectionId
 * Get inspection details (read-only for business owner)
 */
router.get(
  "/:inspectionId",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { inspectionId } = req.params;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        businessProfileId: profile._id,
      })
        .populate("inspectorId", "firstName lastName email")
        .populate("assignedBy", "firstName lastName")
        .lean();

      if (!inspection) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Inspection not found" },
        });
      }

      const business = profile.businesses?.find(
        (b) =>
          b.businessId === inspection.businessId ||
          String(b._id) === inspection.businessId,
      );

      const violations = await Violation.find({ inspectionId })
        .populate("inspectorId", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        data: {
          ...inspection,
          businessName:
            business?.businessName ||
            business?.registeredBusinessName ||
            "Unknown",
          businessAddress: business?.businessAddress || "",
          inspectorName: inspection.inspectorId
            ? `${inspection.inspectorId.firstName} ${inspection.inspectorId.lastName}`
            : null,
          inspector: inspection.inspectorId
            ? {
                name: `${inspection.inspectorId.firstName} ${inspection.inspectorId.lastName}`,
                email: inspection.inspectorId.email,
              }
            : null,
          assignedBy: inspection.assignedBy
            ? `${inspection.assignedBy.firstName} ${inspection.assignedBy.lastName}`
            : null,
          violations,
          violationCount: violations.length,
        },
      });
    } catch (err) {
      console.error("GET /inspections/:inspectionId error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to fetch inspection" },
      });
    }
  },
);

/**
 * GET /api/business/inspections/:inspectionId/violations
 * Get violations from a specific inspection
 */
router.get(
  "/:inspectionId/violations",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { inspectionId } = req.params;

      const profile = await BusinessProfile.findOne({
        userId: req._userId,
      }).lean();
      if (!profile) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        businessProfileId: profile._id,
      }).lean();

      if (!inspection) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Inspection not found" },
        });
      }

      const violations = await Violation.find({ inspectionId })
        .populate("inspectorId", "firstName lastName")
        .sort({ issuedAt: -1 })
        .lean();

      const now = new Date();
      const enriched = violations.map((v) => ({
        ...v,
        isOverdue: v.status === "open" && new Date(v.complianceDeadline) < now,
        inspector: v.inspectorId
          ? `${v.inspectorId.firstName} ${v.inspectorId.lastName}`
          : null,
      }));

      return res.json({ data: enriched });
    } catch (err) {
      console.error("GET /inspections/:inspectionId/violations error:", err);
      return res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to fetch violations" },
      });
    }
  },
);

/**
 * POST /api/business/inspections/:inspectionId/acknowledge
 * Business owner acknowledges inspection results
 */
router.post(
  "/:inspectionId/acknowledge",
  requireJwt,
  requireRole(["business_owner"]),
  async (req, res) => {
    try {
      const { inspectionId } = req.params;

      const profile = await BusinessProfile.findOne({ userId: req._userId });
      if (!profile) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        businessProfileId: profile._id,
      });

      if (!inspection) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Inspection not found" },
        });
      }

      if (inspection.status !== "completed") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATUS",
            message: "Can only acknowledge completed inspections",
          },
        });
      }

      if (inspection.ownerAcknowledgment?.acknowledged) {
        return res.status(400).json({
          error: {
            code: "ALREADY_ACKNOWLEDGED",
            message: "Inspection has already been acknowledged",
          },
        });
      }

      inspection.ownerAcknowledgment = {
        acknowledged: true,
        timestamp: new Date(),
      };
      await inspection.save();

      return res.json({
        data: inspection,
        message: "Inspection acknowledged successfully",
      });
    } catch (err) {
      console.error("POST /inspections/:inspectionId/acknowledge error:", err);
      return res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to acknowledge inspection",
        },
      });
    }
  },
);

module.exports = router;
