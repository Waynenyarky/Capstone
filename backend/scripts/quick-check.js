#!/usr/bin/env node

/**
 * Quick database check with timeout handling
 */

const mongoose = require('mongoose');

async function quickCheck() {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://capstone_app:g95fxnwa1wPDdyfA@capstone.efa2aqu.mongodb.net/capstone_project?appName=capstone';
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to:', mongoose.connection.name);

    // Quick count with options
    const db = mongoose.connection.db;
    
    console.log('\n=== COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));

    console.log('\n=== USERS COUNT ===');
    const userCount = await db.collection('users').countDocuments().catch(() => 'Error');
    console.log('Users:', userCount);

    console.log('\n=== BUSINESS PROFILES COUNT ===');
    const profileCount = await db.collection('businessprofiles').countDocuments().catch(() => 'Error');
    console.log('Business Profiles:', profileCount);

    console.log('\n=== SAMPLE BUSINESS OWNER ===');
    const sampleOwner = await db.collection('users').findOne({ 'role.slug': 'business_owner' }).catch(() => null);
    if (sampleOwner) {
      console.log('Found business owner:', sampleOwner.email);
    } else {
      console.log('No business owners found');
    }

    console.log('\n=== SAMPLE APPLICATION ===');
    const sampleApp = await db.collection('businessprofiles').findOne({ 
      'businesses.applicationStatus': { $exists: true } 
    }).catch(() => null);
    
    if (sampleApp && sampleApp.businesses && sampleApp.businesses.length > 0) {
      const business = sampleApp.businesses[0];
      console.log('Found application:');
      console.log('  Business:', business.businessName || 'No name');
      console.log('  Status:', business.applicationStatus || 'No status');
      console.log('  Submitted:', business.submittedAt || 'No date');
      console.log('  To LGU:', business.submittedToLguOfficer);
    } else {
      console.log('No applications found');
    }

    console.log('\n=== SUBMITTED APPLICATIONS COUNT ===');
    const pipeline = [
      { $unwind: '$businesses' },
      { $match: { 'businesses.applicationStatus': { $in: ['submitted', 'under_review', 'resubmit'] } } },
      { $count: 'total' }
    ];
    const result = await db.collection('businessprofiles').aggregate(pipeline).toArray().catch(() => []);
    console.log('Submitted apps (visible to LGU):', result[0]?.total || 0);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

quickCheck();
