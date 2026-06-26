#!/usr/bin/env node

/**
 * Script to clear all business applications and permit applications for testing
 * This script connects to the database and removes all Business and Application records
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import your models (adjust paths as needed)
const Business = require('../backend/models/Business');
const Application = require('../backend/services/business-service/src/models/Application');

async function clearBusinessApplications() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bizclear';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete all business records
    const businessResult = await Business.deleteMany({});
    console.log(`🗑️  Deleted ${businessResult.deletedCount} business records`);

    // Delete all application records
    const applicationResult = await Application.deleteMany({});
    console.log(`🗑️  Deleted ${applicationResult.deletedCount} application records`);

    console.log('✨ All business and application records cleared successfully!');
    console.log('🔄 You can now refresh the app to see the new user welcome modal');

  } catch (error) {
    console.error('❌ Error clearing records:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Ask for confirmation
console.log('⚠️  This will delete ALL business and application records from the database!');
console.log('📝 Are you sure you want to continue? (y/N)');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (key) => {
  if (key === 'y' || key === 'Y') {
    console.log('\n🚀 Clearing business and application records...');
    await clearBusinessApplications();
    process.exit(0);
  } else if (key === '\u0003' || key === 'n' || key === 'N') {
    console.log('\n❌ Operation cancelled');
    process.exit(0);
  } else {
    console.log('\n❌ Please press "y" to confirm or "n" to cancel');
  }
});
