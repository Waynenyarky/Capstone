const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../../models/User')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')

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

router.post('/profile/avatar', validateBody(uploadAvatarSchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']
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
router.post('/profile/avatar-file', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']
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

const changeEmailAuthenticatedSchema = Joi.object({
  password: Joi.string().min(6).max(200).required(),
  newEmail: Joi.string().email().required(),
})

// POST /api/auth/change-password-authenticated
// Change password for a logged-in user by verifying current password.
router.post('/change-password-authenticated', validateBody(changePasswordAuthenticatedSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}

    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

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

    doc.passwordHash = await bcrypt.hash(newPassword, 10)
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
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }
    return res.json(userSafe)
  } catch (err) {
    console.error('POST /api/auth/change-password-authenticated error:', err)
    return respond.error(res, 500, 'change_password_failed', 'Failed to change password')
  }
})

// POST /api/auth/change-email-authenticated
// Change email for a logged-in user by verifying current password.
router.post('/change-email-authenticated', validateBody(changeEmailAuthenticatedSchema), async (req, res) => {
  try {
    const { password, newEmail } = req.body || {}

    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

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
    await doc.save()

    return res.json({ message: 'Email updated successfully', email: doc.email })
  } catch (err) {
    console.error('POST /api/auth/change-email-authenticated error:', err)
    return respond.error(res, 500, 'change_email_failed', 'Failed to change email')
  }
})

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    // Naive admin check for dev: validate requester headers
    const roleHeader = String(req.headers['x-user-role'] || '').toLowerCase()
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    async function isAdminRequester() {
      if (roleHeader === 'admin') {
        let doc = null
        if (idHeader) {
          try {
            doc = await User.findById(idHeader).lean()
          } catch (_) {
            doc = null
          }
        }
        if (!doc && emailHeader) {
          doc = await User.findOne({ email: emailHeader }).lean()
        }
        return !!doc && doc.role === 'admin'
      }
      return false
    }

    const allowed = await isAdminRequester()
    if (!allowed) return respond.error(res, 403, 'forbidden', 'Forbidden: admin only')

    const docs = await User.find({}).lean()
    const usersSafe = docs.map((doc) => ({
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }))
    return res.json(usersSafe)
  } catch (err) {
    console.error('GET /api/auth/users error:', err)
    return respond.error(res, 500, 'users_load_failed', 'Failed to load users')
  }
})

// GET /api/auth/me - return current user's profile (dev-friendly header-based auth)
router.get('/me', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let doc = null
    if (idHeader) {
      try {
        doc = await User.findById(idHeader).lean()
      } catch (_) {
        doc = null
      }
    }
    if (!doc && emailHeader) {
      doc = await User.findOne({ email: emailHeader }).lean()
    }
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const userSafe = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
      deletionPending: !!doc.deletionPending,
      deletionRequestedAt: doc.deletionRequestedAt,
      deletionScheduledFor: doc.deletionScheduledFor,
    }
    return res.json(userSafe)
  } catch (err) {
    console.error('GET /api/auth/me error:', err)
    return respond.error(res, 500, 'profile_load_failed', 'Failed to load profile')
  }
})

// PATCH /api/auth/profile - update current user's profile (excluding email/password)
router.patch('/profile', validateBody(updateProfileSchema), async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

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
