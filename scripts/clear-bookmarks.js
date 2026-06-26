#!/usr/bin/env node

/**
 * Script to clear all bookmarks for testing
 * This script connects to the database and removes all bookmark records
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import your models (adjust paths as needed)
const Bookmark = require('../backend/services/business-service/src/models/Bookmark');

async function clearBookmarks() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bizclear';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete all bookmark records
    const result = await Bookmark.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} bookmark records`);

    console.log('✨ All bookmarks cleared successfully!');

  } catch (error) {
    console.error('❌ Error clearing bookmarks:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Ask for confirmation
console.log('⚠️  This will delete ALL bookmarks from the database!');
console.log('📝 Are you sure you want to continue? (y/N)');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (key) => {
  if (key === 'y' || key === 'Y') {
    console.log('\n🚀 Clearing bookmarks...');
    await clearBookmarks();
    process.exit(0);
  } else if (key === '\u0003' || key === 'n' || key === 'N') {
    console.log('\n❌ Operation cancelled');
    process.exit(0);
  } else {
    console.log('\n❌ Please press "y" to confirm or "n" to cancel');
  }
});
