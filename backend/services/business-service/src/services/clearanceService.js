const Clearance = require("../models/Clearance");
const BusinessProfile = require("../models/BusinessProfile");
const { generateReferenceNumber } = require("../utils/referenceNumber");
const mongoose = require("mongoose");

const AGENCY_ORDER = [
  "BARANGAY",
  "ZONING",
  "SANITARY",
  "FIRE_SAFETY",
  "BFP",
  "TREASURY",
  "MAYORS_OFFICE",
];

const REQUIRED_AGENCIES = ["BARANGAY", "ZONING", "SANITARY", "FIRE_SAFETY"];

async function resolveBusinessProfile(businessId) {
  // Try by businessId field first
  let profile = await BusinessProfile.findOne({
    "businesses.businessId": businessId,
  });
  // Fallback: try by subdocument _id (most common from frontend)
  if (!profile && mongoose.Types.ObjectId.isValid(businessId)) {
    profile = await BusinessProfile.findOne({
      "businesses._id": new mongoose.Types.ObjectId(businessId),
    });
  }
  // Last resort: try as profile-level _id
  if (!profile && mongoose.Types.ObjectId.isValid(businessId)) {
    profile = await BusinessProfile.findById(businessId);
  }
  return profile;
}

function clearanceBusinessFilter(profile, businessId) {
  const or = [];
  if (profile?._id) or.push({ businessId: profile._id });
  if (mongoose.Types.ObjectId.isValid(businessId)) {
    or.push({ businessId: new mongoose.Types.ObjectId(businessId) });
  }
  if (or.length === 0) return { businessId };
  return { $or: or };
}

/**
 * Initialize clearance process for a new application
 */
async function initiateClearance(businessId, applicationId, initiatedBy) {
  const profile = await resolveBusinessProfile(businessId);
  if (!profile) {
    throw new Error("Business not found");
  }

  const business = profile.businesses.find(
    (b) => b.businessId === businessId || String(b._id) === businessId,
  );
  if (!business) {
    throw new Error("Business not found");
  }

  const filter = clearanceBusinessFilter(profile, businessId);

  // Check if clearance already exists
  const existingClearance = await Clearance.findOne({
    ...filter,
    applicationId,
  });
  if (existingClearance) {
    throw new Error("Clearance process already initiated for this application");
  }

  // Generate reference number
  const referenceNumber = await generateReferenceNumber("CLR");

  // Initialize clearances for all agencies
  const clearances = AGENCY_ORDER.map((agency, index) => ({
    agency,
    status: index === 0 ? "PENDING" : "PENDING",
    submittedAt: index === 0 ? new Date() : null,
    order: index,
  }));

  // Create clearance record
  const clearance = new Clearance({
    businessId: profile._id,
    applicationId,
    referenceNumber,
    clearances,
    overallStatus: "IN_PROGRESS",
    currentAgency: AGENCY_ORDER[0],
    stageHistory: [
      {
        stage: "INITIATED",
        agency: AGENCY_ORDER[0],
        startedAt: new Date(),
      },
    ],
    notificationsSent: [
      {
        type: "PORTAL",
        content:
          "Your application has been submitted for clearance processing.",
        recipient: profile.userId,
      },
    ],
  });

  await clearance.save();

  // Update business application status
  const businessIndex = profile.businesses.findIndex(
    (b) => b.businessId === businessId || String(b._id) === businessId,
  );
  if (businessIndex !== -1) {
    const currentStatus = profile.businesses[businessIndex].applicationStatus;
    // Do not downgrade finalized decisions (e.g., approved -> under_review)
    if (!["approved", "rejected"].includes(currentStatus)) {
      profile.businesses[businessIndex].applicationStatus = "under_review";
    }
    profile.businesses[businessIndex].clearanceReference = referenceNumber;
    profile.businesses[businessIndex].clearanceInitiatedAt = new Date();
    profile.markModified("businesses");
    await profile.save();
  }

  return clearance;
}

/**
 * Get clearance status for a business
 */
async function getClearanceStatus(businessId) {
  const profile = await resolveBusinessProfile(businessId);
  const clearance = await Clearance.findOne(
    clearanceBusinessFilter(profile, businessId),
  )
    .populate("businessId", "businessName applicationStatus")
    .lean();

  if (!clearance) {
    return null;
  }

  return {
    initiated: true,
    referenceNumber: clearance.referenceNumber,
    overallStatus: clearance.overallStatus,
    currentAgency: clearance.currentAgency,
    completionPercentage: clearance.completionPercentage,
    estimatedCompletionDate: clearance.estimatedCompletionDate,
    clearances: clearance.clearances.map((c) => ({
      agency: c.agency,
      status: c.status,
      submittedAt: c.submittedAt,
      reviewedAt: c.reviewedAt,
      reviewerId: c.reviewerId,
      notes: c.notes,
      deficiencies: c.deficiencies?.length || 0,
      certificateNumber: c.certificateNumber,
    })),
    queuePosition: clearance.queuePosition,
    startedAt: clearance.startedAt,
    completedAt: clearance.completedAt,
  };
}

/**
 * Submit application to specific agency
 */
async function submitToAgency(
  businessId,
  agency,
  { documents, notes, submittedBy },
) {
  const profile = await resolveBusinessProfile(businessId);
  const clearance = await Clearance.findOne(
    clearanceBusinessFilter(profile, businessId),
  );
  if (!clearance) {
    throw new Error("Clearance process not found");
  }

  const agencyClearance = clearance.clearances.find((c) => c.agency === agency);
  if (!agencyClearance) {
    throw new Error(`Agency ${agency} not found in clearance process`);
  }

  agencyClearance.status = "PENDING";
  agencyClearance.submittedAt = new Date();
  agencyClearance.notes = notes;

  if (documents && documents.length > 0) {
    // Store document references
    agencyClearance.documents = documents.map((doc) => ({
      ...doc,
      uploadedAt: new Date(),
      uploadedBy: submittedBy,
    }));
  }

  // Update stage history
  clearance.stageHistory.push({
    stage: "SUBMITTED",
    agency,
    startedAt: new Date(),
  });

  await clearance.save();
  return clearance;
}

/**
 * Start agency review
 */
async function startAgencyReview(clearanceId, agency, reviewerId) {
  const clearance = await Clearance.findById(clearanceId);
  if (!clearance) {
    throw new Error("Clearance not found");
  }

  const agencyClearance = clearance.clearances.find((c) => c.agency === agency);
  if (!agencyClearance) {
    throw new Error(`Agency ${agency} not found`);
  }

  agencyClearance.status = "UNDER_REVIEW";
  agencyClearance.reviewerId = reviewerId;
  agencyClearance.reviewStartedAt = new Date();

  // Update current agency
  clearance.currentAgency = agency;

  await clearance.save();
  return clearance;
}

/**
 * Approve agency clearance
 */
async function approveAgencyClearance(
  clearanceId,
  agency,
  { approvedBy, notes, certificateNumber },
) {
  const clearance = await Clearance.findById(clearanceId);
  if (!clearance) {
    throw new Error("Clearance not found");
  }

  const agencyClearance = clearance.clearances.find((c) => c.agency === agency);
  if (!agencyClearance) {
    throw new Error(`Agency ${agency} not found`);
  }

  agencyClearance.status = "APPROVED";
  agencyClearance.reviewedAt = new Date();
  agencyClearance.reviewerId = approvedBy;
  agencyClearance.notes = notes;
  agencyClearance.certificateNumber = certificateNumber;

  // Calculate expiry date (1 year from approval)
  agencyClearance.expiresAt = new Date();
  agencyClearance.expiresAt.setFullYear(
    agencyClearance.expiresAt.getFullYear() + 1,
  );

  // Move to next agency
  const currentIndex = AGENCY_ORDER.indexOf(agency);
  const nextAgency = AGENCY_ORDER[currentIndex + 1];

  if (nextAgency) {
    clearance.currentAgency = nextAgency;

    // Auto-submit to next agency
    const nextClearance = clearance.clearances.find(
      (c) => c.agency === nextAgency,
    );
    if (nextClearance) {
      nextClearance.status = "PENDING";
      nextClearance.submittedAt = new Date();
    }
  } else {
    // All clearances complete
    clearance.currentAgency = null;
    clearance.overallStatus = "ALL_APPROVED";
    clearance.completedAt = new Date();

    // Update business status
    await BusinessProfile.findByIdAndUpdate(clearance.businessId, {
      applicationStatus: "clearance_complete",
      clearanceCompletedAt: new Date(),
    });
  }

  // Update stage history
  clearance.stageHistory.push({
    stage: "APPROVED",
    agency,
    completedAt: new Date(),
    duration: Math.round(
      (Date.now() - agencyClearance.reviewStartedAt) / (1000 * 60 * 60),
    ), // hours
  });

  await clearance.save();
  return clearance;
}

/**
 * Reject agency clearance
 */
async function rejectAgencyClearance(
  clearanceId,
  agency,
  { rejectedBy, reason },
) {
  const clearance = await Clearance.findById(clearanceId);
  if (!clearance) {
    throw new Error("Clearance not found");
  }

  const agencyClearance = clearance.clearances.find((c) => c.agency === agency);
  if (!agencyClearance) {
    throw new Error(`Agency ${agency} not found`);
  }

  agencyClearance.status = "REJECTED";
  agencyClearance.reviewedAt = new Date();
  agencyClearance.reviewerId = rejectedBy;
  agencyClearance.rejectionReason = reason;

  clearance.overallStatus = "HAS_REJECTION";

  await clearance.save();
  return clearance;
}

/**
 * Raise deficiency
 */
async function raiseDeficiency(
  clearanceId,
  agency,
  { raisedBy, description, requiredDocuments },
) {
  const clearance = await Clearance.findById(clearanceId);
  if (!clearance) {
    throw new Error("Clearance not found");
  }

  const agencyClearance = clearance.clearances.find((c) => c.agency === agency);
  if (!agencyClearance) {
    throw new Error(`Agency ${agency} not found`);
  }

  agencyClearance.deficiencies.push({
    description,
    raisedBy,
    raisedAt: new Date(),
    status: "open",
    requiredDocuments: requiredDocuments || [],
  });

  await clearance.save();
  return clearance;
}

/**
 * Resolve deficiency
 */
async function resolveDeficiency(
  clearanceId,
  agency,
  deficiencyId,
  { resolvedBy, resolutionNotes, uploadedDocuments },
) {
  const clearance = await Clearance.findById(clearanceId);
  if (!clearance) {
    throw new Error("Clearance not found");
  }

  const agencyClearance = clearance.clearances.find((c) => c.agency === agency);
  if (!agencyClearance) {
    throw new Error(`Agency ${agency} not found`);
  }

  const deficiency = agencyClearance.deficiencies.id(deficiencyId);
  if (!deficiency) {
    throw new Error("Deficiency not found");
  }

  deficiency.status = "resolved";
  deficiency.resolvedBy = resolvedBy;
  deficiency.resolvedAt = new Date();
  deficiency.resolutionNotes = resolutionNotes;

  if (uploadedDocuments && uploadedDocuments.length > 0) {
    deficiency.uploadedDocuments = uploadedDocuments.map((doc) => ({
      ...doc,
      uploadedAt: new Date(),
      uploadedBy: resolvedBy,
    }));
  }

  await clearance.save();
  return clearance;
}

/**
 * Get agency work queue
 */
async function getAgencyQueue(
  agency,
  { status = "PENDING", page = 1, limit = 20 },
) {
  const query = {
    "clearances.agency": agency,
    "clearances.status": status,
  };

  const skip = (page - 1) * limit;

  const clearances = await Clearance.find(query)
    .populate("businessId", "businessName applicationStatus userId")
    .sort({ "clearances.submittedAt": 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Clearance.countDocuments(query);

  return {
    items: clearances.map((c) => ({
      clearanceId: c._id,
      referenceNumber: c.referenceNumber,
      businessId: c.businessId?._id,
      businessName: c.businessId?.businessName,
      submittedAt: c.clearances.find((cl) => cl.agency === agency)?.submittedAt,
      status: c.clearances.find((cl) => cl.agency === agency)?.status,
      queuePosition: c.queuePosition,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get clearance timeline
 */
async function getClearanceTimeline(businessId) {
  const profile = await resolveBusinessProfile(businessId);
  const clearance = await Clearance.findOne(
    clearanceBusinessFilter(profile, businessId),
  )
    .select("stageHistory clearances startedAt completedAt")
    .lean();

  if (!clearance) {
    return null;
  }

  return {
    startedAt: clearance.startedAt,
    completedAt: clearance.completedAt,
    totalDuration: clearance.completedAt
      ? Math.round(
          (new Date(clearance.completedAt) - new Date(clearance.startedAt)) /
            (1000 * 60 * 60 * 24),
        )
      : null,
    stages: clearance.stageHistory,
    agencyStages: clearance.clearances.map((c) => ({
      agency: c.agency,
      status: c.status,
      submittedAt: c.submittedAt,
      reviewedAt: c.reviewedAt,
      duration:
        c.reviewStartedAt && c.reviewedAt
          ? Math.round(
              (new Date(c.reviewedAt) - new Date(c.reviewStartedAt)) /
                (1000 * 60 * 60),
            )
          : null,
    })),
  };
}

/**
 * Get next pending agency
 */
async function getNextPendingAgency(businessId) {
  const profile = await resolveBusinessProfile(businessId);
  const clearance = await Clearance.findOne(
    clearanceBusinessFilter(profile, businessId),
  );
  if (!clearance) {
    return null;
  }

  return clearance.getNextPendingAgency();
}

/**
 * Send notification
 */
async function sendNotification(
  businessId,
  { type, content, recipientId, sentBy },
) {
  const profile = await resolveBusinessProfile(businessId);
  const clearance = await Clearance.findOne(
    clearanceBusinessFilter(profile, businessId),
  );
  if (!clearance) {
    throw new Error("Clearance not found");
  }

  clearance.notificationsSent.push({
    type,
    content,
    recipient: recipientId,
    sentAt: new Date(),
  });

  await clearance.save();
  return clearance;
}

/**
 * Get all clearances by business
 */
async function getClearancesByBusiness(businessId) {
  const profile = await resolveBusinessProfile(businessId);
  return await Clearance.find(clearanceBusinessFilter(profile, businessId))
    .populate("businessId", "businessName applicationStatus")
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  initiateClearance,
  getClearanceStatus,
  submitToAgency,
  startAgencyReview,
  approveAgencyClearance,
  rejectAgencyClearance,
  raiseDeficiency,
  resolveDeficiency,
  getAgencyQueue,
  getClearanceTimeline,
  getNextPendingAgency,
  sendNotification,
  getClearancesByBusiness,
  AGENCY_ORDER,
  REQUIRED_AGENCIES,
};
