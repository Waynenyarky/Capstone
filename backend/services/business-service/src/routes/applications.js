const express = require("express");
const router = express.Router();
const { requireJwt, requireRole } = require("../middleware/auth");
const Application = require("../models/Application");
const Business = require("../models/Business");
const BusinessProfile = require("../models/BusinessProfile");
const respond = require("../middleware/respond");

// Helper to generate application ID
const generateApplicationId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `APP-${timestamp}-${random}`.toUpperCase();
};

/**
 * POST /api/business/applications
 * Submit a new application
 */
router.post(
  "/applications",
  requireJwt,
  requireRole(["business_owner", "lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const userId = req._userId || req.user?.id;
      const applicationData = req.body;

      // Ensure BusinessProfile exists
      let businessProfile = await BusinessProfile.findOne({ userId });
      if (!businessProfile) {
        businessProfile = await BusinessProfile.create({ userId });
      }

      // Create application
      const application = await Application.create({
        applicationId: generateApplicationId(),
        userId,
        businessId: null,
        ...applicationData,
      });

      return respond.success(res, 201, { application });
    } catch (err) {
      console.error("POST /api/business/applications error:", err);
      return respond.error(res, 500, "create_error", "Failed to create application");
    }
  }
);

/**
 * GET /api/business/applications
 * List applications with optional filters
 */
router.get(
  "/applications",
  requireJwt,
  requireRole(["business_owner", "lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, status, userId, reviewedBy } = req.query;
      const userRole = req.user?.role;

      // For officers/staff, read from Application collection
      if (userRole === "lgu_officer" || userRole === "staff") {
        const filter = {};

        if (status) filter.applicationStatus = status;
        if (userId) filter.userId = userId;
        if (reviewedBy) filter.reviewedBy = reviewedBy;

        const applications = await Application.find(filter)
          .sort({ createdAt: -1 })
          .lean();

        const total = applications.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedApplications = applications.slice(
          startIndex,
          startIndex + parseInt(limit)
        );

        return respond.success(res, 200, {
          applications: paginatedApplications,
          meta: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        });
      }

      // For business owners, read from Application collection
      const filter = {};

      if (status) filter.applicationStatus = status;
      if (userId) filter.userId = userId;
      if (reviewedBy) filter.reviewedBy = reviewedBy;

      const applications = await Application.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Application.countDocuments(filter);

      return respond.success(res, 200, {
        applications,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error("GET /api/business/applications error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch applications");
    }
  }
);

/**
 * GET /api/business/applications/:id
 * Get application details
 */
router.get(
  "/applications/:id",
  requireJwt,
  requireRole(["business_owner", "lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      // Map lguDocuments to documents for frontend compatibility
      // Frontend reads application.documents, but Application model uses lguDocuments
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
          }
        }
      }

      if (application.lguDocuments && !application.documents) {
        application.documents = application.lguDocuments;
      }

      // Also map lguDocuments fields to match form definition keys
      // Form definition uses keys like 'ctc', 'barangayClearance', etc.
      // lguDocuments uses 'ctcIpfsCid', 'barangayClearanceIpfsCid', etc.
      // Add the base keys to documents for easier lookup
      if (application.lguDocuments) {
        const keyMapping = {
          ownerGovernmentIdIpfsCid: 'ownerGovernmentId',
          barangayClearanceIpfsCid: 'barangayClearance',
          dtiSecCdaCertificateIpfsCid: 'dtiSecCdaCertificate',
          leaseContractOrTitleIpfsCid: 'leaseContractOrTitle',
          ctcCedulaIpfsCid: 'ctcCedula',
          occupancyPermitIpfsCid: 'occupancyPermit',
          // General permit form fields
          ctcIpfsCid: 'ctc',
          cdaRegistrationIpfsCid: 'cdaRegistration',
          cityCooperativesComplianceIpfsCid: 'cityCooperativesCompliance',
          spaOrAuthLetterIpfsCid: 'spaOrAuthLetter',
          leaseAndLessorPermitIpfsCid: 'leaseAndLessorPermit',
          rptClearanceIpfsCid: 'rptClearance',
          accountClearanceIpfsCid: 'accountClearance',
          secDoleRegistrationIpfsCid: 'secDoleRegistration',
        };
        for (const [ipfsKey, baseKey] of Object.entries(keyMapping)) {
          if (application.lguDocuments[ipfsKey] && !application.documents[baseKey]) {
            application.documents[baseKey] = application.lguDocuments[ipfsKey];
          }
        }
      }

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("GET /api/business/applications/:id error:", err);
      return respond.error(res, 500, "fetch_error", "Failed to fetch application");
    }
  }
);

/**
 * PUT /api/business/applications/:id/claim
 * Claim an application
 */
router.put(
  "/applications/:id/claim",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (application.reviewedBy) {
        return respond.error(res, 400, "already_claimed", "Application already claimed");
      }

      application.reviewedBy = officerId;
      application.applicationStatus = "under_review";
      application.reviewedAt = new Date();
      await application.save();

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("PUT /api/business/applications/:id/claim error:", err);
      return respond.error(res, 500, "claim_error", "Failed to claim application");
    }
  }
);

/**
 * PUT /api/business/applications/:id/release
 * Release an application
 */
router.put(
  "/applications/:id/release",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (String(application.reviewedBy) !== String(officerId)) {
        return respond.error(res, 403, "forbidden", "You can only release your own claimed applications");
      }

      application.reviewedBy = null;
      application.applicationStatus = "submitted";
      application.reviewedAt = null;
      await application.save();

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("PUT /api/business/applications/:id/release error:", err);
      return respond.error(res, 500, "release_error", "Failed to release application");
    }
  }
);

/**
 * PUT /api/business/applications/:id/transfer
 * Transfer an application to another officer
 */
router.put(
  "/applications/:id/transfer",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const { targetOfficerId } = req.body;

      if (!targetOfficerId) {
        return respond.error(res, 400, "missing_target", "targetOfficerId is required");
      }

      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (String(application.reviewedBy) !== String(officerId)) {
        return respond.error(res, 403, "forbidden", "You can only transfer your own claimed applications");
      }

      application.reviewedBy = targetOfficerId;
      await application.save();

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("PUT /api/business/applications/:id/transfer error:", err);
      return respond.error(res, 500, "transfer_error", "Failed to transfer application");
    }
  }
);

/**
 * PUT /api/business/applications/:id/approve
 * Approve an application and create a Business
 */
router.put(
  "/applications/:id/approve",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (String(application.reviewedBy) !== String(officerId)) {
        return respond.error(res, 403, "forbidden", "You can only approve your own claimed applications");
      }

      if (application.applicationStatus === "approved") {
        return respond.error(res, 400, "already_approved", "Application already approved");
      }

      // Generate business ID
      const businessId = `BIZ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

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
        businessId,
        userId: application.userId,
        ownerProfileId: businessProfile._id,
        approvedApplicationId: application._id,
        businessName,
        registeredBusinessName: application.formData?.registeredBusinessName || "",
        businessStatus: "active",
        registrationStatus: "proposed",
        location: application.formData?.location || {},
        businessType: application.formData?.businessType || "g",
        registrationAgency: application.formData?.registrationAgency || "LGU",
        businessRegistrationNumber: application.formData?.businessRegistrationNumber || application.formData?.tin || `APP-${application._id.toString().slice(-8).toUpperCase()}`,
        businessStartDate: application.formData?.businessStartDate,
        numberOfBranches: application.formData?.numberOfBranches || 0,
        industryClassification: application.formData?.industryClassification || "",
        taxIdentificationNumber: application.formData?.taxIdentificationNumber || "",
        contactNumber: application.formData?.contactNumber || application.formData?.businessPhone || "",
        riskProfile: application.formData?.riskProfile || {},
      });

      // Update application with business reference
      application.businessId = business._id;
      application.applicationStatus = "approved";
      application.reviewedAt = new Date();
      await application.save();

      return respond.success(res, 200, { application, business });
    } catch (err) {
      console.error("PUT /api/business/applications/:id/approve error:", err);
      return respond.error(res, 500, "approve_error", "Failed to approve application");
    }
  }
);

/**
 * PUT /api/business/applications/:id/reject
 * Reject an application
 */
router.put(
  "/applications/:id/reject",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const { rejectionReason } = req.body;

      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (String(application.reviewedBy) !== String(officerId)) {
        return respond.error(res, 403, "forbidden", "You can only reject your own claimed applications");
      }

      application.applicationStatus = "rejected";
      application.rejectionReason = rejectionReason || "";
      if (!application.originalRejectionReason) {
        application.originalRejectionReason = rejectionReason || "";
      }
      application.reviewedAt = new Date();
      await application.save();

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("PUT /api/business/applications/:id/reject error:", err);
      return respond.error(res, 500, "reject_error", "Failed to reject application");
    }
  }
);

/**
 * PUT /api/business/applications/:id/return
 * Return application for revision
 */
router.put(
  "/applications/:id/return",
  requireJwt,
  requireRole(["lgu_officer", "staff"]),
  async (req, res) => {
    try {
      const officerId = req._userId || req.user?.id;
      const { reviewComments } = req.body;

      const application = await Application.findOne({
        $or: [{ applicationId: req.params.id }, { _id: req.params.id }],
      });

      if (!application) {
        return respond.error(res, 404, "not_found", "Application not found");
      }

      if (String(application.reviewedBy) !== String(officerId)) {
        return respond.error(res, 403, "forbidden", "You can only return your own claimed applications");
      }

      // Check if return is exhausted (already returned once)
      if (application.returnExhausted) {
        return respond.error(res, 400, "return_exhausted", "This application has already been returned once. No further returns are allowed.");
      }

      application.applicationStatus = "needs_revision";
      application.reviewComments = reviewComments || "";
      application.reviewedAt = new Date();
      application.returnCount = (application.returnCount || 0) + 1;
      application.returnExhausted = true; // Only allow one return
      await application.save();

      return respond.success(res, 200, { application });
    } catch (err) {
      console.error("PUT /api/business/applications/:id/return error:", err);
      return respond.error(res, 500, "return_error", "Failed to return application");
    }
  }
);

module.exports = router;
