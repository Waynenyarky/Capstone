const mongoose = require('mongoose')
const User = require('../../services/auth-service/src/models/User')
const Role = require('../../services/auth-service/src/models/Role')
const AuditLog = require('../../services/auth-service/src/models/AuditLog')
const IdVerification = require('../../services/auth-service/src/models/IdVerification')
const AdminApproval = require('../../services/auth-service/src/models/AdminApproval')
const EmailChangeRequest = require('../../services/auth-service/src/models/EmailChangeRequest')
const ResetRequest = require('../../services/auth-service/src/models/ResetRequest')
const DeleteRequest = require('../../services/auth-service/src/models/DeleteRequest')
const RecoveryRequest = require('../../services/auth-service/src/models/RecoveryRequest')
const TemporaryCredential = require('../../services/auth-service/src/models/TemporaryCredential')
const Session = require('../../services/auth-service/src/models/Session')
const AdminDeletionRequest = require('../../services/auth-service/src/models/AdminDeletionRequest')

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
    // Clean up in order to respect foreign key constraints
    await AuditLog.deleteMany({})
    await IdVerification.deleteMany({})
    await AdminApproval.deleteMany({})
    await EmailChangeRequest.deleteMany({})
    await ResetRequest.deleteMany({})
    await DeleteRequest.deleteMany({})
    await RecoveryRequest.deleteMany({})
    await TemporaryCredential.deleteMany({})
    await Session.deleteMany({})
    await AdminDeletionRequest.deleteMany({})
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
      const { seedDevDataIfEmpty } = require('../../services/auth-service/src/lib/seedDev')
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
