#!/usr/bin/env node
/**
 * Reset MFA state for an admin (or staff) account so they can log in again and complete MFA setup.
 * Use when an admin is locked out after failing to complete MFA setup.
 *
 * Usage (from repo root):
 *   node backend/scripts/reset-admin-mfa.js [email]
 *
 * Examples:
 *   node backend/scripts/reset-admin-mfa.js 1
 *   node backend/scripts/reset-admin-mfa.js admin@example.com
 *
 * Requires MongoDB in .env (MONGODB_URI or MONGO_URI).
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");

async function main() {
  const email = process.argv[2] || "1";
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("Set MONGODB_URI or MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const User = require("../services/auth-service/src/models/User");
  const Role = require("../services/auth-service/src/models/Role");

  const adminRole = await Role.findOne({ slug: "admin" }).lean();
  if (!adminRole) {
    console.error("Admin role not found in DB");
    await mongoose.disconnect();
    process.exit(1);
  }

  const emailKey = String(email).trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: emailKey }, ...(emailKey === "1" ? [{ email: "1" }] : [])],
    role: adminRole._id,
  });

  if (!user) {
    console.error("No admin user found for:", email);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.mfaSecret = undefined;
  user.mfaEnabled = false;
  user.mfaMethod = "";
  user.mustSetupMfa = true;
  await user.save();

  console.log("MFA reset for admin:", user.email);
  console.log("They can log in again and will be prompted to set up MFA.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
