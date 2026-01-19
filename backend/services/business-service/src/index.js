const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const logger = require('./lib/logger');
const correlationIdMiddleware = require('./middleware/correlationId');
const { performanceMonitorMiddleware } = require('./middleware/performanceMonitor');
const { securityMonitorMiddleware } = require('./middleware/securityMonitor');
const errorHandlerMiddleware = require('./middleware/errorHandler');
const http = require('http');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Structured Logging & Monitoring Middleware (early in chain)
app.use(correlationIdMiddleware);
app.use(performanceMonitorMiddleware);
app.use(securityMonitorMiddleware);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (process.env.NODE_ENV !== 'production') {
  let morgan
  try { morgan = require('morgan') } catch (_) { morgan = null }
  if (morgan) app.use(morgan('dev'))
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'business-service', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve static uploads (business registration documents)
const path = require('path');
// Uploads are stored at: backend/services/business-service/../../../uploads/business-registration
// Which resolves to: backend/uploads/business-registration
// But we need to serve from the parent uploads directory to match the URL structure
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Business routes
const businessRouter = require('./routes/profile');
app.use('/api/business', businessRouter);

// Global Error Handler (must be last middleware)
app.use(errorHandlerMiddleware);

const PORT = Number(process.env.BUSINESS_SERVICE_PORT || 3002);

async function start() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
    logger.info('Business Service starting', { mongoUri: uri ? '<set>' : '<not-set>' });

    await connectDB(uri);

    // IPFS service is lazy-loaded in routes when needed
    // Don't initialize here to avoid module loading issues
    logger.info('IPFS service will be loaded on-demand in routes');

    const server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info(`Business Service listening on http://localhost:${PORT}`);
    });

    return server;
  } catch (err) {
    logger.error('Business Service start failed', { error: err });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
