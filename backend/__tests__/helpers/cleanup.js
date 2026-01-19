const mongoose = require('mongoose')
const User = require('../../src/models/User')
const Role = require('../../src/models/Role')
const AuditLog = require('../../src/models/AuditLog')
const IdVerification = require('../../src/models/IdVerification')
const AdminApproval = require('../../src/models/AdminApproval')
const EmailChangeRequest = require('../../src/models/EmailChangeRequest')
const ResetRequest = require('../../src/models/ResetRequest')
const DeleteRequest = require('../../src/models/DeleteRequest')
const RecoveryRequest = require('../../src/models/RecoveryRequest')
const TemporaryCredential = require('../../src/models/TemporaryCredential')
const Session = require('../../src/models/Session')

/**
 * Clean up all test users (users with test email pattern)
 */
async function cleanupTestUsers() {
  try {
    await User.deleteMany({
      email: { $regex: /@example\.com$/, $options: 'i' },
    })
  } catch (error) {
    console.error('Error cleaning up test users:', error)
  }
}

/**
 * Clean up all test-created data
 */
async function cleanupTestData() {
  try {
    // Ensure mongoose connection is ready before cleanup operations
    const mongoose = require('mongoose')
    if (mongoose.connection.readyState !== 1) {
      // Wait for connection to be ready (max 5 seconds)
      let retries = 0
      while (mongoose.connection.readyState !== 1 && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      if (mongoose.connection.readyState !== 1) {
        console.warn('Mongoose connection not ready, skipping cleanup')
        return
      }
    }

    // Clean up in order to respect foreign key constraints
    // Use Promise.allSettled to continue even if one fails
    await Promise.allSettled([
      AuditLog.deleteMany({}).catch(err => {
        console.warn('Error cleaning up AuditLog:', err.message)
      }),
      IdVerification.deleteMany({}).catch(err => {
        console.warn('Error cleaning up IdVerification:', err.message)
      }),
      AdminApproval.deleteMany({}).catch(err => {
        console.warn('Error cleaning up AdminApproval:', err.message)
      }),
      EmailChangeRequest.deleteMany({}).catch(err => {
        console.warn('Error cleaning up EmailChangeRequest:', err.message)
      }),
      ResetRequest.deleteMany({}).catch(err => {
        console.warn('Error cleaning up ResetRequest:', err.message)
      }),
      DeleteRequest.deleteMany({}).catch(err => {
        console.warn('Error cleaning up DeleteRequest:', err.message)
      }),
      RecoveryRequest.deleteMany({}).catch(err => {
        console.warn('Error cleaning up RecoveryRequest:', err.message)
      }),
      TemporaryCredential.deleteMany({}).catch(err => {
        console.warn('Error cleaning up TemporaryCredential:', err.message)
      }),
      Session.deleteMany({}).catch(err => {
        console.warn('Error cleaning up Session:', err.message)
      }),
    ])
    
    await cleanupTestUsers()
  } catch (error) {
    console.error('Error cleaning up test data:', error)
  }
}

/**
 * Clean up database (all collections except roles)
 */
async function cleanupDatabase() {
  try {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      // Skip roles collection as it's seeded
      if (key !== 'roles') {
        await collections[key].deleteMany({})
      }
    }
  } catch (error) {
    console.error('Error cleaning up database:', error)
  }
}

/**
 * Reset database to initial state
 */
async function resetDatabase() {
  try {
    await cleanupDatabase()
    // Re-seed if needed
    try {
      const { seedDevDataIfEmpty } = require('../../src/lib/seedDev')
      await seedDevDataIfEmpty()
    } catch (err) {
      // seedDev may not exist, that's okay
    }
  } catch (error) {
    console.error('Error resetting database:', error)
  }
}

module.exports = {
  cleanupTestUsers,
  cleanupTestData,
  cleanupDatabase,
  resetDatabase,
}
