const express = require('express')
const Provider = require('../models/Provider')
const User = require('../models/User')
const ServiceAreaConfig = require('../models/ServiceAreaConfig')
// Removed in-memory dev stores; providers routes now require DB.

const router = express.Router()

// DEV-ONLY: Create a provider record for the current user (development convenience)
router.post('/profile/dev-create', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' })
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let userDoc = null
    if (idHeader) {
      try { userDoc = await User.findById(idHeader) } catch (_) { userDoc = null }
    }
    if (!userDoc && emailHeader) userDoc = await User.findOne({ email: emailHeader })
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const exists = await Provider.findOne({ userId: userDoc._id }).lean()
    if (exists) return res.status(200).json({ ok: true, provider: exists })

    const created = await Provider.create({
      userId: userDoc._id,
      businessName: `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || 'Dev Provider',
      servicesCategories: [],
      serviceAreas: [],
      status: 'pending',
    })

    const populated = await Provider.findById(created._id).populate('userId').lean()
    return res.status(201).json(populated)
  } catch (err) {
    console.error('POST /api/providers/profile/dev-create error:', err)
    return res.status(500).json({ error: 'Failed to create provider (dev)' })
  }
})


// GET /api/providers
router.get('/', async (req, res) => {
  try {
    const { status, appeals } = req.query || {}

    const query = {}
    if (appeals) {
      // Filter providers with pending appeals
      const a = String(appeals)
      if (a === 'pending') {
        query.accountAppeals = { $elemMatch: { status: 'pending' } }
      }
    } else if (status) {
      const s = String(status)
      // For application tabs (pending/approved/rejected), filter by applicationStatus with legacy fallback
      if (['pending', 'approved', 'rejected'].includes(s)) {
        const legacyMap = {
          approved: ['approved', 'active'],
          rejected: ['rejected'],
          pending: ['pending'],
        }
        const legacyStatuses = legacyMap[s]
        query.$or = [
          { applicationStatus: s },
          { applicationStatus: { $exists: false }, status: { $in: legacyStatuses } },
        ]
      } else {
        // For account state filters (active, deletion_pending, deleted, inactive), filter by status
        query.status = s
      }
    }
    const docs = await Provider.find(query).populate('userId').lean()
    const data = docs.map((p) => {
      const user = p.userId || {}
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
      const appealsList = Array.isArray(p.accountAppeals) ? p.accountAppeals : []
      const pendingAppealsCount = appealsList.filter((ap) => ap && ap.status === 'pending').length
      const lastAppealSubmittedAt = appealsList.length > 0
        ? appealsList.map((ap) => new Date(ap.submittedAt || 0).getTime()).reduce((a, b) => Math.max(a, b), 0)
        : null
      return {
        id: String(p._id),
        name,
        email: user.email || '',
        status: (p.status === 'approved' ? 'active' : (p.status || 'pending')),
        applicationStatus: p.applicationStatus || 'pending',
        rejectionReason: p.rejectionReason || '',
        reviewedAt: p.reviewedAt || null,
        reviewedByEmail: p.reviewedByEmail || '',
        applicationSubmissionCount: p.applicationSubmissionCount || 0,
        currentApplicationVersion: p.currentApplicationVersion || 0,
        lastApplicationEditedAt: p.lastApplicationEditedAt || null,
        lastApplicationSubmittedAt: p.lastApplicationSubmittedAt || null,
        pendingAppealsCount,
        lastAppealSubmittedAt: lastAppealSubmittedAt ? new Date(lastAppealSubmittedAt) : null,
      }
    })
    return res.json(data)
  } catch (err) {
    console.error('GET /api/providers error:', err)
    return res.status(500).json({ error: 'Failed to fetch providers' })
  }
})

// GET /api/providers/summary - counts for admin Providers tabs
router.get('/summary', async (req, res) => {
  try {
    const [activeCount, inactiveCount, appealsPendingCount, allCount] = await Promise.all([
      Provider.countDocuments({ status: 'active' }),
      Provider.countDocuments({ status: 'inactive' }),
      Provider.countDocuments({ accountAppeals: { $elemMatch: { status: 'pending' } } }),
      Provider.countDocuments({}),
    ])
    return res.json({ activeCount, inactiveCount, appealsPendingCount, allCount })
  } catch (err) {
    console.error('GET /api/providers/summary error:', err)
    return res.status(500).json({ error: 'Failed to get providers summary' })
  }
})

// GET /api/providers/applications-summary - counts for admin Provider Applications tabs
router.get('/applications-summary', async (req, res) => {
  try {
    // Support legacy providers where applicationStatus may be missing.
    // Map legacy account statuses to application decisions for accurate counts.
    const legacyMap = {
      approved: ['approved', 'active'],
      rejected: ['rejected'],
      pending: ['pending'],
    }

    const [pendingCount, approvedCount, rejectedCount, allCount] = await Promise.all([
      Provider.countDocuments({
        $or: [
          { applicationStatus: 'pending' },
          { applicationStatus: { $exists: false }, status: { $in: legacyMap.pending } },
        ],
      }),
      Provider.countDocuments({
        $or: [
          { applicationStatus: 'approved' },
          { applicationStatus: { $exists: false }, status: { $in: legacyMap.approved } },
        ],
      }),
      Provider.countDocuments({
        $or: [
          { applicationStatus: 'rejected' },
          { applicationStatus: { $exists: false }, status: { $in: legacyMap.rejected } },
        ],
      }),
      Provider.countDocuments({}),
    ])

    return res.json({ pendingCount, approvedCount, rejectedCount, allCount })
  } catch (err) {
    console.error('GET /api/providers/applications-summary error:', err)
    return res.status(500).json({ error: 'Failed to get provider applications summary' })
  }
})

module.exports = router
 
// GET /api/providers/profile - current provider profile (dev-friendly header-based auth)
router.get('/profile', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let userDoc = null
    if (idHeader) {
      try {
        userDoc = await User.findById(idHeader).lean()
      } catch (_) {
        userDoc = null
      }
    }
    if (!userDoc && emailHeader) {
      userDoc = await User.findOne({ email: emailHeader }).lean()
    }
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const providerDoc = await Provider.findOne({ userId: userDoc._id }).populate('userId').lean()
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const user = providerDoc.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return res.json({
      id: String(providerDoc._id),
      userId: String(providerDoc.userId || ''),
      name,
      email: user.email || '',
      businessName: providerDoc.businessName || '',
      businessType: providerDoc.businessType || '',
      yearsInBusiness: providerDoc.yearsInBusiness || 0,
      servicesCategories: Array.isArray(providerDoc.servicesCategories) ? providerDoc.servicesCategories : [],
      serviceAreas: Array.isArray(providerDoc.serviceAreas) ? providerDoc.serviceAreas : [],
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
      welcomeAcknowledged: !!providerDoc.welcomeAcknowledged,
      status: (providerDoc.status === 'approved' ? 'active' : (providerDoc.status || 'pending')),
      applicationStatus: providerDoc.applicationStatus || 'pending',
      rejectionReason: providerDoc.rejectionReason || '',
      reviewedAt: providerDoc.reviewedAt || null,
      reviewedByEmail: providerDoc.reviewedByEmail || '',
      applicationSubmissionCount: providerDoc.applicationSubmissionCount || 0,
      currentApplicationVersion: providerDoc.currentApplicationVersion || 0,
      lastApplicationEditedAt: providerDoc.lastApplicationEditedAt || null,
      lastApplicationSubmittedAt: providerDoc.lastApplicationSubmittedAt || null,
      onboardingStatus: providerDoc.onboardingStatus || 'not_started',
      onboardingStartedAt: providerDoc.onboardingStartedAt || null,
      onboardingCompletedAt: providerDoc.onboardingCompletedAt || null,
      onboardingSkippedAt: providerDoc.onboardingSkippedAt || null,
      // Include audit trails for provider portal context
      applicationHistory: Array.isArray(providerDoc.applicationHistory) ? providerDoc.applicationHistory : [],
      accountStatusHistory: Array.isArray(providerDoc.accountStatusHistory) ? providerDoc.accountStatusHistory : [],
      accountAppeals: Array.isArray(providerDoc.accountAppeals) ? providerDoc.accountAppeals : [],
    })
  } catch (err) {
    console.error('GET /api/providers/profile error:', err)
    return res.status(500).json({ error: 'Failed to load provider profile' })
  }
})

// PATCH /api/providers/profile - update current provider's business profile
router.patch('/profile', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let userDoc = null
    if (idHeader) {
      try {
        userDoc = await User.findById(idHeader)
      } catch (_) {
        userDoc = null
      }
    }
    if (!userDoc && emailHeader) {
      userDoc = await User.findOne({ email: emailHeader })
    }
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const providerDoc = await Provider.findOne({ userId: userDoc._id })
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const { businessName, businessType, yearsInBusiness, servicesCategories, serviceAreas, streetAddress, city, province, zipCode, businessPhone, businessEmail, businessDescription, hasInsurance, hasLicenses, consentsToBackgroundCheck, isSolo, teamMembers } = req.body || {}
    if (typeof businessName === 'string') providerDoc.businessName = businessName.trim()
    if (typeof businessType === 'string') providerDoc.businessType = businessType.trim()
    if (yearsInBusiness !== undefined) providerDoc.yearsInBusiness = Number(yearsInBusiness) || 0
    if (Array.isArray(servicesCategories)) providerDoc.servicesCategories = servicesCategories.map(String)
    if (Array.isArray(serviceAreas)) {
      const normalizedAreas = serviceAreas.map((a) => String(a || '').trim()).filter((a) => a.length > 0)
      try {
        const cfg = await ServiceAreaConfig.findOne({}).lean()
        const allowed = Array.isArray(cfg?.areas)
          ? cfg.areas
              .filter((grp) => grp && grp.active !== false)
              .flatMap((grp) => (Array.isArray(grp?.cities) ? grp.cities : []))
              .map((c) => String(c || '').trim().toLowerCase())
          : []
        if (allowed.length > 0) {
          const unsupported = normalizedAreas.filter((a) => !allowed.includes(String(a).trim().toLowerCase()))
          if (unsupported.length > 0) {
            return res.status(422).json({ error: 'Unsupported service areas', unsupported })
          }
        }
      } catch (cfgErr) {
        console.warn('Service areas validation warning:', cfgErr)
      }
      providerDoc.serviceAreas = normalizedAreas
    }
    if (typeof streetAddress === 'string') providerDoc.streetAddress = streetAddress.trim()
    if (typeof city === 'string') providerDoc.city = city.trim()
    if (typeof province === 'string') providerDoc.province = province.trim()
    if (typeof zipCode === 'string') providerDoc.zipCode = zipCode.trim()
    if (typeof businessPhone === 'string') providerDoc.businessPhone = businessPhone.trim()
    if (typeof businessEmail === 'string') providerDoc.businessEmail = businessEmail.trim()
    if (typeof businessDescription === 'string') providerDoc.businessDescription = businessDescription.trim()
    if (typeof hasInsurance === 'boolean') providerDoc.hasInsurance = hasInsurance
    if (typeof hasLicenses === 'boolean') providerDoc.hasLicenses = hasLicenses
    if (typeof consentsToBackgroundCheck === 'boolean') providerDoc.consentsToBackgroundCheck = consentsToBackgroundCheck
    if (typeof isSolo === 'boolean') providerDoc.isSolo = isSolo
    if (Array.isArray(teamMembers)) {
      providerDoc.teamMembers = teamMembers.map((m) => ({
        firstName: String(m.firstName || ''),
        lastName: String(m.lastName || ''),
        email: String(m.email || ''),
        phone: String(m.phone || ''),
      }))
    }

    providerDoc.lastApplicationEditedAt = new Date()
    await providerDoc.save()

    const populated = await Provider.findById(providerDoc._id).populate('userId').lean()
    const user = populated.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return res.json({
      updated: true,
      provider: {
        id: String(populated._id),
        userId: String(populated.userId || ''),
        name,
        email: user.email || '',
        businessName: populated.businessName || '',
        businessType: populated.businessType || '',
        yearsInBusiness: populated.yearsInBusiness || 0,
        servicesCategories: Array.isArray(populated.servicesCategories) ? populated.servicesCategories : [],
        serviceAreas: Array.isArray(populated.serviceAreas) ? populated.serviceAreas : [],
        streetAddress: populated.streetAddress || '',
        city: populated.city || '',
        province: populated.province || '',
        zipCode: populated.zipCode || '',
        businessPhone: populated.businessPhone || '',
        businessEmail: populated.businessEmail || '',
        businessDescription: populated.businessDescription || '',
        hasInsurance: !!populated.hasInsurance,
        hasLicenses: !!populated.hasLicenses,
        consentsToBackgroundCheck: !!populated.consentsToBackgroundCheck,
        isSolo: !!populated.isSolo,
        teamMembers: Array.isArray(populated.teamMembers) ? populated.teamMembers : [],
        welcomeAcknowledged: !!populated.welcomeAcknowledged,
        status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
        applicationStatus: populated.applicationStatus || 'pending',
        rejectionReason: populated.rejectionReason || '',
        reviewedAt: populated.reviewedAt || null,
        reviewedByEmail: populated.reviewedByEmail || '',
        applicationSubmissionCount: populated.applicationSubmissionCount || 0,
        currentApplicationVersion: populated.currentApplicationVersion || 0,
        lastApplicationEditedAt: populated.lastApplicationEditedAt || null,
        lastApplicationSubmittedAt: populated.lastApplicationSubmittedAt || null,
        onboardingStatus: populated.onboardingStatus || 'not_started',
        onboardingStartedAt: populated.onboardingStartedAt || null,
        onboardingCompletedAt: populated.onboardingCompletedAt || null,
        onboardingSkippedAt: populated.onboardingSkippedAt || null,
      },
    })
  } catch (err) {
    console.error('PATCH /api/providers/profile error:', err)
    return res.status(500).json({ error: 'Failed to update provider profile' })
  }
})

// PATCH /api/providers/welcome-ack - acknowledge welcome modal for current provider
// IMPORTANT: Keep this route BEFORE any parameterized routes (e.g., '/:id') to avoid matching conflicts.
router.patch('/welcome-ack', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let userDoc = null
    if (idHeader) {
      try {
        userDoc = await User.findById(idHeader)
      } catch (_) {
        userDoc = null
      }
    }
    if (!userDoc && emailHeader) {
      userDoc = await User.findOne({ email: emailHeader })
    }
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const providerDoc = await Provider.findOne({ userId: userDoc._id })
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const { ack } = req.body || {}
    const shouldAck = typeof ack === 'boolean' ? ack : true
    providerDoc.welcomeAcknowledged = !!shouldAck
    await providerDoc.save()

    const populated = await Provider.findById(providerDoc._id).populate('userId').lean()
    const user = populated.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return res.json({
      acknowledged: !!populated.welcomeAcknowledged,
      provider: {
        id: String(populated._id),
        userId: String(populated.userId || ''),
        name,
        email: user.email || '',
        businessName: populated.businessName || '',
        servicesCategories: Array.isArray(populated.servicesCategories) ? populated.servicesCategories : [],
        streetAddress: populated.streetAddress || '',
        city: populated.city || '',
        province: populated.province || '',
        zipCode: populated.zipCode || '',
        status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
        welcomeAcknowledged: !!populated.welcomeAcknowledged,
      },
    })
  } catch (err) {
    console.error('PATCH /api/providers/welcome-ack error:', err)
    return res.status(500).json({ error: 'Failed to acknowledge welcome' })
  }
})

// POST /api/providers/resubmit-application - provider resubmits after fixing profile
router.post('/resubmit-application', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let userDoc = null
    if (idHeader) {
      try { userDoc = await User.findById(idHeader).lean() } catch (_) { userDoc = null }
    }
    if (!userDoc && emailHeader) {
      userDoc = await User.findOne({ email: emailHeader }).lean()
    }
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const providerDoc = await Provider.findOne({ userId: userDoc._id })
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const prevDecision = providerDoc.applicationStatus || 'pending'
    if (prevDecision !== 'rejected') {
      return res.status(400).json({ error: 'Only rejected applications can be resubmitted' })
    }

    // Increment counters and version
    providerDoc.applicationSubmissionCount = (providerDoc.applicationSubmissionCount || 0) + 1
    providerDoc.currentApplicationVersion = (providerDoc.currentApplicationVersion || 0) + 1

    const snapshot = {
      businessName: providerDoc.businessName || '',
      businessType: providerDoc.businessType || '',
      yearsInBusiness: providerDoc.yearsInBusiness || 0,
      servicesCategories: Array.isArray(providerDoc.servicesCategories) ? providerDoc.servicesCategories : [],
      serviceAreas: Array.isArray(providerDoc.serviceAreas) ? providerDoc.serviceAreas : [],
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
    }
    const now = new Date()
    providerDoc.applicationHistory = Array.isArray(providerDoc.applicationHistory) ? providerDoc.applicationHistory : []
    providerDoc.applicationHistory.push({
      version: providerDoc.currentApplicationVersion,
      submittedAt: now,
      decision: 'pending',
      reviewedAt: null,
      reviewedByEmail: '',
      reviewedByUserId: null,
      rejectionReason: '',
      businessSnapshot: snapshot,
    })

    // Reset application decision fields for new review
    providerDoc.applicationStatus = 'pending'
    providerDoc.status = 'pending'
    providerDoc.rejectionReason = ''
    providerDoc.reviewedAt = null
    providerDoc.reviewedByUserId = null
    providerDoc.reviewedByEmail = ''
    providerDoc.lastApplicationSubmittedAt = now

    await providerDoc.save()

    const populated = await Provider.findById(providerDoc._id).populate('userId').lean()
    const user = populated.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return res.json({
      resubmitted: true,
      provider: {
        id: String(populated._id),
        userId: String(populated.userId || ''),
        name,
        email: user.email || '',
        businessName: populated.businessName || '',
        servicesCategories: Array.isArray(populated.servicesCategories) ? populated.servicesCategories : [],
        streetAddress: populated.streetAddress || '',
        city: populated.city || '',
        province: populated.province || '',
        zipCode: populated.zipCode || '',
        welcomeAcknowledged: !!populated.welcomeAcknowledged,
        status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
        applicationStatus: populated.applicationStatus || 'pending',
        rejectionReason: populated.rejectionReason || '',
        reviewedAt: populated.reviewedAt || null,
        reviewedByEmail: populated.reviewedByEmail || '',
        applicationSubmissionCount: populated.applicationSubmissionCount || 0,
        currentApplicationVersion: populated.currentApplicationVersion || 0,
        lastApplicationEditedAt: populated.lastApplicationEditedAt || null,
        lastApplicationSubmittedAt: populated.lastApplicationSubmittedAt || null,
      },
    })
  } catch (err) {
    console.error('POST /api/providers/resubmit-application error:', err)
    return res.status(500).json({ error: 'Failed to resubmit application' })
  }
})

// GET /api/providers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const doc = await Provider.findById(id).populate('userId').lean()
    if (!doc) return res.status(404).json({ error: 'Provider not found' })
    const user = doc.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return res.json({
      id: String(doc._id),
      userId: String(doc.userId || ''),
      name,
      email: user.email || '',
      businessName: doc.businessName || '',
      businessType: doc.businessType || '',
      yearsInBusiness: doc.yearsInBusiness || 0,
      servicesCategories: Array.isArray(doc.servicesCategories) ? doc.servicesCategories : [],
      serviceAreas: Array.isArray(doc.serviceAreas) ? doc.serviceAreas : [],
      streetAddress: doc.streetAddress || '',
      city: doc.city || '',
      province: doc.province || '',
      zipCode: doc.zipCode || '',
      businessPhone: doc.businessPhone || '',
      businessEmail: doc.businessEmail || '',
      businessDescription: doc.businessDescription || '',
      hasInsurance: !!doc.hasInsurance,
      hasLicenses: !!doc.hasLicenses,
      consentsToBackgroundCheck: !!doc.consentsToBackgroundCheck,
      isSolo: !!doc.isSolo,
      teamMembers: Array.isArray(doc.teamMembers) ? doc.teamMembers : [],
      welcomeAcknowledged: !!doc.welcomeAcknowledged,
      status: (doc.status === 'approved' ? 'active' : (doc.status || 'pending')),
      applicationStatus: doc.applicationStatus || 'pending',
      rejectionReason: doc.rejectionReason || '',
      reviewedAt: doc.reviewedAt || null,
      reviewedByEmail: doc.reviewedByEmail || '',
      applicationSubmissionCount: doc.applicationSubmissionCount || 0,
      currentApplicationVersion: doc.currentApplicationVersion || 0,
      lastApplicationEditedAt: doc.lastApplicationEditedAt || null,
      lastApplicationSubmittedAt: doc.lastApplicationSubmittedAt || null,
      applicationHistory: Array.isArray(doc.applicationHistory) ? doc.applicationHistory : [],
      accountStatusHistory: Array.isArray(doc.accountStatusHistory) ? doc.accountStatusHistory : [],
      accountAppeals: Array.isArray(doc.accountAppeals) ? doc.accountAppeals : [],
    })
  } catch (err) {
    console.error('GET /api/providers/:id error:', err)
    return res.status(500).json({ error: 'Failed to fetch provider' })
  }
})

// PATCH /api/providers/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, rejectionReason, statusChangeReason } = req.body || {}
    const roleHeader = String(req.headers['x-user-role'] || '').toLowerCase()
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']
    const normalized = String(status || '')
    // Allow new account statuses; map legacy 'approved' to 'active'.
    const allowedAccount = ['pending', 'approved', 'rejected', 'active', 'deleted', 'deletion_pending', 'inactive']
    if (!normalized || !allowedAccount.includes(normalized)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    const update = {}
    const nextStatus = normalized === 'approved' ? 'active' : normalized
    update.status = nextStatus
    // Keep applicationStatus in sync when relevant transitions occur
    if (normalized === 'approved' || normalized === 'active') {
      update.applicationStatus = 'approved'
      update.reviewedAt = new Date()
      if (idHeader) update.reviewedByUserId = idHeader
      if (emailHeader) update.reviewedByEmail = emailHeader
    } else if (normalized === 'rejected') {
      update.applicationStatus = 'rejected'
      if (typeof rejectionReason === 'string') {
        update.rejectionReason = rejectionReason.trim()
      }
      update.reviewedAt = new Date()
      if (idHeader) update.reviewedByUserId = idHeader
      if (emailHeader) update.reviewedByEmail = emailHeader
    } else if (normalized === 'pending') {
      update.applicationStatus = 'pending'
      // Clearing review metadata when moved back to pending
      update.reviewedAt = null
      update.reviewedByUserId = null
      update.reviewedByEmail = ''
    } else if (normalized === 'inactive') {
      // Record reviewer metadata when setting inactive
      update.reviewedAt = new Date()
      if (idHeader) update.reviewedByUserId = idHeader
      if (emailHeader) update.reviewedByEmail = emailHeader
    }

    const updatedDoc = await Provider.findByIdAndUpdate(id, update, { new: true })
    if (!updatedDoc) return res.status(404).json({ error: 'Provider not found' })

    // Append account status change audit entry
    try {
      const reasonToStore = (normalized === 'rejected' && typeof rejectionReason === 'string' && rejectionReason.trim())
        ? rejectionReason.trim()
        : (typeof statusChangeReason === 'string' ? statusChangeReason.trim() : '')
      const history = Array.isArray(updatedDoc.accountStatusHistory) ? updatedDoc.accountStatusHistory : []
      history.push({
        status: nextStatus,
        reason: reasonToStore,
        changedAt: new Date(),
        changedByEmail: emailHeader || '',
        changedByUserId: idHeader || null,
      })
      updatedDoc.accountStatusHistory = history
      await updatedDoc.save()
    } catch (err) {
      console.error('Failed to append accountStatusHistory:', err)
    }

    // Update application history entry for current version
    try {
      // Ensure a version exists for the current application lifecycle
      if (!updatedDoc.currentApplicationVersion || Number(updatedDoc.currentApplicationVersion) <= 0) {
        updatedDoc.currentApplicationVersion = 1
      }
      const version = updatedDoc.currentApplicationVersion
      const list = Array.isArray(updatedDoc.applicationHistory) ? updatedDoc.applicationHistory : []
      let entryIdx = list.findIndex((e) => Number(e.version) === Number(version))
      if (entryIdx < 0) {
        // Create a new history entry capturing current business snapshot
        const snap = {
          businessName: updatedDoc.businessName || '',
          businessType: updatedDoc.businessType || '',
          yearsInBusiness: updatedDoc.yearsInBusiness || 0,
          servicesCategories: Array.isArray(updatedDoc.servicesCategories) ? updatedDoc.servicesCategories : [],
          serviceAreas: Array.isArray(updatedDoc.serviceAreas) ? updatedDoc.serviceAreas : [],
          streetAddress: updatedDoc.streetAddress || '',
          city: updatedDoc.city || '',
          province: updatedDoc.province || '',
          zipCode: updatedDoc.zipCode || '',
          businessPhone: updatedDoc.businessPhone || '',
          businessEmail: updatedDoc.businessEmail || '',
          businessDescription: updatedDoc.businessDescription || '',
          hasInsurance: !!updatedDoc.hasInsurance,
          hasLicenses: !!updatedDoc.hasLicenses,
          consentsToBackgroundCheck: !!updatedDoc.consentsToBackgroundCheck,
          isSolo: !!updatedDoc.isSolo,
          teamMembers: Array.isArray(updatedDoc.teamMembers) ? updatedDoc.teamMembers : [],
        }
        updatedDoc.applicationHistory.push({
          version,
          submittedAt: new Date(),
          decision: 'pending',
          reviewedAt: null,
          reviewedByEmail: '',
          reviewedByUserId: null,
          rejectionReason: '',
          businessSnapshot: snap,
        })
        entryIdx = updatedDoc.applicationHistory.length - 1
      }
      const entry = updatedDoc.applicationHistory[entryIdx]
      if (normalized === 'approved' || normalized === 'active') {
        entry.decision = 'approved'
        entry.reviewedAt = new Date()
        entry.reviewedByEmail = emailHeader || ''
        entry.reviewedByUserId = idHeader || null
      } else if (normalized === 'rejected') {
        entry.decision = 'rejected'
        entry.reviewedAt = new Date()
        entry.reviewedByEmail = emailHeader || ''
        entry.reviewedByUserId = idHeader || null
        entry.rejectionReason = typeof rejectionReason === 'string' ? rejectionReason.trim() : ''
      } else if (normalized === 'pending') {
        entry.decision = 'pending'
        entry.reviewedAt = null
        entry.reviewedByEmail = ''
        entry.reviewedByUserId = null
        entry.rejectionReason = ''
      }
      updatedDoc.applicationHistory[entryIdx] = entry
      await updatedDoc.save()
    } catch (_) {}

    const populated = await Provider.findById(id).populate('userId').lean()
    const user = populated.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return res.json({
      id: String(populated._id),
      userId: String(populated.userId || ''),
      name,
      email: user.email || '',
      businessName: populated.businessName || '',
      businessType: populated.businessType || '',
      yearsInBusiness: populated.yearsInBusiness || 0,
      servicesCategories: Array.isArray(populated.servicesCategories) ? populated.servicesCategories : [],
      serviceAreas: Array.isArray(populated.serviceAreas) ? populated.serviceAreas : [],
      streetAddress: populated.streetAddress || '',
      city: populated.city || '',
      province: populated.province || '',
      zipCode: populated.zipCode || '',
      businessPhone: populated.businessPhone || '',
      businessEmail: populated.businessEmail || '',
      businessDescription: populated.businessDescription || '',
      hasInsurance: !!populated.hasInsurance,
      hasLicenses: !!populated.hasLicenses,
      consentsToBackgroundCheck: !!populated.consentsToBackgroundCheck,
      isSolo: !!populated.isSolo,
      teamMembers: Array.isArray(populated.teamMembers) ? populated.teamMembers : [],
      welcomeAcknowledged: !!populated.welcomeAcknowledged,
      status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
      applicationStatus: populated.applicationStatus || 'pending',
      rejectionReason: populated.rejectionReason || '',
      reviewedAt: populated.reviewedAt || null,
      reviewedByEmail: populated.reviewedByEmail || '',
      applicationSubmissionCount: populated.applicationSubmissionCount || 0,
      currentApplicationVersion: populated.currentApplicationVersion || 0,
      lastApplicationEditedAt: populated.lastApplicationEditedAt || null,
      lastApplicationSubmittedAt: populated.lastApplicationSubmittedAt || null,
      applicationHistory: Array.isArray(populated.applicationHistory) ? populated.applicationHistory : [],
      accountStatusHistory: Array.isArray(populated.accountStatusHistory) ? populated.accountStatusHistory : [],
      accountAppeals: Array.isArray(populated.accountAppeals) ? populated.accountAppeals : [],
    })
  } catch (err) {
    console.error('PATCH /api/providers/:id error:', err)
    return res.status(500).json({ error: 'Failed to update provider' })
  }
})

// GET /api/providers/:id/appeals - list appeals for a provider (admin context)
router.get('/:id/appeals', async (req, res) => {
  try {
    const { id } = req.params
    const doc = await Provider.findById(id).lean()
    if (!doc) return res.status(404).json({ error: 'Provider not found' })
    return res.json(Array.isArray(doc.accountAppeals) ? doc.accountAppeals : [])
  } catch (err) {
    console.error('GET /api/providers/:id/appeals error:', err)
    return res.status(500).json({ error: 'Failed to fetch provider appeals' })
  }
})

// PATCH /api/providers/:id/appeals/:appealId - resolve an appeal (admin)
router.patch('/:id/appeals/:appealId', async (req, res) => {
  try {
    const { id, appealId } = req.params
    const { decision, decisionNotes } = req.body || {}
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    if (!decision || !['approved', 'denied'].includes(String(decision))) {
      return res.status(400).json({ error: 'Invalid decision' })
    }
    const doc = await Provider.findById(id)
    if (!doc) return res.status(404).json({ error: 'Provider not found' })
    const appeal = (doc.accountAppeals || []).find((a) => String(a._id) === String(appealId))
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' })
    if (appeal.status !== 'pending') {
      return res.status(400).json({ error: 'Appeal already decided' })
    }
    appeal.status = decision
    appeal.decisionNotes = typeof decisionNotes === 'string' ? decisionNotes.trim() : ''
    appeal.decidedAt = new Date()
    appeal.decidedByEmail = emailHeader || ''
    appeal.decidedByUserId = idHeader || null

    // If approved, activate account and append audit trail with decision notes
    if (decision === 'approved') {
      doc.status = 'active'
      doc.applicationStatus = 'approved'
      doc.reviewedAt = new Date()
      if (idHeader) doc.reviewedByUserId = idHeader
      if (emailHeader) doc.reviewedByEmail = emailHeader
      const hist = Array.isArray(doc.accountStatusHistory) ? doc.accountStatusHistory : []
      hist.push({
        status: 'active',
        reason: appeal.decisionNotes || 'Appeal approved',
        changedAt: new Date(),
        changedByEmail: emailHeader || '',
        changedByUserId: idHeader || null,
      })
      doc.accountStatusHistory = hist
    }

    await doc.save()
    const populated = await Provider.findById(id).populate('userId').lean()
    return res.json({
      id: String(populated._id),
      status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
      applicationStatus: populated.applicationStatus || 'pending',
      rejectionReason: populated.rejectionReason || '',
      reviewedAt: populated.reviewedAt || null,
      reviewedByEmail: populated.reviewedByEmail || '',
      accountStatusHistory: Array.isArray(populated.accountStatusHistory) ? populated.accountStatusHistory : [],
      accountAppeals: Array.isArray(populated.accountAppeals) ? populated.accountAppeals : [],
    })
  } catch (err) {
    console.error('PATCH /api/providers/:id/appeals/:appealId error:', err)
    return res.status(500).json({ error: 'Failed to resolve appeal' })
  }
})

// PATCH /api/providers/:id/rejection-reason - update rejection reason without changing status
router.patch('/:id/rejection-reason', async (req, res) => {
  try {
    const { id } = req.params
    const { rejectionReason } = req.body || {}
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    if (typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'rejectionReason is required' })
    }

    const doc = await Provider.findById(id)
    if (!doc) return res.status(404).json({ error: 'Provider not found' })
    if ((doc.applicationStatus || 'pending') !== 'rejected') {
      return res.status(400).json({ error: 'Application must be rejected to update reason' })
    }

    doc.rejectionReason = rejectionReason.trim()
    // Update audit fields to reflect latest edit
    doc.reviewedAt = new Date()
    if (idHeader) doc.reviewedByUserId = idHeader
    if (emailHeader) doc.reviewedByEmail = emailHeader
    await doc.save()

    const populated = await Provider.findById(doc._id).populate('userId').lean()
    const user = populated.userId || {}
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    // Also update application history for current version
    try {
      const d2 = await Provider.findById(doc._id)
      const version = d2.currentApplicationVersion || 0
      const list = Array.isArray(d2.applicationHistory) ? d2.applicationHistory : []
      const idx = list.findIndex((e) => Number(e.version) === Number(version))
      if (idx >= 0) {
        const e = list[idx]
        e.rejectionReason = doc.rejectionReason || ''
        e.reviewedAt = doc.reviewedAt || new Date()
        e.reviewedByEmail = doc.reviewedByEmail || ''
        e.reviewedByUserId = doc.reviewedByUserId || null
        d2.applicationHistory[idx] = e
        await d2.save()
      }
    } catch (_) {}
    return res.json({
      id: String(populated._id),
      userId: String(populated.userId || ''),
      name,
      email: user.email || '',
      businessName: populated.businessName || '',
      servicesCategories: Array.isArray(populated.servicesCategories) ? populated.servicesCategories : [],
      streetAddress: populated.streetAddress || '',
      city: populated.city || '',
      province: populated.province || '',
      zipCode: populated.zipCode || '',
      welcomeAcknowledged: !!populated.welcomeAcknowledged,
      status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
      applicationStatus: populated.applicationStatus || 'pending',
      rejectionReason: populated.rejectionReason || '',
      reviewedAt: populated.reviewedAt || null,
      reviewedByEmail: populated.reviewedByEmail || '',
      applicationSubmissionCount: populated.applicationSubmissionCount || 0,
      currentApplicationVersion: populated.currentApplicationVersion || 0,
      lastApplicationEditedAt: populated.lastApplicationEditedAt || null,
      lastApplicationSubmittedAt: populated.lastApplicationSubmittedAt || null,
      applicationHistory: Array.isArray(populated.applicationHistory) ? populated.applicationHistory : [],
    })
  } catch (err) {
    console.error('PATCH /api/providers/:id/rejection-reason error:', err)
    return res.status(500).json({ error: 'Failed to update rejection reason' })
  }
})
// POST /api/providers/appeals - provider submits an appeal (current provider context)
router.post('/appeals', async (req, res) => {
  try {
    const idHeader = req.headers['x-user-id']
    const emailHeader = req.headers['x-user-email']

    let userDoc = null
    if (idHeader) {
      try { userDoc = await User.findById(idHeader) } catch (_) { userDoc = null }
    }
    if (!userDoc && emailHeader) {
      userDoc = await User.findOne({ email: emailHeader })
    }
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const providerDoc = await Provider.findOne({ userId: userDoc._id })
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const { appealReason } = req.body || {}
    if (typeof appealReason !== 'string' || !appealReason.trim()) {
      return res.status(400).json({ error: 'appealReason is required' })
    }

    const currentStatus = String(providerDoc.status || 'pending')
    if (currentStatus !== 'inactive') {
      // For now, only allow appeals when inactive; rejected flow has resubmit
      return res.status(400).json({ error: 'Appeals are only allowed for inactive accounts' })
    }

    const pendingCount = Array.isArray(providerDoc.accountAppeals)
      ? providerDoc.accountAppeals.filter((a) => a && a.status === 'pending').length
      : 0
    if (pendingCount > 0) {
      return res.status(409).json({ error: 'There is already a pending appeal' })
    }

    providerDoc.accountAppeals = Array.isArray(providerDoc.accountAppeals) ? providerDoc.accountAppeals : []
    providerDoc.accountAppeals.push({
      status: 'pending',
      appealReason: appealReason.trim(),
      relatedStatus: currentStatus,
      submittedAt: new Date(),
      submittedByEmail: emailHeader || '',
      submittedByUserId: userDoc._id || null,
    })
    await providerDoc.save()

    const populated = await Provider.findById(providerDoc._id).populate('userId').lean()
    return res.json({
      appealed: true,
      provider: {
        id: String(populated._id),
        status: (populated.status === 'approved' ? 'active' : (populated.status || 'pending')),
        accountAppeals: Array.isArray(populated.accountAppeals) ? populated.accountAppeals : [],
        accountStatusHistory: Array.isArray(populated.accountStatusHistory) ? populated.accountStatusHistory : [],
      },
    })
  } catch (err) {
    console.error('POST /api/providers/appeals error:', err)
    return res.status(500).json({ error: 'Failed to submit appeal' })
  }
})