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

// Session/cookie support for SSO
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
  logger.warn('Session middleware not available', { error: err });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'auth-service', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection && mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Auth routes
const authRouter = require('./routes/index');
app.use('/api/auth', authRouter);

// Global Error Handler (must be last middleware)
app.use(errorHandlerMiddleware);

const PORT = Number(process.env.AUTH_SERVICE_PORT || 3001);
const mongoose = require('mongoose');

async function start() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
    logger.info('Auth Service starting', { mongoUri: uri ? '<set>' : '<not-set>' });

    await connectDB(uri);

    // Seed development data if enabled
    if (process.env.SEED_DEV === 'true') {
      try {
        const { seedDevDataIfEmpty } = require('./lib/seedDev');
        await seedDevDataIfEmpty();
      } catch (error) {
        logger.warn('Failed to seed dev data', { error: error.message });
      }
    }

    // Initialize IPFS service
    const ipfsService = require('./lib/ipfsService');
    if (ipfsService.isAvailable()) {
      logger.info('IPFS service available');
    } else {
      logger.warn('IPFS service not available - file uploads will use local storage');
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
      logger.info(`Auth Service listening on http://localhost:${PORT}`);
    });

    return server;
  } catch (err) {
    logger.error('Auth Service start failed', { error: err });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
