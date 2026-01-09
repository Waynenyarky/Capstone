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
  console.warn('Session middleware not available; install express-session and cookie-parser to enable SSO sessions')
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

// Removed domain-specific routes for services/providers/offerings

// Auth API routes (DB-aware with in-memory fallback)
const authRouter = require('./routes/auth')
const businessRouter = require('./routes/business/profile') // Direct import for now
// Mirror session user id into request headers for existing handlers
try {
  const { attachSessionUser } = require('./middleware/sessionAuth')
  app.use(attachSessionUser)
} catch (_) {}

app.use('/api/auth', authRouter)
app.use('/api/business', businessRouter)

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

    const ports = [PRIMARY_PORT, SECONDARY_PORT, ...EXTRA_PORTS];
    const unique = [];
    for (const p of ports) {
      if (!unique.includes(p)) unique.push(p);
    }
    await Promise.all(unique.map((p) => startOnPort(p)));
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

app.get('/policy', (req, res) => {
  res.type('html').send(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Privacy Policy</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.6;color:#222"><h1>Capstone Privacy Policy</h1><p>Capstone collects and processes basic profile data to provide authentication and profile features. We store your email, name, and optional avatar to operate the service. We do not sell your data.</p><p>For account removal, contact support or use the in-app delete account flow. Deletion requests are scheduled and processed in accordance with our retention policy.</p><p>When you sign in with Google, Google shares your account email and profile as permitted; we verify your identity to log you into Capstone.</p><p>Contact: enriquejohnwayne@gmail.com</p></body></html>'
  )
})

app.get('/terms', (req, res) => {
  res.type('html').send(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Terms of Service</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.6;color:#222"><h1>Capstone Terms of Service</h1><p>By using Capstone you agree to create an account and provide accurate information. You are responsible for activity on your account.</p><p>Capstone is provided as-is without warranties. We may update features and policies; continued use indicates acceptance of changes.</p><p>We process your data as described in the Privacy Policy to provide authentication, profile management, and security features such as MFA.</p><p>Contact: enriquejohnwayne@gmail.com</p></body></html>'
  )
})
