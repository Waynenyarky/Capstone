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
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

// Load .env from project root when running from backend/services/business-service (so GEMINI_API_KEY etc. are found)
const projectRootEnv = path.join(__dirname, '..', '..', '..', '..', '.env');
try {
  require('dotenv').config({ path: projectRootEnv });
} catch (_) { /* optional */ }

const app = express();

const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["https://challenges.cloudflare.com"],
      fontSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Structured Logging & Monitoring Middleware (early in chain)
app.use(correlationIdMiddleware);
app.use(performanceMonitorMiddleware);
app.use(securityMonitorMiddleware);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Session middleware required for CSRF tokens
try {
  const session = require('express-session');
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
  const sessSecret = process.env.SESSION_SECRET || 'dev-session-secret';
  app.use(
    session({
      secret: sessSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
    })
  );
} catch (err) {
  console.warn('Session middleware not available', { error: err });
}
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// CSRF (IAS-2.7): token endpoint and middleware for /api/business and /api/inspector, /api/lgu-officer
const csrfDisabled = process.env.DISABLE_CSRF === 'true' || process.env.NODE_ENV === 'test';
const { createCsrfMiddleware, getCsrfTokenHandler } = require('../../../shared/csrf');
app.get('/api/business/csrf-token', getCsrfTokenHandler({ cookieName: 'csrf-token-business', sameSite: 'lax' }));
app.get('/api/inspector/csrf-token', getCsrfTokenHandler({ cookieName: 'csrf-token-inspector', sameSite: 'lax' }));
app.get('/api/lgu-officer/csrf-token', getCsrfTokenHandler({ cookieName: 'csrf-token-lgu-officer', sameSite: 'lax' }));
app.use('/api/business', createCsrfMiddleware({ cookieName: 'csrf-token-business', skipPaths: ['/api/business/csrf-token'], disabled: csrfDisabled }));
app.use('/api/inspector', createCsrfMiddleware({ cookieName: 'csrf-token-inspector', skipPaths: ['/api/inspector/csrf-token'], disabled: csrfDisabled }));
app.use('/api/lgu-officer', createCsrfMiddleware({ cookieName: 'csrf-token-lgu-officer', skipPaths: ['/api/lgu-officer/csrf-token'], disabled: csrfDisabled }));

if (process.env.NODE_ENV !== 'production') {
  let morgan
  try { morgan = require('morgan') } catch (_) { morgan = null }
  if (morgan) app.use(morgan('dev'))
}

// Track database readiness - prevents indefinite hangs when DB is slow
let dbReady = false;

// Middleware to return 503 while DB is connecting (prevents frontend hangs)
app.use((req, res, next) => {
  // Always allow health check and CSRF endpoints
  if (req.path === '/api/health' || req.path.includes('/csrf-token')) {
    return next();
  }
  // Allow requests once DB is ready
  if (dbReady || mongoose.connection.readyState === 1) {
    return next();
  }
  // Return 503 Service Unavailable - frontend should retry
  return res.status(503).json({
    ok: false,
    error: { code: 'service_starting', message: 'Service is starting, please retry' }
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let ipfsStatus = 'not_configured'
  try {
    const ipfsService = require('./lib/ipfsService')
    if (ipfsService.isAvailable()) {
      ipfsStatus = 'connected'
    } else {
      ipfsStatus = 'unavailable'
    }
  } catch { ipfsStatus = 'error' }
  res.json({ 
    ok: true, 
    service: 'business-service', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ipfs: ipfsStatus,
  });
});

// Serve static uploads (business registration documents)
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
const paymentsRouter = require('./routes/payments');
const ownerInspectionsRouter = require('./routes/ownerInspections');
const ownerViolationsRouter = require('./routes/ownerViolations');
const aiRouter = require('./routes/ai');
const lobTrainerRouter = require('./routes/lobTrainer');
const feesRouter = require('./routes/fees');
const clearanceRouter = require('./routes/clearances');
const treasuryRouter = require('./routes/treasury');
const inspectionSchedulingRouter = require('./routes/inspectionScheduling');
const permitsRouter = require('./routes/permits');

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
app.use('/api/business/payments', paymentsRouter);
app.use('/api/business/inspections', ownerInspectionsRouter);
app.use('/api/business/violations', ownerViolationsRouter);
app.use('/api/business/ai', aiRouter);
app.use('/api/business/admin/lob-trainer', lobTrainerRouter);
app.use('/api/business', feesRouter);
app.use('/api/business/fees', feesRouter);
app.use('/api/business/clearances', clearanceRouter);
app.use('/api/business/permits', permitsRouter);
app.use('/api/treasury', treasuryRouter);
app.use('/api/inspections', inspectionSchedulingRouter);

const adminStatsRouter = require('./routes/adminStats');
app.use('/api/business/admin', adminStatsRouter);

// Inspector routes
const inspectorRouter = require('./routes/inspector/index');
app.use('/api/inspector', inspectorRouter);

// LGU Officer inspection assignment routes
const inspectionAssignmentsRouter = require('./routes/lgu-officer/inspectionAssignments');
app.use('/api/lgu-officer', inspectionAssignmentsRouter);

// LGU Manager routes
const lguManagerRouter = require('./routes/lguManager');
app.use('/api/lgu-manager', lguManagerRouter);

// Global Error Handler (must be last middleware)
app.use(errorHandlerMiddleware);

const PORT = Number(process.env.BUSINESS_SERVICE_PORT || 3002);

async function start() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
  logger.info('Business Service starting', { mongoUri: uri ? '<set>' : '<not-set>' });

  // START SERVER EARLY - create server first for socket.io attachment
  const server = http.createServer(app);

  // Initialize Socket.io for realtime updates (can work without DB)
  try {
    const { initializeSocket } = require('../../../shared/lib/socketService');
    const { Server: SocketIOServer } = require('socket.io');
    const jwtModule = require('jsonwebtoken');
    initializeSocket(server, { SocketIO: SocketIOServer, jwt: jwtModule });
    logger.info('Socket.io initialized for realtime updates');
  } catch (err) {
    logger.warn('Socket.io initialization failed (non-critical)', { error: err.message });
  }

  // Start listening IMMEDIATELY - don't wait for DB connection
  server.listen(PORT, () => {
    logger.info(`Business Service listening on http://localhost:${PORT} (DB connecting...)`);
    logger.info('AI LOB recommendation config', {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      lobModelServiceUrl: process.env.LOB_MODEL_SERVICE_URL ? '(set)' : '(not set)',
    });
  });

  // Connect to DB in background
  try {
    await connectDB(uri);
    dbReady = true;
    logger.info('Business Service database ready');

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

    // Seed LOB training examples (idempotent — only inserts when empty)
    if (shouldSeedFeeConfig) {
      try {
        const { seedIfEmpty: seedLobExamples } = require('./seed/seedLobTrainingExamples');
        const lobResult = await seedLobExamples();
        if (lobResult.seeded) {
          logger.info('LOB training examples seeded', { count: lobResult.count });
        } else if (lobResult.skipped === 'dataset_not_found') {
          logger.info('LOB training examples skip: dataset file not found', {
            triedPaths: lobResult.triedPaths || [],
            hint: 'In Docker ensure volume ./ai/datasets:/backend/ai/datasets is mounted and restart the container (docker-compose up -d --force-recreate business-service)',
          });
        }
      } catch (error) {
        logger.warn('LOB training examples seed failed', { error: error.message });
      }
    }

    // IPFS service is lazy-loaded in routes when needed
    // Don't initialize here to avoid module loading issues
    logger.info('IPFS service will be loaded on-demand in routes');

    // Cron jobs (only in non-test environments)
    if (process.env.NODE_ENV !== 'test') {
      const cron = require('node-cron')
      const { flagBusinessesForRenewal, calculateMonthlyInterest } = require('./cron/renewalAutoFlag')
      const { detectAbandonedBusinesses } = require('./cron/abandonedDetection')
      const { markOverduePostRequirements } = require('./cron/postRequirementOverdue')
      const { checkPostRequirementDue, checkOverduePostRequirements } = require('./cron/notificationReminders')
      const {
        escalateOverdueViolations,
        sendViolationReminders,
        flagCriticalViolators,
        sendInspectionReminders,
        cancelExpiredBookings
      } = require('./cron/complianceEnforcement')

      const cronLocks = new Set()
      async function withCronMutex(name, fn) {
        if (cronLocks.has(name)) {
          logger.warn(`[CRON] Skipping ${name} — previous run still in progress`)
          return
        }
        cronLocks.add(name)
        try { await fn() } finally { cronLocks.delete(name) }
      }

      cron.schedule('0 0 1 1 *', () => withCronMutex('renewalAutoFlag', async () => {
        logger.info('[CRON] Running renewal auto-flag...')
        try { await flagBusinessesForRenewal() }
        catch (err) { logger.error('[CRON] renewalAutoFlag error:', { error: err.message }) }
      }))

      cron.schedule('0 1 1 * *', () => withCronMutex('monthlyInterest', async () => {
        logger.info('[CRON] Calculating monthly interest...')
        try { await calculateMonthlyInterest() }
        catch (err) { logger.error('[CRON] calculateMonthlyInterest error:', { error: err.message }) }
      }))

      cron.schedule('0 6 1 * *', () => withCronMutex('abandonedDetection', async () => {
        logger.info('[CRON] Running abandoned business detection...')
        try {
          const flagged = await detectAbandonedBusinesses()
          logger.info(`[CRON] Flagged ${flagged.length} businesses as potentially abandoned`)
        }
        catch (err) { logger.error('[CRON] abandonedDetection error:', { error: err.message }) }
      }))

      cron.schedule('0 0 * * *', () => withCronMutex('postRequirementOverdue', async () => {
        logger.info('[CRON] Checking for overdue post-requirements...')
        try {
          const result = await markOverduePostRequirements()
          logger.info(`[CRON] Marked ${result.marked} post-requirements as overdue`)
        }
        catch (err) { logger.error('[CRON] postRequirementOverdue error:', { error: err.message }) }
      }))

      cron.schedule('0 9 * * *', () => withCronMutex('notificationReminders', async () => {
        logger.info('[CRON] Running notification reminders...')
        try {
          const dueCount = await checkPostRequirementDue()
          const overdueCount = await checkOverduePostRequirements()
          logger.info(`[CRON] Notification reminders: ${dueCount} due, ${overdueCount} overdue`)
        }
        catch (err) { logger.error('[CRON] notificationReminders error:', { error: err.message }) }
      }))

      logger.info('Cron jobs scheduled: renewalAutoFlag, monthlyInterest, abandonedDetection, postRequirementOverdue, notificationReminders')

      // Phase 4: Compliance Enforcement Cron Jobs
      cron.schedule('0 9 * * *', () => withCronMutex('escalateViolations', async () => {
        logger.info('[CRON] Escalating overdue violations...')
        try {
          const result = await escalateOverdueViolations()
          logger.info(`[CRON] Escalated ${result.escalated} violations`)
        }
        catch (err) { logger.error('[CRON] escalateViolations error:', { error: err.message }) }
      }))

      cron.schedule('0 8 * * *', () => withCronMutex('violationReminders', async () => {
        logger.info('[CRON] Sending violation reminders...')
        try {
          const result = await sendViolationReminders()
          logger.info(`[CRON] Sent ${result.remindersSent} violation reminders`)
        }
        catch (err) { logger.error('[CRON] violationReminders error:', { error: err.message }) }
      }))

      cron.schedule('0 10 * * *', () => withCronMutex('flagCriticalViolators', async () => {
        logger.info('[CRON] Flagging critical violators...')
        try {
          const result = await flagCriticalViolators()
          logger.info(`[CRON] Flagged ${result.flagged} businesses as high risk`)
        }
        catch (err) { logger.error('[CRON] flagCriticalViolators error:', { error: err.message }) }
      }))

      cron.schedule('0 * * * *', () => withCronMutex('inspectionReminders', async () => {
        try {
          const result = await sendInspectionReminders()
          if (result.remindersSent > 0) {
            logger.info(`[CRON] Sent ${result.remindersSent} inspection reminders`)
          }
        }
        catch (err) { logger.error('[CRON] inspectionReminders error:', { error: err.message }) }
      }))

      cron.schedule('0 0 * * *', () => withCronMutex('cancelExpiredBookings', async () => {
        logger.info('[CRON] Cancelling expired inspection bookings...')
        try {
          const result = await cancelExpiredBookings()
          logger.info(`[CRON] Cancelled ${result.cancelled} expired bookings`)
        }
        catch (err) { logger.error('[CRON] cancelExpiredBookings error:', { error: err.message }) }
      }))

      logger.info('Phase 4 cron jobs scheduled: escalateViolations, violationReminders, flagCriticalViolators, inspectionReminders, cancelExpiredBookings')
    }

  } catch (err) {
    logger.error('Business Service DB/init failed (server still running)', { error: err });
    // Don't exit - server is still running and will return 503 until DB connects
  }

  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
