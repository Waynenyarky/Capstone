/**
 * Seed Fees, FeeGroups, and PenaltyRules
 *
 * Populates the new simplified fee system with basic examples from the backup data.
 * This is idempotent - can be run multiple times without creating duplicates.
 *
 * Usage:
 *   node backend/services/business-service/src/seed/seedFees.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
dotenv.config({
  path: path.resolve(__dirname, "..", "..", "..", "..", ".env"),
});

const Fee = require("../models/Fee");
const FeeGroup = require("../models/FeeGroup");
const PenaltyRule = require("../models/PenaltyRule");

// Basic fee examples based on General Trias Charter data
const FEES_SEED_DATA = [
  {
    name: "Mayor's Permit Fee",
    description: "Annual mayor's permit fee for business registration",
    amount: 500,
    category: "permit",
  },
  {
    name: "Environmental Protection Fee",
    description: "Annual environmental protection fee",
    amount: 200,
    category: "regulatory",
  },
  {
    name: "Barangay Clearance Fee",
    description: "Barangay business clearance fee",
    amount: 100,
    category: "regulatory",
  },
  {
    name: "Sanitary Inspection Fee",
    description: "Sanitary permit inspection fee",
    amount: 150,
    category: "regulatory",
  },
  {
    name: "Fire Safety Fee",
    description: "Fire safety inspection fee (BFP)",
    amount: 300,
    category: "regulatory",
  },
  {
    name: "Business Plate Fee",
    description: "Business nameplate fee",
    amount: 50,
    category: "permit",
  },
  {
    name: "Zoning Clearance Fee",
    description: "Zoning clearance processing fee",
    amount: 100,
    category: "regulatory",
  },
  {
    name: "Health Inspection Fee",
    description: "Health department inspection fee",
    amount: 200,
    category: "regulatory",
  },
];

// Basic fee group examples
const FEE_GROUPS_SEED_DATA = [
  {
    name: "New Business Permit",
    description: "Complete fee package for new business registration",
    fees: ["Mayor's Permit Fee", "Sanitary Inspection Fee", "Fire Safety Fee"],
  },
  {
    name: "Renewal Package",
    description: "Standard renewal fee package",
    fees: ["Mayor's Permit Fee", "Sanitary Inspection Fee"],
  },
];

// Basic penalty rule examples
const PENALTY_RULES_SEED_DATA = [
  {
    name: "Late Renewal Surcharge",
    description: "Surcharge for late business permit renewal",
    amount: 500,
    category: "late_renewal",
  },
  {
    name: "Violation Penalty",
    description: "Standard penalty for business violations",
    amount: 1000,
    category: "violation",
  },
  {
    name: "Administrative Fee",
    description: "Administrative processing fee for penalties",
    amount: 200,
    category: "other",
  },
];

async function seed() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/bplo";
  console.log(
    `Connecting to MongoDB: ${mongoUri.replace(/\/\/[^@]+@/, "//<credentials>@")}`,
  );
  await mongoose.connect(mongoUri);

  let totalUpserted = 0;
  let totalSkipped = 0;

  // Seed Fees
  console.log("\nSeeding Fees...");
  for (const feeData of FEES_SEED_DATA) {
    const result = await Fee.updateOne(
      { name: feeData.name, isActive: true },
      {
        $setOnInsert: {
          ...feeData,
          isActive: true,
          version: 1,
          effectiveDate: new Date(),
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount > 0) {
      totalUpserted++;
      console.log(`  + Seeded: ${feeData.name} (₱${feeData.amount})`);
    } else {
      totalSkipped++;
      console.log(`  = Skipped (exists): ${feeData.name}`);
    }
  }

  // Seed Fee Groups
  console.log("\nSeeding Fee Groups...");
  for (const groupData of FEE_GROUPS_SEED_DATA) {
    // Find fee IDs for the group
    const feeDocs = await Fee.find({ name: { $in: groupData.fees }, isActive: true });
    if (feeDocs.length !== groupData.fees.length) {
      console.log(`  ! Skipped: ${groupData.name} (missing fees)`);
      continue;
    }

    const feeIds = feeDocs.map((f) => f._id);
    const result = await FeeGroup.updateOne(
      { name: groupData.name, isActive: true },
      {
        $setOnInsert: {
          ...groupData,
          fees: feeIds,
          isActive: true,
          version: 1,
          effectiveDate: new Date(),
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount > 0) {
      totalUpserted++;
      console.log(`  + Seeded: ${groupData.name} (${feeIds.length} fees)`);
    } else {
      totalSkipped++;
      console.log(`  = Skipped (exists): ${groupData.name}`);
    }
  }

  // Seed Penalty Rules
  console.log("\nSeeding Penalty Rules...");
  for (const penaltyData of PENALTY_RULES_SEED_DATA) {
    const result = await PenaltyRule.updateOne(
      { name: penaltyData.name, isActive: true },
      {
        $setOnInsert: {
          ...penaltyData,
          isActive: true,
          version: 1,
          effectiveDate: new Date(),
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount > 0) {
      totalUpserted++;
      console.log(`  + Seeded: ${penaltyData.name} (₱${penaltyData.amount})`);
    } else {
      totalSkipped++;
      console.log(`  = Skipped (exists): ${penaltyData.name}`);
    }
  }

  console.log(`\nDone. Total Seeded: ${totalUpserted}, Total Skipped: ${totalSkipped}`);
  await mongoose.disconnect();
}

/**
 * Seed fees if the collections are empty.
 * Safe to call during startup — assumes mongoose is already connected.
 *
 * @returns {{ seeded: boolean, count?: number, error?: string }}
 */
async function seedIfEmpty() {
  try {
    const feeCount = await Fee.countDocuments({});
    const feeGroupCount = await FeeGroup.countDocuments({});
    const penaltyRuleCount = await PenaltyRule.countDocuments({});

    if (feeCount > 0 || feeGroupCount > 0 || penaltyRuleCount > 0) {
      return {
        seeded: false,
        feeCount,
        feeGroupCount,
        penaltyRuleCount,
      };
    }

    let totalUpserted = 0;

    // Seed Fees
    for (const feeData of FEES_SEED_DATA) {
      const result = await Fee.updateOne(
        { name: feeData.name, isActive: true },
        {
          $setOnInsert: {
            ...feeData,
            isActive: true,
            version: 1,
            effectiveDate: new Date(),
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount > 0) totalUpserted++;
    }

    // Seed Fee Groups
    for (const groupData of FEE_GROUPS_SEED_DATA) {
      const feeDocs = await Fee.find({ name: { $in: groupData.fees }, isActive: true });
      if (feeDocs.length !== groupData.fees.length) continue;

      const feeIds = feeDocs.map((f) => f._id);
      const result = await FeeGroup.updateOne(
        { name: groupData.name, isActive: true },
        {
          $setOnInsert: {
            ...groupData,
            fees: feeIds,
            isActive: true,
            version: 1,
            effectiveDate: new Date(),
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount > 0) totalUpserted++;
    }

    // Seed Penalty Rules
    for (const penaltyData of PENALTY_RULES_SEED_DATA) {
      const result = await PenaltyRule.updateOne(
        { name: penaltyData.name, isActive: true },
        {
          $setOnInsert: {
            ...penaltyData,
            isActive: true,
            version: 1,
            effectiveDate: new Date(),
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount > 0) totalUpserted++;
    }

    return { seeded: true, count: totalUpserted };
  } catch (error) {
    return { seeded: false, error: error.message };
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed, seedIfEmpty };
