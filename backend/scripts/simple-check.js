#!/usr/bin/env node

/**
 * Simple database check through admin-service
 * 
 * Usage: docker exec capstone-admin-service node /app/scripts/simple-check.js
 */

const mongoose = require('mongoose');

async function checkData() {
  try {
    console.log('🔗 Using existing MongoDB connection...');
    
    // Check users
    const User = require('./src/models/User');
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users: ${totalUsers}`);
    
    // Check business owners
    const businessOwners = await User.find({ 'role.slug': 'business_owner' })
      .select('firstName lastName email createdAt')
      .limit(5)
      .lean();
    
    console.log(`\n🏢 Business Owners (showing up to 5):`);
    businessOwners.forEach((owner, i) => {
      console.log(`  ${i + 1}. ${owner.firstName} ${owner.lastName} - ${owner.email}`);
    });
    
    // Check business profiles
    const BusinessProfile = require('./src/models/BusinessProfile');
    const totalProfiles = await BusinessProfile.countDocuments();
    console.log(`\n📊 Total business profiles: ${totalProfiles}`);
    
    // Check applications
    const apps = await BusinessProfile.aggregate([
      { $unwind: '$businesses' },
      { $project: {
        businessName: '$businesses.businessName',
        applicationStatus: '$businesses.applicationStatus',
        submittedAt: '$businesses.submittedAt',
        submittedToLguOfficer: '$businesses.submittedToLguOfficer'
      }},
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);
    
    console.log(`\n📝 Recent applications (up to 10):`);
    apps.forEach((app, i) => {
      console.log(`  ${i + 1}. ${app.businessName || 'No Name'} - ${app.applicationStatus || 'no-status'}`);
      console.log(`     Submitted: ${app.submittedAt?.toISOString() || 'No date'}`);
      console.log(`     To LGU: ${app.submittedToLguOfficer}`);
      console.log('');
    });
    
    // Count submitted applications
    const submittedCount = await BusinessProfile.aggregate([
      { $unwind: '$businesses' },
      { $match: { 'businesses.applicationStatus': { $in: ['submitted', 'under_review', 'resubmit'] } } },
      { $count: 'total' }
    ]);
    
    console.log(`✅ Submitted applications (should be visible to LGU officer): ${submittedCount[0]?.total || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkData();
