const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const authConnectDB = require('../../services/auth-service/src/config/db')
const businessConnectDB = require('../../services/business-service/src/config/db')
const adminConnectDB = require('../../services/admin-service/src/config/db')
const auditConnectDB = require('../../services/audit-service/src/config/db')

let mongoServer = null

/**
 * Setup test environment variables
 */
function setupTestEnvironment() {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret'
  process.env.SEED_DEV = 'true'
  process.env.EMAIL_API_PROVIDER = 'mock' // Use mock email for tests
  process.env.DEFAULT_FROM_EMAIL = 'no-reply@example.com'
  process.env.WEBAUTHN_RPID = 'localhost'
  process.env.WEBAUTHN_ORIGIN = 'http://localhost:3001' // Auth service port
  process.env.AUTH_SERVICE_PORT = '3001'
  process.env.AUDIT_CONTRACT_ADDRESS = '' // Disable blockchain for tests
  process.env.DISABLE_RATE_LIMIT = 'false' // Enable rate limiting for security tests
  // Disable Turnstile CAPTCHA in tests (login/signup/password-reset would otherwise require it)
  delete process.env.TURNSTILE_SECRET_KEY
}

/**
 * Setup MongoDB Memory Server
 * @returns {Promise<MongoMemoryServer>}
 */
async function setupMongoDB() {
  if (mongoServer) {
    return mongoServer
  }

  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  process.env.MONGO_URI = uri

  // Each service has its own node_modules/mongoose (separate singletons).
  // Connect the root mongoose so tests using `require('mongoose')` also work,
  // then connect each service's mongoose via their connectDB helpers.
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  }
  await authConnectDB(uri)
  await businessConnectDB(uri)
  await adminConnectDB(uri)
  await auditConnectDB(uri)
  
  // Seed dev data if seedDev exists (optional - may not be needed for all tests)
  try {
    const { seedDevDataIfEmpty } = require('../../services/auth-service/src/lib/seedDev')
    await seedDevDataIfEmpty()
  } catch (err) {
    // seedDev may not exist, that's okay
  }
  
  // Verify the root mongoose connection
  let retries = 0
  while (mongoose.connection.readyState !== 1 && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error('Mongoose connection not ready after setup')
  }
  
  return mongoServer
}

/**
 * Teardown MongoDB connection
 */
async function teardownMongoDB() {
  try {
    // Disconnect all mongoose singletons (root + each service's own copy)
    const disconnects = [mongoose.disconnect().catch(() => {})]
    for (const svcPath of [
      '../../services/auth-service/src/models/User',
      '../../services/business-service/src/models/BusinessProfile',
      '../../services/admin-service/src/models/User',
      '../../services/audit-service/src/models/AuditLog',
    ]) {
      try {
        const svcMongoose = require(svcPath).base
        if (svcMongoose && svcMongoose !== mongoose) {
          disconnects.push(svcMongoose.disconnect().catch(() => {}))
        }
      } catch { /* ignore */ }
    }
    await Promise.all(disconnects)
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error)
  } finally {
    if (mongoServer) {
      await mongoServer.stop()
      mongoServer = null
    }
  }
}

/**
 * Setup Express app for testing
 * @param {string} service - Service name ('auth', 'business', 'admin', 'audit')
 * @returns {Express.Application}
 */
function setupApp(service = 'auth') {
  const serviceMap = {
    auth: '../../services/auth-service/src/index',
    business: '../../services/business-service/src/index',
    admin: '../../services/admin-service/src/index',
    audit: '../../services/audit-service/src/index',
  }

  const servicePath = serviceMap[service] || serviceMap.auth

  // Clear require cache to get fresh app instance
  delete require.cache[require.resolve(servicePath)]
  const { app } = require(servicePath)

  return app
}

module.exports = {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
}
