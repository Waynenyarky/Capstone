const express = require("express");
const PostRequirement = require("../models/PostRequirement");
const { requireJwt } = require("../middleware/auth");

const router = express.Router();

// GET /api/business/post-requirements
router.get("/", requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, businessId } = req.query;
    const filter = {};
    if (req._userRole === "business_owner") {
      filter.ownerId = req._userId;
    }
    if (status) filter.status = status;
    if (businessId) filter.businessId = businessId;
    const skip = (Number(page) - 1) * Number(limit);
    const [reqs, total] = await Promise.all([
      PostRequirement.find(filter)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PostRequirement.countDocuments(filter),
    ]);

    // Edge case UC-2I-3: Mark overdue requirements in response
    const now = new Date();
    const enriched = reqs.map((r) => ({
      ...r,
      isOverdue:
        r.status === "pending" && r.dueDate && new Date(r.dueDate) < now,
    }));

    return res.json({
      data: enriched,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    console.error("GET /post-requirements error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch post-requirements",
      },
    });
  }
});

// POST /api/business/post-requirements — create (system / officer)
router.post("/", requireJwt, async (req, res) => {
  try {
    const {
      businessId,
      ownerId,
      permitId,
      requirementType,
      description,
      dueDate,
    } = req.body;
    if (!businessId || !requirementType) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "businessId and requirementType are required",
        },
      });
    }

    // Edge case: Validate dueDate is in the future if provided
    if (dueDate && new Date(dueDate) <= new Date()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "dueDate must be in the future",
        },
      });
    }

    const postReq = await PostRequirement.create({
      businessId,
      ownerId: ownerId || req._userId,
      permitId: permitId || undefined,
      requirementType,
      description: description || "",
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      status: "pending",
    });
    return res.status(201).json({ data: postReq });
  } catch (err) {
    console.error("POST /post-requirements error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to create post-requirement",
      },
    });
  }
});

// PUT /api/business/post-requirements/:id — submit compliance / verify
router.put("/:id", requireJwt, async (req, res) => {
  try {
    const postReq = await PostRequirement.findById(req.params.id);
    if (!postReq) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Post-requirement not found" },
      });
    }

    const { status, submittedDocuments, verificationNotes } = req.body;
    if (status) postReq.status = status;
    if (submittedDocuments) postReq.submittedDocuments = submittedDocuments;
    if (status === "submitted") postReq.submittedAt = new Date();
    if (status === "verified") {
      postReq.verifiedBy = req._userId;
      postReq.verifiedAt = new Date();
      postReq.verificationNotes = verificationNotes || "";
    }
    if (status === "non_compliant") {
      postReq.verifiedBy = req._userId;
      postReq.verificationNotes =
        verificationNotes || "Non-compliant submission";
    }
    await postReq.save();
    return res.json({ data: postReq });
  } catch (err) {
    console.error("PUT /post-requirements error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to update post-requirement",
      },
    });
  }
});

// PUT /api/business/post-requirements/:id/extend — extend due date (officer)
// Edge case UC-2I-8: Officer can extend post-requirement due date with reason
router.put("/:id/extend", requireJwt, async (req, res) => {
  try {
    const postReq = await PostRequirement.findById(req.params.id);
    if (!postReq) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Post-requirement not found" },
      });
    }

    if (postReq.status === "verified") {
      return res.status(400).json({
        error: {
          code: "ALREADY_VERIFIED",
          message: "Cannot extend a verified post-requirement",
        },
      });
    }

    const { newDueDate, reason } = req.body;
    if (!newDueDate) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "newDueDate is required" },
      });
    }

    if (new Date(newDueDate) <= new Date()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "newDueDate must be in the future",
        },
      });
    }

    const previousDueDate = postReq.dueDate;
    postReq.dueDate = new Date(newDueDate);
    postReq.extensionHistory = postReq.extensionHistory || [];
    postReq.extensionHistory.push({
      previousDueDate,
      newDueDate: new Date(newDueDate),
      reason: reason || "",
      extendedBy: req._userId,
      extendedAt: new Date(),
    });

    // If it was overdue, reset to pending
    if (postReq.status === "overdue") {
      postReq.status = "pending";
    }

    await postReq.save();
    return res.json({ data: postReq });
  } catch (err) {
    console.error("PUT /post-requirements/extend error:", err);
    return res.status(500).json({
      error: { code: "INTERNAL", message: "Failed to extend due date" },
    });
  }
});

module.exports = router;
