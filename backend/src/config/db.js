const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    console.warn('MONGO_URI not set. Skipping MongoDB connection.');
    return;
  }

  try {
    // Connect using the provided URI. Mongoose will parse the DB name from the URI.
    await mongoose.connect(uri);
    // Log the resolved connection details to help debug which database was used.
    try {
      const dbName = mongoose.connection && mongoose.connection.name ? mongoose.connection.name : '<unknown-db>';
      const host = mongoose.connection && mongoose.connection.host ? mongoose.connection.host : '<unknown-host>';
      console.log(`MongoDB connected to database '${dbName}' on host '${host}'`);
    } catch (logErr) {
      // Best-effort logging; do not fail the connection if logging fails.
      console.log('MongoDB connected (unable to resolve connection name/host)');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;