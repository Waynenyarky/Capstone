const mongoose = require('mongoose');
const logger = require('../lib/logger');
const { trackDatabaseQuery } = require('../middleware/performanceMonitor');

// Phase 5: Database query performance tracking
mongoose.set('debug', false); // Disable mongoose debug mode (we use our own)

// Track database queries using mongoose middleware
const originalQuery = mongoose.Query.prototype.exec;
mongoose.Query.prototype.exec = function(...args) {
  const startTime = Date.now();
  const collection = this.model?.collection?.name || this.mongooseCollection?.name || 'unknown';
  const operation = this.op || 'query';
  
  const result = originalQuery.apply(this, args);
  
  // Track query if it's a promise
  if (result && typeof result.then === 'function') {
    return result.then(
      (data) => {
        const duration = Date.now() - startTime;
        trackDatabaseQuery(collection, operation, duration);
        return data;
      },
      (err) => {
        const duration = Date.now() - startTime;
        trackDatabaseQuery(collection, operation, duration);
        throw err;
      }
    );
  }
  
  return result;
};

// Track aggregate queries
const originalAggregate = mongoose.Aggregate.prototype.exec;
mongoose.Aggregate.prototype.exec = function(...args) {
  const startTime = Date.now();
  const collection = this._model?.collection?.name || 'unknown';
  const operation = 'aggregate';
  
  const result = originalAggregate.apply(this, args);
  
  if (result && typeof result.then === 'function') {
    return result.then(
      (data) => {
        const duration = Date.now() - startTime;
        trackDatabaseQuery(collection, operation, duration);
        return data;
      },
      (err) => {
        const duration = Date.now() - startTime;
        trackDatabaseQuery(collection, operation, duration);
        throw err;
      }
    );
  }
  
  return result;
};

async function connectDB(uri) {
  if (!uri) {
    logger.warn('MONGO_URI not set. Skipping MongoDB connection.');
    return;
  }

  try {
    // Connect using the provided URI. Mongoose will parse the DB name from the URI.
    await mongoose.connect(uri);
    // Log the resolved connection details to help debug which database was used.
    try {
      const dbName = mongoose.connection && mongoose.connection.name ? mongoose.connection.name : '<unknown-db>';
      const host = mongoose.connection && mongoose.connection.host ? mongoose.connection.host : '<unknown-host>';
      logger.info(`MongoDB connected to database '${dbName}' on host '${host}'`);
    } catch (logErr) {
      // Best-effort logging; do not fail the connection if logging fails.
      logger.info('MongoDB connected (unable to resolve connection name/host)');
    }
  } catch (err) {
    logger.error('MongoDB connection error', { error: err });
    throw err;
  }
}

module.exports = connectDB;