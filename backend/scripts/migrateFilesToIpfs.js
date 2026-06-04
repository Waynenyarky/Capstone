/**
 * Migration Script: Migrate Files to IPFS
 *
 * This script migrates existing files from the local filesystem (/uploads/) to IPFS
 * and updates MongoDB records with IPFS CIDs while maintaining backward compatibility.
 *
 * Usage:
 *   node scripts/migrateFilesToIpfs.js [--dry-run] [--service=auth|business]
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");
const crypto = require("crypto");

// Import IPFS service (try both services)
let ipfsService = null;
try {
  ipfsService = require("../services/auth-service/src/lib/ipfsService");
} catch (err) {
  try {
    ipfsService = require("../services/business-service/src/lib/ipfsService");
  } catch (err2) {
    console.error("❌ IPFS service not found. Make sure IPFS is set up.");
    process.exit(1);
  }
}

// Import models
const User = require("../services/auth-service/src/models/User");
const BusinessProfile = require("../services/business-service/src/models/BusinessProfile");

const DRY_RUN = process.argv.includes("--dry-run");
const SERVICE_FILTER = process.argv
  .find((arg) => arg.startsWith("--service="))
  ?.split("=")[1];

/**
 * Calculate SHA256 hash of file
 */
async function calculateFileHash(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Migrate avatar files to IPFS
 */
async function migrateAvatars() {
  console.log("\n📸 Migrating avatar files to IPFS...");

  const uploadsDir = path.join(__dirname, "..", "uploads", "avatars");
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all users with avatarUrl
    const users = await User.find({ avatarUrl: { $ne: "", $exists: true } });
    console.log(`   Found ${users.length} users with avatars`);

    for (const user of users) {
      try {
        // Skip if already has IPFS CID
        if (user.avatarIpfsCid) {
          skipped++;
          continue;
        }

        const avatarPath = user.avatarUrl.replace("/uploads/", "");
        const fullPath = path.join(__dirname, "..", "uploads", avatarPath);

        // Check if file exists
        try {
          await fs.access(fullPath);
        } catch {
          console.warn(`   ⚠️  File not found: ${fullPath}`);
          errors++;
          continue;
        }

        // Read file
        const fileBuffer = await fs.readFile(fullPath);
        const fileName = path.basename(fullPath);

        if (DRY_RUN) {
          console.log(`   [DRY RUN] Would migrate: ${fileName} (${user._id})`);
          migrated++;
          continue;
        }

        // Upload to IPFS
        const { cid } = await ipfsService.uploadFile(fileBuffer, fileName);
        await ipfsService.pinFile(cid).catch((err) => {
          console.warn(`   ⚠️  Failed to pin file: ${cid}`, err.message);
        });

        // Update user record
        user.avatarIpfsCid = cid;
        await user.save();

        console.log(`   ✅ Migrated: ${fileName} → ${cid}`);
        migrated++;
      } catch (error) {
        console.error(
          `   ❌ Error migrating avatar for user ${user._id}:`,
          error.message,
        );
        errors++;
      }
    }

    console.log(
      `   ✅ Avatars: ${migrated} migrated, ${skipped} skipped, ${errors} errors`,
    );
  } catch (error) {
    console.error("❌ Error in avatar migration:", error);
  }

  return { migrated, skipped, errors };
}

/**
 * Migrate business registration documents to IPFS
 */
async function migrateBusinessDocuments() {
  console.log("\n📄 Migrating business registration documents to IPFS...");

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const profiles = await BusinessProfile.find();
    console.log(`   Found ${profiles.length} business profiles`);

    for (const profile of profiles) {
      try {
        if (!profile.businesses || profile.businesses.length === 0) {
          continue;
        }

        for (const business of profile.businesses) {
          // Migrate LGU documents
          const lguDocs = business.lguDocuments || {};
          const lguDocFields = [
            { field: "idPicture", ipfsField: "idPictureIpfsCid" },
            { field: "ctc", ipfsField: "ctcIpfsCid" },
            {
              field: "barangayClearance",
              ipfsField: "barangayClearanceIpfsCid",
            },
            { field: "dtiSecCda", ipfsField: "dtiSecCdaIpfsCid" },
            { field: "leaseOrLandTitle", ipfsField: "leaseOrLandTitleIpfsCid" },
            { field: "occupancyPermit", ipfsField: "occupancyPermitIpfsCid" },
            {
              field: "healthCertificate",
              ipfsField: "healthCertificateIpfsCid",
            },
          ];

          for (const docField of lguDocFields) {
            const url = lguDocs[docField.field];
            if (url && !lguDocs[docField.ipfsField]) {
              const docPath = url.replace("/uploads/", "");
              const fullPath = path.join(__dirname, "..", "uploads", docPath);

              try {
                await fs.access(fullPath);
                const fileBuffer = await fs.readFile(fullPath);
                const fileName = path.basename(fullPath);

                if (DRY_RUN) {
                  console.log(
                    `   [DRY RUN] Would migrate: ${fileName} (${docField.field})`,
                  );
                } else {
                  const { cid } = await ipfsService.uploadFile(
                    fileBuffer,
                    fileName,
                  );
                  await ipfsService.pinFile(cid).catch((err) => {
                    console.warn(
                      `   ⚠️  Failed to pin file: ${cid}`,
                      err.message,
                    );
                  });
                  lguDocs[docField.ipfsField] = cid;
                  console.log(`   ✅ Migrated: ${fileName} → ${cid}`);
                }
                migrated++;
              } catch (error) {
                console.warn(`   ⚠️  File not found: ${fullPath}`);
                errors++;
              }
            } else if (lguDocs[docField.ipfsField]) {
              skipped++;
            }
          }

          // Migrate BIR documents
          const birDocs = business.birRegistration || {};
          const birDocFields = [
            { field: "certificateUrl", ipfsField: "certificateIpfsCid" },
            {
              field: "booksOfAccountsUrl",
              ipfsField: "booksOfAccountsIpfsCid",
            },
            {
              field: "authorityToPrintUrl",
              ipfsField: "authorityToPrintIpfsCid",
            },
            { field: "paymentReceiptUrl", ipfsField: "paymentReceiptIpfsCid" },
          ];

          for (const docField of birDocFields) {
            const url = birDocs[docField.field];
            if (url && !birDocs[docField.ipfsField]) {
              const docPath = url.replace("/uploads/", "");
              const fullPath = path.join(__dirname, "..", "uploads", docPath);

              try {
                await fs.access(fullPath);
                const fileBuffer = await fs.readFile(fullPath);
                const fileName = path.basename(fullPath);

                if (DRY_RUN) {
                  console.log(
                    `   [DRY RUN] Would migrate: ${fileName} (${docField.field})`,
                  );
                } else {
                  const { cid } = await ipfsService.uploadFile(
                    fileBuffer,
                    fileName,
                  );
                  await ipfsService.pinFile(cid).catch((err) => {
                    console.warn(
                      `   ⚠️  Failed to pin file: ${cid}`,
                      err.message,
                    );
                  });
                  birDocs[docField.ipfsField] = cid;
                  console.log(`   ✅ Migrated: ${fileName} → ${cid}`);
                }
                migrated++;
              } catch (error) {
                console.warn(`   ⚠️  File not found: ${fullPath}`);
                errors++;
              }
            } else if (birDocs[docField.ipfsField]) {
              skipped++;
            }
          }
        }

        if (!DRY_RUN && profile.isModified()) {
          await profile.save();
        }
      } catch (error) {
        console.error(
          `   ❌ Error migrating business profile ${profile._id}:`,
          error.message,
        );
        errors++;
      }
    }

    console.log(
      `   ✅ Business Documents: ${migrated} migrated, ${skipped} skipped, ${errors} errors`,
    );
  } catch (error) {
    console.error("❌ Error in business document migration:", error);
  }

  return { migrated, skipped, errors };
}

/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting file migration to IPFS...");
  console.log(
    `   Mode: ${DRY_RUN ? "DRY RUN (no changes will be made)" : "LIVE (changes will be saved)"}`,
  );
  console.log(`   Service Filter: ${SERVICE_FILTER || "all"}`);

  // Check IPFS availability
  if (!ipfsService.isAvailable()) {
    console.error(
      "❌ IPFS service is not available. Please start IPFS node or configure IPFS provider.",
    );
    process.exit(1);
  }

  // Connect to MongoDB
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!mongoUri) {
    console.error("❌ MONGO_URI not set in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const results = {
      avatars: { migrated: 0, skipped: 0, errors: 0 },
      idDocuments: { migrated: 0, skipped: 0, errors: 0 },
      businessDocuments: { migrated: 0, skipped: 0, errors: 0 },
    };

    // Migrate based on service filter
    if (!SERVICE_FILTER || SERVICE_FILTER === "auth") {
      results.avatars = await migrateAvatars();
    }

    if (!SERVICE_FILTER || SERVICE_FILTER === "business") {
      results.businessDocuments = await migrateBusinessDocuments();
    }

    // Summary
    console.log("\n📊 Migration Summary:");
    console.log("   Avatars:", results.avatars);
    console.log("   ID Documents:", results.idDocuments);
    console.log("   Business Documents:", results.businessDocuments);

    const total = {
      migrated:
        results.avatars.migrated +
        results.idDocuments.migrated +
        results.businessDocuments.migrated,
      skipped:
        results.avatars.skipped +
        results.idDocuments.skipped +
        results.businessDocuments.skipped,
      errors:
        results.avatars.errors +
        results.idDocuments.errors +
        results.businessDocuments.errors,
    };

    console.log("\n   Total:", total);
    console.log(
      `\n${DRY_RUN ? "✅ Dry run completed. Use without --dry-run to apply changes." : "✅ Migration completed!"}`,
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { main, migrateAvatars, migrateBusinessDocuments };
