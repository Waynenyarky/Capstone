const mongoose = require("mongoose");
const User = require("../../services/auth-service/src/models/User");
const AuditLog = require("../../services/audit-service/src/models/AuditLog");
const AdminApproval = require("../../services/auth-service/src/models/AdminApproval");
const EmailChangeRequest = require("../../services/auth-service/src/models/EmailChangeRequest");
const ResetRequest = require("../../services/auth-service/src/models/ResetRequest");
const DeleteRequest = require("../../services/auth-service/src/models/DeleteRequest");
const RecoveryRequest = require("../../services/auth-service/src/models/RecoveryRequest");
const TemporaryCredential = require("../../services/auth-service/src/models/TemporaryCredential");
const Session = require("../../services/auth-service/src/models/Session");

/**
 * Clean up all test users (users with test email pattern)
 */
async function cleanupTestUsers() {
  try {
    await User.deleteMany({
      email: { $regex: /@example\.com$/, $options: "i" },
    });
  } catch (error) {
    console.error("Error cleaning up test users:", error);
  }
}

/**
 * Clean up all test-created data
 */
async function cleanupTestData() {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      let retries = 0;
      while (mongoose.connection.readyState !== 1 && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (mongoose.connection.readyState !== 1) {
        console.warn("Mongoose connection not ready, skipping cleanup");
        return;
      }
    }

    // Clean up in order to respect foreign key constraints
    // Use Promise.allSettled to continue even if one fails
    await Promise.allSettled([
      AuditLog.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up AuditLog:", err.message);
      }),
      AdminApproval.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up AdminApproval:", err.message);
      }),
      EmailChangeRequest.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up EmailChangeRequest:", err.message);
      }),
      ResetRequest.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up ResetRequest:", err.message);
      }),
      DeleteRequest.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up DeleteRequest:", err.message);
      }),
      RecoveryRequest.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up RecoveryRequest:", err.message);
      }),
      TemporaryCredential.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up TemporaryCredential:", err.message);
      }),
      Session.deleteMany({}).catch((err) => {
        console.warn("Error cleaning up Session:", err.message);
      }),
    ]);

    await cleanupTestUsers();
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
}

/**
 * Clean up database (all collections except roles)
 */
async function cleanupDatabase() {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== "roles") {
        await collections[key].deleteMany({});
      }
    }
  } catch (error) {
    console.error("Error cleaning up database:", error);
  }
}

/**
 * Reset database to initial state
 */
async function resetDatabase() {
  try {
    await cleanupDatabase();
    // Re-seed if needed
    try {
      const {
        seedDevDataIfEmpty,
      } = require("../../services/auth-service/src/lib/seedDev");
      await seedDevDataIfEmpty();
    } catch {
      // seedDev may not exist, that's okay
    }
  } catch (error) {
    console.error("Error resetting database:", error);
  }
}

module.exports = {
  cleanupTestUsers,
  cleanupTestData,
  cleanupDatabase,
  resetDatabase,
};
