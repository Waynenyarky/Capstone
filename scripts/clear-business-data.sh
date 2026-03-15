#!/bin/bash

# Quick script to clear business data for testing the welcome modal
# This script connects to MongoDB using the docker container

echo "🔌 Connecting to MongoDB to clear business data..."

# Use mongosh in the MongoDB container with root credentials
docker exec capstone-mongodb mongosh -u root -p devrootpass --authenticationDatabase admin --eval "
try {
  const count = db.businessprofiles.countDocuments();
  console.log('📊 Found ' + count + ' business applications');
  
  if (count > 0) {
    const result = db.businessprofiles.deleteMany({});
    console.log('🗑️  Deleted ' + result.deletedCount + ' business applications');
    console.log('✨ Ready for testing! Welcome modal will appear for business owners.');
  } else {
    console.log('✨ No businesses found - ready for testing!');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
" capstone_project

echo "🎉 Done! Refresh your app to test the welcome modal."
