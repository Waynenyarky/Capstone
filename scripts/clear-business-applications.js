#!/usr/bin/env node

/**
 * Script to clear all business applications for testing new user experience
 * This script connects to the database and removes all business records
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import your models (adjust paths as needed)
const Business = require('../backend/models/Business');

async function clearBusinessApplications() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bizclear';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete all business records
    const result = await Business.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} business applications`);

    // Optional: Also clear any related collections if needed
    // const formResult = await FormDefinition.deleteMany({});
    // console.log(`🗑️  Deleted ${formResult.deletedCount} form definitions`);

    console.log('✨ Business applications cleared successfully!');
    console.log('🔄 You can now refresh the app to see the new user welcome modal');

  } catch (error) {
    console.error('❌ Error clearing business applications:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Ask for confirmation
console.log('⚠️  This will delete ALL business applications from the database!');
console.log('📝 Are you sure you want to continue? (y/N)');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (key) => {
  if (key === 'y' || key === 'Y') {
    console.log('\n🚀 Clearing business applications...');
    await clearBusinessApplications();
    process.exit(0);
  } else if (key === '\u0003' || key === 'n' || key === 'N') {
    console.log('\n❌ Operation cancelled');
    process.exit(0);
  } else {
    console.log('\n❌ Please press "y" to confirm or "n" to cancel');
  }
});
