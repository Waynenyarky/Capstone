const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedDevDataIfEmpty } = require('./lib/seedDev');
const http = require('http');

dotenv.config();

const app = express();

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

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

// Categories API routes (DB-aware with in-memory fallback)
const categoriesRouter = require('./routes/categories')
app.use('/api/categories', categoriesRouter)

// Services API routes (DB-aware with in-memory fallback)
const servicesRouter = require('./routes/services')
app.use('/api/services', servicesRouter)

// Providers API routes (DB-aware with in-memory fallback)
const providersRouter = require('./routes/providers')
app.use('/api/providers', providersRouter)

// Provider offerings and onboarding routes
const providerOfferingsRouter = require('./routes/providerOfferings')
app.use('/api/provider-offerings', providerOfferingsRouter)

// Auth API routes (DB-aware with in-memory fallback)
const authRouter = require('./routes/auth')
app.use('/api/auth', authRouter)

// Locations API routes (PSGC-backed)
const locationsRouter = require('./routes/locations')
app.use('/api/locations', locationsRouter)

// Service Areas config routes (admin-managed)
const serviceAreasRouter = require('./routes/serviceAreas')
app.use('/api/service-areas', serviceAreasRouter)

// Customer Addresses routes
const customerAddressesRouter = require('./routes/customerAddresses')
app.use('/api/customer-addresses', customerAddressesRouter)

// Appointments routes
const appointmentsRouter = require('./routes/appointments')
app.use('/api/appointments', appointmentsRouter)

const PRIMARY_PORT = Number(process.env.PORT || 3000);
const SECONDARY_PORT = Number(process.env.ALT_PORT || process.env.PORT2 || 5001);

async function start() {
  try {
    // Print the resolved MONGO_URI for debugging (useful to confirm which DB is being used)
    // NOTE: avoid logging credentials in production. This is a development debug statement.
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
    console.log('Using Mongo URI:', uri ? '<set>' : '<not-set>');

    await connectDB(uri);

    // Optionally seed development data from JSON files when enabled
    await seedDevDataIfEmpty();

    async function startOnPort(port) {
      return new Promise((resolve) => {
        const server = http.createServer(app);
        server.on('error', (err) => {
          if (err && err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} in use, skipping`);
          } else {
            console.error(`Server error on port ${port}:`, err);
          }
          resolve(null);
        });
        server.listen(port, () => {
          console.log(`API server listening on http://localhost:${port}`);
          resolve(server);
        });
      });
    }

    await Promise.all([
      startOnPort(PRIMARY_PORT),
      startOnPort(SECONDARY_PORT),
    ]);
  } catch (err) {
    console.error('Server start failed:', err);
    process.exit(1);
  }
}

start();
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
try { fs.mkdirSync(avatarsDir, { recursive: true }); } catch (_) {}
app.use('/uploads', express.static(uploadsDir));
// Also serve legacy path used by some routes (src/uploads)
const uploadsDirLegacy = path.join(__dirname, 'uploads');
try { fs.mkdirSync(uploadsDirLegacy, { recursive: true }); } catch (_) {}
app.use('/uploads', express.static(uploadsDirLegacy));
