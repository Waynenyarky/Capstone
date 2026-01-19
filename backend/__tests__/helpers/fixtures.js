const User = require('../../src/models/User')
const Role = require('../../src/models/Role')
const bcrypt = require('bcryptjs')

/**
 * Generate unique email with timestamp
 * @param {string} prefix - Email prefix (e.g., 'businessowner', 'staff')
 * @returns {string}
 */
function generateUniqueEmail(prefix = 'user') {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `${prefix}${timestamp}${random}@example.com`
}

/**
 * Generate unique phone number with timestamp
 * @param {string} prefix - Phone prefix (optional)
 * @returns {string}
 */
function generateUniquePhone(prefix = '') {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return prefix ? `${prefix}${timestamp}${random}` : `+1${timestamp}${random}`
}

/**
 * Create a test role
 * @param {string} slug - Role slug (e.g., 'business_owner', 'admin', 'lgu_officer')
 * @returns {Promise<Role>}
 */
async function createTestRole(slug) {
  let role = await Role.findOne({ slug })
  if (!role) {
    const roleNames = {
      business_owner: 'Business Owner',
      admin: 'Admin',
      lgu_officer: 'LGU Officer',
      lgu_manager: 'LGU Manager',
      inspector: 'LGU Inspector',
      cso: 'Customer Support Officer',
    }
    role = await Role.create({
      name: roleNames[slug] || slug,
      slug,
    })
  }
  return role
}

/**
 * Create a test user with unique data
 * @param {object} options - User options
 * @param {string} options.roleSlug - Role slug
 * @param {string} options.email - Email (optional, will generate unique if not provided)
 * @param {string} options.phoneNumber - Phone number (optional, will generate unique if not provided)
 * @param {string} options.password - Password (default: 'Test123!@#')
 * @param {string} options.firstName - First name (optional)
 * @param {string} options.lastName - Last name (optional)
 * @param {object} options.extraFields - Additional fields to set
 * @returns {Promise<User>}
 */
async function createTestUser(options = {}) {
  const {
    roleSlug = 'business_owner',
    email,
    phoneNumber,
    password = 'Test123!@#',
    firstName,
    lastName,
    extraFields = {},
  } = options

  const role = await createTestRole(roleSlug)
  const uniqueEmail = email || generateUniqueEmail(roleSlug)
  const uniquePhone = phoneNumber || generateUniquePhone(`__unset__${Date.now()}_`)

  const userData = {
    role: role._id,
    email: uniqueEmail,
    phoneNumber: uniquePhone,
    passwordHash: await bcrypt.hash(password, 10),
    termsAccepted: true,
    tokenVersion: 0,
    firstName: firstName || (roleSlug === 'business_owner' ? 'Business' : roleSlug === 'admin' ? 'Admin' : 'Staff'),
    lastName: lastName || 'User',
    ...extraFields,
  }

  const user = await User.findOneAndUpdate(
    { email: uniqueEmail },
    userData,
    { upsert: true, new: true }
  )

  await user.populate('role')
  return user
}

/**
 * Create all standard test users (businessOwner, staff, admin)
 * @returns {Promise<{businessOwner: User, staffUser: User, adminUser: User, roles: {businessOwnerRole: Role, staffRole: Role, adminRole: Role}}>}
 */
async function createTestUsers() {
  const businessOwnerRole = await createTestRole('business_owner')
  const staffRole = await createTestRole('lgu_officer')
  const adminRole = await createTestRole('admin')

  const businessOwner = await createTestUser({
    roleSlug: 'business_owner',
    firstName: 'Business',
    lastName: 'Owner',
  })

  const staffUser = await createTestUser({
    roleSlug: 'lgu_officer',
    firstName: 'Staff',
    lastName: 'User',
    extraFields: {
      isStaff: true,
      isActive: true,
    },
  })

  const adminUser = await createTestUser({
    roleSlug: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  })

  return {
    businessOwner,
    staffUser,
    adminUser,
    roles: {
      businessOwnerRole,
      staffRole,
      adminRole,
    },
  }
}

/**
 * Generate tokens for test users
 * @param {object} users - Object with businessOwner, staffUser, adminUser
 * @returns {object} Tokens object
 */
function getTestTokens(users) {
  const { signAccessToken } = require('../../src/middleware/auth')
  
  return {
    businessOwnerToken: signAccessToken(users.businessOwner).token,
    staffToken: signAccessToken(users.staffUser).token,
    adminToken: signAccessToken(users.adminUser).token,
  }
}

/**
 * Create a test verification request
 * @param {string} userId - User ID
 * @param {string} purpose - Verification purpose
 * @param {string} method - Verification method ('otp' or 'mfa')
 * @returns {Promise<object>} Verification request result
 */
async function createTestVerificationRequest(userId, purpose, method = 'otp') {
  const { requestVerification } = require('../../src/lib/verificationService')
  return await requestVerification(userId, method, purpose)
}

module.exports = {
  generateUniqueEmail,
  generateUniquePhone,
  createTestRole,
  createTestUser,
  createTestUsers,
  getTestTokens,
  createTestVerificationRequest,
}
