const express = require("express");
const router = express.Router();
const { requireJwt, requireRole } = require("../middleware/auth");
const respond = require("../middleware/respond");
const clearanceService = require("../services/clearanceService");

// GET /api/business/clearances/:businessId - Get all clearances for a business
router.get(
  "/:businessId",
  requireJwt,
  requireRole(["business_owner", "lgu_officer", "admin"]),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const clearances =
        await clearanceService.getClearancesByBusiness(businessId);
      res.json(clearances);
    } catch (err) {
      console.error("GET /api/business/clearances/:businessId error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch clearances",
      );
    }
  },
);

// POST /api/business/clearances/:businessId/initiate - Initiate clearance process
router.post(
  "/:businessId/initiate",
  requireJwt,
  requireRole(["lgu_officer", "admin"]),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const { applicationId } = req.body;
      const userId = req._userId;

      if (!applicationId) {
        return respond.error(
          res,
          400,
          "application_required",
          "Application ID is required",
        );
      }

      const clearance = await clearanceService.initiateClearance(
        businessId,
        applicationId,
        userId,
      );
      res.json(clearance);
    } catch (err) {
      console.error(
        "POST /api/business/clearances/:businessId/initiate error:",
        err,
      );
      return respond.error(
        res,
        500,
        "initiate_error",
        err.message || "Failed to initiate clearance process",
      );
    }
  },
);

// GET /api/business/clearances/:businessId/status - Get clearance status summary
router.get(
  "/:businessId/status",
  requireJwt,
  requireRole(["business_owner", "lgu_officer", "admin"]),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const status = await clearanceService.getClearanceStatus(businessId);
      res.json(status);
    } catch (err) {
      console.error(
        "GET /api/business/clearances/:businessId/status error:",
        err,
      );
      return respond.error(
        res,
        500,
        "status_error",
        err.message || "Failed to get clearance status",
      );
    }
  },
);

// POST /api/business/clearances/:businessId/:agency/submit - Submit to agency
router.post(
  "/:businessId/:agency/submit",
  requireJwt,
  requireRole(["lgu_officer"]),
  async (req, res) => {
    try {
      const { businessId, agency } = req.params;
      const userId = req._userId;
      const { documents, notes } = req.body;

      const result = await clearanceService.submitToAgency(businessId, agency, {
        documents,
        notes,
        submittedBy: userId,
      });
      res.json(result);
    } catch (err) {
      console.error(
        "POST /api/business/clearances/:businessId/:agency/submit error:",
        err,
      );
      return respond.error(
        res,
        500,
        "submit_error",
        err.message || "Failed to submit to agency",
      );
    }
  },
);

// POST /api/agency/:agency/review - Agency reviewer starts review
router.post(
  "/agency/:agency/review",
  requireJwt,
  requireRole(["lgu_officer", "agency_reviewer"]),
  async (req, res) => {
    try {
      const { agency } = req.params;
      const userId = req._userId;
      const { businessId, clearanceId } = req.body;

      const result = await clearanceService.startAgencyReview(
        clearanceId,
        agency,
        userId,
      );
      res.json(result);
    } catch (err) {
      console.error("POST /api/agency/:agency/review error:", err);
      return respond.error(
        res,
        500,
        "review_error",
        err.message || "Failed to start review",
      );
    }
  },
);

// POST /api/agency/:agency/approve - Agency approves clearance
router.post(
  "/agency/:agency/approve",
  requireJwt,
  requireRole(["lgu_officer", "agency_reviewer"]),
  async (req, res) => {
    try {
      const { agency } = req.params;
      const userId = req._userId;
      const { businessId, clearanceId, notes, certificateNumber } = req.body;

      const result = await clearanceService.approveAgencyClearance(
        clearanceId,
        agency,
        {
          approvedBy: userId,
          notes,
          certificateNumber,
        },
      );
      res.json(result);
    } catch (err) {
      console.error("POST /api/agency/:agency/approve error:", err);
      return respond.error(
        res,
        500,
        "approve_error",
        err.message || "Failed to approve clearance",
      );
    }
  },
);

// POST /api/agency/:agency/reject - Agency rejects clearance
router.post(
  "/agency/:agency/reject",
  requireJwt,
  requireRole(["lgu_officer", "agency_reviewer"]),
  async (req, res) => {
    try {
      const { agency } = req.params;
      const userId = req._userId;
      const { businessId, clearanceId, reason } = req.body;

      if (!reason) {
        return respond.error(
          res,
          400,
          "reason_required",
          "Rejection reason is required",
        );
      }

      const result = await clearanceService.rejectAgencyClearance(
        clearanceId,
        agency,
        {
          rejectedBy: userId,
          reason,
        },
      );
      res.json(result);
    } catch (err) {
      console.error("POST /api/agency/:agency/reject error:", err);
      return respond.error(
        res,
        500,
        "reject_error",
        err.message || "Failed to reject clearance",
      );
    }
  },
);

// POST /api/agency/:agency/deficiency - Raise deficiency
router.post(
  "/agency/:agency/deficiency",
  requireJwt,
  requireRole(["lgu_officer", "agency_reviewer"]),
  async (req, res) => {
    try {
      const { agency } = req.params;
      const userId = req._userId;
      const { businessId, clearanceId, description, requiredDocuments } =
        req.body;

      if (!description) {
        return respond.error(
          res,
          400,
          "description_required",
          "Deficiency description is required",
        );
      }

      const result = await clearanceService.raiseDeficiency(
        clearanceId,
        agency,
        {
          raisedBy: userId,
          description,
          requiredDocuments,
        },
      );
      res.json(result);
    } catch (err) {
      console.error("POST /api/agency/:agency/deficiency error:", err);
      return respond.error(
        res,
        500,
        "deficiency_error",
        err.message || "Failed to raise deficiency",
      );
    }
  },
);

// POST /api/agency/:agency/resolve-deficiency - Resolve deficiency
router.post(
  "/agency/:agency/resolve-deficiency",
  requireJwt,
  requireRole(["business_owner", "lgu_officer"]),
  async (req, res) => {
    try {
      const { agency } = req.params;
      const userId = req._userId;
      const {
        businessId,
        clearanceId,
        deficiencyId,
        resolutionNotes,
        uploadedDocuments,
      } = req.body;

      const result = await clearanceService.resolveDeficiency(
        clearanceId,
        agency,
        deficiencyId,
        {
          resolvedBy: userId,
          resolutionNotes,
          uploadedDocuments,
        },
      );
      res.json(result);
    } catch (err) {
      console.error("POST /api/agency/:agency/resolve-deficiency error:", err);
      return respond.error(
        res,
        500,
        "resolve_error",
        err.message || "Failed to resolve deficiency",
      );
    }
  },
);

// GET /api/agency/:agency/queue - Get agency work queue
router.get(
  "/agency/:agency/queue",
  requireJwt,
  requireRole(["lgu_officer", "agency_reviewer"]),
  async (req, res) => {
    try {
      const { agency } = req.params;
      const { status = "PENDING", page = 1, limit = 20 } = req.query;

      const queue = await clearanceService.getAgencyQueue(agency, {
        status,
        page: parseInt(page),
        limit: parseInt(limit),
      });
      res.json(queue);
    } catch (err) {
      console.error("GET /api/agency/:agency/queue error:", err);
      return respond.error(
        res,
        500,
        "queue_error",
        err.message || "Failed to fetch agency queue",
      );
    }
  },
);

// GET /api/business/clearances/:businessId/timeline - Get clearance timeline
router.get(
  "/:businessId/timeline",
  requireJwt,
  requireRole(["business_owner", "lgu_officer"]),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const timeline = await clearanceService.getClearanceTimeline(businessId);
      res.json(timeline);
    } catch (err) {
      console.error(
        "GET /api/business/clearances/:businessId/timeline error:",
        err,
      );
      return respond.error(
        res,
        500,
        "timeline_error",
        err.message || "Failed to fetch timeline",
      );
    }
  },
);

// GET /api/business/clearances/:businessId/next-agency - Get next pending agency
router.get(
  "/:businessId/next-agency",
  requireJwt,
  requireRole(["business_owner", "lgu_officer"]),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const nextAgency =
        await clearanceService.getNextPendingAgency(businessId);
      res.json({ nextAgency });
    } catch (err) {
      console.error(
        "GET /api/business/clearances/:businessId/next-agency error:",
        err,
      );
      return respond.error(
        res,
        500,
        "next_agency_error",
        err.message || "Failed to get next agency",
      );
    }
  },
);

// POST /api/business/clearances/:businessId/notify - Send notification about clearance update
router.post(
  "/:businessId/notify",
  requireJwt,
  requireRole(["lgu_officer"]),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const userId = req._userId;
      const { type, content, recipientId } = req.body;

      const result = await clearanceService.sendNotification(businessId, {
        type,
        content,
        recipientId,
        sentBy: userId,
      });
      res.json(result);
    } catch (err) {
      console.error(
        "POST /api/business/clearances/:businessId/notify error:",
        err,
      );
      return respond.error(
        res,
        500,
        "notify_error",
        err.message || "Failed to send notification",
      );
    }
  },
);

module.exports = router;
