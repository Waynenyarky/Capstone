const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../../models/User')
const { decryptWithHash, encryptWithHash } = require('../../lib/secretCipher')
const respond = require('../../middleware/respond')
const { requireJwt, requireRole } = require('../../middleware/auth')
const { validateBody, Joi } = require('../../middleware/validation')
const { generateCode } = require('../../lib/codes')
const { sendOtp } = require('../../lib/mailer')
const { changeEmailRequests } = require('../../lib/authRequestsStore')

const router = express.Router()

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
        doc = await User.findById(idHeader)
      } catch (_) {
        doc = null
      }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader })
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
      role: doc.role,
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
    const usersSafe = docs.map((doc) => ({
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      isEmailVerified: !!doc.isEmailVerified,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }))
    return res.json(usersSafe)
  } catch (err) {
    console.error('GET /api/auth/users error:', err)
    return respond.error(res, 500, 'users_load_failed', 'Failed to load users')
  }
})

// GET /api/auth/me - return current user's profile
router.get('/me', requireJwt, async (req, res) => {
  try {
    const doc = await User.findById(req._userId).lean()
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const userSafe = {
      id: String(doc._id),
      role: doc.role,
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
    console.error('GET /api/auth/me error:', err)
    return respond.error(res, 500, 'profile_load_failed', 'Failed to load profile')
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

    const userSafe = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }
    return res.json({ updated: true, user: userSafe })
  } catch (err) {
    console.error('PATCH /api/auth/profile error:', err)
    return respond.error(res, 500, 'profile_update_failed', 'Failed to update profile')
  }
})

module.exports = router
