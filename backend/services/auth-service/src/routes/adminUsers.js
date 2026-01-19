const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../models/User')
const Role = require('../models/Role')
const { requireJwt, requireRole } = require('../middleware/auth')
const respond = require('../middleware/respond')
const { validateBody, Joi } = require('../middleware/validation')
const { sanitizeString, sanitizeEmail, sanitizePhoneNumber, sanitizeName } = require('../lib/sanitizer')
const { isStaffRole } = require('../lib/roleHelpers')
const { createAuditLog } = require('../lib/auditLogger')
const { addToPasswordHistory } = require('../lib/passwordHistory')
const { validatePasswordStrength } = require('../lib/passwordValidator')
const { sendStaffCredentialsEmail } = require('../lib/mailer')

const router = express.Router()

// Keep office options consistent with staff creation
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

const staffRoleList = ['lgu_officer', 'lgu_manager', 'inspector', 'cso']

const updateStaffSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  phoneNumber: Joi.string().trim().allow('', null).optional(),
  email: Joi.string().email().optional(),
  office: Joi.string().valid(...staffOfficeList).optional(),
  role: Joi.string().valid(...staffRoleList).optional(),
  isActive: Joi.boolean().optional(),
  reason: Joi.string().trim().min(5).max(500).required(),
})

const resetPasswordSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required(),
  tempPasswordLength: Joi.number().integer().min(12).max(24).optional(),
})

function generateTempPassword(len = 14) {
  const length = Math.max(12, Math.min(32, Number(len) || 14))
  const lowers = 'abcdefghijklmnopqrstuvwxyz'
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const specials = '!@#$%^&*'
  const all = lowers + uppers + digits + specials

  function pick(set) {
    const idx = crypto.randomBytes(1)[0] % set.length
    return set[idx]
  }

  const required = [pick(lowers), pick(uppers), pick(digits), pick(specials)]
  const remainingLen = Math.max(length - required.length, 0)
  const remaining = Array.from({ length: remainingLen }, () => pick(all))
  const raw = required.concat(remaining)

  // Shuffle
  for (let i = raw.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1)
    ;[raw[i], raw[j]] = [raw[j], raw[i]]
  }

  return raw.join('')
}

function sanitizeNameField(value) {
  const raw = sanitizeName(sanitizeString(value || ''))
  return raw || ''
}

router.patch(
  '/admin/staff/:staffId',
  requireJwt,
  requireRole(['admin']),
  validateBody(updateStaffSchema),
  async (req, res) => {
    try {
      const adminId = req._userId
      const staffId = req.params.staffId
      const {
        firstName,
        lastName,
        phoneNumber,
        email,
        office,
        role,
        isActive,
        reason,
      } = req.body || {}

      const staffUser = await User.findById(staffId).populate('role')
      if (!staffUser) return respond.error(res, 404, 'staff_not_found', 'Staff user not found')

      const currentRoleSlug = staffUser.role?.slug || ''
      if (!isStaffRole(currentRoleSlug)) {
        return respond.error(res, 400, 'not_staff_user', 'Only staff users can be edited here')
      }

      const changes = []

      if (firstName !== undefined) {
        const safe = sanitizeNameField(firstName)
        if (safe && safe !== staffUser.firstName) {
          changes.push({ field: 'firstName', oldValue: staffUser.firstName || '', newValue: safe })
          staffUser.firstName = safe
        }
      }

      if (lastName !== undefined) {
        const safe = sanitizeNameField(lastName)
        if (safe && safe !== staffUser.lastName) {
          changes.push({ field: 'lastName', oldValue: staffUser.lastName || '', newValue: safe })
          staffUser.lastName = safe
        }
      }

      if (phoneNumber !== undefined) {
        const safePhone = sanitizePhoneNumber(String(phoneNumber || ''))
        if (safePhone !== staffUser.phoneNumber) {
          changes.push({ field: 'phoneNumber', oldValue: staffUser.phoneNumber || '', newValue: safePhone })
          staffUser.phoneNumber = safePhone || ''
        }
      }

      if (email !== undefined) {
        const normalized = sanitizeEmail(email || '')
        if (!normalized) return respond.error(res, 400, 'invalid_email', 'Invalid email')
        if (normalized !== staffUser.email) {
          const exists = await User.findOne({ email: normalized }).lean()
          if (exists && String(exists._id) !== String(staffUser._id)) {
            return respond.error(res, 409, 'email_exists', 'Email already in use')
          }
          changes.push({ field: 'email', oldValue: staffUser.email || '', newValue: normalized })
          staffUser.email = normalized
          // Email change: require MFA re-setup and invalidate sessions
          staffUser.mfaEnabled = false
          staffUser.mfaSecret = ''
          staffUser.fprintEnabled = false
          staffUser.mfaMethod = ''
          staffUser.mfaDisablePending = false
          staffUser.mfaDisableRequestedAt = null
          staffUser.mfaDisableScheduledFor = null
          staffUser.tokenFprint = ''
          staffUser.tokenVersion = (staffUser.tokenVersion || 0) + 1
          staffUser.mustSetupMfa = true
        }
      }

      if (office !== undefined) {
        const canonicalOffice = String(office || '').replace('PNP‑FEU', 'PNP-FEU')
        if (canonicalOffice !== staffUser.office) {
          changes.push({ field: 'office', oldValue: staffUser.office || '', newValue: canonicalOffice })
          staffUser.office = canonicalOffice
        }
      }

      if (role !== undefined) {
        const roleDoc = await Role.findOne({ slug: role }).lean()
        if (!roleDoc || !staffRoleList.includes(roleDoc.slug)) {
          return respond.error(res, 400, 'role_not_allowed', 'Role not allowed for staff')
        }
        if (String(staffUser.role?._id || staffUser.role) !== String(roleDoc._id)) {
          changes.push({ field: 'role', oldValue: currentRoleSlug, newValue: roleDoc.slug })
          staffUser.role = roleDoc._id
        }
      }

      if (isActive !== undefined) {
        const active = !!isActive
        const prev = staffUser.isActive !== false
        if (active !== prev) {
          changes.push({ field: 'account', oldValue: String(prev), newValue: String(active) })
          staffUser.isActive = active
          // Invalidate sessions when deactivating
          if (!active) {
            staffUser.tokenVersion = (staffUser.tokenVersion || 0) + 1
          }
        }
      }

      if (!changes.length) {
        return res.json({ success: true, user: {
          id: String(staffUser._id),
          email: staffUser.email,
          firstName: staffUser.firstName,
          lastName: staffUser.lastName,
          phoneNumber: staffUser.phoneNumber,
          office: staffUser.office,
          role: staffUser.role?.slug || staffUser.role,
          isActive: staffUser.isActive !== false,
          mustSetupMfa: !!staffUser.mustSetupMfa,
          mustChangeCredentials: !!staffUser.mustChangeCredentials,
          tokenVersion: staffUser.tokenVersion || 0,
        }})
      }

      await staffUser.save()

      const adminRole = req._userRole || 'admin'
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'

      // Create audit log per field changed
      for (const change of changes) {
        await createAuditLog(
          staffUser._id,
          'profile_update',
          change.field,
          change.oldValue,
          change.newValue,
          adminRole,
          {
            reason,
            changedBy: adminId,
            ip,
            userAgent,
          }
        )
      }

      return res.json({
        success: true,
        user: {
          id: String(staffUser._id),
          email: staffUser.email,
          firstName: staffUser.firstName,
          lastName: staffUser.lastName,
          phoneNumber: staffUser.phoneNumber,
          office: staffUser.office,
          role: staffUser.role?.slug || staffUser.role,
          isActive: staffUser.isActive !== false,
          mustSetupMfa: !!staffUser.mustSetupMfa,
          mustChangeCredentials: !!staffUser.mustChangeCredentials,
          tokenVersion: staffUser.tokenVersion || 0,
        },
      })
    } catch (err) {
      console.error('PATCH /api/auth/admin/staff/:staffId error:', err)
      return respond.error(res, 500, 'staff_update_failed', 'Failed to update staff user')
    }
  }
)

router.post(
  '/admin/staff/:staffId/reset-password',
  requireJwt,
  requireRole(['admin']),
  validateBody(resetPasswordSchema),
  async (req, res) => {
    try {
      const adminId = req._userId
      const { staffId } = req.params
      const { reason, tempPasswordLength } = req.body || {}

      const staffUser = await User.findById(staffId).populate('role')
      if (!staffUser) return respond.error(res, 404, 'staff_not_found', 'Staff user not found')

      const roleSlug = staffUser.role?.slug || ''
      if (!isStaffRole(roleSlug)) {
        return respond.error(res, 400, 'not_staff_user', 'Only staff users can be reset here')
      }

      const tempPassword = generateTempPassword(tempPasswordLength || 14)
      const strength = validatePasswordStrength(tempPassword)
      if (!strength.valid) {
        return respond.error(res, 500, 'password_generation_failed', 'Generated password did not meet strength requirements')
      }

      // Update password and security flags
      const oldHash = String(staffUser.passwordHash || '')
      const newHash = await bcrypt.hash(tempPassword, 10)
      const updatedHistory = addToPasswordHistory(oldHash, staffUser.passwordHistory || [])

      staffUser.passwordHash = newHash
      staffUser.passwordHistory = updatedHistory
      staffUser.tokenVersion = (staffUser.tokenVersion || 0) + 1
      staffUser.mustChangeCredentials = true
      staffUser.mustSetupMfa = true
      staffUser.mfaEnabled = false
      staffUser.mfaSecret = ''
      staffUser.fprintEnabled = false
      staffUser.mfaMethod = ''
      staffUser.mfaDisablePending = false
      staffUser.mfaDisableRequestedAt = null
      staffUser.mfaDisableScheduledFor = null
      staffUser.tokenFprint = ''

      await staffUser.save()

      // Send email with temp credentials (non-blocking)
      const roleLabel = staffUser.role?.name || roleSlug || 'Staff'
      sendStaffCredentialsEmail({
        to: staffUser.email,
        username: staffUser.username,
        tempPassword,
        office: staffUser.office || '',
        roleLabel,
      }).catch((err) => {
        console.error('Failed to send staff credentials email:', err)
      })

      const adminRole = req._userRole || 'admin'
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'

      await createAuditLog(
        staffUser._id,
        'password_change',
        'password',
        '[REDACTED]',
        '[REDACTED]',
        adminRole,
        {
          reason,
          resetBy: adminId,
          ip,
          userAgent,
          tokenVersion: staffUser.tokenVersion,
          mustChangeCredentials: true,
          mustSetupMfa: true,
        }
      )

      return res.json({
        success: true,
        message: 'Temporary password issued',
        user: {
          id: String(staffUser._id),
          email: staffUser.email,
          username: staffUser.username || '',
          office: staffUser.office || '',
          role: roleSlug,
          isActive: staffUser.isActive !== false,
          mustChangeCredentials: !!staffUser.mustChangeCredentials,
          mustSetupMfa: !!staffUser.mustSetupMfa,
        },
      })
    } catch (err) {
      console.error('POST /api/auth/admin/staff/:staffId/reset-password error:', err)
      return respond.error(res, 500, 'staff_reset_failed', 'Failed to reset staff password')
    }
  }
)

module.exports = router
