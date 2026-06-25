const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { requireJwt, requireRole } = require("../../middleware/auth");
const BusinessProfile = require("../../models/BusinessProfile");
const Inspection = require("../../models/Inspection");
const Payment = require("../../models/Payment");
const respond = require("../../middleware/respond");
const Violation = require("../../models/Violation");
const User = require("../../models/User");
const Role = require("../../models/Role");
const AuditLog = require("../../models/AuditLog");
const {
  createChecklistFromTemplate,
} = require("../../data/inspectionChecklistTemplate");
const notificationService = require("../../services/notificationService");
const { logAuditEvent } = require("../../lib/auditClient");
const { decrypt, isEncrypted } = require("../../../../../shared/lib/fieldCipher");
const { crossClaimForBusiness } = require("../../lib/crossClaimService");

// Helper: build query that matches either businessId or subdoc _id
function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || "");
  const clauses = [{ "businesses.businessId": target }];
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ "businesses._id": new mongoose.Types.ObjectId(target) });
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

// Helper: find business in profile by either businessId or subdoc _id
function findBusinessInProfile(profile, identifier) {
  if (!profile?.businesses) return { business: null, index: -1 };
  const target = String(identifier);
  const index = profile.businesses.findIndex(
    (b) => b.businessId === target || String(b._id) === target,
  );
  return { business: index >= 0 ? profile.businesses[index] : null, index };
}

/**
 * GET /api/lgu-officer/payments
 * Get all payments for officer ledger view
 */
router.get(
  "/payments",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, paymentType } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (paymentType) filter.paymentType = paymentType;

      const skip = (page - 1) * limit;
      const [payments, total] = await Promise.all([
        Payment.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Payment.countDocuments(filter),
      ]);

      return respond.success(res, 200, {
        data: payments,
        meta: { total, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/payments error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch payments");
    }
  }
);

/**
 * GET /api/lgu-officer/businesses-for-inspection
 */
router.get(
  "/businesses-for-inspection",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const businesses = await BusinessProfile.aggregate([
        { $match: { businesses: { $exists: true, $ne: [] } } },
        { $unwind: "$businesses" },
        { $match: { "businesses.applicationStatus": "approved" } },
        {
          $project: {
            businessProfileId: "$_id",
            businessId: "$businesses.businessId",
            businessName: {
              $ifNull: [
                "$businesses.registeredBusinessName",
                "$businesses.businessName",
              ],
            },
          },
        },
        { $sort: { businessName: 1 } },
        { $limit: 500 },
      ]);
      return res.json({ businesses });
    } catch (err) {
      console.error(
        "GET /api/lgu-officer/businesses-for-inspection error:",
        err,
      );
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch businesses",
      );
    }
  },
);

/**
 * GET /api/lgu-officer/inspections
 */
router.get(
  "/inspections",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const {
        status,
        inspectorId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
      } = req.query;

      const query = {};
      if (status) query.status = status;
      if (inspectorId) query.inspectorId = inspectorId;
      if (req.query.businessId) {
        const bizId = String(req.query.businessId);
        const bizClauses = [{ businessId: bizId }];
        if (mongoose.Types.ObjectId.isValid(bizId)) {
          // Also match inspections whose businessId is the subdoc _id
          bizClauses.push({ businessId: bizId });
        }
        // We also need to find inspections where the businessProfileId has this business
        // For simplicity, filter by businessId field directly (handles both alias forms)
        query.businessId = bizId;
      }
      if (dateFrom || dateTo) {
        query.scheduledDate = {};
        if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
        if (dateTo)
          query.scheduledDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await Inspection.countDocuments(query);
      const inspections = await Inspection.find(query)
        .populate("inspectorId", "firstName lastName email")
        .populate("businessProfileId", "businesses userId")
        .populate("assignedBy", "firstName lastName")
        .sort({ scheduledDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean();

      const items = inspections.map((i) => {
        const business = (i.businessProfileId?.businesses || []).find(
          (b) =>
            b.businessId === i.businessId || String(b._id) === i.businessId,
        );
        return {
          _id: i._id,
          businessName:
            business?.businessName ||
            business?.registeredBusinessName ||
            "Unknown",
          businessId: i.businessId,
          _businessSubdocId: business ? String(business._id || "") : null,
          _canonicalBusinessId: business?.businessId || "",
          businessProfileId: i.businessProfileId?._id,
          permitType: i.permitType,
          inspectionType: i.inspectionType,
          scheduledDate: i.scheduledDate,
          status: i.status,
          overallResult: i.overallResult,
          inspectorId: i.inspectorId?._id,
          inspectorName: i.inspectorId
            ? `${i.inspectorId.firstName} ${i.inspectorId.lastName}`
            : null,
          assignedById: i.assignedBy?._id ? String(i.assignedBy._id) : null,
          assignedBy: i.assignedBy
            ? `${i.assignedBy.firstName} ${i.assignedBy.lastName}`
            : null,
          assignedAt: i.assignedAt,
        };
      });

      return res.json({
        inspections: items,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/inspections error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch inspections",
      );
    }
  },
);

/**
 * POST /api/lgu-officer/inspections
 */
router.post(
  "/inspections",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const assignedBy = req._userId;
      const {
        inspectorId,
        businessProfileId,
        businessId,
        permitType,
        inspectionType,
        scheduledDate,
        parentInspectionId,
        scheduledTimeWindow,
      } = req.body;

      if (
        !inspectorId ||
        !businessProfileId ||
        !businessId ||
        !permitType ||
        !inspectionType ||
        !scheduledDate
      ) {
        return respond.error(
          res,
          400,
          "missing_fields",
          "inspectorId, businessProfileId, businessId, permitType, inspectionType, and scheduledDate are required",
        );
      }
      if (!["initial", "renewal"].includes(permitType)) {
        return respond.error(
          res,
          400,
          "invalid_permit_type",
          "permitType must be initial or renewal",
        );
      }
      if (!["initial", "renewal", "follow_up"].includes(inspectionType)) {
        return respond.error(
          res,
          400,
          "invalid_inspection_type",
          "inspectionType must be initial, renewal, or follow_up",
        );
      }

      const inspector = await User.findById(inspectorId)
        .populate("role")
        .lean();
      if (!inspector)
        return respond.error(
          res,
          404,
          "inspector_not_found",
          "Inspector not found",
        );
      const roleSlug = inspector.role?.slug || "";
      if (roleSlug !== "inspector") {
        return respond.error(
          res,
          400,
          "invalid_inspector",
          "Selected user must have inspector role",
        );
      }

      const profile = await BusinessProfile.findById(businessProfileId).lean();
      if (!profile)
        return respond.error(
          res,
          404,
          "business_not_found",
          "Business profile not found",
        );
      const business = (profile.businesses || []).find(
        (b) => b.businessId === businessId || String(b._id) === businessId,
      );
      if (!business)
        return respond.error(
          res,
          404,
          "business_unit_not_found",
          "Business unit not found",
        );

      let checklist = createChecklistFromTemplate();
      const inspectionPayload = {
        inspectorId,
        businessProfileId,
        businessId,
        permitType,
        inspectionType,
        scheduledDate: new Date(scheduledDate),
        status: "pending",
        assignedBy,
        checklist,
      };

      let carriedOverViolations = [];
      if (parentInspectionId) {
        inspectionPayload.parentInspectionId = parentInspectionId;
        const parentInspection =
          await Inspection.findById(parentInspectionId).lean();
        if (
          parentInspection &&
          parentInspection.businessProfileId?.toString() ===
            businessProfileId?.toString() &&
          parentInspection.businessId === businessId
        ) {
          const unresolvedViolations = await Violation.find({
            inspectionId: parentInspectionId,
            status: "open",
          }).lean();
          carriedOverViolations = unresolvedViolations.map((v) => ({
            violationType: v.violationType,
            description: v.description,
            severity: v.severity,
            complianceDeadline: v.complianceDeadline,
            legalBasis: v.legalBasis,
          }));
        }
      }

      if (
        scheduledTimeWindow &&
        scheduledTimeWindow.start &&
        scheduledTimeWindow.end
      ) {
        inspectionPayload.scheduledTimeWindow = {
          start: new Date(scheduledTimeWindow.start),
          end: new Date(scheduledTimeWindow.end),
        };
      }

      const inspection = await Inspection.create(inspectionPayload);
      logAuditEvent(
        "inspection_created",
        req._userId,
        "Inspection",
        inspection._id.toString(),
        { businessId: inspection.businessId },
      );

      if (carriedOverViolations.length > 0) {
        for (const v of carriedOverViolations) {
          const year = new Date().getFullYear();
          const prefix = `VIO-${year}-`;
          const last = await Violation.findOne({
            violationId: new RegExp(`^${prefix}`),
          })
            .sort({ violationId: -1 })
            .lean();
          let seq = 1;
          if (last && last.violationId) {
            const match = last.violationId.match(/-(\d+)$/);
            if (match) seq = parseInt(match[1], 10) + 1;
          }
          const violationId = `${prefix}${String(seq).padStart(3, "0")}`;
          await Violation.create({
            inspectionId: inspection._id,
            violationId,
            violationType: v.violationType,
            description: `[Carried over from re-inspection] ${v.description}`,
            severity: v.severity,
            complianceDeadline: v.complianceDeadline,
            legalBasis: v.legalBasis,
            inspectorId: inspection.inspectorId,
            status: "open",
          });
        }
      }

      const businessName =
        business.businessName || business.registeredBusinessName || "Unknown";
      const scheduledStr = new Date(scheduledDate).toLocaleDateString();
      const message = parentInspectionId
        ? `Re-inspection assigned for ${businessName}. Scheduled: ${scheduledStr}.`
        : `You have been assigned to inspect ${businessName}. Scheduled: ${scheduledStr}.`;
      try {
        await notificationService.createNotification(
          inspectorId,
          "inspection_assigned",
          "New Inspection Assigned",
          message,
          "inspection",
          String(inspection._id),
          {
            inspectionId: inspection._id,
            businessName,
            scheduledDate,
            parentInspectionId: parentInspectionId || null,
          },
        );
      } catch (notifErr) {
        console.warn(
          "Failed to create inspection_assigned notification:",
          notifErr,
        );
      }

      return res.status(201).json({ success: true, inspection });
    } catch (err) {
      console.error("POST /api/lgu-officer/inspections error:", err);
      return respond.error(
        res,
        500,
        "create_error",
        err.message || "Failed to create inspection",
      );
    }
  },
);

/**
 * GET /api/lgu-officer/inspectors
 */
router.get(
  "/inspectors",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const inspectorRole = await Role.findOne({ slug: "inspector" });
      if (!inspectorRole) return res.json({ inspectors: [] });

      const inspectors = await User.find({
        role: inspectorRole._id,
        isActive: true,
      })
        .select("_id firstName lastName email")
        .sort({ lastName: 1, firstName: 1 });

      return res.json({
        inspectors: inspectors.map((u) => ({
          _id: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          email: u.email,
        })),
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/inspectors error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch inspectors",
      );
    }
  },
);

/**
 * PUT /api/lgu-officer/inspections/:id/assign
 * Assign an inspector to an existing pending_assignment inspection
 */
router.put(
  "/inspections/:id/assign",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { inspectorId, scheduledDate } = req.body;

      if (!inspectorId || !scheduledDate) {
        return respond.error(
          res,
          400,
          "missing_fields",
          "inspectorId and scheduledDate are required",
        );
      }

      const inspection = await Inspection.findById(id);
      if (!inspection) {
        return respond.error(res, 404, "not_found", "Inspection not found");
      }
      if (inspection.status !== "pending_assignment") {
        return respond.error(
          res,
          400,
          "invalid_status",
          "Inspection is not in pending_assignment status",
        );
      }

      // Validate inspector
      const inspector = await User.findById(inspectorId)
        .populate("role")
        .lean();
      if (!inspector)
        return respond.error(
          res,
          404,
          "inspector_not_found",
          "Inspector not found",
        );
      const roleSlug = inspector.role?.slug || "";
      if (roleSlug !== "inspector") {
        return respond.error(
          res,
          400,
          "invalid_inspector",
          "Selected user must have inspector role",
        );
      }

      // Update the existing inspection
      inspection.inspectorId = inspectorId;
      inspection.scheduledDate = new Date(scheduledDate);
      inspection.status = "pending";
      inspection.assignedBy = req._userId;
      inspection.assignedAt = new Date();
      inspection.checklist = inspection.checklist?.length
        ? inspection.checklist
        : createChecklistFromTemplate();

      await inspection.save();

      logAuditEvent(
        "inspection_assigned",
        req._userId,
        "Inspection",
        inspection._id.toString(),
        {
          businessId: inspection.businessId,
          inspectorId,
        },
      );

      // Send notification to inspector
      try {
        const profile = await BusinessProfile.findById(
          inspection.businessProfileId,
        ).lean();
        const business = (profile?.businesses || []).find(
          (b) =>
            b.businessId === inspection.businessId ||
            String(b._id) === inspection.businessId,
        );
        const businessName =
          business?.businessName ||
          business?.registeredBusinessName ||
          "Unknown";
        const scheduledStr = new Date(scheduledDate).toLocaleDateString();
        await notificationService.createNotification(
          inspectorId,
          "inspection_assigned",
          "New Inspection Assigned",
          `You have been assigned to inspect ${businessName}. Scheduled: ${scheduledStr}.`,
          "inspection",
          String(inspection._id),
          { inspectionId: inspection._id, businessName, scheduledDate },
        );
      } catch (notifErr) {
        console.warn(
          "Failed to create inspection_assigned notification:",
          notifErr,
        );
      }

      return res.json({ success: true, inspection });
    } catch (err) {
      console.error("PUT /api/lgu-officer/inspections/:id/assign error:", err);
      return respond.error(
        res,
        500,
        "assign_error",
        err.message || "Failed to assign inspector",
      );
    }
  },
);

/**
 * POST /api/lgu-officer/permit-applications/:applicationId/reset-status
 * Reset application status (for testing - undo approval)
 */
router.post(
  "/permit-applications/:applicationId/reset-status",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "admin"]),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { newStatus } = req.body;

      if (!newStatus) {
        return respond.error(
          res,
          400,
          "validation_error",
          "New status is required",
        );
      }

      // Find the business profile containing this application
      const profile = await BusinessProfile.findOne({
        "businesses.applicationId": applicationId,
      });

      if (!profile) {
        // Try finding by businessId or subdoc _id
        const profileByBusinessId = await BusinessProfile.findOne(
          buildBusinessLookupQuery(applicationId),
        );

        if (!profileByBusinessId) {
          return respond.error(res, 404, "not_found", "Application not found");
        }

        const { index: businessIndex } = findBusinessInProfile(
          profileByBusinessId,
          applicationId,
        );
        if (businessIndex === -1) {
          return respond.error(res, 404, "not_found", "Business not found");
        }

        // Reset status
        profileByBusinessId.businesses[businessIndex].applicationStatus =
          newStatus;
        profileByBusinessId.businesses[businessIndex].updatedAt = new Date();

        await profileByBusinessId.save();

        return respond.success(res, 200, {
          message: "Application status reset successfully",
          application: profileByBusinessId.businesses[businessIndex],
        });
      }

      // Find the specific business
      const businessIndex = profile.businesses.findIndex(
        (b) => b.applicationId === applicationId,
      );
      if (businessIndex === -1) {
        return respond.error(
          res,
          404,
          "not_found",
          "Application not found in profile",
        );
      }

      // Reset status
      profile.businesses[businessIndex].applicationStatus = newStatus;
      profile.businesses[businessIndex].updatedAt = new Date();

      await profile.save();

      return respond.success(res, 200, {
        message: "Application status reset successfully",
        application: profile.businesses[businessIndex],
      });
    } catch (err) {
      console.error(
        "POST /api/lgu-officer/permit-applications/:applicationId/reset-status error:",
        err,
      );
      return respond.error(
        res,
        500,
        "reset_error",
        err.message || "Failed to reset application status",
      );
    }
  },
);

/**
 * PUT /api/lgu-officer/permit-applications/:applicationId/claim
 * Claim a permit application for review
 */
router.put(
  "/permit-applications/:applicationId/claim",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "admin"]),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      let profile = await BusinessProfile.findOne({
        "businesses.applicationId": applicationId,
      });

      if (!profile) {
        profile = await BusinessProfile.findOne(
          buildBusinessLookupQuery(applicationId),
        );

        if (!profile) {
          return respond.error(res, 404, "not_found", "Application not found");
        }
      }

      const businessIndex = profile.businesses.findIndex(
        (b) => b.applicationId === applicationId || String(b._id) === applicationId,
      );
      if (businessIndex === -1) {
        return respond.error(res, 404, "not_found", "Application not found in profile");
      }

      const business = profile.businesses[businessIndex];

      if (business.reviewedBy && String(business.reviewedBy) !== String(req._userId)) {
        return respond.error(res, 409, "already_claimed", "Application is already claimed by another officer");
      }

      const officer = await User.findById(req._userId).select("firstName lastName").lean();
      const officerName = officer ? `${officer.firstName} ${officer.lastName}`.trim() : (req._userEmail || "Officer");

      profile.businesses[businessIndex].reviewedBy = req._userId;
      profile.businesses[businessIndex].reviewedByName = officerName;
      profile.businesses[businessIndex].reviewedAt = new Date();
      profile.businesses[businessIndex].updatedAt = new Date();
      // Change status to under_review when claimed
      if (profile.businesses[businessIndex].applicationStatus === 'submitted') {
        profile.businesses[businessIndex].applicationStatus = 'under_review';
      }
      await profile.save();

      console.log("[PermitApplications] Attempting to log audit event for claim:", applicationId);
      logAuditEvent(
        "claim",
        req._userId,
        "BusinessProfile",
        applicationId,
        {
          claimedBy: req._userId,
          claimedByName: officerName,
          claimedAt: new Date(),
          businessId: business.businessId,
        }
      ).catch((err) => console.error("Failed to log claim audit", { error: err.message }));

      const bizId = business.businessId || String(business._id);
      await crossClaimForBusiness(bizId, req._userId, { skipModel: "PermitApplication" });

      return respond.success(res, 200, {
        message: "Application claimed successfully",
        application: profile.businesses[businessIndex],
      });
    } catch (err) {
      console.error("PUT /api/lgu-officer/permit-applications/:applicationId/claim error:", err);
      return respond.error(res, 500, "claim_failed", "Failed to claim application");
    }
  },
);

/**
 * PUT /api/lgu-officer/permit-applications/:applicationId/release
 * Release a permit application back to the pool
 */
router.put(
  "/permit-applications/:applicationId/release",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "admin"]),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      let profile = await BusinessProfile.findOne({
        "businesses.applicationId": applicationId,
      });

      if (!profile) {
        profile = await BusinessProfile.findOne(
          buildBusinessLookupQuery(applicationId),
        );

        if (!profile) {
          return respond.error(res, 404, "not_found", "Application not found");
        }
      }

      const businessIndex = profile.businesses.findIndex(
        (b) => b.applicationId === applicationId || String(b._id) === applicationId,
      );
      if (businessIndex === -1) {
        return respond.error(res, 404, "not_found", "Application not found in profile");
      }

      const business = profile.businesses[businessIndex];

      if (business.reviewedBy && String(business.reviewedBy) !== String(req._userId)) {
        const isManagerOrAdmin = req._userRole === "lgu_manager" || req._userRole === "admin";
        if (!isManagerOrAdmin) {
          return respond.error(res, 403, "not_owner", "Only the claiming officer can release this application");
        }
      }

      const officer = await User.findById(req._userId).select("firstName lastName").lean();
      const officerName = officer ? `${officer.firstName} ${officer.lastName}`.trim() : (req._userEmail || "Officer");

      profile.businesses[businessIndex].reviewedBy = null;
      profile.businesses[businessIndex].reviewedByName = "";
      profile.businesses[businessIndex].reviewedAt = null;
      profile.businesses[businessIndex].updatedAt = new Date();
      await profile.save();

      console.log("[PermitApplications] Attempting to log audit event for release:", applicationId);
      logAuditEvent(
        "release",
        req._userId,
        "BusinessProfile",
        applicationId,
        {
          releasedBy: req._userId,
          releasedByName: officerName,
          releasedAt: new Date(),
          businessId: business.businessId,
        }
      ).catch((err) => console.error("Failed to log release audit", { error: err.message }));

      const bizId = business.businessId || String(business._id);
      await crossClaimForBusiness(bizId, null, { skipModel: "PermitApplication" });

      return respond.success(res, 200, {
        message: "Application released successfully",
        application: profile.businesses[businessIndex],
      });
    } catch (err) {
      console.error("PUT /api/lgu-officer/permit-applications/:applicationId/release error:", err);
      return respond.error(res, 500, "release_failed", "Failed to release application");
    }
  },
);

/**
 * GET /api/lgu-officer/permit-applications
 * List permit applications with optional filters
 */
router.get(
  "/permit-applications",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "admin"]),
  async (req, res) => {
    try {
      // Disable caching for this endpoint
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const { status, reviewedBy, page = 1, limit = 20 } = req.query;

      const filter = {};
      if (status) {
        const statuses = status.split(",");
        filter["businesses.applicationStatus"] = { $in: statuses };
      }
      if (reviewedBy) {
        filter["businesses.reviewedBy"] = reviewedBy;
      }

      console.log("GET /api/lgu-officer/permit-applications filter:", filter);

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const profiles = await BusinessProfile.find(filter)
        .select("businesses userId")
        .lean();

      console.log("GET /api/lgu-officer/permit-applications profiles found:", profiles.length);

      // Flatten businesses from all profiles
      let applications = [];
      profiles.forEach((profile) => {
        if (profile.businesses && profile.businesses.length > 0) {
          profile.businesses.forEach((business) => {
            // Apply additional filters that couldn't be done at the profile level
            if (status && !status.split(",").includes(business.applicationStatus)) {
              return;
            }
            if (reviewedBy && String(business.reviewedBy) !== reviewedBy) {
              return;
            }
            applications.push({
              ...business,
              _id: business._id,
              businessProfileId: profile._id,
              userId: profile.userId,
            });
          });
        }
      });

      // Apply pagination
      const total = applications.length;
      const paginatedApplications = applications
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(skip, skip + parseInt(limit));

      return respond.success(res, 200, {
        applications: paginatedApplications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/permit-applications error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch permit applications");
    }
  },
);

/**
 * GET /api/lgu-officer/permit-applications/:applicationId
 * Get a single permit application by ID
 */
router.get(
  "/permit-applications/:applicationId",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "admin"]),
  async (req, res) => {
    try {
      // Disable caching for this endpoint
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const { applicationId } = req.params;

      const query = buildBusinessLookupQuery(applicationId);
      const profile = await BusinessProfile.findOne(query).lean();

      if (!profile) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      const { business, index } = findBusinessInProfile(profile, applicationId);
      if (!business) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Fetch user record for owner name as fallback
      let user = null;
      if (profile.userId) {
        try {
          user = await User.findById(profile.userId).select("firstName lastName").lean();
        } catch (err) {
          console.error("Failed to fetch user:", err);
        }
      }

      // Get owner full name with priority
      const ownerFullName =
        (profile.ownerIdentity?.fullName && profile.ownerIdentity.fullName.trim()) ||
        (business.ownerFullName && business.ownerFullName.trim()) ||
        (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "") ||
        "";

      return respond.success(res, 200, {
        ...business,
        _id: business._id,
        businessProfileId: profile._id,
        userId: profile.userId,
        ownerName: ownerFullName || "N/A",
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/permit-applications/:applicationId error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch permit application");
    }
  },
);

/**
 * GET /api/lgu-officer/permit-applications/:applicationId/audit
 * Get audit history for a permit application
 */
router.get(
  "/permit-applications/:applicationId/audit",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "admin"]),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = {
        entityType: "BusinessProfile",
        entityId: applicationId,
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

      return respond.success(res, 200, {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/permit-applications/:applicationId/audit error:", err);
      return respond.error(res, 500, "audit_fetch_failed", "Failed to fetch audit logs");
    }
  },
);

/**
 * PUT /api/lgu-officer/inspections/:id/reschedule
 * Reschedule an existing inspection to a new date/time
 */
router.put(
  "/inspections/:id/reschedule",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduledDate, scheduledTimeWindow, reason } = req.body;

      if (!scheduledDate) {
        return respond.error(
          res,
          400,
          "missing_date",
          "scheduledDate is required",
        );
      }

      const newDate = new Date(scheduledDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (newDate < now) {
        return respond.error(
          res,
          400,
          "past_date",
          "Cannot reschedule to a date in the past",
        );
      }

      const inspection = await Inspection.findById(id);
      if (!inspection) {
        return respond.error(res, 404, "not_found", "Inspection not found");
      }
      if (inspection.status === "completed") {
        return respond.error(
          res,
          400,
          "already_completed",
          "Cannot reschedule a completed inspection",
        );
      }

      const previousDate = inspection.scheduledDate;
      inspection.scheduledDate = newDate;

      if (
        scheduledTimeWindow &&
        scheduledTimeWindow.start &&
        scheduledTimeWindow.end
      ) {
        inspection.scheduledTimeWindow = {
          start: new Date(scheduledTimeWindow.start),
          end: new Date(scheduledTimeWindow.end),
        };
      }

      inspection.editHistory = inspection.editHistory || [];
      inspection.editHistory.push({
        changedAt: new Date(),
        changedBy: req._userId,
        field: "scheduledDate",
        reason:
          reason ||
          `Rescheduled from ${previousDate.toISOString().split("T")[0]} to ${newDate.toISOString().split("T")[0]}`,
      });

      await inspection.save();

      logAuditEvent(
        "inspection_rescheduled",
        req._userId,
        "Inspection",
        inspection._id.toString(),
        {
          businessId: inspection.businessId,
          previousDate,
          newDate: inspection.scheduledDate,
        },
      );

      try {
        const profile = await BusinessProfile.findById(
          inspection.businessProfileId,
        ).lean();
        const business = (profile?.businesses || []).find(
          (b) => b.businessId === inspection.businessId,
        );
        const businessName =
          business?.businessName ||
          business?.registeredBusinessName ||
          "Unknown";
        const scheduledStr = newDate.toLocaleDateString();
        await notificationService.createNotification(
          inspection.inspectorId.toString(),
          "inspection_rescheduled",
          "Inspection Rescheduled",
          `Inspection for ${businessName} has been rescheduled to ${scheduledStr}.`,
          "inspection",
          String(inspection._id),
          {
            inspectionId: inspection._id,
            businessName,
            scheduledDate: newDate,
            previousDate,
          },
        );
      } catch (notifErr) {
        console.warn(
          "Failed to create inspection_rescheduled notification:",
          notifErr,
        );
      }

      return res.json({ success: true, inspection });
    } catch (err) {
      console.error(
        "PUT /api/lgu-officer/inspections/:id/reschedule error:",
        err,
      );
      return respond.error(
        res,
        500,
        "reschedule_error",
        err.message || "Failed to reschedule inspection",
      );
    }
  },
);

/**
 * GET /api/lgu-officer/inspections/:id
 * Get full inspection detail (with checklist, evidence, violations, notes)
 */
router.get(
  "/inspections/:id",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return respond.error(res, 400, "invalid_id", "Invalid inspection ID");
      }

      const inspection = await Inspection.findById(id)
        .populate("inspectorId", "firstName lastName email")
        .populate("businessProfileId", "businesses userId")
        .populate("assignedBy", "firstName lastName")
        .lean();

      if (!inspection) {
        return respond.error(res, 404, "not_found", "Inspection not found");
      }

      const business = (inspection.businessProfileId?.businesses || []).find(
        (b) =>
          b.businessId === inspection.businessId ||
          String(b._id) === inspection.businessId,
      );

      const violations = await Violation.find({ inspectionId: id })
        .populate("inspectorId", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        inspection: {
          ...inspection,
          businessName:
            business?.businessName ||
            business?.registeredBusinessName ||
            "Unknown",
          businessAddress: business?.businessAddress || "",
          _businessSubdocId: business ? String(business._id || "") : null,
          _canonicalBusinessId: business?.businessId || "",
          inspectorName: inspection.inspectorId
            ? `${inspection.inspectorId.firstName} ${inspection.inspectorId.lastName}`
            : null,
          inspectorEmail: inspection.inspectorId?.email || null,
          assignedByName: inspection.assignedBy
            ? `${inspection.assignedBy.firstName} ${inspection.assignedBy.lastName}`
            : null,
          violations,
          violationCount: violations.length,
        },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/inspections/:id error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch inspection detail",
      );
    }
  },
);

/**
 * GET /api/lgu-officer/inspections/:id/violations
 * Get violations associated with a specific inspection
 */
router.get(
  "/inspections/:id/violations",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const violations = await Violation.find({ inspectionId: id })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ violations });
    } catch (err) {
      console.error(
        "GET /api/lgu-officer/inspections/:id/violations error:",
        err,
      );
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch violations",
      );
    }
  },
);

/**
 * GET /api/lgu-officer/violations
 * List all violations with optional filters
 */
router.get(
  "/violations",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { status, businessId, severity, page = 1, limit = 50 } = req.query;
      const query = {};
      if (status) query.status = status;
      if (businessId) query.businessId = businessId;
      if (severity) query.severity = severity;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await Violation.countDocuments(query);
      const violations = await Violation.find(query)
        .populate("inspectorId", "firstName lastName")
        .populate(
          "inspectionId",
          "businessId businessProfileId scheduledDate status",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean();

      return res.json({
        violations,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/violations error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch violations",
      );
    }
  },
);

/**
 * PUT /api/lgu-officer/violations/:id/resolve
 * Mark a violation as resolved
 */
router.put(
  "/violations/:id/resolve",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, notes } = req.body;

      const violation = await Violation.findById(id);
      if (!violation) {
        return respond.error(res, 404, "not_found", "Violation not found");
      }

      if (violation.status === "resolved") {
        return respond.error(
          res,
          400,
          "already_resolved",
          "Violation is already resolved",
        );
      }

      violation.status = "resolved";
      violation.resolution = resolution || "Resolved by officer";
      violation.resolvedAt = new Date();
      violation.resolvedBy = req._userId;
      if (notes) violation.notes = notes;
      await violation.save();

      logAuditEvent(
        "violation_resolved",
        req._userId,
        "Violation",
        violation._id.toString(),
        {
          businessId: violation.businessId,
          violationId: violation.violationId,
        },
      );

      return res.json({ success: true, violation });
    } catch (err) {
      console.error("PUT /api/lgu-officer/violations/:id/resolve error:", err);
      return respond.error(
        res,
        500,
        "resolve_error",
        err.message || "Failed to resolve violation",
      );
    }
  },
);

/**
 * GET /api/lgu-officer/owner-profile/:userId
 * Get owner profile data for LGU officers
 */
router.get(
  "/owner-profile/:userId",
  requireJwt,
  requireRole(["lgu_officer", "lgu_manager", "staff"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return respond.error(res, 400, "invalid_id", "Invalid user ID");
      }

      const user = await User.findById(userId)
        .select("firstName lastName middleName suffix email phoneNumber dateOfBirth sex maritalStatus placeOfBirth nationality highestEducationalAttainment fatherName motherName distinctiveMark address")
        .lean();

      if (!user) {
        return respond.error(res, 404, "not_found", "Owner profile not found");
      }

      // Decrypt encrypted fields
      const decryptedProfile = { ...user };
      const fieldsToDecrypt = [
        'middleName', 'placeOfBirth', 'nationality', 'fatherName', 'motherName',
        'address.street', 'address.streetAddress', 'address.barangayName', 'address.barangay',
        'address.cityName', 'address.city', 'address.provinceName', 'address.province',
        'address.postalCode', 'address.zipCode'
      ];

      fieldsToDecrypt.forEach(field => {
        const keys = field.split('.');
        let value = decryptedProfile;
        for (const key of keys) {
          if (value) value = value[key];
        }
        if (value && isEncrypted(value)) {
          try {
            const decrypted = decrypt(value);
            // Set the decrypted value back to the nested object
            if (keys.length === 1) {
              decryptedProfile[keys[0]] = decrypted;
            } else {
              let obj = decryptedProfile;
              for (let i = 0; i < keys.length - 1; i++) {
                if (!obj[keys[i]]) obj[keys[i]] = {};
                obj = obj[keys[i]];
              }
              obj[keys[keys.length - 1]] = decrypted;
            }
          } catch (err) {
            console.error(`Failed to decrypt ${field}:`, err);
          }
        }
      });

      return res.json({ success: true, profile: decryptedProfile });
    } catch (err) {
      console.error("GET /api/lgu-officer/owner-profile/:userId error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch owner profile",
      );
    }
  },
);

module.exports = router;
