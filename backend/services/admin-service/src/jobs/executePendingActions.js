/**
 * Execute expired pending actions
 * Runs every minute to check for pending actions that have expired and execute them
 */

const logger = require("../lib/logger");
const permitApplicationService = require("../services/permitApplicationService");

/**
 * Find and execute all expired pending actions
 */
async function executePendingActions() {
  try {
    const BusinessProfile = require("../models/BusinessProfile");

    // Find all businesses with pending actions that have expired
    const now = new Date();
    const profiles = await BusinessProfile.find({
      "businesses.pendingAction.expiresAt": { $lte: now },
    }).lean();

    if (profiles.length === 0) {
      return;
    }

    logger.info(`Found ${profiles.length} pending actions to execute`);

    for (const profile of profiles) {
      for (const business of profile.businesses) {
        if (business.pendingAction && business.pendingAction.expiresAt <= now) {
          try {
            const applicationId = business.applicationId || business.businessId || business._id;
            const businessId = business.businessId;
            
            logger.info(`Executing pending action for application ${applicationId}: ${business.pendingAction.actionType}`);
            
            await permitApplicationService.executePendingAction(applicationId, businessId);
            
            logger.info(`Successfully executed pending action for application ${applicationId}`);
          } catch (error) {
            logger.error(`Failed to execute pending action for application ${business.applicationId || business.businessId}`, { error });
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error in executePendingActions job", { error });
  }
}

module.exports = executePendingActions;
