const mongoose = require('mongoose');

async function testConnection() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://capstone_app:devapppass@localhost:27017/capstone_project?authSource=admin';
  
  try {
    console.log('Attempting to connect to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully to:', mongoose.connection.name);
    
    // Simple test
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
