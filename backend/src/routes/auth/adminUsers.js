const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../../models/User')
const Role = require('../../models/Role')
const Office = require('../../models/Office')
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { sanitizeString, sanitizeEmail, sanitizePhoneNumber, sanitizeName } = require('../../lib/sanitizer')
const { isStaffRole, refreshStaffRoleCache } = require('../../lib/roleHelpers')
const { createAuditLog } = require('../../lib/auditLogger')
const { addToPasswordHistory } = require('../../lib/passwordHistory')
const { validatePasswordStrength } = require('../../lib/passwordValidator')
const { sendStaffCredentialsEmail } = require('../../lib/mailer')

const router = express.Router()

const updateStaffSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  phoneNumber: Joi.string().trim().allow('', null).optional(),
  email: Joi.string().email().optional(),
  office: Joi.string().trim().optional(),
  role: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  reason: Joi.string().trim().min(5).max(500).required(),
})

const resetPasswordSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required(),
  tempPasswordLength: Joi.number().integer().min(12).max(24).optional(),
})

const officeCreateSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  group: Joi.string().trim().min(2).max(120).required(),
  isActive: Joi.boolean().optional(),
})

const officeUpdateSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).optional(),
  name: Joi.string().trim().min(2).max(120).optional(),
  group: Joi.string().trim().min(2).max(120).optional(),
  isActive: Joi.boolean().optional(),
}).min(1)

const staffRoleCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().min(3).max(50).pattern(/^[a-z0-9_]+$/).required(),
  description: Joi.string().trim().max(300).allow('').optional(),
  displayName: Joi.string().trim().max(120).allow('').optional(),
})

const staffRoleUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  slug: Joi.string().trim().min(3).max(50).pattern(/^[a-z0-9_]+$/).optional(),
  description: Joi.string().trim().max(300).allow('').optional(),
  displayName: Joi.string().trim().max(120).allow('').optional(),
}).min(1)

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

function normalizeOfficeCode(value) {
  return String(value || '').replace('PNP‑FEU', 'PNP-FEU').trim().toUpperCase()
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
      if (!(staffUser.role?.isStaffRole || isStaffRole(currentRoleSlug))) {
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
        const canonicalOffice = normalizeOfficeCode(office)
        const officeDoc = await Office.findOne({ code: canonicalOffice, isActive: true }).lean()
        if (!officeDoc) {
          return respond.error(res, 400, 'office_not_found', 'Office not found')
        }
        if (canonicalOffice !== staffUser.office) {
          changes.push({ field: 'office', oldValue: staffUser.office || '', newValue: canonicalOffice })
          staffUser.office = canonicalOffice
        }
      }

      if (role !== undefined) {
        const roleDoc = await Role.findOne({ slug: String(role || '').toLowerCase() }).lean()
        if (!roleDoc || !roleDoc.isStaffRole) {
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
    if (!(staffUser.role?.isStaffRole || isStaffRole(roleSlug))) {
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

router.get('/admin/offices', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const docs = await Office.find({}).sort({ group: 1, name: 1 }).lean()
    const offices = docs.map((doc) => ({
      id: String(doc._id),
      code: doc.code,
      name: doc.name,
      group: doc.group || '',
      isActive: doc.isActive !== false,
    }))
    return res.json(offices)
  } catch (err) {
    console.error('GET /api/auth/admin/offices error:', err)
    return respond.error(res, 500, 'office_list_failed', 'Failed to load offices')
  }
})

router.get('/offices', requireJwt, requireRole(['lgu_officer', 'lgu_manager', 'staff', 'inspector', 'cso', 'admin']), async (req, res) => {
  try {
    const docs = await Office.find({}).sort({ group: 1, name: 1 }).lean()
    const offices = docs.map((doc) => ({
      id: String(doc._id),
      code: doc.code,
      name: doc.name,
      group: doc.group || '',
      isActive: doc.isActive !== false,
    }))
    return res.json(offices)
  } catch (err) {
    console.error('GET /api/auth/offices error:', err)
    return respond.error(res, 500, 'office_list_failed', 'Failed to load offices')
  }
})

router.post('/admin/offices', requireJwt, requireRole(['admin']), validateBody(officeCreateSchema), async (req, res) => {
  try {
    const { code, name, group, isActive } = req.body || {}
    const normalizedCode = normalizeOfficeCode(code)
    const existing = await Office.findOne({ code: normalizedCode }).lean()
    if (existing) {
      return respond.error(res, 409, 'office_exists', 'Office code already exists')
    }
    const created = await Office.create({
      code: normalizedCode,
      name: String(name || '').trim(),
      group: String(group || '').trim(),
      isActive: isActive !== false,
    })
    return res.status(201).json({
      id: String(created._id),
      code: created.code,
      name: created.name,
      group: created.group || '',
      isActive: created.isActive !== false,
    })
  } catch (err) {
    console.error('POST /api/auth/admin/offices error:', err)
    return respond.error(res, 500, 'office_create_failed', 'Failed to create office')
  }
})

router.patch('/admin/offices/:officeId', requireJwt, requireRole(['admin']), validateBody(officeUpdateSchema), async (req, res) => {
  try {
    const { officeId } = req.params
    const { code, name, group, isActive } = req.body || {}
    const office = await Office.findById(officeId)
    if (!office) return respond.error(res, 404, 'office_not_found', 'Office not found')

    if (code !== undefined) {
      const normalizedCode = normalizeOfficeCode(code)
      if (normalizedCode !== office.code) {
        const inUse = await User.findOne({ office: office.code }).lean()
        if (inUse) {
          return respond.error(res, 409, 'office_in_use', 'Office code is in use by staff accounts')
        }
        const exists = await Office.findOne({ code: normalizedCode }).lean()
        if (exists) {
          return respond.error(res, 409, 'office_exists', 'Office code already exists')
        }
        office.code = normalizedCode
      }
    }

    if (name !== undefined) {
      office.name = String(name || '').trim()
    }
    if (group !== undefined) {
      office.group = String(group || '').trim()
    }
    if (isActive !== undefined) {
      office.isActive = !!isActive
    }
    await office.save()
    return res.json({
      id: String(office._id),
      code: office.code,
      name: office.name,
      group: office.group || '',
      isActive: office.isActive !== false,
    })
  } catch (err) {
    console.error('PATCH /api/auth/admin/offices/:officeId error:', err)
    return respond.error(res, 500, 'office_update_failed', 'Failed to update office')
  }
})

router.delete('/admin/offices/:officeId', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { officeId } = req.params
    const office = await Office.findById(officeId)
    if (!office) return respond.error(res, 404, 'office_not_found', 'Office not found')
    const inUse = await User.findOne({ office: office.code }).lean()
    if (inUse) {
      return respond.error(res, 409, 'office_in_use', 'Office is assigned to staff users')
    }
    await office.deleteOne()
    return res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/auth/admin/offices/:officeId error:', err)
    return respond.error(res, 500, 'office_delete_failed', 'Failed to delete office')
  }
})

router.get('/admin/staff-roles', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const docs = await Role.find({ isStaffRole: true }).sort({ name: 1 }).lean()
    const roles = docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || '',
      displayName: doc.displayName || doc.name,
    }))
    return res.json(roles)
  } catch (err) {
    console.error('GET /api/auth/admin/staff-roles error:', err)
    return respond.error(res, 500, 'role_list_failed', 'Failed to load roles')
  }
})

router.post('/admin/staff-roles', requireJwt, requireRole(['admin']), validateBody(staffRoleCreateSchema), async (req, res) => {
  try {
    const { name, slug, description, displayName } = req.body || {}
    const normalizedSlug = String(slug || '').toLowerCase().trim()
    const exists = await Role.findOne({ slug: normalizedSlug }).lean()
    if (exists) {
      return respond.error(res, 409, 'role_exists', 'Role slug already exists')
    }
    const created = await Role.create({
      name: String(name || '').trim(),
      slug: normalizedSlug,
      description: String(description || '').trim(),
      displayName: String(displayName || '').trim() || String(name || '').trim(),
      isStaffRole: true,
    })
    await refreshStaffRoleCache()
    return res.status(201).json({
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      description: created.description || '',
      displayName: created.displayName || created.name,
    })
  } catch (err) {
    console.error('POST /api/auth/admin/staff-roles error:', err)
    return respond.error(res, 500, 'role_create_failed', 'Failed to create role')
  }
})

router.patch('/admin/staff-roles/:roleId', requireJwt, requireRole(['admin']), validateBody(staffRoleUpdateSchema), async (req, res) => {
  try {
    const { roleId } = req.params
    const { name, slug, description, displayName } = req.body || {}
    const role = await Role.findById(roleId)
    if (!role) return respond.error(res, 404, 'role_not_found', 'Role not found')
    if (!role.isStaffRole) {
      return respond.error(res, 400, 'role_not_staff', 'Only staff roles can be edited here')
    }
    if (slug !== undefined) {
      const normalizedSlug = String(slug || '').toLowerCase().trim()
      if (normalizedSlug !== role.slug) {
        const exists = await Role.findOne({ slug: normalizedSlug }).lean()
        if (exists) {
          return respond.error(res, 409, 'role_exists', 'Role slug already exists')
        }
        role.slug = normalizedSlug
      }
    }
    if (name !== undefined) {
      role.name = String(name || '').trim()
    }
    if (description !== undefined) {
      role.description = String(description || '').trim()
    }
    if (displayName !== undefined) {
      role.displayName = String(displayName || '').trim()
    }
    await role.save()
    await refreshStaffRoleCache()
    return res.json({
      id: String(role._id),
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      displayName: role.displayName || role.name,
    })
  } catch (err) {
    console.error('PATCH /api/auth/admin/staff-roles/:roleId error:', err)
    return respond.error(res, 500, 'role_update_failed', 'Failed to update role')
  }
})

router.delete('/admin/staff-roles/:roleId', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { roleId } = req.params
    const role = await Role.findById(roleId)
    if (!role) return respond.error(res, 404, 'role_not_found', 'Role not found')
    if (!role.isStaffRole) {
      return respond.error(res, 400, 'role_not_staff', 'Only staff roles can be deleted here')
    }
    const inUse = await User.findOne({ role: role._id }).lean()
    if (inUse) {
      return respond.error(res, 409, 'role_in_use', 'Role is assigned to staff users')
    }
    await role.deleteOne()
    await refreshStaffRoleCache()
    return res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/auth/admin/staff-roles/:roleId error:', err)
    return respond.error(res, 500, 'role_delete_failed', 'Failed to delete role')
  }
})

module.exports = router
