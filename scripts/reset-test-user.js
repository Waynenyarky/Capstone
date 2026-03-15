#!/usr/bin/env node

/**
 * Reset test user data - clear all businesses for a specific user
 * Usage: node scripts/reset-test-user.js [user-email]
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetUserBusinesses(userEmail) {
  try {
    // First, let's try to connect directly to the database
    console.log('🔌 Attempting direct database connection...');
    
    const mongoose = require('mongoose');
    const path = require('path');
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    
    const BusinessProfile = require('../backend/services/business-service/src/models/BusinessProfile');
    const User = require('../backend/services/business-service/src/models/User');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bizclear';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to database');
    
    // Find the user
    let user;
    if (userEmail) {
      user = await User.findOne({ email: userEmail });
    } else {
      // Get all users and let you choose
      const users = await User.find({ role: 'business_owner' }).limit(10);
      if (users.length === 0) {
        console.log('❌ No business owners found in database');
        return;
      }
      
      console.log('\n👥 Found business owners:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
      });
      
      const choice = await new Promise(resolve => {
        rl.question('\n🔢 Select user number (or press Enter for first): ', answer => {
          resolve(answer || '1');
        });
      });
      
      const userIndex = parseInt(choice) - 1;
      user = users[userIndex];
    }
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n👤 Found user: ${user.email}`);
    
    // Count their businesses
    const businessCount = await BusinessProfile.countDocuments({ userId: user._id });
    console.log(`📊 User has ${businessCount} business applications`);
    
    if (businessCount === 0) {
      console.log('✨ No businesses to clear - ready for testing!');
    } else {
      // Delete all businesses for this user
      const result = await BusinessProfile.deleteMany({ userId: user._id });
      console.log(`🗑️  Deleted ${result.deletedCount} business applications`);
      console.log('🎉 User data cleared! The welcome modal will appear on next login.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Use MongoDB Compass to manually delete records');
    console.log('   - Connect to your MongoDB instance');
    console.log('   - Find the bizclear database');
    console.log('   - Delete documents from businessprofiles collection');
  } finally {
    try {
      await mongoose.disconnect();
      rl.close();
    } catch (e) {
      // Ignore
    }
  }
}

// Run with optional email argument
const userEmail = process.argv[2];
resetUserBusinesses(userEmail);
