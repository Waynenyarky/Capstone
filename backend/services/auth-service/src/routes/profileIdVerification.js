const express = require('express')
const User = require('../models/User')
const IdVerification = require('../models/IdVerification')
const respond = require('../middleware/respond')
const { requireJwt } = require('../middleware/auth')
const { validateBody, Joi } = require('../middleware/validation')
const { sanitizeString, sanitizeIdNumber } = require('../lib/sanitizer')
const { createAuditLog } = require('../lib/auditLogger')
const { isBusinessOwnerRole } = require('../lib/roleHelpers')
const { profileUpdateRateLimit, idUploadRateLimit } = require('../middleware/rateLimit')
const { verifyCode, checkVerificationStatus, clearVerificationRequest } = require('../lib/verificationService')
const { validateImageFile } = require('../lib/fileValidator')

const router = express.Router()

const updateIdInfoSchema = Joi.object({
  idType: Joi.string().optional(),
  idNumber: Joi.string().optional(),
  verificationCode: Joi.string().optional(),
  mfaCode: Joi.string().optional(),
})

// POST /api/auth/profile/id-upload
// Upload ID front and back images (requires verification)
router.post(
  '/profile/id-upload',
  requireJwt,
  idUploadRateLimit(),
  async (req, res) => {
    try {
      const doc = await User.findById(req._userId).populate('role')
      if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      if (!isBusinessOwnerRole(roleSlug)) {
        return respond.error(res, 403, 'forbidden', 'This endpoint is only available for business owners')
      }

      // Check verification
      const { verificationCode, mfaCode } = req.body || {}
      const purpose = 'id_upload'
      
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
            'Verification required before uploading ID. Please request verification first.'
          )
        }
        return respond.error(
          res,
          428,
          'verification_required',
          'Please provide verification code or MFA code'
        )
      }

      // Setup multer for file uploads
      const multer = require('multer')
      const path = require('path')
      const fs = require('fs')
      const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')
      const idsDir = path.join(uploadsDir, 'ids')
      try {
        fs.mkdirSync(idsDir, { recursive: true })
      } catch (_) {}

      const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, idsDir),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg'
          const side = file.fieldname === 'front' ? 'front' : 'back'
          cb(null, `${String(doc._id)}_${side}_${Date.now()}${ext}`)
        },
      })

      const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      }).fields([
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
      ])

      upload(req, res, async (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return respond.error(res, 400, 'file_too_large', 'File size exceeds 5MB limit')
          }
          return respond.error(res, 400, 'upload_failed', 'Upload failed: ' + err.message)
        }

        const files = req.files || {}
        const frontFile = files.front && files.front[0]
        const backFile = files.back && files.back[0]

        if (!frontFile) {
          return respond.error(res, 400, 'front_required', 'Front image is required')
        }

        // Validate front file
        const frontValidation = await validateImageFile(frontFile)
        if (!frontValidation.valid) {
          // Clean up uploaded file
          if (frontFile.path) {
            try {
              await fs.promises.unlink(frontFile.path)
            } catch (_) {}
          }
          return respond.error(res, 400, 'invalid_file', frontValidation.error)
        }

        // Validate back file if provided
        if (backFile) {
          const backValidation = await validateImageFile(backFile)
          if (!backValidation.valid) {
            // Clean up uploaded files
            if (frontFile.path) {
              try {
                await fs.promises.unlink(frontFile.path)
              } catch (_) {}
            }
            if (backFile.path) {
              try {
                await fs.promises.unlink(backFile.path)
              } catch (_) {}
            }
            return respond.error(res, 400, 'invalid_file', backValidation.error)
          }
        }

        // Upload to IPFS if available, otherwise use local storage
        const ipfsService = require('../lib/ipfsService')
        let frontImageUrl = ''
        let backImageUrl = ''
        let frontImageIpfsCid = ''
        let backImageIpfsCid = ''

        // Delete old files if updating
        const existing = await IdVerification.findOne({ userId: doc._id })
        if (existing) {
          if (existing.frontImageUrl) {
            const oldFrontPath = path.join(uploadsDir, existing.frontImageUrl.replace('/uploads/', ''))
            try {
              await fs.promises.unlink(oldFrontPath)
            } catch (_) {}
          }
          if (existing.backImageUrl) {
            const oldBackPath = path.join(uploadsDir, existing.backImageUrl.replace('/uploads/', ''))
            try {
              await fs.promises.unlink(oldBackPath)
            } catch (_) {}
          }
          // Unpin old IPFS files if they exist
          if (existing.frontImageIpfsCid && ipfsService.isAvailable()) {
            try {
              await ipfsService.unpinFile(existing.frontImageIpfsCid)
            } catch (_) {}
          }
          if (existing.backImageIpfsCid && ipfsService.isAvailable()) {
            try {
              await ipfsService.unpinFile(existing.backImageIpfsCid)
            } catch (_) {}
          }
        }

        // Upload front image to IPFS
        if (ipfsService.isAvailable()) {
          try {
            const frontBuffer = await fs.promises.readFile(frontFile.path)
            const frontFileName = `id_front_${String(doc._id)}_${Date.now()}.${path.extname(frontFile.originalname || '.jpg')}`
            const { cid: frontCid } = await ipfsService.uploadFile(frontBuffer, frontFileName)
            await ipfsService.pinFile(frontCid).catch((err) => {
              console.warn('Failed to pin front image to IPFS', { cid: frontCid, error: err.message })
            })
            frontImageIpfsCid = frontCid
            frontImageUrl = ipfsService.getGatewayUrl(frontCid)
            
            // Store CID in DocumentStorage contract (non-blocking)
            try {
              const axios = require('axios')
              const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'
              const auditHeaders = { 'Content-Type': 'application/json' }
              if (process.env.AUDIT_SERVICE_API_KEY) auditHeaders['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY
              await axios.post(`${auditServiceUrl}/api/audit/store-document`, {
                userId: String(doc._id),
                docType: 'ID_FRONT',
                ipfsCid: frontCid
              }, { headers: auditHeaders }).catch((err) => {
                console.warn('Failed to store ID front CID in blockchain', { error: err.message })
              })
            } catch (blockchainError) {
              console.warn('Blockchain storage failed for ID front', { error: blockchainError.message })
            }
            
            // Delete local file after IPFS upload
            try {
              await fs.promises.unlink(frontFile.path)
            } catch (_) {}
          } catch (ipfsError) {
            console.error('IPFS upload failed for front image, using local storage fallback', { error: ipfsError.message })
            frontImageUrl = `/uploads/ids/${path.basename(frontFile.path)}`
          }
        } else {
          frontImageUrl = `/uploads/ids/${path.basename(frontFile.path)}`
        }

        // Upload back image to IPFS if provided
        if (backFile) {
          if (ipfsService.isAvailable()) {
            try {
              const backBuffer = await fs.promises.readFile(backFile.path)
              const backFileName = `id_back_${String(doc._id)}_${Date.now()}.${path.extname(backFile.originalname || '.jpg')}`
              const { cid: backCid } = await ipfsService.uploadFile(backBuffer, backFileName)
              await ipfsService.pinFile(backCid).catch((err) => {
                console.warn('Failed to pin back image to IPFS', { cid: backCid, error: err.message })
              })
              backImageIpfsCid = backCid
              backImageUrl = ipfsService.getGatewayUrl(backCid)
              
              // Store CID in DocumentStorage contract (non-blocking)
              try {
                const axios = require('axios')
                const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'
                const auditHeaders = { 'Content-Type': 'application/json' }
                if (process.env.AUDIT_SERVICE_API_KEY) auditHeaders['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY
                await axios.post(`${auditServiceUrl}/api/audit/store-document`, {
                  userId: String(doc._id),
                  docType: 'ID_BACK',
                  ipfsCid: backCid
                }, { headers: auditHeaders }).catch((err) => {
                  console.warn('Failed to store ID back CID in blockchain', { error: err.message })
                })
              } catch (blockchainError) {
                console.warn('Blockchain storage failed for ID back', { error: blockchainError.message })
              }
              
              // Delete local file after IPFS upload
              try {
                await fs.promises.unlink(backFile.path)
              } catch (_) {}
            } catch (ipfsError) {
              console.error('IPFS upload failed for back image, using local storage fallback', { error: ipfsError.message })
              backImageUrl = `/uploads/ids/${path.basename(backFile.path)}`
            }
          } else {
            backImageUrl = `/uploads/ids/${path.basename(backFile.path)}`
          }
        }

        const canRevertUntil = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        const idVerification = await IdVerification.findOneAndUpdate(
          { userId: doc._id },
          {
            frontImageUrl,
            backImageUrl,
            frontImageIpfsCid,
            backImageIpfsCid,
            status: 'pending',
            uploadedAt: new Date(),
            canRevertUntil,
            reverted: false,
            verifiedBy: null,
            verifiedAt: null,
            rejectionReason: '',
          },
          { upsert: true, new: true }
        )

        // Clear verification request
        clearVerificationRequest(doc._id, purpose)

        // Create audit log
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
        const userAgent = req.headers['user-agent'] || 'unknown'
        await createAuditLog(
          doc._id,
          'id_upload',
          'id_document',
          existing ? 'updated' : 'new',
          'uploaded',
          roleSlug,
          {
            ip,
            userAgent,
            frontImageUrl,
            backImageUrl: backImageUrl || 'not_provided',
            canRevertUntil,
          }
        )

        return res.json({
          success: true,
          idVerification: {
            id: String(idVerification._id),
            frontImageUrl,
            backImageUrl,
            frontImageIpfsCid: idVerification.frontImageIpfsCid || null,
            backImageIpfsCid: idVerification.backImageIpfsCid || null,
            status: idVerification.status,
            uploadedAt: idVerification.uploadedAt,
            canRevertUntil,
          },
        })
      })
    } catch (err) {
      console.error('POST /api/auth/profile/id-upload error:', err)
      return respond.error(res, 500, 'id_upload_failed', 'Failed to upload ID documents')
    }
  }
)

// PATCH /api/auth/profile/id-info
// Update ID type and number (requires verification)
router.patch(
  '/profile/id-info',
  requireJwt,
  profileUpdateRateLimit(),
  validateBody(updateIdInfoSchema),
  async (req, res) => {
    try {
      const { idType, idNumber } = req.body || {}
      const doc = await User.findById(req._userId).populate('role')
      if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

      const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
      if (!isBusinessOwnerRole(roleSlug)) {
        return respond.error(res, 403, 'forbidden', 'This endpoint is only available for business owners')
      }

      // Check verification
      const { verificationCode, mfaCode } = req.body || {}
      const purpose = 'idType_change'
      
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
            'Verification required before updating ID information. Please request verification first.'
          )
        }
        return respond.error(
          res,
          428,
          'verification_required',
          'Please provide verification code or MFA code'
        )
      }

      // Get or create ID verification record
      let idVerification = await IdVerification.findOne({ userId: doc._id })
      if (!idVerification) {
        idVerification = await IdVerification.create({
          userId: doc._id,
          status: 'pending',
        })
      }

      const oldValues = {
        idType: idVerification.idType || '',
        idNumber: idVerification.idNumber || '',
      }

      const changes = []
      if (idType !== undefined) {
        const sanitized = sanitizeString(idType)
        if (sanitized !== idVerification.idType) {
          idVerification.idType = sanitized
          changes.push('idType')
        }
      }

      if (idNumber !== undefined) {
        const sanitized = sanitizeIdNumber(idNumber)
        if (sanitized !== idVerification.idNumber) {
          idVerification.idNumber = sanitized
          changes.push('idNumber')
        }
      }

      if (changes.length === 0) {
        return res.json({ updated: false, message: 'No changes detected' })
      }

      idVerification.status = 'pending' // Reset to pending when ID info changes
      idVerification.verifiedBy = null
      idVerification.verifiedAt = null
      await idVerification.save()

      // Clear verification request
      clearVerificationRequest(doc._id, 'idType_change')

      // Create audit log
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'
      await createAuditLog(
        doc._id,
        'id_verification',
        changes.join(','),
        JSON.stringify(oldValues),
        JSON.stringify({
          idType: idVerification.idType,
          idNumber: idVerification.idNumber,
        }),
        roleSlug,
        {
          ip,
          userAgent,
          allChanges: changes,
        }
      )

      return res.json({
        updated: true,
        idVerification: {
          id: String(idVerification._id),
          idType: idVerification.idType,
          idNumber: idVerification.idNumber,
          status: idVerification.status,
        },
      })
    } catch (err) {
      console.error('PATCH /api/auth/profile/id-info error:', err)
      return respond.error(res, 500, 'id_info_update_failed', 'Failed to update ID information')
    }
  }
)

// GET /api/auth/profile/id-verification
// Get ID verification status
router.get('/profile/id-verification', requireJwt, async (req, res) => {
  try {
    const doc = await User.findById(req._userId).populate('role')
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    if (!isBusinessOwnerRole(roleSlug)) {
      return respond.error(res, 403, 'forbidden', 'This endpoint is only available for business owners')
    }

    const idVerification = await IdVerification.findOne({ userId: doc._id }).lean()

    if (!idVerification) {
      return res.json({
        exists: false,
        status: 'not_uploaded',
      })
    }

    const canRevert = idVerification.canRevertUntil && new Date() < new Date(idVerification.canRevertUntil) && !idVerification.reverted

    return res.json({
      exists: true,
      id: String(idVerification._id),
      idType: idVerification.idType,
      idNumber: idVerification.idNumber,
      frontImageUrl: idVerification.frontImageUrl,
      backImageUrl: idVerification.backImageUrl,
      status: idVerification.status,
      uploadedAt: idVerification.uploadedAt,
      verifiedAt: idVerification.verifiedAt,
      canRevert,
      canRevertUntil: idVerification.canRevertUntil,
    })
  } catch (err) {
    console.error('GET /api/auth/profile/id-verification error:', err)
    return respond.error(res, 500, 'id_verification_failed', 'Failed to retrieve ID verification status')
  }
})

// GET /api/auth/profile/id-info
// Get ID verification status (alias for id-verification for frontend compatibility)
router.get('/profile/id-info', requireJwt, async (req, res) => {
  try {
    const doc = await User.findById(req._userId).populate('role')
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    if (!isBusinessOwnerRole(roleSlug)) {
      return respond.error(res, 403, 'forbidden', 'This endpoint is only available for business owners')
    }

    const idVerification = await IdVerification.findOne({ userId: doc._id }).lean()

    if (!idVerification) {
      return res.json({
        exists: false,
        status: 'not_uploaded',
      })
    }

    const canRevert = idVerification.canRevertUntil && new Date() < new Date(idVerification.canRevertUntil) && !idVerification.reverted

    return res.json({
      exists: true,
      id: String(idVerification._id),
      idType: idVerification.idType,
      idNumber: idVerification.idNumber,
      frontImageUrl: idVerification.frontImageUrl,
      backImageUrl: idVerification.backImageUrl,
      status: idVerification.status,
      uploadedAt: idVerification.uploadedAt,
      verifiedAt: idVerification.verifiedAt,
      canRevert,
      canRevertUntil: idVerification.canRevertUntil,
    })
  } catch (err) {
    console.error('GET /api/auth/profile/id-info error:', err)
    return respond.error(res, 500, 'id_info_failed', 'Failed to retrieve ID information')
  }
})

// POST /api/auth/profile/id-upload/revert
// Revert ID upload (within 24 hours)
router.post('/profile/id-upload/revert', requireJwt, async (req, res) => {
  try {
    const doc = await User.findById(req._userId).populate('role')
    if (!doc) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')

    const roleSlug = (doc.role && doc.role.slug) ? doc.role.slug : 'user'
    if (!isBusinessOwnerRole(roleSlug)) {
      return respond.error(res, 403, 'forbidden', 'This endpoint is only available for business owners')
    }

    const idVerification = await IdVerification.findOne({ userId: doc._id })
    if (!idVerification) {
      return respond.error(res, 404, 'not_found', 'No ID verification found')
    }

    if (idVerification.reverted) {
      return respond.error(res, 400, 'already_reverted', 'ID upload has already been reverted')
    }

    const now = new Date()
    if (!idVerification.canRevertUntil || now > new Date(idVerification.canRevertUntil)) {
      return respond.error(res, 400, 'revert_expired', 'Revert period has expired (24 hours)')
    }

    // Delete uploaded files
    const path = require('path')
    const fs = require('fs').promises
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')

    if (idVerification.frontImageUrl) {
      const frontPath = path.join(uploadsDir, idVerification.frontImageUrl.replace('/uploads/', ''))
      try {
        await fs.unlink(frontPath)
      } catch (_) {}
    }

    if (idVerification.backImageUrl) {
      const backPath = path.join(uploadsDir, idVerification.backImageUrl.replace('/uploads/', ''))
      try {
        await fs.unlink(backPath)
      } catch (_) {}
    }

    // Mark as reverted
    idVerification.reverted = true
    idVerification.frontImageUrl = ''
    idVerification.backImageUrl = ''
    idVerification.status = 'pending'
    await idVerification.save()

    // Create audit log
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    await createAuditLog(
      doc._id,
      'id_upload_reverted',
      'id_document',
      'uploaded',
      'reverted',
      roleSlug,
      {
        ip,
        userAgent,
      }
    )

    return res.json({
      success: true,
      message: 'ID upload reverted successfully',
    })
  } catch (err) {
    console.error('POST /api/auth/profile/id-upload/revert error:', err)
    return respond.error(res, 500, 'revert_failed', 'Failed to revert ID upload')
  }
})

module.exports = router
