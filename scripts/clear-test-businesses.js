#!/usr/bin/env node

/**
 * Quick script to clear all business applications for testing
 * Usage: node scripts/clear-test-businesses.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the BusinessProfile model from the business service
const BusinessProfile = require('../backend/services/business-service/src/models/BusinessProfile');

async function clearBusinesses() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Connect using the same method as the business service
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bizclear';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to database');
    
    // Count businesses before deletion
    const count = await BusinessProfile.countDocuments();
    console.log(`📊 Found ${count} business applications`);
    
    if (count === 0) {
      console.log('✨ No businesses to clear - you\'re ready for testing!');
      await mongoose.disconnect();
      return;
    }
    
    // Delete all businesses
    const result = await BusinessProfile.deleteMany({});
    console.log(`🗑️  Successfully deleted ${result.deletedCount} business applications`);
    
    console.log('🎉 Ready for testing! The welcome modal will now appear for new users.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.log('💡 Make sure you\'re running this from the project root');
    }
  } finally {
    try {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(0);
  }
}

// Run the cleanup
clearBusinesses();
