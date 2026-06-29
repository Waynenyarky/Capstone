const express = require("express");
const router = express.Router();
const { requireJwt, requireRole } = require("../../middleware/auth");
const Application = require("../../models/Application");
const Business = require("../../models/Business");
const BusinessProfile = require("../../models/BusinessProfile");
const User = require("../../models/User");
const respond = require("../../middleware/respond");
const { logAuditEvent } = require("../../lib/auditClient");

/**
 * POST /api/lgu-officer/permit-applications/:id/start-review
 * Claim an application for review
 */
router.post(
  "/permit-applications/:id/start-review",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const { businessId } = req.body;
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (application.reviewedBy) {
        return respond.error(res, 400, "already_claimed", "Application already claimed");
      }

      // Fetch officer name
      const officer = await User.findById(officerId)
        .select("firstName lastName");
      const officerName = officer
        ? `${officer.firstName} ${officer.lastName}`.trim()
        : "Officer";

      application.reviewedBy = officerId;
      application.reviewedByName = officerName;
      application.applicationStatus = "under_review";
      application.reviewedAt = new Date();

      // Add to reviewers array if not already present
      if (!application.reviewers) {
        application.reviewers = [];
      }
      const alreadyInReviewers = application.reviewers.some(
        r => String(r.officerId) === String(officerId)
      );
      if (!alreadyInReviewers) {
        application.reviewers.push({
          officerId: officerId,
          officerName: officerName,
        });
      }

      await application.save();

      return respond.success(res, 200, {
        application,
        lockedByOfficer: true
      });
    } catch (err) {
      console.error("POST /api/lgu-officer/permit-applications/:id/start-review error:", err);
      return respond.error(res, 500, "claim_error", "Failed to claim application");
    }
  }
);

/**
 * POST /api/lgu-officer/permit-applications/:id/review
 * Review and approve/reject an application
 */
router.post(
  "/permit-applications/:id/review",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const { decision, comments, rejectionReason, businessId } = req.body;
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (String(application.reviewedBy) !== String(officerId)) {
        return respond.error(res, 403, "forbidden", "You can only review your own claimed applications");
      }

      if (decision === "approve") {
        // Generate business ID
        const generatedBusinessId = `BIZ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

        // Get BusinessProfile
        const businessProfile = await BusinessProfile.findOne({ userId: application.userId });
        if (!businessProfile) {
          return respond.error(res, 404, "profile_not_found", "Business profile not found");
        }

        // Create Business from approved application
        // Extract business name from various possible field keys (different form types use different keys)
        const businessName = application.formData?.businessName ||
                           application.formData?.registeredBusinessName ||
                           application.formData?.activityName ||
                           application.formData?.['Business / trade name'] ||
                           application.formData?.businessTradeName ||
                           "Unnamed Business";

        const business = await Business.create({
          businessId: generatedBusinessId,
          userId: application.userId,
          ownerProfileId: businessProfile._id,
          approvedApplicationId: application._id,
          businessName,
          registeredBusinessName: application.formData?.registeredBusinessName || "",
          businessStatus: "active",
          registrationStatus: "proposed",
          location: application.formData?.location || {},
          businessType: application.formData?.businessType,
          registrationAgency: application.formData?.registrationAgency,
          businessRegistrationNumber: application.formData?.businessRegistrationNumber || "",
          businessStartDate: application.formData?.businessStartDate,
          numberOfBranches: application.formData?.numberOfBranches || 0,
          industryClassification: application.formData?.industryClassification || "",
          taxIdentificationNumber: application.formData?.taxIdentificationNumber || "",
          contactNumber: application.formData?.contactNumber || "",
          riskProfile: application.formData?.riskProfile || {},
        });

        // Update application with business reference
        application.businessId = business._id;
        application.applicationStatus = "approved";
        application.reviewedAt = new Date();
        application.reviewComments = comments;
        await application.save();

        return respond.success(res, 200, { application, business });
      } else if (decision === "reject") {
        application.applicationStatus = "rejected";
        application.rejectionReason = rejectionReason;
        if (!application.originalRejectionReason) {
          application.originalRejectionReason = rejectionReason;
        }
        application.reviewComments = comments;
        application.reviewedAt = new Date();
        await application.save();

        return respond.success(res, 200, { application });
      } else if (decision === "request_changes") {
        application.applicationStatus = "needs_revision";
        application.reviewComments = comments;
        application.reviewedAt = new Date();
        await application.save();

        return respond.success(res, 200, { application });
      } else {
        return respond.error(res, 400, "invalid_decision", "Invalid decision");
      }
    } catch (err) {
      console.error("POST /api/lgu-officer/permit-applications/:id/review error:", err);
      return respond.error(res, 500, "review_error", "Failed to review application");
    }
  }
);

/**
 * GET /api/lgu-officer/permit-applications
 * Get permit applications with filters (includes both Application and GeneralPermit)
 */
router.get(
  "/permit-applications",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { status, reviewedBy, page = 1, limit = 50 } = req.query;

      const filter = {};
      if (status) {
        // Support comma-separated statuses (e.g. "pending_renewal,renewal_submitted")
        const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
        filter.applicationStatus =
          statuses.length > 1 ? { $in: statuses } : statuses[0];
      } else {
        // Default: show all SUBMITTED applications regardless of status (exclude drafts)
        filter.applicationStatus = { $ne: "draft" };
      }

      if (reviewedBy) filter.reviewedBy = reviewedBy;

      // Get applications from Application collection
      const applications = await Application.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Application.countDocuments(filter);

      // Also get GeneralPermit documents (temporary permits)
      const GeneralPermit = require("../../models/GeneralPermit");
      const permitFilter = {};
      if (status) {
        const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
        permitFilter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
      } else {
        permitFilter.status = { $ne: "draft" };
      }

      const generalPermits = await GeneralPermit.find(permitFilter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const permitTotal = await GeneralPermit.countDocuments(permitFilter);

      // Merge results and add formType to distinguish
      const mergedApplications = [
        ...applications.map(app => ({ ...app.toObject(), formType: app.formType || "permit" })),
        ...generalPermits.map(permit => ({
          ...permit.toObject(),
          formType: "general_permit",
          applicationStatus: permit.status,
          userId: permit.applicantId,
          businessName: permit.permitCategory,
          formData: {
            permitCategory: permit.permitCategory,
            businessPlateNo: permit.businessPlateNo,
            requirements: permit.requirements,
          },
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return respond.success(res, 200, {
        applications: mergedApplications,
        meta: {
          total: total + permitTotal,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((total + permitTotal) / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error("GET /api/lgu-officer/permit-applications error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch applications");
    }
  }
);

/**
 * GET /api/lgu-officer/permit-applications/:id
 * Get single application by ID (includes GeneralPermit)
 */
router.get(
  "/permit-applications/:id",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      // First check Application collection (for draft/submitted applications)
      let doc = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!doc) {
        doc = await Business.findOne({
          $or: [{ businessId: req.params.id }, { _id: req.params.id }],
        });
      }

      // If not found in Business, check GeneralPermit collection (for temporary permits)
      if (!doc) {
        const GeneralPermit = require("../../models/GeneralPermit");
        doc = await GeneralPermit.findOne({ _id: req.params.id });
      }

      if (!doc) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Convert to plain object so we can enrich with ownerName
      const application = doc.toObject ? doc.toObject() : doc;

      // Handle GeneralPermit-specific field mapping
      if (doc.constructor.modelName === "GeneralPermit") {
        application.formType = "general_permit";
        application.applicationStatus = application.status;
        application.userId = application.applicantId;
        application.businessName = application.permitCategory;
        application.category = application.permitCategory;
        application.formData = {
          permitCategory: application.permitCategory,
          businessPlateNo: application.businessPlateNo,
          requirements: application.requirements,
        };
      }

      // Enrich with owner's full name (frontend reads application.ownerName)
      const ownerId = application.userId || application.ownerId || application.applicantId;
      if (ownerId) {
        try {
          const owner = await User.findById(ownerId)
            .select("firstName lastName email")
            .lean();
          if (owner) {
            application.ownerName =
              `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
              owner.email ||
              "N/A";
            application.ownerEmail = owner.email;
          }
        } catch (e) {
          // Non-fatal: owner lookup failure shouldn't block the response
        }
      }

      // Map lguDocuments to documents for frontend compatibility
      // Frontend reads application.documents, but Application model uses lguDocuments
      console.log('[GET /:id] lguDocuments:', application.lguDocuments);
      console.log('[GET /:id] formData keys:', Object.keys(application.formData || {}));
      
      // Initialize lguDocuments if it doesn't exist
      if (!application.lguDocuments) {
        application.lguDocuments = {};
      }
      
      // Try to extract document CIDs from formData if lguDocuments is empty
      // Form fields might store CIDs directly in formData
      if (Object.keys(application.lguDocuments).length === 0 && application.formData) {
        const docFields = ['ownerGovernmentId', 'barangayClearance', 'dtiSecCdaCertificate', 'leaseContractOrTitle', 'ctcCedula', 'occupancyPermit'];
        for (const field of docFields) {
          if (application.formData[field]) {
            application.lguDocuments[`${field}IpfsCid`] = application.formData[field];
            console.log(`[GET /:id] Extracted ${field} from formData:`, application.formData[field]);
          }
        }
      }
      
      if (application.lguDocuments && !application.documents) {
        application.documents = application.lguDocuments;
      }

      // Also map lguDocuments fields to match form definition keys
      // Form definition uses keys like 'ownerGovernmentId', 'barangayClearance', etc.
      // lguDocuments uses 'ownerGovernmentIdIpfsCid', 'barangayClearanceIpfsCid', etc.
      // Add the base keys to documents for easier lookup
      if (application.lguDocuments) {
        const keyMapping = {
          ownerGovernmentIdIpfsCid: 'ownerGovernmentId',
          barangayClearanceIpfsCid: 'barangayClearance',
          dtiSecCdaCertificateIpfsCid: 'dtiSecCdaCertificate',
          leaseContractOrTitleIpfsCid: 'leaseContractOrTitle',
          ctcCedulaIpfsCid: 'ctcCedula',
          occupancyPermitIpfsCid: 'occupancyPermit',
        };
        for (const [ipfsKey, baseKey] of Object.entries(keyMapping)) {
          if (application.lguDocuments[ipfsKey] && !application.documents[baseKey]) {
            application.documents[baseKey] = application.lguDocuments[ipfsKey];
            console.log(`[GET /:id] Mapped ${ipfsKey} -> ${baseKey}:`, application.lguDocuments[ipfsKey]);
          }
        }
        console.log('[GET /:id] Final documents:', application.documents);
      }

      // Return the application object directly (frontend uses the response as-is)
      return res.json(application);
    } catch (err) {
      console.error("GET /api/lgu-officer/permit-applications/:id error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch application");
    }
  }
);

/**
 * PUT /api/lgu-officer/permit-applications/:id/claim
 * Claim a permit application for review
 */
router.put(
  "/permit-applications/:id/claim",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const officerId = req._userId;

      // Find application in Application collection
      let application = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!application) {
        application = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Fetch officer name for reviewedByName (don't use lean() to allow decryption)
      const officer = await User.findById(officerId)
        .select("firstName lastName");
      const officerName = officer
        ? `${officer.firstName} ${officer.lastName}`.trim()
        : req._userEmail || "Officer";

      // Set reviewer and transition to under_review if currently submitted
      // Keep resubmit status as is to distinguish from first-time submissions
      const updateData = {
        reviewedBy: officerId,
        reviewedByName: officerName,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      };

      if (application.applicationStatus === "submitted") {
        updateData.applicationStatus = "under_review";
      }

      // Update based on collection type with atomic condition to prevent race condition
      let updated;
      if (application.constructor.modelName === "Application") {
        updated = await Application.findOneAndUpdate(
          {
            _id: application._id,
            $or: [
              { reviewedBy: null },
              { reviewedBy: officerId }
            ]
          },
          {
            $set: updateData,
            $addToSet: {
              reviewers: {
                officerId: officerId,
                officerName: officerName,
              }
            }
          },
          { new: true }
        );
      } else {
        updated = await Business.findOneAndUpdate(
          {
            _id: application._id,
            $or: [
              { reviewedBy: null },
              { reviewedBy: officerId }
            ]
          },
          { $set: updateData },
          { new: true }
        );
      }

      if (!updated) {
        return respond.error(res, 409, "conflict", "Application already claimed by another officer");
      }

      // Emit real-time event to all officers
      req.io?.to('lgu-officers').emit('application:claimed', {
        applicationId: application.applicationId || application.businessId || application._id.toString(),
        claimedBy: officerId,
        claimedByName: officerName,
      });

      // Log audit event
      await logAuditEvent(
        "application_claimed",
        officerId,
        application.constructor.modelName,
        application.applicationId || application.businessId || application._id.toString(),
        {
          applicationId: application.applicationId || application.businessId,
          applicationStatus: application.applicationStatus,
          officerName,
        }
      );

      // Re-fetch to get updated data
      const updatedApplication = await (application.constructor.modelName === "Application"
        ? Application.findById(application._id)
        : Business.findById(application._id)
      );

      return res.json({
        success: true,
        message: "Application claimed successfully",
        application: updatedApplication,
      });
    } catch (err) {
      console.error("PUT /api/lgu-officer/permit-applications/:id/claim error:", err);
      return respond.error(
        res,
        500,
        "claim_failed",
        "Failed to claim application"
      );
    }
  }
);

/**
 * PUT /api/lgu-officer/permit-applications/:id/release
 * Release a permit application back to the pool
 */
router.put(
  "/permit-applications/:id/release",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const officerId = req._userId;

      // Find application in Application collection
      let application = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!application) {
        application = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Only the claiming officer can release (or admin)
      const userRole = req.user?.role?.slug || req._userRole;
      if (
        application.reviewedBy &&
        String(application.reviewedBy) !== String(officerId) &&
        userRole !== "admin"
      ) {
        return respond.error(
          res,
          403,
          "forbidden",
          "Only the claiming officer can release this application"
        );
      }

      // Revert to submitted if under_review
      const updateData = {
        reviewedBy: null,
        reviewedByName: "",
        reviewedAt: null,
        updatedAt: new Date(),
      };

      if (application.applicationStatus === "under_review") {
        updateData.applicationStatus = "submitted";
      }

      // Update based on collection type
      if (application.constructor.modelName === "Application") {
        await Application.updateOne(
          { _id: application._id },
          { $set: updateData }
        );
      } else {
        await Business.updateOne({ _id: application._id }, { $set: updateData });
      }

      // Log audit event
      await logAuditEvent(
        "application_released",
        officerId,
        application.constructor.modelName,
        application.applicationId || application.businessId || application._id.toString(),
        {
          applicationId: application.applicationId || application.businessId,
          applicationStatus: application.applicationStatus,
        }
      );

      return res.json({
        success: true,
        message: "Application released successfully",
      });
    } catch (err) {
      console.error("PUT /api/lgu-officer/permit-applications/:id/release error:", err);
      return respond.error(
        res,
        500,
        "release_failed",
        "Failed to release application"
      );
    }
  }
);

/**
 * POST /api/lgu-officer/permit-applications/:id/reset-status
 * Reset application status (for testing - undo approval)
 */
router.post(
  "/permit-applications/:id/reset-status",
  requireJwt,
  requireRole(["lgu_officer", "admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newStatus } = req.body;

      if (!newStatus) {
        return respond.error(
          res,
          400,
          "validation_error",
          "New status is required"
        );
      }

      // Find application in Application collection
      let application = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!application) {
        application = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Update status
      const updateData = {
        applicationStatus: newStatus,
        updatedAt: new Date(),
      };

      // Update based on collection type
      if (application.constructor.modelName === "Application") {
        await Application.updateOne(
          { _id: application._id },
          { $set: updateData }
        );
      } else {
        await Business.updateOne({ _id: application._id }, { $set: updateData });
      }

      return respond.success(res, 200, {
        message: "Application status reset successfully",
      });
    } catch (err) {
      console.error(
        "POST /api/lgu-officer/permit-applications/:id/reset-status error:",
        err
      );
      return respond.error(
        res,
        500,
        "reset_error",
        err.message || "Failed to reset application status"
      );
    }
  }
);

/**
 * PATCH /api/lgu-officer/permit-applications/:id/field-decisions
 * Update field-level review decisions
 */
router.patch(
  "/permit-applications/:id/field-decisions",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { businessId, fieldKey, status, reasonCode, reasonOther, decisions } = req.body;
      const officerId = req._userId;

      // Build payload from single decision or batch decisions
      const payload =
        decisions && Array.isArray(decisions)
          ? decisions
          : fieldKey && (status !== undefined && status !== null)
            ? [{ fieldKey, status, reasonCode, reasonOther }]
            : fieldKey && (status === null || status === undefined)
              ? [{ fieldKey, status: null, reasonCode, reasonOther }]
              : null;

      if (!payload || payload.length === 0) {
        return respond.error(
          res,
          400,
          "missing_data",
          "fieldKey and status, or decisions array, required"
        );
      }

      // Find application in Application collection
      let doc = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!doc) {
        doc = await Business.findOne({
          $or: [{ businessId: req.params.id }, { _id: req.params.id }],
        });
      }

      if (!doc) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Fetch officer name for audit trail (don't use lean() to allow decryption)
      const officer = await User.findById(officerId).select("firstName lastName");
      const officerName = officer ? `${officer.firstName} ${officer.lastName}`.trim() : "Officer";

      // Get existing fieldReviewDecisions as object (not array)
      const decisionsObj =
        doc.fieldReviewDecisions && typeof doc.fieldReviewDecisions === "object"
          ? { ...doc.fieldReviewDecisions }
          : {};

      // Process each decision
      for (const item of payload) {
        const {
          fieldKey: itemFieldKey,
          status: decisionStatus,
          requestCode,
          requestOther,
          reasonCode: itemReasonCode,
          reasonOther: itemReasonOther,
        } = item;
        if (!itemFieldKey) continue;

        // Clear decision if status is null
        if (decisionStatus === null || decisionStatus === undefined) {
          delete decisionsObj[itemFieldKey];
          continue;
        }

        if (!["accepted", "request_changes"].includes(decisionStatus)) continue;

        decisionsObj[itemFieldKey] = {
          status: decisionStatus,
          requestCode:
            decisionStatus === "request_changes" ? (itemReasonCode || requestCode || null) : undefined,
          requestOther:
            decisionStatus === "request_changes" ? (itemReasonOther || requestOther || null) : undefined,
          decidedAt: new Date(),
          decidedBy: officerId,
          decidedByName: officerName,
        };
      }

      // Update based on collection type
      const updateData = {
        fieldReviewDecisions: decisionsObj,
        updatedAt: new Date(),
      };

      if (doc.constructor.modelName === "Application") {
        await Application.updateOne({ _id: doc._id }, { $set: updateData });
      } else {
        await Business.updateOne({ _id: doc._id }, { $set: updateData });
      }

      // Log audit event for field decisions
      await logAuditEvent(
        "field_decisions_updated",
        officerId,
        doc.constructor.modelName,
        doc.applicationId || doc.businessId || doc._id.toString(),
        {
          applicationId: doc.applicationId || doc.businessId,
          decisionsCount: payload.length,
          officerName,
          decisions: payload.map(item => ({
            fieldKey: item.fieldKey,
            status: item.status,
            requestCode: item.requestCode,
            requestOther: item.requestOther,
            reasonCode: item.reasonCode,
            reasonOther: item.reasonOther,
          })),
        }
      );

      // Re-fetch and return the updated application
      const updatedApplication = await (doc.constructor.modelName === "Application"
        ? Application.findById(doc._id)
        : Business.findById(doc._id)
      );

      // Enrich with ownerName and map lguDocuments to documents (same as GET /:id)
      const application = updatedApplication.toObject ? updatedApplication.toObject() : updatedApplication;
      const ownerId = application.userId || application.ownerId;
      if (ownerId) {
        try {
          const owner = await User.findById(ownerId)
            .select("firstName lastName email")
            .lean();
          if (owner) {
            application.ownerName =
              `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
              owner.email ||
              "N/A";
            application.ownerEmail = owner.email;
          }
        } catch (e) {
          // Non-fatal
        }
      }

      if (application.lguDocuments && !application.documents) {
        application.documents = application.lguDocuments;
        const keyMapping = {
          ownerGovernmentIdIpfsCid: 'ownerGovernmentId',
          barangayClearanceIpfsCid: 'barangayClearance',
          dtiSecCdaCertificateIpfsCid: 'dtiSecCdaCertificate',
          leaseContractOrTitleIpfsCid: 'leaseContractOrTitle',
          ctcCedulaIpfsCid: 'ctcCedula',
          occupancyPermitIpfsCid: 'occupancyPermit',
        };
        for (const [ipfsKey, baseKey] of Object.entries(keyMapping)) {
          if (application.lguDocuments[ipfsKey] && !application.documents[baseKey]) {
            application.documents[baseKey] = application.lguDocuments[ipfsKey];
          }
        }
      }

      return res.json(application);
    } catch (err) {
      console.error("PATCH /api/lgu-officer/permit-applications/:id/field-decisions error:", err);
      return respond.error(res, 500, "update_error", "Failed to update field decisions");
    }
  }
);

/**
 * POST /api/lgu-officer/permit-applications/:id/pending-action
 * Create a pending action with undo window
 */
router.post(
  "/permit-applications/:id/pending-action",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { actionType, payload, delayMinutes } = req.body;

      if (!actionType || !["complete_review", "reject", "return", "reject_appeal"].includes(actionType)) {
        return respond.error(res, 400, "invalid_data", "actionType must be one of: complete_review, reject, return, reject_appeal");
      }

      // Find application in Application collection
      let doc = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!doc) {
        doc = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      // If not found in Business, check GeneralPermit collection (for temporary permits)
      if (!doc) {
        const GeneralPermit = require("../../models/GeneralPermit");
        doc = await GeneralPermit.findOne({ _id: id });
      }

      if (!doc) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Check if there's already a pending action
      if (doc.pendingAction?.actionType) {
        return respond.error(res, 409, "conflict", "A pending action already exists. Cancel it first.");
      }

      const now = new Date();
      const scheduledAt = new Date(now.getTime() + (delayMinutes || 10) * 60 * 1000);

      const updateData = {
        pendingAction: {
          actionType,
          scheduledAt,
          payload: payload || {},
          expiresAt: scheduledAt,
          createdAt: now,
        },
        updatedAt: new Date(),
      };

      // Update based on collection type
      if (doc.constructor.modelName === "Application") {
        await Application.updateOne({ _id: doc._id }, { $set: updateData });
      } else if (doc.constructor.modelName === "GeneralPermit") {
        await require("../../models/GeneralPermit").updateOne({ _id: doc._id }, { $set: updateData });
      } else {
        await Business.updateOne({ _id: doc._id }, { $set: updateData });
      }

      // Log audit event for pending action creation
      await logAuditEvent(
        "pending_action_created",
        req._userId,
        doc.constructor.modelName,
        doc.applicationId || doc.businessId || doc._id.toString(),
        {
          applicationId: doc.applicationId || doc.businessId,
          actionType,
          scheduledAt,
        }
      );

      // Re-fetch and return the updated application
      const updatedApplication = await (doc.constructor.modelName === "Application"
        ? Application.findById(doc._id)
        : doc.constructor.modelName === "GeneralPermit"
          ? require("../../models/GeneralPermit").findById(doc._id)
          : Business.findById(doc._id)
      );

      // Enrich with ownerName and map lguDocuments to documents (same as GET /:id)
      const application = updatedApplication.toObject ? updatedApplication.toObject() : updatedApplication;
      const ownerId = application.userId || application.ownerId;
      if (ownerId) {
        try {
          const owner = await User.findById(ownerId)
            .select("firstName lastName email")
            .lean();
          if (owner) {
            application.ownerName =
              `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
              owner.email ||
              "N/A";
            application.ownerEmail = owner.email;
          }
        } catch (e) {
          // Non-fatal
        }
      }

      if (application.lguDocuments && !application.documents) {
        application.documents = application.lguDocuments;
        const keyMapping = {
          ownerGovernmentIdIpfsCid: 'ownerGovernmentId',
          barangayClearanceIpfsCid: 'barangayClearance',
          dtiSecCdaCertificateIpfsCid: 'dtiSecCdaCertificate',
          leaseContractOrTitleIpfsCid: 'leaseContractOrTitle',
          ctcCedulaIpfsCid: 'ctcCedula',
          occupancyPermitIpfsCid: 'occupancyPermit',
        };
        for (const [ipfsKey, baseKey] of Object.entries(keyMapping)) {
          if (application.lguDocuments[ipfsKey] && !application.documents[baseKey]) {
            application.documents[baseKey] = application.lguDocuments[ipfsKey];
          }
        }
      }

      return res.json(application);
    } catch (err) {
      console.error("POST /pending-action error:", err);
      if (err.message === "Application not found") {
        return respond.error(res, 404, "not_found", "Application not found");
      }
      return respond.error(res, 500, "server_error", err.message || "Failed to create pending action");
    }
  }
);

/**
 * DELETE /api/lgu-officer/permit-applications/:id/pending-action
 * Cancel a pending action (undo)
 */
router.delete(
  "/permit-applications/:id/pending-action",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find application in Application collection
      let doc = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!doc) {
        doc = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      // If not found in Business, check GeneralPermit collection (for temporary permits)
      if (!doc) {
        const GeneralPermit = require("../../models/GeneralPermit");
        doc = await GeneralPermit.findOne({ _id: id });
      }

      if (!doc) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      const updateData = {
        pendingAction: null,
        updatedAt: new Date(),
      };

      // Update based on collection type
      if (doc.constructor.modelName === "Application") {
        await Application.updateOne({ _id: doc._id }, { $set: updateData });
      } else if (doc.constructor.modelName === "GeneralPermit") {
        await require("../../models/GeneralPermit").updateOne({ _id: doc._id }, { $set: updateData });
      } else {
        await Business.updateOne({ _id: doc._id }, { $set: updateData });
      }

      // Log audit event for pending action cancellation
      await logAuditEvent(
        "pending_action_cancelled",
        req._userId,
        doc.constructor.modelName,
        doc.applicationId || doc.businessId || doc._id.toString(),
        {
          applicationId: doc.applicationId || doc.businessId,
        }
      );

      // Re-fetch and return the updated application
      const updatedApplication = await (doc.constructor.modelName === "Application"
        ? Application.findById(doc._id)
        : Business.findById(doc._id)
      );

      // Enrich with ownerName and map lguDocuments to documents (same as GET /:id)
      const application = updatedApplication.toObject ? updatedApplication.toObject() : updatedApplication;
      const ownerId = application.userId || application.ownerId;
      if (ownerId) {
        try {
          const owner = await User.findById(ownerId)
            .select("firstName lastName email")
            .lean();
          if (owner) {
            application.ownerName =
              `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
              owner.email ||
              "N/A";
            application.ownerEmail = owner.email;
          }
        } catch (e) {
          // Non-fatal
        }
      }

      if (application.lguDocuments && !application.documents) {
        application.documents = application.lguDocuments;
        const keyMapping = {
          ownerGovernmentIdIpfsCid: 'ownerGovernmentId',
          barangayClearanceIpfsCid: 'barangayClearance',
          dtiSecCdaCertificateIpfsCid: 'dtiSecCdaCertificate',
          leaseContractOrTitleIpfsCid: 'leaseContractOrTitle',
          ctcCedulaIpfsCid: 'ctcCedula',
          occupancyPermitIpfsCid: 'occupancyPermit',
        };
        for (const [ipfsKey, baseKey] of Object.entries(keyMapping)) {
          if (application.lguDocuments[ipfsKey] && !application.documents[baseKey]) {
            application.documents[baseKey] = application.lguDocuments[ipfsKey];
          }
        }
      }

      return res.json(application);
    } catch (err) {
      console.error("DELETE /pending-action error:", err);
      return respond.error(res, 500, "server_error", err.message || "Failed to cancel pending action");
    }
  }
);

/**
 * GET /api/lgu-officer/permit-applications/:id/pending-action
 * Get pending action
 */
router.get(
  "/permit-applications/:id/pending-action",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find application in Application collection
      let doc = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!doc) {
        doc = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      if (!doc) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      return res.json({ pendingAction: doc.pendingAction });
    } catch (err) {
      console.error("GET /pending-action error:", err);
      return respond.error(res, 500, "server_error", err.message || "Failed to get pending action");
    }
  }
);

/**
 * PUT /api/lgu-officer/permit-applications/:id/execute-pending-action
 * Execute a pending action (called by scheduled job or manual trigger)
 */
router.put(
  "/permit-applications/:id/execute-pending-action",
  requireJwt,
  requireRole(["lgu_officer", "staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find application in Application collection
      let doc = await Application.findOne({
        $or: [{ applicationId: id }, { _id: id }],
      });

      // If not found in Application, check Business collection (for approved applications)
      if (!doc) {
        doc = await Business.findOne({
          $or: [{ businessId: id }, { _id: id }],
        });
      }

      // If not found in Business, check GeneralPermit collection (for temporary permits)
      if (!doc) {
        const GeneralPermit = require("../../models/GeneralPermit");
        doc = await GeneralPermit.findOne({ _id: id });
      }

      if (!doc) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      const pendingAction = doc.pendingAction;
      if (!pendingAction || !pendingAction.actionType) {
        return respond.error(res, 400, "no_pending_action", "No pending action to execute");
      }

      // Execute the action based on type
      let newStatus = doc.applicationStatus || doc.status;
      if (pendingAction.actionType === "complete_review") {
        newStatus = "approved";
      } else if (pendingAction.actionType === "reject") {
        newStatus = "rejected";
      } else if (pendingAction.actionType === "return") {
        newStatus = "returned";
      } else if (pendingAction.actionType === "reject_appeal") {
        newStatus = "appeal_rejected";
      }

      const updateData = {
        pendingAction: null,
        updatedAt: new Date(),
      };
      // Use appropriate status field based on model type
      if (doc.constructor.modelName === "GeneralPermit") {
        updateData.status = newStatus;
      } else {
        updateData.applicationStatus = newStatus;
      }

      // Store rejection reason or comments on the document when rejecting
      if (pendingAction.actionType === "reject") {
        updateData.rejectionReason = pendingAction.payload?.rejectionReason || pendingAction.payload?.comments || pendingAction.payload?.requestOther;
      }
      // Store comments when approving
      if (pendingAction.actionType === "complete_review") {
        updateData.reviewComments = pendingAction.payload?.comments;
      }
      // Handle appeal rejection - update appeal document
      if (pendingAction.actionType === "reject_appeal") {
        const Appeal = require("../../models/Appeal");
        const appealId = pendingAction.payload?.appealId;
        if (appealId) {
          await Appeal.updateOne(
            { _id: appealId },
            {
              $set: {
                status: "rejected",
                resolution: pendingAction.payload?.rejectionReason || "",
                reviewedBy: req._userId,
                reviewedAt: new Date(),
              }
            }
          );
        }
      }

      // Update based on collection type
      if (doc.constructor.modelName === "Application") {
        await Application.updateOne({ _id: doc._id }, { $set: updateData });

        // If approving an Application, create a corresponding Business record
        if (newStatus === "approved") {
          const BusinessProfile = require("../../models/BusinessProfile");
          const businessProfile = await BusinessProfile.findOne({ userId: doc.userId });
          if (!businessProfile) {
            console.error('[execute-pending-action] BusinessProfile not found for Application applicant:', doc.userId);
          } else {
            const businessId = `BIZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            // For general_permit formType, use activityName as business name (the actual name submitted by user)
            const businessName = doc.formType === "general_permit"
              ? (doc.formData?.activityName || doc.formData?.businessName || "Temporary Permit")
              : (doc.formData?.businessName || "Unknown Business");
            const business = await Business.create({
              businessId,
              userId: doc.userId,
              ownerProfileId: businessProfile._id,
              approvedApplicationId: doc._id,
              businessName,
              businessStatus: "active",
              registrationStatus: "not_yet_registered",
              applicationStatus: "approved",
              applicationReferenceNumber: doc.applicationReferenceNumber,
              formType: doc.formType || "permit",
              category: doc.formType === "general_permit" ? (doc.formData?.generalPermitCategory || doc.category || "") : (doc.category || ""),
              formData: doc.formData || {},
              submittedAt: doc.submittedAt,
              reviewedBy: doc.reviewedBy,
              location: {
                street: doc.formData?.businessAddress?.streetAddress || "",
                barangay: doc.formData?.businessAddress?.barangayName || "",
                city: "",
                municipality: "",
                province: "",
                zipCode: doc.formData?.businessAddress?.postalCode || "",
              },
              businessType: "g", // Default to retail trade (Wholesale and retail trade) - can be mapped from LOB later
              registrationAgency: "LGU",
              businessRegistrationNumber: doc.formData?.tin || `APP-${doc._id.toString().slice(-8).toUpperCase()}`,
              contactNumber: doc.formData?.businessPhone || "",
            });
            console.log('[execute-pending-action] Created Business record:', businessId, 'for Application:', doc.applicationId);
          }
        }
      } else if (doc.constructor.modelName === "GeneralPermit") {
        await require("../../models/GeneralPermit").updateOne({ _id: doc._id }, { $set: updateData });

        // If approving a GeneralPermit, create a corresponding Business record
        if (newStatus === "approved") {
          const BusinessProfile = require("../../models/BusinessProfile");
          const businessProfile = await BusinessProfile.findOne({ userId: doc.applicantId });
          if (!businessProfile) {
            console.error('[execute-pending-action] BusinessProfile not found for GeneralPermit applicant:', doc.applicantId);
          } else {
            const businessId = `BIZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const business = await Business.create({
              businessId,
              userId: doc.applicantId,
              ownerProfileId: businessProfile._id,
              approvedGeneralPermitId: doc._id,
              businessName: doc.permitCategory || "Temporary Permit",
              registeredBusinessName: "",
              businessStatus: "active",
              registrationStatus: "not_yet_registered",
              applicationStatus: "approved",
              applicationReferenceNumber: `GP-${doc._id.toString().slice(-8).toUpperCase()}`,
              formType: "general_permit",
              category: doc.permitCategory || "",
              formData: {
                permitCategory: doc.permitCategory,
                businessPlateNo: doc.businessPlateNo,
                requirements: doc.requirements,
              },
              submittedAt: doc.createdAt,
              reviewedBy: req._userId,
              location: {},
              businessType: "g",
              registrationAgency: "LGU",
              businessRegistrationNumber: `TEMP-${doc._id.toString().slice(-8).toUpperCase()}`,
              contactNumber: "",
            });
            // Update permit with business reference
            await require("../../models/GeneralPermit").updateOne({ _id: doc._id }, { $set: { businessId: business._id } });
            console.log('[execute-pending-action] Created Business record:', businessId, 'for GeneralPermit:', doc._id);
          }
        }
      } else {
        await Business.updateOne({ _id: doc._id }, { $set: updateData });
      }

      // Log audit event for the executed decision
      let eventType = null;
      if (pendingAction.actionType === "complete_review") {
        eventType = "review_completed";
      } else if (pendingAction.actionType === "reject") {
        eventType = "application_rejected";
      } else if (pendingAction.actionType === "return") {
        eventType = "application_returned";
      } else if (pendingAction.actionType === "reject_appeal") {
        eventType = "appeal_rejected";
      }

      if (eventType) {
        await logAuditEvent(
          eventType,
          req._userId,
          doc.constructor.modelName,
          doc.applicationId || doc.businessId || doc._id.toString(),
          {
            applicationId: doc.applicationId || doc.businessId,
            businessId: doc.businessId,
            applicationStatus: newStatus,
            previousStatus: doc.applicationStatus,
            comments: pendingAction.payload?.comments,
            rejectionReason: pendingAction.payload?.rejectionReason,
            requestType: pendingAction.payload?.requestType,
            requestOther: pendingAction.payload?.requestOther,
            appealId: pendingAction.payload?.appealId,
          }
        );
      }

      // Re-fetch and return the updated application
      const updatedApplication = await (doc.constructor.modelName === "Application"
        ? Application.findById(doc._id)
        : Business.findById(doc._id)
      );

      // Enrich with ownerName and map lguDocuments to documents (same as GET /:id)
      const application = updatedApplication.toObject ? updatedApplication.toObject() : updatedApplication;
      const ownerId = application.userId || application.ownerId;
      if (ownerId) {
        try {
          const owner = await User.findById(ownerId)
            .select("firstName lastName email")
            .lean();
          if (owner) {
            application.ownerName =
              `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
              owner.email ||
              "N/A";
            application.ownerEmail = owner.email;
          }
        } catch (e) {
          // Non-fatal
        }
      }

      if (application.lguDocuments && !application.documents) {
        application.documents = application.lguDocuments;
        const keyMapping = {
          ownerGovernmentIdIpfsCid: 'ownerGovernmentId',
          barangayClearanceIpfsCid: 'barangayClearance',
          dtiSecCdaCertificateIpfsCid: 'dtiSecCdaCertificate',
          leaseContractOrTitleIpfsCid: 'leaseContractOrTitle',
          ctcCedulaIpfsCid: 'ctcCedula',
          occupancyPermitIpfsCid: 'occupancyPermit',
        };
        for (const [ipfsKey, baseKey] of Object.entries(keyMapping)) {
          if (application.lguDocuments[ipfsKey] && !application.documents[baseKey]) {
            application.documents[baseKey] = application.lguDocuments[ipfsKey];
          }
        }
      }

      return res.json(application);
    } catch (err) {
      console.error("PUT /execute-pending-action error:", err);
      return respond.error(res, 500, "server_error", err.message || "Failed to execute pending action");
    }
  }
);

/**
 * PATCH /api/lgu-officer/permit-applications/:id/form-data
 * Update LOB form data
 */
router.patch(
  "/permit-applications/:id/form-data",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { businessId, businessDescriptionText, businessActivities } = req.body;
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (!application.formData) application.formData = {};
      application.formData.businessDescriptionText = businessDescriptionText;
      application.formData.businessActivities = businessActivities;

      await application.save();

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("PATCH /api/lgu-officer/permit-applications/:id/form-data error:", err);
      return respond.error(res, 500, "update_error", "Failed to update form data");
    }
  }
);

module.exports = router;
