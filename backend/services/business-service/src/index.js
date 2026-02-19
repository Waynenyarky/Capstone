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

// CSRF (IAS-2.7): cookie-parser for double-submit cookie; token endpoint and middleware for /api/business and /api/inspector, /api/lgu-officer
let cookieParser;
try { cookieParser = require('cookie-parser'); app.use(cookieParser()); } catch (_) { /* optional */ }
const csrfDisabled = process.env.DISABLE_CSRF === 'true' || process.env.NODE_ENV === 'test';
const { createCsrfMiddleware, getCsrfTokenHandler } = require('../../../shared/csrf');
app.get('/api/business/csrf-token', getCsrfTokenHandler({ sameSite: 'lax' }));
app.get('/api/inspector/csrf-token', getCsrfTokenHandler({ sameSite: 'lax' }));
app.get('/api/lgu-officer/csrf-token', getCsrfTokenHandler({ sameSite: 'lax' }));
app.use('/api/business', createCsrfMiddleware({ skipPaths: ['/api/business/csrf-token'], disabled: csrfDisabled }));
app.use('/api/inspector', createCsrfMiddleware({ skipPaths: ['/api/inspector/csrf-token'], disabled: csrfDisabled }));
app.use('/api/lgu-officer', createCsrfMiddleware({ skipPaths: ['/api/lgu-officer/csrf-token'], disabled: csrfDisabled }));

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

// Phase 2 routes
const feeConfigurationRouter = require('./routes/feeConfiguration');
const regulatoryFeeConfigRouter = require('./routes/regulatoryFeeConfig');
const generalPermitsRouter = require('./routes/generalPermits');
const occupationalPermitsRouter = require('./routes/occupationalPermits');
const appealsRouter = require('./routes/appeals');
const editRequestsRouter = require('./routes/editRequests');
const postRequirementsRouter = require('./routes/postRequirements');
const walkInRouter = require('./routes/walkIn');
const retirementRouter = require('./routes/retirement');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/business/admin/fee-configuration', feeConfigurationRouter);
app.use('/api/business/admin/regulatory-fee-config', regulatoryFeeConfigRouter);
app.use('/api/business/general-permits', generalPermitsRouter);
app.use('/api/business/occupational-permits', occupationalPermitsRouter);
app.use('/api/business/appeals', appealsRouter);
app.use('/api/business/edit-requests', editRequestsRouter);
app.use('/api/business/post-requirements', postRequirementsRouter);
app.use('/api/business/walk-in', walkInRouter);
app.use('/api/business/retirements', retirementRouter);
app.use('/api/business', retirementRouter); // Also mount at /api/business/:businessId/retire
app.use('/api/business/dashboard', dashboardRouter);

// Inspector routes
const inspectorRouter = require('./routes/inspector/index');
app.use('/api/inspector', inspectorRouter);

// LGU Officer inspection assignment routes
const inspectionAssignmentsRouter = require('./routes/lgu-officer/inspectionAssignments');
app.use('/api/lgu-officer', inspectionAssignmentsRouter);

// Global Error Handler (must be last middleware)
app.use(errorHandlerMiddleware);

const PORT = Number(process.env.BUSINESS_SERVICE_PORT || 3002);

async function start() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
    logger.info('Business Service starting', { mongoUri: uri ? '<set>' : '<not-set>' });

    await connectDB(uri);

    // Seed fee configuration if empty (idempotent). Runs when SEED_FEE_CONFIGURATION=true (Docker) or in non-production.
    const shouldSeedFeeConfig = process.env.NODE_ENV !== 'test' &&
      (process.env.SEED_FEE_CONFIGURATION === 'true' || process.env.NODE_ENV !== 'production');
    if (shouldSeedFeeConfig) {
      const maxSeedRetries = 5;
      const seedRetryDelayMs = 3000;
      for (let attempt = 1; attempt <= maxSeedRetries; attempt++) {
        try {
          const { seedIfEmpty } = require('./seed/seedFeeConfiguration');
          const result = await seedIfEmpty();
          if (result.seeded) {
            logger.info('Fee configuration seeded', { count: result.count });
          }
          break;
        } catch (error) {
          logger.warn(`Fee configuration seed attempt ${attempt}/${maxSeedRetries} failed`, { error: error.message });
          if (attempt === maxSeedRetries) {
            logger.warn('Fee configuration seed failed after retries', { error: error.message });
          } else {
            await new Promise((r) => setTimeout(r, seedRetryDelayMs));
          }
        }
      }
    }

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
