#!/usr/bin/env node

/**
 * Database Diagnostic Script
 *
 * Usage:
 *   MONGO_URI=mongodb://capstone_app:devapppass@localhost:27017/capstone_project?authSource=admin node backend/scripts/check-database.js
 *
 * This script checks:
 * - Total number of users and their roles
 * - Number of business owners
 * - Number of business profiles with applications
 * - Application statuses
 * - Recent applications
 */

const mongoose = require("mongoose");

// Load models
const User = require("../services/auth-service/src/models/User");
const BusinessProfile = require("../services/admin-service/src/models/BusinessProfile");

async function checkDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
  if (!mongoUri) {
    console.error("❌ MONGO_URI environment variable is required");
    process.exit(1);
  }

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to database:", mongoose.connection.name);

    console.log("\n=== USERS ===");

    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users: ${totalUsers}`);

    // Check users by role
    const usersByRole = await User.aggregate([
      { $unwind: "$role" },
      { $group: { _id: "$role.slug", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n👥 Users by role:");
    usersByRole.forEach((r) => {
      console.log(`  ${r._id || "no-role"}: ${r.count}`);
    });

    // Business owners specifically
    const businessOwners = await User.find({ "role.slug": "business_owner" })
      .select("firstName lastName email role createdAt")
      .lean();

    console.log(`\n🏢 Business Owners (${businessOwners.length}):`);
    businessOwners.forEach((owner, i) => {
      console.log(
        `  ${i + 1}. ${owner.firstName} ${owner.lastName} - ${owner.email} - Created: ${owner.createdAt?.toISOString()}`,
      );
    });

    console.log("\n=== BUSINESS PROFILES ===");

    // Check business profiles
    const totalProfiles = await BusinessProfile.countDocuments();
    console.log(`📊 Total business profiles: ${totalProfiles}`);

    // Profiles with businesses
    const profilesWithBusinesses = await BusinessProfile.countDocuments({
      businesses: { $exists: true, $ne: [] },
    });
    console.log(`📊 Profiles with businesses: ${profilesWithBusinesses}`);

    console.log("\n=== APPLICATIONS ===");

    // Check all businesses in all profiles
    const allBusinesses = await BusinessProfile.aggregate([
      { $unwind: "$businesses" },
      {
        $project: {
          userId: 1,
          businessId: "$businesses.businessId",
          businessName: "$businesses.businessName",
          applicationStatus: "$businesses.applicationStatus",
          applicationReferenceNumber: "$businesses.applicationReferenceNumber",
          submittedAt: "$businesses.submittedAt",
          submittedToLguOfficer: "$businesses.submittedToLguOfficer",
          isSubmitted: "$businesses.isSubmitted",
          reviewedBy: "$businesses.reviewedBy",
          createdAt: "$businesses.createdAt",
          updatedAt: "$businesses.updatedAt",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    console.log(`📊 Total business applications: ${allBusinesses.length}`);

    // Applications by status
    const appsByStatus = allBusinesses.reduce((acc, app) => {
      const status = app.applicationStatus || "no-status";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📋 Applications by status:");
    Object.entries(appsByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Submitted applications (what LGU officer should see)
    const submittedApps = allBusinesses.filter((app) =>
      ["submitted", "under_review", "resubmit"].includes(app.applicationStatus),
    );

    console.log(
      `\n✅ Submitted applications (should be visible to LGU officer): ${submittedApps.length}`,
    );

    if (submittedApps.length > 0) {
      console.log("\n📝 Recent submitted applications:");
      submittedApps.slice(0, 5).forEach((app, i) => {
        console.log(
          `  ${i + 1}. ${app.businessName || "No Name"} - ${app.applicationStatus}`,
        );
        console.log(`     Ref: ${app.applicationReferenceNumber || "No Ref"}`);
        console.log(
          `     Submitted: ${app.submittedAt?.toISOString() || "No date"}`,
        );
        console.log(`     To LGU: ${app.submittedToLguOfficer}`);
        console.log(`     User ID: ${app.userId}`);
        console.log("");
      });
    }

    // Check for any applications that might be missing status
    const noStatusApps = allBusinesses.filter((app) => !app.applicationStatus);
    if (noStatusApps.length > 0) {
      console.log(`⚠️  Applications without status: ${noStatusApps.length}`);
      noStatusApps.slice(0, 3).forEach((app) => {
        console.log(
          `  - ${app.businessName || "No Name"} (ID: ${app.businessId})`,
        );
      });
    }

    console.log("\n=== RECENT ACTIVITY ===");

    // Most recent applications
    const recentApps = allBusinesses.slice(0, 10);
    if (recentApps.length > 0) {
      console.log("🕒 10 most recent applications:");
      recentApps.forEach((app, i) => {
        console.log(
          `  ${i + 1}. ${app.businessName || "No Name"} - ${app.applicationStatus || "no-status"} - ${app.createdAt?.toISOString()}`,
        );
      });
    }

    console.log("\n=== DIAGNOSTIC COMPLETE ===");
  } catch (error) {
    console.error("❌ Error checking database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };
