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
    service: 'admin-service', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Load models to ensure they're registered with mongoose
require('./models/Role');
require('./models/User');
require('./models/BusinessProfile');
require('./models/AuditLog');
require('./models/LGU');
require('./models/FormGroup');
require('./models/FormDefinition');

// Admin routes
const adminRouter = require('./routes/approvals');
const monitoringRouter = require('./routes/monitoring');
const maintenanceRouter = require('./routes/maintenance');
const tamperIncidentsRouter = require('./routes/tamperIncidents');
const lguOfficerPermitRouter = require('./routes/permitApplications');
const lgusRouter = require('./routes/lgus');
const formDefinitionsRouter = require('./routes/formDefinitions');
const publicFormsRouter = require('./routes/publicForms');

app.use('/api/admin', adminRouter);
app.use('/api/admin/monitoring', monitoringRouter);
app.use('/api/admin/maintenance', maintenanceRouter);
app.use('/api/admin/tamper', tamperIncidentsRouter);
app.use('/api/admin/lgus', lgusRouter);
app.use('/api/admin/forms', formDefinitionsRouter);
// Public maintenance status endpoint (for frontend to check)
app.use('/api/maintenance', maintenanceRouter);
// Public LGU endpoints
app.use('/api/lgus', lgusRouter);
// Public form definitions endpoints
app.use('/api/forms', publicFormsRouter);
// LGU Officer permit applications routes
app.use('/api/lgu-officer/permit-applications', lguOfficerPermitRouter);

// Serve static uploads (form templates, etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Notification routes (shared across all services)
// Use auth service routes since notifications are user-specific
// In microservices mode, /api/notifications routes to auth service (port 3001)
// This is handled by vite.config.js proxy configuration

// Global Error Handler (must be last middleware)
app.use(errorHandlerMiddleware);

const PORT = Number(process.env.ADMIN_SERVICE_PORT || 3003);

async function start() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
    logger.info('Admin Service starting', { mongoUri: uri ? '<set>' : '<not-set>' });

    await connectDB(uri);

    // Seed form definitions if empty (idempotent)
    // Runs when SEED_FORM_DEFINITIONS=true (Docker) or in non-test dev
    const shouldSeed = process.env.NODE_ENV !== 'test' &&
      (process.env.SEED_FORM_DEFINITIONS === 'true' || process.env.NODE_ENV !== 'production')

    if (shouldSeed) {
      const maxSeedRetries = 5
      const seedRetryDelayMs = 3000
      for (let attempt = 1; attempt <= maxSeedRetries; attempt++) {
        try {
          const { seedIfEmpty } = require('./migrations/seedFormDefinitions')
          const result = await seedIfEmpty()
          if (result.seeded) {
            logger.info('Form definitions seeded', { count: result.count })
          }
          break
        } catch (error) {
          logger.warn(`Form definitions seed attempt ${attempt}/${maxSeedRetries} failed`, { error: error.message })
          if (attempt === maxSeedRetries) {
            logger.warn('Form definitions seed failed after retries', { error: error.message })
          } else {
            await new Promise((r) => setTimeout(r, seedRetryDelayMs))
          }
        }
      }
    }

    // Initialize background jobs after DB connection
    if (process.env.NODE_ENV !== 'test') {
      try {
        const { startJobs } = require('./jobs')
        startJobs()
      } catch (error) {
        logger.warn('Failed to start background jobs', { error })
      }
    }

    const server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info(`Admin Service listening on http://localhost:${PORT}`);
    });

    return server;
  } catch (err) {
    logger.error('Admin Service start failed', { error: err });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
