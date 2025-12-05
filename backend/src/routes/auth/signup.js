const express = require('express')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../../models/User')
const Provider = require('../../models/Provider')
const ServiceAreaConfig = require('../../models/ServiceAreaConfig')
const { generateCode } = require('../../lib/codes')
const { signUpRequests } = require('../../lib/authRequestsStore')
const SignUpRequest = require('../../models/SignUpRequest')
const respond = require('../../middleware/respond')
const { validateBody, Joi } = require('../../middleware/validation')
const { perEmailRateLimit } = require('../../middleware/rateLimit')

const router = express.Router()

const signupPayloadSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().allow('', null),
  password: Joi.string().min(6).max(200).required(),
  termsAccepted: Joi.boolean().truthy('true', 'TRUE', 'True', 1, '1').valid(true).required(),
  role: Joi.string().valid('customer', 'provider').default('customer'),
  businessName: Joi.string().allow('', null),
  businessType: Joi.string().allow('', null),
  yearsInBusiness: Joi.number().integer().min(0).allow(null),
  servicesCategories: Joi.array().items(Joi.string()).default([]),
  serviceAreas: Joi.array().items(Joi.string()).default([]),
  socialLinks: Joi.array().items(Joi.string()).default([]),
  streetAddress: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  province: Joi.string().allow('', null),
  zipCode: Joi.string().allow('', null),
  businessPhone: Joi.string().allow('', null),
  businessEmail: Joi.string().email().allow('', null),
  businessDescription: Joi.string().allow('', null),
  hasInsurance: Joi.boolean().default(false),
  hasLicenses: Joi.boolean().default(false),
  consentsToBackgroundCheck: Joi.boolean().default(false),
  isSolo: Joi.boolean().default(true),
  teamMembers: Joi.array()
    .items(
      Joi.object({
        firstName: Joi.string().allow('', null),
        lastName: Joi.string().allow('', null),
        email: Joi.string().allow('', null),
        phone: Joi.string().allow('', null),
      })
    )
    .default([]),
})

const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().pattern(/^[0-9]{6}$/).required(),
})

const signupStartLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  code: 'signup_code_rate_limited',
  message: 'Too many signup code requests; try again later.',
})

const signupVerifyLimiter = perEmailRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  code: 'signup_verify_rate_limited',
  message: 'Too many signup verification attempts; try again later.',
})

// POST /api/auth/signup
router.post('/signup', validateBody(signupPayloadSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      termsAccepted,
      role = 'customer',
      businessName,
      businessType,
      yearsInBusiness,
      servicesCategories,
      serviceAreas,
      socialLinks,
      streetAddress,
      city,
      province,
      zipCode,
      businessPhone,
      businessEmail,
      businessDescription,
      hasInsurance,
      hasLicenses,
      consentsToBackgroundCheck,
      isSolo,
      teamMembers,
    } = req.body || {}

    const passwordHash = await bcrypt.hash(password, 10)

    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const doc = await User.create({
      role: role || 'customer',
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || '',
      termsAccepted: !!termsAccepted,
      passwordHash,
    })

    const created = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }

    if ((role || 'customer') === 'provider') {
      // Validate service areas against admin-managed config (if present)
      const normalizedAreas = Array.isArray(serviceAreas)
        ? serviceAreas.map((a) => String(a || '').trim()).filter((a) => a.length > 0)
        : []
      try {
        const cfg = await ServiceAreaConfig.findOne({}).lean()
        const allowed = Array.isArray(cfg?.areas)
          ? cfg.areas.flatMap((grp) => (Array.isArray(grp?.cities) ? grp.cities : []))
              .map((c) => String(c || '').trim().toLowerCase())
          : []
        if (allowed.length > 0) {
          const unsupported = normalizedAreas.filter((a) => !allowed.includes(String(a).trim().toLowerCase()))
          if (unsupported.length > 0) {
            return respond.error(res, 422, 'unsupported_service_areas', 'Unsupported service areas', { unsupported })
          }
        }
      } catch (cfgErr) {
        console.warn('Service areas validation warning:', cfgErr)
      }

      const providerDoc = await Provider.create({
        userId: doc._id,
        businessName,
        businessType,
        yearsInBusiness: typeof yearsInBusiness === 'number' ? yearsInBusiness : Number(yearsInBusiness || 0),
        servicesCategories: Array.isArray(servicesCategories) ? servicesCategories : [],
        serviceAreas: normalizedAreas,
        socialLinks: Array.isArray(socialLinks) ? socialLinks.map((s) => String(s || '').trim()).filter((s) => s.length > 0) : [],
        streetAddress,
        city,
        province,
        zipCode,
        businessPhone,
        businessEmail,
        businessDescription,
        hasInsurance: !!hasInsurance,
        hasLicenses: !!hasLicenses,
        consentsToBackgroundCheck: !!consentsToBackgroundCheck,
        isSolo: typeof isSolo === 'boolean' ? isSolo : true,
        teamMembers: Array.isArray(teamMembers) ? teamMembers.map((m) => ({
          firstName: String(m.firstName || ''),
          lastName: String(m.lastName || ''),
          email: String(m.email || ''),
          phone: String(m.phone || ''),
        })) : [],
      })

      const provider = {
        id: String(providerDoc._id),
        userId: String(providerDoc.userId),
        businessName: providerDoc.businessName || '',
        businessType: providerDoc.businessType || '',
        yearsInBusiness: providerDoc.yearsInBusiness || 0,
        servicesCategories: providerDoc.servicesCategories || [],
        serviceAreas: providerDoc.serviceAreas || [],
        socialLinks: providerDoc.socialLinks || [],
        streetAddress: providerDoc.streetAddress || '',
        city: providerDoc.city || '',
        province: providerDoc.province || '',
        zipCode: providerDoc.zipCode || '',
        businessPhone: providerDoc.businessPhone || '',
        businessEmail: providerDoc.businessEmail || '',
        businessDescription: providerDoc.businessDescription || '',
        hasInsurance: !!providerDoc.hasInsurance,
        hasLicenses: !!providerDoc.hasLicenses,
        consentsToBackgroundCheck: !!providerDoc.consentsToBackgroundCheck,
        isSolo: !!providerDoc.isSolo,
        teamMembers: Array.isArray(providerDoc.teamMembers) ? providerDoc.teamMembers : [],
        status: providerDoc.status || 'pending',
        createdAt: providerDoc.createdAt,
      }
      return res.status(201).json({ user: created, provider })
    }

    return res.status(201).json(created)
  } catch (err) {
    if (err && err.code === 11000) {
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }
    console.error('POST /api/auth/signup error:', err)
    return respond.error(res, 500, 'signup_failed', 'Failed to sign up')
  }
})

// POST /api/auth/signup/start
// Step 1 for sign-up: collect payload, validate, send verification code
router.post('/signup/start', signupStartLimiter, validateBody(signupPayloadSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      termsAccepted,
      role = 'customer',
      businessName,
      businessType,
      yearsInBusiness,
      servicesCategories,
      serviceAreas,
      socialLinks,
      streetAddress,
      city,
      province,
      zipCode,
      businessPhone,
      businessEmail,
      businessDescription,
      hasInsurance,
      hasLicenses,
      consentsToBackgroundCheck,
      isSolo,
      teamMembers,
    } = req.body || {}

    // Prevent duplicates prior to verification
    let existing = null
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      existing = await User.findOne({ email }).lean()
    }
    if (existing) return respond.error(res, 409, 'email_exists', 'Email already exists')

    const payload = {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || '',
      password,
      termsAccepted: !!termsAccepted,
      role: role || 'customer',
      businessName,
      businessType,
      yearsInBusiness,
      servicesCategories,
      serviceAreas,
      socialLinks,
      streetAddress,
      city,
      province,
      zipCode,
      businessPhone,
      businessEmail,
      businessDescription,
      hasInsurance,
      hasLicenses,
      consentsToBackgroundCheck,
      isSolo,
      teamMembers,
    }

    const code = generateCode()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // 10 minutes
    const emailKey = String(email).toLowerCase()

    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    if (useDB) {
      await SignUpRequest.findOneAndUpdate(
        { email: emailKey },
        { code, expiresAt: new Date(expiresAtMs), payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      signUpRequests.set(emailKey, { code, expiresAt: expiresAtMs, payload })
    }

    const out = { sent: true }
    if (process.env.NODE_ENV !== 'production') out.devCode = code
    return res.json(out)
  } catch (err) {
    console.error('POST /api/auth/signup/start error:', err)
    return respond.error(res, 500, 'signup_start_failed', 'Failed to start sign up')
  }
})

// POST /api/auth/signup/verify
// Step 2 for sign-up: verify code and create account
router.post('/signup/verify', signupVerifyLimiter, validateBody(verifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body || {}
    const emailKey = String(email).toLowerCase()
    const useDB = mongoose.connection && mongoose.connection.readyState === 1
    let reqObj = null
    if (useDB) {
      reqObj = await SignUpRequest.findOne({ email: emailKey }).lean()
      if (!reqObj) return respond.error(res, 404, 'signup_request_not_found', 'No signup request found')
      if (Date.now() > new Date(reqObj.expiresAt).getTime()) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    } else {
      reqObj = signUpRequests.get(emailKey)
      if (!reqObj) return respond.error(res, 404, 'signup_request_not_found', 'No signup request found')
      if (Date.now() > reqObj.expiresAt) return respond.error(res, 410, 'code_expired', 'Code expired')
      if (String(reqObj.code) !== String(code)) return respond.error(res, 401, 'invalid_code', 'Invalid code')
    }

    const p = reqObj.payload || {}

    // Double-check duplicates at creation time
    const existing = await User.findOne({ email: p.email }).lean()
    if (existing) {
      // Cleanup pending state
      if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
      else signUpRequests.delete(emailKey)
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }

    const passwordHash = await bcrypt.hash(p.password, 10)
    const doc = await User.create({
      role: p.role || 'customer',
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phoneNumber: p.phoneNumber || '',
      termsAccepted: !!p.termsAccepted,
      passwordHash,
    })
    const created = {
      id: String(doc._id),
      role: doc.role,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      termsAccepted: doc.termsAccepted,
      createdAt: doc.createdAt,
    }

    // Create provider profile if role is provider
    if (String(p.role || '').toLowerCase() === 'provider') {
      const providerDoc = await Provider.create({
        userId: doc._id,
        businessName: p.businessName || '',
        businessType: p.businessType || '',
        yearsInBusiness: Number(p.yearsInBusiness || 0),
        servicesCategories: Array.isArray(p.servicesCategories) ? p.servicesCategories : [],
        serviceAreas: Array.isArray(p.serviceAreas) ? p.serviceAreas : [],
        socialLinks: Array.isArray(p.socialLinks) ? p.socialLinks : [],
        streetAddress: p.streetAddress || '',
        city: p.city || '',
        province: p.province || '',
        zipCode: p.zipCode || '',
        businessPhone: p.businessPhone || '',
        businessEmail: p.businessEmail || '',
        businessDescription: p.businessDescription || '',
        hasInsurance: !!p.hasInsurance,
        hasLicenses: !!p.hasLicenses,
        consentsToBackgroundCheck: !!p.consentsToBackgroundCheck,
        isSolo: !!p.isSolo,
        teamMembers: Array.isArray(p.teamMembers) ? p.teamMembers : [],
        status: 'pending',
      })
      const provider = {
        id: String(providerDoc._id),
        userId: String(providerDoc.userId),
        businessName: providerDoc.businessName || '',
        businessType: providerDoc.businessType || '',
        yearsInBusiness: Number(providerDoc.yearsInBusiness || 0),
        servicesCategories: Array.isArray(providerDoc.servicesCategories) ? providerDoc.servicesCategories : [],
        serviceAreas: Array.isArray(providerDoc.serviceAreas) ? providerDoc.serviceAreas : [],
        socialLinks: Array.isArray(providerDoc.socialLinks) ? providerDoc.socialLinks : [],
        streetAddress: providerDoc.streetAddress || '',
        city: providerDoc.city || '',
        province: providerDoc.province || '',
        zipCode: providerDoc.zipCode || '',
        businessPhone: providerDoc.businessPhone || '',
        businessEmail: providerDoc.businessEmail || '',
        businessDescription: providerDoc.businessDescription || '',
        hasInsurance: !!providerDoc.hasInsurance,
        hasLicenses: !!providerDoc.hasLicenses,
        consentsToBackgroundCheck: !!providerDoc.consentsToBackgroundCheck,
        isSolo: !!providerDoc.isSolo,
        teamMembers: Array.isArray(providerDoc.teamMembers) ? providerDoc.teamMembers : [],
        status: providerDoc.status || 'pending',
        createdAt: providerDoc.createdAt,
      }

      // Cleanup pending state
      if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
      else signUpRequests.delete(emailKey)
      return res.status(201).json({ user: created, provider })
    }

    // Cleanup pending state
    if (useDB) await SignUpRequest.deleteOne({ email: emailKey })
    else signUpRequests.delete(emailKey)
    return res.status(201).json(created)
  } catch (err) {
    if (err && err.code === 11000) {
      return respond.error(res, 409, 'email_exists', 'Email already exists')
    }
    console.error('POST /api/auth/signup/verify error:', err)
    return respond.error(res, 500, 'signup_verify_failed', 'Failed to verify signup')
  }
})

module.exports = router
