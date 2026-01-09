const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const User = require('../src/models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    console.log('Updating users with role "business_owner" to "inspector"...');
    const result = await User.updateMany(
      { role: 'business_owner' },
      { $set: { role: 'inspector' } }
    );

    console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }
};

migrate();
