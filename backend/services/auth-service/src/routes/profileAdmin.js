const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const crypto = require('crypto')
const User = require('../models/User')
const Role = require('../models/Role')
const AdminApproval = require('../models/AdminApproval')
const MaintenanceWindow = require('../models/MaintenanceWindow')
const respond = require('../middleware/respond')
const { requireJwt, requireRole } = require('../middleware/auth')
const { validateBody, Joi } = require('../middleware/validation')
const { generateCode, generateToken } = require('../lib/codes')
const { sendStaffCredentialsEmail } = require('../lib/mailer')
const { sanitizeName, sanitizePhoneNumber, sanitizeEmail } = require('../lib/sanitizer')
const { createAuditLog } = require('../lib/auditLogger')
const { isAdminRole } = require('../lib/roleHelpers')
const { profileUpdateRateLimit, adminApprovalRateLimit, passwordChangeRateLimit } = require('../middleware/rateLimit')
const { requireFieldPermission } = require('../middleware/fieldPermissions')
const { verifyCode, checkVerificationStatus, clearVerificationRequest } = require('../lib/verificationService')
const { validatePasswordStrength } = require('../lib/passwordValidator')
const { checkPasswordHistory, addToPasswordHistory } = require('../lib/passwordHistory')

const router = express.Router()

function displayPhoneNumber(value) {
  const s = typeof value === 'string' ? value : ''
  if (s.startsWith('__unset__')) return ''
  return s
}

function generateTempPassword() {
  return crypto.randomBytes(12).toString('base64url')
}

function generateTempUsername(length = 12) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const bytes = crypto.randomBytes(Math.max(3, Math.min(40, Number(length) || 12)))
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

function deriveNamesFromEmail(email) {
  const local = String(email || '').split('@')[0] || ''
  const tokens = local.split(/[._\- ]+/).filter(Boolean)
  const first = tokens[0] || 'Staff'
  const last = tokens.length > 1 ? tokens.slice(1).join(' ') : 'User'
  return { firstName: first, lastName: last }
}

const staffOfficeList = [
  'OSBC',
  'CHO',
  'BFP',
  'CEO / ZC',
  'BH',
  'DTI',
  'SEC',
  'CDA',
  'PNP-FEU',
  'PNP‑FEU',
  'FDA / BFAD / DOH',
  'PRC / PTR',
  'NTC',
  'POEA',
  'NIC',
  'ECC / ENV',
  'CTO',
  'MD',
  'CLO',
]

const staffCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  phoneNumber: Joi.string().trim().allow('', null).optional(),
  office: Joi.string().valid(...staffOfficeList).required(),
  role: Joi.string().valid('lgu_officer', 'lgu_manager', 'inspector', 'cso').required(),
})

const updateAdminContactSchema = Joi.object({
  phoneNumber: Joi.string().optional().allow(''),
})

const updateAdminPersonalInfoSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phoneNumber: Joi.string().optional().allow(''),
})

const updateAdminEmailSchema = Joi.object({
  newEmail: Joi.string().email().required(),
  verificationCode: Joi.string().optional(),
  mfaCode: Joi.string().optional(),
})

const updateAdminPasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(200).optional(),
  newPassword: Joi.string().min(6).max(200).required(),
  verificationCode: Joi.string().optional(),
  mfaCode: Joi.string().optional(),
})

// GET /api/auth/users
router.get('/users', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const docs = await User.find({}).lean()
    
    // Manually fetch all roles to avoid populate errors with bad data
    const allRoles = await Role.find({}).lean()
    const roleMap = new Map(allRoles.map(r => [String(r._id), r]))
    const roleSlugMap = new Map(allRoles.map(r => [r.slug, r]))

    const usersSafe = []
    for (const doc of docs) {
      let roleData = null
      
      // Handle ObjectId reference
      if (doc.role && mongoose.Types.ObjectId.isValid(doc.role)) {
        roleData = roleMap.get(String(doc.role))
      } 
      // Handle string slug reference (legacy/bad data)
      else if (doc.role && typeof doc.role === 'string') {
        roleData = roleSlugMap.get(doc.role)
        // Auto-fix if we found the role object for this string
        if (roleData) {
          try {
            await User.updateOne({ _id: doc._id }, { role: roleData._id })
          } catch (_) {}
        }
      }

      const roleSlug = roleData ? roleData.slug : 'user'
      
      usersSafe.push({
        id: String(doc._id),
        role: roleSlug,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phoneNumber: displayPhoneNumber(doc.phoneNumber),
        username: doc.username || '',
        office: doc.office || '',
        isActive: doc.isActive !== false,
        isStaff: !!doc.isStaff,
        mustChangeCredentials: !!doc.mustChangeCredentials,
        mustSetupMfa: !!doc.mustSetupMfa,
        isEmailVerified: !!doc.isEmailVerified,
        termsAccepted: doc.termsAccepted,
        createdAt: doc.createdAt,
      })
    }
    
    return res.json(usersSafe)
  } catch (err) {
    console.error('GET /api/auth/users error:', err)
    return respond.error(res, 500, 'users_load_failed', 'Failed to load users')
  }
})

// GET /api/auth/staff
router.get('/staff', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const staffRoles = await Role.find({ slug: { $in: ['lgu_officer', 'lgu_manager', 'inspector', 'cso'] } }).lean()
    const ids = staffRoles.map((r) => r._id)
    const docs = await User.find({ role: { $in: ids } }).populate('role').lean()
    const staffSafe = docs.map((doc) => {
      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      return {
        id: String(doc._id),
        role: roleSlug,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        username: doc.username || '',
        office: doc.office || '',
        phoneNumber: displayPhoneNumber(doc.phoneNumber),
        isActive: doc.isActive !== false,
        mustChangeCredentials: !!doc.mustChangeCredentials,
        mustSetupMfa: !!doc.mustSetupMfa,
        createdAt: doc.createdAt,
      }
    })
    return res.json(staffSafe)
  } catch (err) {
    console.error('GET /api/auth/staff error:', err)
    return respond.error(res, 500, 'staff_load_failed', 'Failed to load staff')
  }
})

// POST /api/auth/staff
router.post('/staff', requireJwt, requireRole(['admin']), validateBody(staffCreateSchema), async (req, res) => {
  try {
    const { email, firstName, lastName, phoneNumber, office, role } = req.body || {}
    const emailKey = String(email).toLowerCase().trim()

    const exists = await User.findOne({ email: emailKey }).lean()
    if (exists) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const roleDoc = await Role.findOne({ slug: role }).lean()
    if (!roleDoc) return respond.error(res, 400, 'role_not_found', 'Role not found')

    let username = ''
    for (let i = 0; i < 20; i++) {
      const candidate = generateTempUsername(12)
      const taken = await User.findOne({ username: candidate }).lean()
      if (!taken) {
        username = candidate
        break
      }
    }
    if (!username) return respond.error(res, 500, 'username_generation_failed', 'Failed to generate a unique username')

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    const storedPhone = phoneNumber && String(phoneNumber).trim() ? String(phoneNumber).trim() : `__unset__${generateToken().slice(0, 16)}`
    const canonicalOffice = String(office || '').replace('PNP‑FEU', 'PNP-FEU')

    const derived = deriveNamesFromEmail(emailKey)
    const safeFirstName = String(firstName || '').trim() || derived.firstName
    const safeLastName = String(lastName || '').trim() || derived.lastName

    const created = await User.create({
      role: roleDoc._id,
      firstName: safeFirstName,
      lastName: safeLastName,
      email: emailKey,
      phoneNumber: storedPhone,
      username,
      office: canonicalOffice,
      isStaff: true,
      isActive: false,
      mustChangeCredentials: true,
      mustSetupMfa: true,
      termsAccepted: true,
      passwordHash,
      isEmailVerified: true,
    })

    const roleLabel = roleDoc.name || role
    await sendStaffCredentialsEmail({ to: emailKey, username, tempPassword, office: canonicalOffice, roleLabel })

    const safe = {
      id: String(created._id),
      role,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      username: created.username || '',
      office: created.office || '',
      phoneNumber: displayPhoneNumber(created.phoneNumber),
      isActive: created.isActive !== false,
      mustChangeCredentials: !!created.mustChangeCredentials,
      mustSetupMfa: !!created.mustSetupMfa,
      createdAt: created.createdAt,
    }
    if (process.env.NODE_ENV !== 'production') {
      safe.devTempPassword = tempPassword
    }
    return res.status(201).json(safe)
  } catch (err) {
    if (err && err.code === 11000) {
      return respond.error(res, 409, 'duplicate_key', 'Duplicate user field')
    }
    console.error('POST /api/auth/staff error:', err)
    return respond.error(res, 500, 'staff_create_failed', 'Failed to create staff account')
  }
})

// PATCH /api/auth/admin/profile/contact (Admin only - no approval required)
// Update contact number for admin
router.patch(
  '/admin/profile/contact',
  requireJwt,
  profileUpdateRateLimit(),
  validateBody(updateAdminContactSchema),
  async (req, res) => {
    try {
      const { phoneNumber } = req.body || {}
      const doc = await User.findById(req._userId).populate('role')
      if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      if (!isAdminRole(roleSlug)) {
        return respond.error(res, 403, 'forbidden', 'This endpoint is only available for admins')
      }

      const sanitized = sanitizePhoneNumber(phoneNumber || '')
      const oldPhoneNumber = doc.phoneNumber

      if (sanitized === oldPhoneNumber) {
        return res.json({ updated: false, message: 'No changes detected' })
      }

      // Check if phone number is already in use (if provided)
      if (sanitized) {
        const existing = await User.findOne({ phoneNumber: sanitized })
        if (existing && String(existing._id) !== String(doc._id)) {
          return respond.error(res, 409, 'phone_exists', 'Phone number already in use')
        }
      }

      doc.phoneNumber = sanitized
      await doc.save()

      // Create audit log
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      await createAuditLog(
        doc._id,
        'contact_update',
        'phoneNumber',
        oldPhoneNumber || '',
        sanitized || '',
        roleSlug,
        {
          ip,
          userAgent,
          adminSelfUpdate: true,
        }
      )

      const userSafe = {
        id: String(doc._id),
        role: roleSlug,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phoneNumber: doc.phoneNumber,
      }

      return res.json({ updated: true, user: userSafe })
    } catch (err) {
      console.error('PATCH /api/auth/profile/contact error:', err)
      return respond.error(res, 500, 'contact_update_failed', 'Failed to update contact number')
    }
  }
)

// PATCH /api/auth/profile/personal-info (Admin only - requires 2 admin approvals)
// Update name and contact info for admin
router.patch(
  '/profile/personal-info',
  requireJwt,
  adminApprovalRateLimit(),
  validateBody(updateAdminPersonalInfoSchema),
  async (req, res) => {
    try {
      const { firstName, lastName, phoneNumber } = req.body || {}
      const doc = await User.findById(req._userId).populate('role')
      if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      if (!isAdminRole(roleSlug)) {
        return respond.error(res, 403, 'forbidden', 'This endpoint is only available for admins')
      }

      // Prepare changes
      const changes = {}
      const oldValues = {}

      if (firstName !== undefined && firstName !== doc.firstName) {
        oldValues.firstName = doc.firstName
        changes.firstName = sanitizeName(firstName)
      }

      if (lastName !== undefined && lastName !== doc.lastName) {
        oldValues.lastName = doc.lastName
        changes.lastName = sanitizeName(lastName)
      }

      if (phoneNumber !== undefined && phoneNumber !== doc.phoneNumber) {
        oldValues.phoneNumber = doc.phoneNumber
        changes.phoneNumber = sanitizePhoneNumber(phoneNumber || '')
      }

      if (Object.keys(changes).length === 0) {
        return res.json({ updated: false, message: 'No changes detected' })
      }

      // Check if phone number is already in use
      if (changes.phoneNumber) {
        const existing = await User.findOne({ phoneNumber: changes.phoneNumber })
        if (existing && String(existing._id) !== String(doc._id)) {
          return respond.error(res, 409, 'phone_exists', 'Phone number already in use')
        }
      }

      // Create approval request
      const approvalId = AdminApproval.generateApprovalId()
      const approval = await AdminApproval.create({
        approvalId,
        requestType: 'personal_info_change',
        userId: doc._id,
        requestedBy: doc._id,
        requestDetails: {
          oldValues,
          newValues: changes,
          fields: Object.keys(changes),
        },
        status: 'pending',
        requiredApprovals: 2,
        metadata: {
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      })

      // Create audit log for approval request
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      // Use first field name (fieldChanged enum doesn't accept comma-separated values)
      const changedFields = Object.keys(changes)
      const fieldChanged = changedFields[0] || undefined
      await createAuditLog(
        doc._id,
        'admin_approval_request',
        fieldChanged,
        JSON.stringify(oldValues),
        JSON.stringify(changes),
        roleSlug,
        {
          ip,
          userAgent,
          approvalId,
          requestType: 'personal_info_change',
        }
      )

      return res.json({
        success: true,
        approval: {
          approvalId: approval.approvalId,
          requestType: approval.requestType,
          status: approval.status,
          requiredApprovals: approval.requiredApprovals,
          message: 'Approval request created. Waiting for 2 admin approvals.',
        },
      })
    } catch (err) {
      console.error('PATCH /api/auth/profile/personal-info error:', err)
      return respond.error(res, 500, 'personal_info_update_failed', 'Failed to create approval request')
    }
  }
)

// PATCH /api/auth/profile/email (Admin only - requires OTP/MFA + 2 admin approvals)
// Change email for admin
router.patch(
  '/profile/email',
  requireJwt,
  adminApprovalRateLimit(),
  validateBody(updateAdminEmailSchema),
  async (req, res) => {
    try {
      const { newEmail, verificationCode, mfaCode } = req.body || {}
      const doc = await User.findById(req._userId).populate('role')
      if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      if (!isAdminRole(roleSlug)) {
        return respond.error(res, 403, 'forbidden', 'This endpoint is only available for admins')
      }

      // Check verification first
      const purpose = 'email_change'
      if (verificationCode) {
        const verifyResult = await verifyCode(doc._id, verificationCode, 'otp', purpose)
        if (!verifyResult.verified) {
          return respond.error(res, 401, 'verification_failed', verifyResult.error || 'Invalid verification code')
        }
      } else if (mfaCode) {
        const verifyResult = await verifyCode(doc._id, mfaCode, 'mfa', purpose)
        if (!verifyResult.verified) {
          return respond.error(res, 401, 'verification_failed', verifyResult.error || 'Invalid MFA code')
        }
      } else {
        const status = await checkVerificationStatus(doc._id, purpose)
        if (!status.pending) {
          return respond.error(
            res,
            428,
            'verification_required',
            'Verification required before changing email. Please request verification first.'
          )
        }
        return respond.error(
          res,
          428,
          'verification_required',
          'Please provide verification code or MFA code'
        )
      }

      const sanitizedEmail = sanitizeEmail(newEmail)

      // Check if email already exists
      const existing = await User.findOne({ email: sanitizedEmail })
      if (existing && String(existing._id) !== String(doc._id)) {
        return respond.error(res, 409, 'email_exists', 'Email already exists')
      }

      const oldEmail = doc.email

      // Create approval request
      const approvalId = AdminApproval.generateApprovalId()
      const approval = await AdminApproval.create({
        approvalId,
        requestType: 'email_change',
        userId: doc._id,
        requestedBy: doc._id,
        requestDetails: {
          oldEmail,
          newEmail: sanitizedEmail,
        },
        status: 'pending',
        requiredApprovals: 2,
        metadata: {
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          verificationCompleted: true,
        },
      })

      // Clear verification request
      clearVerificationRequest(doc._id, purpose)

      // Create audit log for approval request
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      await createAuditLog(
        doc._id,
        'admin_approval_request',
        'email',
        oldEmail,
        sanitizedEmail,
        roleSlug,
        {
          ip,
          userAgent,
          approvalId,
          requestType: 'email_change',
        }
      )

      return res.json({
        success: true,
        approval: {
          approvalId: approval.approvalId,
          requestType: approval.requestType,
          status: approval.status,
          requiredApprovals: approval.requiredApprovals,
          message: 'Approval request created. Waiting for 2 admin approvals.',
        },
      })
    } catch (err) {
      console.error('PATCH /api/auth/profile/email error:', err)
      return respond.error(res, 500, 'email_update_failed', 'Failed to create approval request')
    }
  }
)

// PATCH /api/auth/profile/password (Admin only - requires OTP/MFA + 2 admin approvals)
// Change password for admin
router.patch(
  '/profile/password',
  requireJwt,
  passwordChangeRateLimit(),
  validateBody(updateAdminPasswordSchema),
  requireFieldPermission('password'),
  async (req, res) => {
    try {
      const { currentPassword, newPassword, verificationCode, mfaCode } = req.body || {}
      const doc = await User.findById(req._userId).populate('role')
      if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      if (!isAdminRole(roleSlug)) {
        return respond.error(res, 403, 'forbidden', 'This endpoint is only available for admins')
      }

      // Verify current password if provided (alternative to OTP/MFA)
      let verificationPassed = false
      if (currentPassword) {
        const ok = await bcrypt.compare(currentPassword, doc.passwordHash)
        if (ok) {
          verificationPassed = true
        }
      }

      // Check OTP/MFA verification
      if (!verificationPassed) {
        const purpose = 'password_change'
        if (verificationCode) {
          const verifyResult = await verifyCode(doc._id, verificationCode, 'otp', purpose)
          if (verifyResult.verified) {
            verificationPassed = true
          }
        } else if (mfaCode) {
          const verifyResult = await verifyCode(doc._id, mfaCode, 'mfa', purpose)
          if (verifyResult.verified) {
            verificationPassed = true
          }
        }

        if (!verificationPassed) {
          const status = await checkVerificationStatus(doc._id, purpose)
          if (!status.pending) {
            return respond.error(
              res,
              428,
              'verification_required',
              'Verification required. Provide current password, verification code, or MFA code.'
            )
          }
          return respond.error(
            res,
            428,
            'verification_required',
            'Please provide current password, verification code, or MFA code'
          )
        }
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) {
        return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordValidation.errors)
      }

      // Check password history
      const historyCheck = await checkPasswordHistory(newPassword, doc.passwordHistory || [])
      if (historyCheck.inHistory) {
        return respond.error(res, 400, 'password_reused', 'You cannot reuse a recently used password. Please choose a different password.')
      }

      // Create approval request
      const approvalId = AdminApproval.generateApprovalId()
      const approval = await AdminApproval.create({
        approvalId,
        requestType: 'password_change',
        userId: doc._id,
        requestedBy: doc._id,
        requestDetails: {
          // Don't store actual passwords, just indicate change requested
          passwordChangeRequested: true,
          passwordStrengthValid: true,
          passwordNotInHistory: true,
        },
        status: 'pending',
        requiredApprovals: 2,
        metadata: {
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          verificationCompleted: true,
          // Store password hash temporarily (will be cleared after approval)
          newPasswordHash: await bcrypt.hash(newPassword, 10),
        },
      })

      // Clear verification request
      clearVerificationRequest(doc._id, 'password_change')

      // Create audit log for approval request
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      await createAuditLog(
        doc._id,
        'admin_approval_request',
        'password',
        '[REDACTED]',
        '[REDACTED]',
        roleSlug,
        {
          ip,
          userAgent,
          approvalId,
          requestType: 'password_change',
        }
      )

      return res.json({
        success: true,
        approval: {
          approvalId: approval.approvalId,
          requestType: approval.requestType,
          status: approval.status,
          requiredApprovals: approval.requiredApprovals,
          message: 'Approval request created. Waiting for 2 admin approvals.',
        },
      })
    } catch (err) {
      console.error('PATCH /api/auth/profile/password error:', err)
      return respond.error(res, 500, 'password_update_failed', 'Failed to create approval request')
    }
  }
)

module.exports = router
