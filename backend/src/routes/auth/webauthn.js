const express = require('express')
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server')
const User = require('../../models/User')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')

const router = express.Router()

// In-memory challenge storage keyed by email. For clustered deployments, persist.
const registrationChallenges = new Map()
const authenticationChallenges = new Map()

const emailSchema = Joi.object({ email: Joi.string().email().required() })

// POST /api/auth/webauthn/register/start
router.post('/webauthn/register/start', validateBody(emailSchema), async (req, res) => {
  try {
      const { email } = req.body || {}
      const user = await User.findOne({ email }).populate('role')
      if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')

      const userId = Buffer.from(String(user._id))
      const rpName = String(process.env.WEBAUTHN_RP_NAME || process.env.DEFAULT_FROM_EMAIL || 'Capstone').replace(/<.*?>/g, '').trim()

      const options = generateRegistrationOptions({
         rpName,
         userID: userId,
         userName: user.email,
         timeout: 60000,
         attestationType: 'none',
         // excludeCredentials prevents re-registering the same credential
         excludeCredentials: (user.webauthnCredentials || []).map(c => ({ id: Buffer.from(c.credId, 'base64url'), type: 'public-key' })),
         authenticatorSelection: { userVerification: 'preferred' },
      })

      // Store challenge for verification
      registrationChallenges.set(String(email).toLowerCase(), options.challenge)

      // Return options (simplewebauthn already uses base64url for challenge etc.)
      return res.json({ publicKey: options })
   } catch (err) {
      console.error('webauthn register start error', err)
      return respond.error(res, 500, 'webauthn_register_start_failed', 'Failed to start WebAuthn registration')
   }
})

const registrationCompleteSchema = Joi.object({
   email: Joi.string().email().required(),
   credential: Joi.object().required(),
})

// POST /api/auth/webauthn/register/complete
router.post('/webauthn/register/complete', validateBody(registrationCompleteSchema), async (req, res) => {
  try {
      const { email, credential } = req.body || {}
      const expectedChallenge = registrationChallenges.get(String(email).toLowerCase())
      if (!expectedChallenge) return respond.error(res, 400, 'challenge_missing', 'No registration in progress')

      const verification = await verifyRegistrationResponse({
         credential,
         expectedChallenge,
         expectedOrigin: process.env.WEBAUTHN_ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
         expectedRPID: process.env.WEBAUTHN_RPID || 'localhost',
      })

      if (!verification.verified) return respond.error(res, 401, 'webauthn_verification_failed', 'Attestation verification failed')

      const { registrationInfo } = verification
      const credID = registrationInfo.credentialID.toString('base64url')
      const publicKey = registrationInfo.credentialPublicKey.toString('base64')

      const user = await User.findOne({ email })
      if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')

      user.webauthnCredentials = user.webauthnCredentials || []
      user.webauthnCredentials.push({ credId: credID, publicKey, counter: registrationInfo.counter || 0 })
      user.mfaEnabled = true
      user.mfaMethod = (user.mfaMethod ? user.mfaMethod + ',passkey' : 'passkey')
      await user.save()

      registrationChallenges.delete(String(email).toLowerCase())
      return res.json({ registered: true })
   } catch (err) {
      console.error('webauthn register complete error', err)
      return respond.error(res, 500, 'webauthn_register_complete_failed', 'Failed to complete WebAuthn registration')
   }
})

const authStartSchema = Joi.object({ email: Joi.string().email().required() })

// POST /api/auth/webauthn/authenticate/start
router.post('/webauthn/authenticate/start', validateBody(authStartSchema), async (req, res) => {
   try {
      const { email } = req.body || {}
      const user = await User.findOne({ email })
      if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')

      const allowCredentials = (user.webauthnCredentials || []).map(c => ({ id: c.credId, type: 'public-key', transports: c.transports || [] }))

      const options = generateAuthenticationOptions({
         timeout: 60000,
         allowCredentials: allowCredentials.map(c => ({ id: Buffer.from(c.id || c.credId || c, 'base64url'), type: 'public-key' })),
         userVerification: 'preferred',
      })

      authenticationChallenges.set(String(email).toLowerCase(), options.challenge)
      return res.json({ publicKey: options })
   } catch (err) {
      console.error('webauthn authenticate start error', err)
      return respond.error(res, 500, 'webauthn_auth_start_failed', 'Failed to start WebAuthn authentication')
   }
})

const authCompleteSchema = Joi.object({
   email: Joi.string().email().required(),
   credential: Joi.object().required(),
})

// POST /api/auth/webauthn/authenticate/complete
router.post('/webauthn/authenticate/complete', validateBody(authCompleteSchema), async (req, res) => {
   try {
      const { email, credential } = req.body || {}
      const expectedChallenge = authenticationChallenges.get(String(email).toLowerCase())
      if (!expectedChallenge) return respond.error(res, 400, 'challenge_missing', 'No authentication in progress')

      const user = await User.findOne({ email }).populate('role')
      if (!user) return respond.error(res, 404, 'user_not_found', 'User not found')

      const credRecord = (user.webauthnCredentials || []).find(c => c.credId === credential.id || c.credId === credential.rawId)
      if (!credRecord) return respond.error(res, 404, 'credential_not_found', 'Credential not recognized')

      const verification = await verifyAuthenticationResponse({
         credential,
         expectedChallenge,
         expectedOrigin: process.env.WEBAUTHN_ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
         expectedRPID: process.env.WEBAUTHN_RPID || 'localhost',
         authenticator: {
         credentialPublicKey: Buffer.from(credRecord.publicKey, 'base64'),
         credentialID: Buffer.from(credRecord.credId, 'base64url'),
         counter: credRecord.counter || 0,
         },
      })

      if (!verification.verified) return respond.error(res, 401, 'webauthn_auth_failed', 'Authentication verification failed')

      // Update counter
      const dbUser = await User.findById(user._id)
      const rec = (dbUser.webauthnCredentials || []).find(c => c.credId === credRecord.credId)
      if (rec) rec.counter = verification.authenticationInfo.newCounter || rec.counter
      await dbUser.save()

      authenticationChallenges.delete(String(email).toLowerCase())

      // Return safe user object similar to login endpoints
      const roleSlug = (user.role && user.role.slug) ? user.role.slug : 'user'
      const safe = {
         id: String(user._id),
         role: roleSlug,
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         phoneNumber: user.phoneNumber,
         avatarUrl: user.avatarUrl || '',
         termsAccepted: user.termsAccepted,
         deletionPending: !!user.deletionPending,
         deletionScheduledFor: user.deletionScheduledFor,
         createdAt: user.createdAt,
      }
      
      try {
         const { token, expiresAtMs } = require('../../middleware/auth').signAccessToken(user)
         safe.token = token
         safe.expiresAt = new Date(expiresAtMs).toISOString()
      } catch (err) {
         console.error('webauthn token signing error', err)
      }

      return res.json(safe)
   } catch (err) {
      console.error('webauthn authenticate complete error', err)
      return respond.error(res, 500, 'webauthn_auth_complete_failed', 'Failed to complete WebAuthn authentication')
   }
})

module.exports = router
