const express = require("express");
const OccupationalPermit = require("../models/OccupationalPermit");
const BusinessProfile = require("../models/BusinessProfile");
const { requireJwt } = require("../middleware/auth");

const router = express.Router();

// GET /api/business/occupational-permits
router.get("/", requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { applicantId: req._userId };
    const skip = (Number(page) - 1) * Number(limit);
    const [permits, total] = await Promise.all([
      OccupationalPermit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      OccupationalPermit.countDocuments(filter),
    ]);
    return res.json({
      data: permits,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    console.error("GET /occupational-permits error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to fetch occupational permits",
      },
    });
  }
});

// POST /api/business/occupational-permits
router.post("/", requireJwt, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      civilStatus,
      dateOfBirth,
      address,
      education,
      businessPlateNo,
      employer,
      company,
      position,
      type,
    } = req.body;

    if (!businessPlateNo) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "businessPlateNo is required",
        },
      });
    }

    // Edge case UC-2H-4: Validate business plate number exists in system
    const profile = await BusinessProfile.findOne({
      "businesses.businessPlateNo": businessPlateNo,
    });
    if (!profile) {
      return res.status(404).json({
        error: {
          code: "BP_NUMBER_NOT_FOUND",
          message: "Business plate number not found in system",
        },
      });
    }

    const permit = await OccupationalPermit.create({
      applicantId: req._userId,
      firstName,
      lastName,
      gender,
      civilStatus,
      dateOfBirth,
      address,
      education,
      businessPlateNo,
      employer,
      company,
      position,
      type: type || "employed",
      status: "pending",
    });
    return res.status(201).json({ data: permit });
  } catch (err) {
    console.error("POST /occupational-permits error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL",
        message: "Failed to create occupational permit",
      },
    });
  }
});

// PUT /api/business/occupational-permits/:id — update lab status (officer)
router.put("/:id", requireJwt, async (req, res) => {
  try {
    const permit = await OccupationalPermit.findById(req.params.id);
    if (!permit) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Not found" } });
    }

    const { status, labExams } = req.body;
    if (status) permit.status = status;

    if (labExams && typeof labExams === "object") {
      for (const [key, val] of Object.entries(labExams)) {
        permit.labExams.set(key, { ...val, updatedAt: new Date() });
      }

      // Edge case UC-2H-6: If any required lab exam fails, reject entire application
      if (status !== "rejected") {
        let anyFailed = false;
        for (const [, exam] of permit.labExams) {
          if (exam.status === "failed") {
            anyFailed = true;
            break;
          }
        }
        if (anyFailed) {
          permit.status = "rejected";
          permit.rejectionReason = "One or more required lab exams failed";
        }
      }
    }

    await permit.save();
    return res.json({ data: permit });
  } catch (err) {
    console.error("PUT /occupational-permits error:", err);
    return res
      .status(500)
      .json({ error: { code: "INTERNAL", message: "Failed to update" } });
  }
});

module.exports = router;
