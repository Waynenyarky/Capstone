const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://capstone_app:g95fxnwa1wPDdyfA@capstone.efa2aqu.mongodb.net/?appName=capstone';

async function clearTamperIncidents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const result = await db.collection('tamperincidents').deleteMany({});
    console.log(`Cleared ${result.deletedCount} tamper incidents`);

    await mongoose.connection.close();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

clearTamperIncidents();
