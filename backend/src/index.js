const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { seedDevDataIfEmpty } = require('./lib/seedDev');
const blockchainService = require('./lib/blockchainService');
const blockchainQueue = require('./lib/blockchainQueue');
const http = require('http');
// Trigger restart

// Phase 5: Monitoring & Operations
const logger = require('./lib/logger');
const errorTracking = require('./lib/errorTracking');
const correlationIdMiddleware = require('./middleware/correlationId');
const { performanceMonitorMiddleware } = require('./middleware/performanceMonitor');
const { securityMonitorMiddleware } = require('./middleware/securityMonitor');

// Load .env from multiple locations (root and backend directory)
// This supports both Docker (root .env) and local development (backend/.env)
const path = require('path');
const fs = require('fs');

// Try root .env first (for Docker Compose), then backend/.env (for local dev)
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
const backendEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  console.log('[Config] Loaded .env from root directory');
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
  console.log('[Config] Loaded .env from backend directory');
} else {
  dotenv.config(); // Default behavior - current directory
  console.log('[Config] Loaded .env from current directory (or using defaults)');
}

// In test mode, establish database connection immediately when app is required
// This ensures middleware can access the database
if (process.env.NODE_ENV === 'test') {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
  if (uri) {
    try {
      // Check if mongoose is already connected to avoid multiple connections to same URI
      if (mongoose.connection.readyState === 0) {
        connectDB(uri);
      } else {
        logger.info('Using existing mongoose connection for tests');
      }
    } catch (error) {
      logger.warn('Main backend test DB connection failed:', error.message);
    }
  }
}

const app = express();

// Phase 5: Structured Logging & Monitoring Middleware
// Must be early in the middleware chain to capture all requests
app.use(correlationIdMiddleware);
app.use(performanceMonitorMiddleware);
app.use(securityMonitorMiddleware);

// Middleware
app.use(cors());
// Enable preflight across-the-board for cross-origin requests (useful when not using proxy)
// Increase JSON body size limit to handle base64 image payloads from the frontend
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
if (process.env.NODE_ENV !== 'production') {
  let morgan
  try { morgan = require('morgan') } catch (_) { morgan = null }
  if (morgan) app.use(morgan('dev'))
}

// Basic session/cookie support required for SSO state handling
try {
  const cookieParser = require('cookie-parser')
  const session = require('express-session')
  app.use(cookieParser())
  const sessSecret = process.env.SESSION_SECRET || 'dev-session-secret'
  app.use(
    session({
      secret: sessSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
    })
  )
} catch (err) {
  logger.warn('Session middleware not available; install express-session and cookie-parser to enable SSO sessions', { error: err });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

// Removed domain-specific routes for services/providers/offerings

// Auth API routes (DB-aware with in-memory fallback)
const authRouter = require('./routes/auth')
const businessRouter = require('./routes/business/profile') // Direct import for now
const adminRouter = require('./routes/admin/approvals')
const monitoringRouter = require('./routes/admin/monitoring')
const adminMaintenanceRouter = require('./routes/admin/maintenance')
const tamperIncidentsRouter = require('./routes/admin/tamperIncidents')
const maintenanceRouter = require('./routes/maintenance')
const lguOfficerPermitRouter = require('./routes/lgu-officer/permitApplications')
const notificationsRouter = require('./routes/notifications')
// Mirror session user id into request headers for existing handlers
try {
  const { attachSessionUser } = require('./middleware/sessionAuth')
  app.use(attachSessionUser)
} catch (_) {}

app.use('/api/auth', authRouter)
app.use('/api/business', businessRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/monitoring', monitoringRouter)
app.use('/api/admin/maintenance', adminMaintenanceRouter)
app.use('/api/admin/tamper', tamperIncidentsRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/lgu-officer/permit-applications', lguOfficerPermitRouter)
app.use('/api/notifications', notificationsRouter)

// Phase 5: Global Error Handler (must be last middleware)
const errorHandlerMiddleware = require('./middleware/errorHandler');
app.use(errorHandlerMiddleware);

// Optionally mount SSO at top-level if other routers expect session

// Removed locations, service areas, customer addresses, appointments routes

const PRIMARY_PORT = Number(process.env.PORT || 3000);
const SECONDARY_PORT = Number(process.env.ALT_PORT || process.env.PORT2 || 5001);
const EXTRA_PORTS = String(process.env.EXTRA_PORTS || process.env.PORTS || '')
  .split(',')
  .map((s) => Number(String(s).trim()))
  .filter((n) => Number.isFinite(n) && n > 0);

async function start() {
  try {
    // Print the resolved MONGO_URI for debugging (useful to confirm which DB is being used)
    // NOTE: avoid logging credentials in production. This is a development debug statement.
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
    logger.info('Server starting', { mongoUri: uri ? '<set>' : '<not-set>' });

    await connectDB(uri);

    // Initialize blockchain service for audit logging
    await blockchainService.initialize();

    // Optionally seed development data from JSON files when enabled
    await seedDevDataIfEmpty();

    // Initialize background jobs after DB connection
    if (process.env.NODE_ENV !== 'test') {
      try {
        const { startJobs } = require('./jobs')
        startJobs()
      } catch (error) {
        logger.warn('Failed to start background jobs', { error })
      }
    }

    async function startOnPort(port) {
      return new Promise((resolve) => {
        const server = http.createServer(app);
        server.on('error', (err) => {
          if (err && err.code === 'EADDRINUSE') {
            logger.warn(`Port ${port} in use, skipping`);
          } else {
            errorTracking.trackError(err, {
              context: { port, event: 'server_start_error' },
            });
            logger.error(`Server error on port ${port}`, { error: err });
          }
          resolve(null);
        });
        server.listen(port, () => {
          logger.info(`API server listening on http://localhost:${port}`);
          resolve(server);
        });
      });
    }

    const ports = [PRIMARY_PORT, SECONDARY_PORT, ...EXTRA_PORTS];
    const unique = [];
    for (const p of ports) {
      if (!unique.includes(p)) unique.push(p);
    }
    await Promise.all(unique.map((p) => startOnPort(p)));
  } catch (err) {
    errorTracking.trackError(err, {
      context: { event: 'server_start_failed' },
    });
    logger.error('Server start failed', { error: err });
    process.exit(1);
  }
}

// Initialize background jobs
try {
  const { startJobs } = require('./jobs')
  startJobs()
} catch (error) {
  logger.warn('Failed to start background jobs', { error })
  // Don't fail server startup if jobs fail
}

// Initialize background jobs
if (process.env.NODE_ENV !== 'test') {
  try {
    const { startJobs } = require('./jobs')
    startJobs()
  } catch (error) {
    logger.warn('Failed to start background jobs', { error })
  }
}

const uploadsDir = path.join(__dirname, '..', 'uploads')
const avatarsDir = path.join(uploadsDir, 'avatars')
try { fs.mkdirSync(uploadsDir, { recursive: true }) } catch (_) {}
try { fs.mkdirSync(avatarsDir, { recursive: true }) } catch (_) {}
app.use('/uploads', express.static(uploadsDir))
// Also serve legacy path used by some routes (src/uploads)
const uploadsDirLegacy = path.join(__dirname, 'uploads')
try { fs.mkdirSync(uploadsDirLegacy, { recursive: true }) } catch (_) {}
app.use('/uploads', express.static(uploadsDirLegacy))

app.get('/policy', (req, res) => {
  res.type('html').send(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Privacy Policy</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.6;color:#222"><h1>BizClear Business Center Privacy Policy</h1><p>BizClear Business Center collects and processes basic profile data to provide authentication and profile features. We store your email, name, and optional avatar to operate the service. We do not sell your data.</p><p>For account removal, contact support or use the in-app delete account flow. Deletion requests are scheduled and processed in accordance with our retention policy.</p><p>When you sign in with Google, Google shares your account email and profile as permitted; we verify your identity to log you into BizClear Business Center.</p><p>Contact: enriquejohnwayne@gmail.com</p></body></html>'
  )
})

app.get('/terms', (req, res) => {
  res.type('html').send(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Terms of Service</title><meta name="viewport" content="width=device-width, initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet"></head><body style="font-family:\'Raleway\', sans-serif;padding:24px;line-height:1.6;color:#222"><h1>BizClear Business Center Terms of Service</h1><p>By using BizClear Business Center you agree to create an account and provide accurate information. You are responsible for activity on your account.</p><p>BizClear Business Center is provided as-is without warranties. We may update features and policies; continued use indicates acceptance of changes.</p><p>We process your data as described in the Privacy Policy to provide authentication, profile management, and security features such as MFA.</p><p>Contact: enriquejohnwayne@gmail.com</p></body></html>'
  )
})

if (require.main === module) {
  start()
}

module.exports = { app, start }
