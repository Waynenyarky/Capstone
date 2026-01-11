const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const Role = require('../../models/Role')
const { decryptWithHash, encryptWithHash } = require('../../lib/secretCipher')
const respond = require('../../middleware/respond')
const { requireJwt, requireRole } = require('../../middleware/auth')
const { validateBody, Joi } = require('../../middleware/validation')
const { generateCode, generateToken } = require('../../lib/codes')
const { sendOtp, sendStaffCredentialsEmail } = require('../../lib/mailer')
const { changeEmailRequests } = require('../../lib/authRequestsStore')

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

const changePasswordAuthenticatedSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(200).required(),
  newPassword: Joi.string().min(6).max(200).required(),
})

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phoneNumber: Joi.string().optional(),
})

const uploadAvatarSchema = Joi.object({
  imageBase64: Joi.string().min(32).required(),
})

router.post('/profile/avatar', requireJwt, validateBody(uploadAvatarSchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const raw = String(req.body.imageBase64 || '')
    let mime = ''
    let dataStr = raw
    if (raw.startsWith('data:')) {
      const parts = raw.split(',')
      const header = parts[0] || ''
      dataStr = parts[1] || ''
      const m = header.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/)
      mime = m ? m[1] : ''
    }
    const buf = Buffer.from(dataStr, 'base64')
    if (!buf || buf.length < 1000) return respond.error(res, 400, 'invalid_image', 'Invalid image')
    let ext = 'jpg'
    if (mime.includes('png')) ext = 'png'
    if (mime.includes('jpeg')) ext = 'jpg'
    if (mime.includes('webp')) ext = 'webp'
    const path = require('path')
    const fs = require('fs')
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
    const avatarsDir = path.join(uploadsDir, 'avatars')
    try { fs.mkdirSync(avatarsDir, { recursive: true }) } catch (_) {}
    const filename = `${String(doc._id)}_${Date.now()}.${ext}`
    const filePath = path.join(avatarsDir, filename)
    await fs.promises.writeFile(filePath, buf)
    doc.avatarUrl = `/uploads/avatars/${filename}`
    await doc.save()
    return res.json({ success: true, avatarUrl: doc.avatarUrl })
  } catch (err) {
    console.error('POST /api/auth/profile/avatar error:', err)
    return respond.error(res, 500, 'avatar_upload_failed', 'Failed to upload avatar')
  }
})

// POST /api/auth/profile/avatar-file - multipart upload
router.post('/profile/avatar-file', requireJwt, async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const multer = require('multer')
    const path = require('path')
    const fs = require('fs')
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
    const avatarsDir = path.join(uploadsDir, 'avatars')
    try { fs.mkdirSync(avatarsDir, { recursive: true }) } catch (_) {}
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, avatarsDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg'
        cb(null, `${String(doc._id)}_${Date.now()}${ext}`)
      },
    })
    const upload = multer({ storage }).single('avatar')

    upload(req, res, async (err) => {
      if (err) return respond.error(res, 400, 'upload_failed', 'Upload failed')
      const file = req.file
      if (!file) return respond.error(res, 400, 'no_file', 'No file uploaded')
      doc.avatarUrl = `/uploads/avatars/${path.basename(file.path)}`
      await doc.save()
      return res.json({ success: true, avatarUrl: doc.avatarUrl })
    })
  } catch (err) {
    console.error('POST /api/auth/profile/avatar-file error:', err)
    return respond.error(res, 500, 'avatar_upload_failed', 'Failed to upload avatar')
  }
})

router.delete('/profile/avatar', requireJwt, async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const path = require('path')
    const fs = require('fs')
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
    const avatarsDir = path.join(uploadsDir, 'avatars')
    const basename = path.basename(String(doc.avatarUrl || ''))
    const filePath = basename ? path.join(avatarsDir, basename) : ''
    try { if (filePath) await fs.promises.unlink(filePath) } catch (_) {}
    doc.avatarUrl = ''
    await doc.save()
    return res.json({ success: true, message: 'Avatar deleted' })
  } catch (err) {
    console.error('DELETE /api/auth/profile/avatar error:', err)
    return respond.error(res, 500, 'avatar_delete_failed', 'Failed to delete avatar')
  }
})

router.post('/profile/avatar/delete', requireJwt, async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const path = require('path')
    const fs = require('fs')
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
    const avatarsDir = path.join(uploadsDir, 'avatars')
    const basename = path.basename(String(doc.avatarUrl || ''))
    const filePath = basename ? path.join(avatarsDir, basename) : ''
    try { if (filePath) await fs.promises.unlink(filePath) } catch (_) {}
    doc.avatarUrl = ''
    await doc.save()
    return res.json({ success: true, message: 'Avatar deleted' })
  } catch (err) {
    console.error('POST /api/auth/profile/avatar/delete error:', err)
    return respond.error(res, 500, 'avatar_delete_failed', 'Failed to delete avatar')
  }
})

const changeEmailAuthenticatedSchema = Joi.object({
  password: Joi.string().min(6).max(200).required(),
  newEmail: Joi.string().email().required(),
})

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

const firstLoginChangeCredentialsSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(200).optional(),
  newPassword: Joi.string().min(6).max(200).required(),
  newUsername: Joi.string().trim().lowercase().pattern(/^[a-z0-9][a-z0-9._-]{2,39}$/).required(),
})

// POST /api/auth/change-password-authenticated
// Change password for a logged-in user by verifying current password.
router.post('/change-password-authenticated', requireJwt, validateBody(changePasswordAuthenticatedSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}

    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']

    let doc = null
    if (idHeader) {
      try {
        doc = await User.findById(idHeader).populate('role')
      } catch (_) {
        doc = null
      }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader }).populate('role')
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const ok = await bcrypt.compare(currentPassword, doc.passwordHash)
    if (!ok) return respond.error(res, 401, 'invalid_current_password', 'Invalid current password')

    const oldHash = String(doc.passwordHash)
    let mfaPlain = ''
    try { if (doc.mfaSecret) mfaPlain = decryptWithHash(oldHash, doc.mfaSecret) } catch (_) { mfaPlain = '' }

    doc.passwordHash = await bcrypt.hash(newPassword, 10)

    if (mfaPlain) {
      try { doc.mfaSecret = encryptWithHash(doc.passwordHash, mfaPlain) } catch (_) {}
    }
    await doc.save()

    const userSafe = {
      id: String(doc._id),
      role: doc.role && doc.role.slug ? doc.role.slug : doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      isEmailVerified: !!doc.isEmailVerified,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }

    // Force 200 by adding a cache-busting header or modifying response headers
    // The 304 happens because Express/ETag sees the response hasn't changed.
    // To "make it 200", we can disable caching for this specific route.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')

    return res.json(userSafe)
  } catch (err) {
    console.error('POST /api/auth/change-password-authenticated error:', err)
    return respond.error(res, 500, 'change_password_failed', 'Failed to change password')
  }
})

// POST /api/auth/change-email-authenticated
// Change email for a logged-in user by verifying current password.
router.post('/change-email-authenticated', requireJwt, validateBody(changeEmailAuthenticatedSchema), async (req, res) => {
  try {
    const { password, newEmail } = req.body || {}

    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']

    let doc = null
    if (idHeader) {
      try {
        doc = await User.findById(idHeader)
      } catch (_) {
        doc = null
      }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const ok = await bcrypt.compare(password, doc.passwordHash)
    if (!ok) return respond.error(res, 401, 'invalid_password', 'Invalid password')

    const normalized = String(newEmail || '').trim().toLowerCase()
    if (!normalized) return respond.error(res, 400, 'invalid_email', 'Invalid email')
    if (normalized === String(doc.email || '').toLowerCase()) {
      return respond.error(res, 400, 'same_email', 'New email must be different from current')
    }
    const exists = await User.findOne({ email: normalized }).lean()
    if (exists) return respond.error(res, 409, 'email_in_use', 'Email already in use')

    doc.email = normalized
    doc.mfaEnabled = false
    doc.mfaSecret = ''
    doc.fprintEnabled = false
    doc.mfaMethod = ''
    doc.mfaDisablePending = false
    doc.mfaDisableRequestedAt = null
    doc.mfaDisableScheduledFor = null
    doc.tokenFprint = ''
    await doc.save()

    return res.json({ message: 'Email updated successfully', email: doc.email })
  } catch (err) {
    console.error('POST /api/auth/change-email-authenticated error:', err)
    return respond.error(res, 500, 'change_email_failed', 'Failed to change email')
  }
})

const changeEmailStartSchema = Joi.object({
  newEmail: Joi.string().email().required(),
})

// POST /api/auth/change-email/start
// Step 1: send OTP to the new email to confirm change
router.post('/change-email/start', requireJwt, validateBody(changeEmailStartSchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const currentEmail = String(doc.email || '').toLowerCase()
    const input = String(req.body.newEmail || '').trim().toLowerCase()
    if (!input) return respond.error(res, 400, 'invalid_email', 'Invalid email')
    if (input === currentEmail) return respond.error(res, 400, 'same_email', 'New email must be different from current')

    const exists = await User.findOne({ email: input }).lean()
    if (exists) return respond.error(res, 409, 'email_in_use', 'Email already in use')

    const code = generateCode()
    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAtMs = Date.now() + ttlMin * 60 * 1000
    const key = currentEmail
    changeEmailRequests.set(key, { code, expiresAt: expiresAtMs, newEmail: input })

    await sendOtp({ to: input, code, subject: 'Confirm email change' })
    return res.json({ sent: true, to: input, expiresAt: new Date(expiresAtMs).toISOString() })
  } catch (err) {
    console.error('POST /api/auth/change-email/start error:', err)
    return respond.error(res, 500, 'change_email_start_failed', 'Failed to send verification code')
  }
})

const changeEmailVerifySchema = Joi.object({
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

// POST /api/auth/change-email/verify
// Step 2: verify OTP and update user's email
router.post('/change-email/verify', requireJwt, validateBody(changeEmailVerifySchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const key = String(doc.email || '').toLowerCase()
    const reqObj = changeEmailRequests.get(key)
    if (!reqObj) return respond.error(res, 404, 'change_email_request_not_found', 'No change email request found')
    if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')

    const { code } = req.body || {}
    if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')

    const nextEmail = String(reqObj.newEmail || '').toLowerCase()
    if (!nextEmail) return respond.error(res, 400, 'invalid_email', 'Invalid email')
    const exists = await User.findOne({ email: nextEmail }).lean()
    if (exists) {
      changeEmailRequests.delete(key)
      return respond.error(res, 409, 'email_in_use', 'Email already in use')
    }

    doc.email = nextEmail
    doc.mfaEnabled = false
    doc.mfaSecret = ''
    doc.fprintEnabled = false
    doc.mfaMethod = ''
    doc.mfaDisablePending = false
    doc.mfaDisableRequestedAt = null
    doc.mfaDisableScheduledFor = null
    doc.tokenFprint = ''
    await doc.save()
    changeEmailRequests.delete(key)
    return res.json({ updated: true, email: doc.email })
  } catch (err) {
    console.error('POST /api/auth/change-email/verify error:', err)
    return respond.error(res, 500, 'change_email_verify_failed', 'Failed to verify change email')
  }
})

const changeEmailConfirmStartSchema = Joi.object({
  email: Joi.string().email().optional(),
})

// POST /api/auth/change-email/confirm/start
router.post('/change-email/confirm/start', requireJwt, validateBody(changeEmailConfirmStartSchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const currentEmail = String(doc.email || '').toLowerCase()
    const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
    const expiresAtMs = Date.now() + ttlMin * 60 * 1000
    const code = generateCode()
    changeEmailRequests.set(currentEmail, { code, expiresAt: expiresAtMs, newEmail: '' })
    await sendOtp({ to: currentEmail, code, subject: 'Confirm your email' })
    return res.json({ sent: true, to: currentEmail, expiresAt: new Date(expiresAtMs).toISOString() })
  } catch (err) {
    console.error('POST /api/auth/change-email/confirm/start error:', err)
    return respond.error(res, 500, 'change_email_confirm_start_failed', 'Failed to send verification code')
  }
})

const changeEmailConfirmVerifySchema = Joi.object({
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

// POST /api/auth/change-email/confirm/verify
router.post('/change-email/confirm/verify', requireJwt, validateBody(changeEmailConfirmVerifySchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req._userEmail || req.headers['x-user-email']
    let doc = null
    if (idHeader) {
      try { doc = await User.findById(idHeader) } catch (_) { doc = null }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const key = String(doc.email || '').toLowerCase()
    const reqObj = changeEmailRequests.get(key)
    if (!reqObj) return respond.error(res, 404, 'change_email_confirm_not_found', 'No confirmation request found')
    if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
    const { code } = req.body || {}
    if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    changeEmailRequests.delete(key)
    return res.json({ verified: true })
  } catch (err) {
    console.error('POST /api/auth/change-email/confirm/verify error:', err)
    return respond.error(res, 500, 'change_email_confirm_verify_failed', 'Failed to verify email')
  }
})
// GET /api/auth/users
router.get('/users', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const docs = await User.find({}).lean()
    
    // Manually fetch all roles to avoid populate errors with bad data
    const Role = require('../../models/Role')
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

// GET /api/auth/me - return current user's profile
router.get('/me', requireJwt, async (req, res) => {
  try {
    const doc = await User.findById(req._userId).populate('role').lean()
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    const userSafe = {
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
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }

    // Force 200 by adding a cache-busting header or modifying response headers
    // The 304 happens because Express/ETag sees the response hasn't changed.
    // To "make it 200", we can disable caching for this specific route.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')

    return res.json(userSafe)
  } catch (err) {
    console.error('GET /api/auth/me error:', err)
    return respond.error(res, 500, 'profile_load_failed', 'Failed to load profile')
  }
})

router.post('/first-login/change-credentials', requireJwt, validateBody(firstLoginChangeCredentialsSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword, newUsername } = req.body || {}
    const doc = await User.findById(req._userId).populate('role')
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    if (!doc.mustChangeCredentials) {
      return respond.error(res, 400, 'credentials_already_updated', 'Credentials already updated')
    }

    const hasCurrentPassword = typeof currentPassword === 'string' && currentPassword.length > 0
    if (hasCurrentPassword) {
      const ok = await bcrypt.compare(String(currentPassword || ''), String(doc.passwordHash || ''))
      if (!ok) return respond.error(res, 401, 'invalid_current_password', 'Invalid current password')
    }

    const usernameKey = String(newUsername).toLowerCase().trim()
    const exists = await User.findOne({ username: usernameKey, _id: { $ne: doc._id } }).lean()
    if (exists) return respond.error(res, 409, 'username_exists', 'Username already exists')

    const oldHash = String(doc.passwordHash)
    let mfaPlain = ''
    try {
      if (doc.mfaSecret) mfaPlain = decryptWithHash(oldHash, doc.mfaSecret)
    } catch (_) {
      mfaPlain = ''
    }

    doc.username = usernameKey
    doc.passwordHash = await bcrypt.hash(String(newPassword), 10)
    if (mfaPlain) {
      try {
        doc.mfaSecret = encryptWithHash(doc.passwordHash, mfaPlain)
      } catch (_) {}
    }

    doc.mustChangeCredentials = false
    if (doc.isStaff) doc.isActive = doc.mustSetupMfa ? false : true
    await doc.save()

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    const userSafe = {
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
    }
    return res.json({ updated: true, user: userSafe })
  } catch (err) {
    console.error('POST /api/auth/first-login/change-credentials error:', err)
    return respond.error(res, 500, 'first_login_failed', 'Failed to update credentials')
  }
})

// PATCH /api/auth/profile - update current user's profile (excluding email/password)
router.patch('/profile', requireJwt, validateBody(updateProfileSchema), async (req, res) => {
  try {
    const doc = await User.findById(req._userId)
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const { firstName, lastName, phoneNumber } = req.body || {}
    if (typeof firstName === 'string') doc.firstName = firstName.trim()
    if (typeof lastName === 'string') doc.lastName = lastName.trim()
    if (typeof phoneNumber === 'string') doc.phoneNumber = phoneNumber.trim()

    await doc.save()

    // Ensure role is returned as a slug, consistent with other endpoints
    // If doc.role is an ID (not populated), we can't get the slug easily without fetching.
    // However, usually PATCH /profile doesn't change role.
    // We should ideally populate it or return what we have if it's already populated (unlikely after save).
    // But since we didn't populate in findById above, doc.role is the ID.
    // We can try to fetch the role or just return 'user' if we can't be sure? 
    // Or better: refetch the user with populate.
    const updatedDoc = await User.findById(doc._id).populate('role').lean()
    const roleSlug = (updatedDoc.role && updatedDoc.role.slug) ? updatedDoc.role.slug : 'user'

    const userSafe = {
      id: String(updatedDoc._id),
      role: roleSlug,
      firstName: updatedDoc.firstName,
      lastName: updatedDoc.lastName,
      email: updatedDoc.email,
      phoneNumber: displayPhoneNumber(updatedDoc.phoneNumber),
      username: updatedDoc.username || '',
      office: updatedDoc.office || '',
      termsAccepted: updatedDoc.termsAccepted,
      createdAt: updatedDoc.createdAt,
    }
    return res.json({ updated: true, user: userSafe })
  } catch (err) {
    console.error('PATCH /api/auth/profile error:', err)
    return respond.error(res, 500, 'profile_update_failed', 'Failed to update profile')
  }
})

module.exports = router
