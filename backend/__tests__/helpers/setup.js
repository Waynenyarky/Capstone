const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const connectDB = require('../../src/config/db')

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
  process.env.MONGO_URI = mongoServer.getUri()
  
  await connectDB(process.env.MONGO_URI)
  
  // Seed dev data if seedDev exists (optional - may not be needed for all tests)
  try {
    const { seedDevDataIfEmpty } = require('../../src/lib/seedDev')
    await seedDevDataIfEmpty()
  } catch (err) {
    // seedDev may not exist, that's okay
  }
  
  // Ensure mongoose connection is ready
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve()
      } else {
        mongoose.connection.once('connected', resolve)
        mongoose.connection.once('error', reject)
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Mongoose connection timeout')), 5000)
      }
    })
  }
  
  return mongoServer
}

/**
 * Teardown MongoDB connection
 */
async function teardownMongoDB() {
  try {
    await mongoose.disconnect()
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
 * Setup Express app for testing (Auth Service)
 * @param {string} service - Service name ('auth', 'business', 'admin', 'audit')
 * @returns {Express.Application}
 */
function setupApp(service = 'auth') {
  const serviceMap = {
    auth: '../../services/auth-service/src/index',
    business: '../../services/business-service/src/index',
    admin: '../../services/admin-service/src/index',
    audit: '../../services/audit-service/src/index',
    main: '../../src/index',
  }
  
  const servicePath = serviceMap[service] || serviceMap.main
  
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
