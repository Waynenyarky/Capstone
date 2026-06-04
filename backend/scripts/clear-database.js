#!/usr/bin/env node

/**
 * Clear Database Script
 *
 * Drops all collections in the database (works for both local and Atlas)
 *
 * Usage:
 *   MONGO_URI=<your-connection-string> node backend/scripts/clear-database.js
 *
 * WARNING: This will permanently delete all data in the database!
 */

const mongoose = require("mongoose");

async function clearDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
  if (!mongoUri) {
    console.error("❌ MONGO_URI environment variable is required");
    process.exit(1);
  }

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    const dbName = mongoose.connection.name;
    console.log(`✅ Connected to database: ${dbName}`);

    // Get all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map((c) => c.name);

    if (collectionNames.length === 0) {
      console.log("✨ Database is already empty");
      return;
    }

    console.log(`\n📊 Found ${collectionNames.length} collections:`);
    collectionNames.forEach((name) => console.log(`  - ${name}`));

    console.log("\n🗑️  Dropping all collections...");

    // Drop each collection
    let droppedCount = 0;
    for (const collectionName of collectionNames) {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`  ✓ Dropped ${collectionName}`);
        droppedCount++;
      } catch (error) {
        console.error(`  ✗ Failed to drop ${collectionName}:`, error.message);
      }
    }

    console.log(
      `\n✅ Successfully dropped ${droppedCount}/${collectionNames.length} collections`,
    );
    console.log("🧹 Database cleared!");
  } catch (error) {
    console.error("❌ Error clearing database:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };
