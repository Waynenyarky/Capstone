const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedDevDataIfEmpty } = require('./lib/seedDev');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Enable preflight across-the-board for cross-origin requests (useful when not using proxy)
// Increase JSON body size limit to handle base64 image payloads from the frontend
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
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

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Print the resolved MONGO_URI for debugging (useful to confirm which DB is being used)
    // NOTE: avoid logging credentials in production. This is a development debug statement.
    console.log('Using MONGO_URI:', process.env.MONGO_URI || '<not-set>');

    // Attempt DB connection if URI is provided
    await connectDB(process.env.MONGO_URI);

    // Optionally seed development data from JSON files when enabled
    await seedDevDataIfEmpty();

    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server start failed:', err);
    process.exit(1);
  }
}

start();