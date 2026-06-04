/**
 * Abandoned Business Detection Cron Job
 *
 * Runs monthly to detect businesses that haven't renewed their permits.
 * Flags them as potentially abandoned and creates inspector verification tasks.
 */
const mongoose = require("mongoose");
const BusinessProfile = require("../models/BusinessProfile");
const logger = require("../lib/logger");

function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || "");
  const clauses = [{ "businesses.businessId": target }];
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ "businesses._id": new mongoose.Types.ObjectId(target) });
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

/**
 * Detect businesses that are overdue for renewal (no renewal submitted for current year
 * after a configurable grace period, e.g., 3 months past January deadline).
 */
async function detectAbandonedBusinesses() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const GRACE_MONTHS = 3; // Flag after March if no renewal submitted

  if (currentMonth <= GRACE_MONTHS) {
    logger.info("[Abandoned Cron] Still within grace period, skipping");
    return { flagged: 0, reason: "within_grace_period" };
  }

  logger.info(
    `[Abandoned Cron] Checking for abandoned businesses (year: ${currentYear})`,
  );

  try {
    const profiles = await BusinessProfile.find({
      "businesses.businessStatus": "active",
    });

    let flagged = 0;
    const abandonedBusinesses = [];

    for (const profile of profiles) {
      for (const business of profile.businesses) {
        if (business.businessStatus !== "active") continue;
        // Skip businesses with pending retirement
        if (
          business.retirementStatus &&
          ["requested", "confirmed"].includes(business.retirementStatus)
        )
          continue;

        // Check if renewal exists for current year
        const hasRenewal = (business.renewals || []).some(
          (r) => r.renewalYear === currentYear && r.renewalStatus !== "draft",
        );

        if (!hasRenewal) {
          abandonedBusinesses.push({
            userId: profile.userId,
            businessId: business.businessId,
            businessName:
              business.businessName || business.registeredBusinessName || "N/A",
          });
          flagged++;
        }
      }
    }

    logger.info(
      `[Abandoned Cron] Found ${flagged} potentially abandoned businesses`,
    );
    return { flagged, businesses: abandonedBusinesses };
  } catch (err) {
    logger.error("[Abandoned Cron] Error detecting abandoned businesses:", {
      error: err.message,
    });
    throw err;
  }
}

/**
 * Mark a business as abandoned after inspector verification.
 */
async function markBusinessAbandoned(businessId, inspectorId) {
  try {
    const profile = await BusinessProfile.findOne(
      buildBusinessLookupQuery(businessId),
    );
    if (!profile) throw new Error("Business not found");

    const business = profile.businesses.find(
      (b) => b.businessId === businessId || String(b._id) === businessId,
    );
    if (!business) throw new Error("Business not found");

    business.businessStatus = "inactive";
    business.updatedAt = new Date();

    await profile.save();
    logger.info(
      `[Abandoned] Business ${businessId} marked as inactive by inspector ${inspectorId}`,
    );
    return { businessId, status: "inactive" };
  } catch (err) {
    logger.error("[Abandoned] Error marking business:", {
      businessId,
      error: err.message,
    });
    throw err;
  }
}

module.exports = {
  detectAbandonedBusinesses,
  markBusinessAbandoned,
};
