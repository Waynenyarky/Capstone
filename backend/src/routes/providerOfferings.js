const express = require('express')
const mongoose = require('mongoose')
const Provider = require('../models/Provider')
const User = require('../models/User')
const Service = require('../models/Service')
const Category = require('../models/Category')
const ProviderServiceOffering = require('../models/ProviderServiceOffering')

const router = express.Router()

function isDBConnected() {
  return mongoose.connection?.readyState === 1
}

async function getCurrentProvider(req, { lean = false } = {}) {
  const idHeader = req.headers['x-user-id']
  const emailHeader = req.headers['x-user-email']
  let userDoc = null
  if (idHeader) {
    try { userDoc = lean ? await User.findById(idHeader).lean() : await User.findById(idHeader) } catch (_) { userDoc = null }
  }
  if (!userDoc && emailHeader) {
    userDoc = lean ? await User.findOne({ email: emailHeader }).lean() : await User.findOne({ email: emailHeader })
  }
  if (!userDoc) return { error: 'Unauthorized: user not found' }
  const providerDoc = lean ? await Provider.findOne({ userId: userDoc._id }).lean() : await Provider.findOne({ userId: userDoc._id })
  if (!providerDoc) return { error: 'Provider profile not found' }
  return { providerDoc, userDoc }
}

function isValidTime(str) {
  if (typeof str !== 'string') return false
  const m = str.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  return !!m
}

function compareTimes(a, b) {
  // returns negative if a < b, 0 if equal, positive if a > b
  const [ah, am] = String(a).split(':').map((x) => parseInt(x, 10))
  const [bh, bm] = String(b).split(':').map((x) => parseInt(x, 10))
  return (ah * 60 + am) - (bh * 60 + bm)
}

// GET /api/provider-offerings/allowed-services
// Returns services the current provider is allowed to configure based on selected categories
router.get('/allowed-services', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req, { lean: true })
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const selectedCategories = Array.isArray(providerDoc.servicesCategories) ? providerDoc.servicesCategories : []
    if (selectedCategories.length === 0) return res.json([])
    // Fetch all services and populate category to match by name
    const services = await Service.find({ status: { $ne: 'inactive' } }).populate('categoryId').lean()
    const allowed = services.filter((s) => {
      const catName = (s.categoryId && s.categoryId.name) ? String(s.categoryId.name) : ''
      return catName && selectedCategories.includes(catName)
    }).map((s) => ({
      id: String(s._id),
      name: s.name,
      description: s.description || '',
      categoryName: s.categoryId?.name || '',
      categoryId: s.categoryId ? String(s.categoryId._id) : null,
      pricingMode: s.pricingMode || 'fixed',
      priceMin: s.priceMin ?? null,
      priceMax: s.priceMax ?? null,
      hourlyRateMin: s.hourlyRateMin ?? null,
      hourlyRateMax: s.hourlyRateMax ?? null,
    }))
    return res.json(allowed)
  } catch (err) {
    console.error('GET /api/provider-offerings/allowed-services error:', err)
    return res.status(500).json({ error: 'Failed to fetch allowed services' })
  }
})

// POST /api/provider-offerings/initialize
// Create draft offerings for selected serviceIds (checkbox selections)
router.post('/initialize', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req)
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const { serviceIds } = req.body || {}
    const ids = Array.isArray(serviceIds) ? serviceIds.filter(Boolean).map(String) : []
    if (ids.length === 0) return res.status(400).json({ error: 'serviceIds is required' })

    const providerCategories = Array.isArray(providerDoc.servicesCategories) ? providerDoc.servicesCategories : []

    const created = []
    for (const sid of ids) {
      const s = await Service.findById(sid).populate('categoryId')
      if (!s) continue
      const catName = s.categoryId?.name || ''
      if (!providerCategories.includes(catName)) {
        // Skip services from categories the provider did not select
        continue
      }
      const existing = await ProviderServiceOffering.findOne({ providerId: providerDoc._id, serviceId: s._id })
      if (existing) {
        created.push({ id: String(existing._id), serviceId: String(existing.serviceId), skipped: true })
        continue
      }
      const defaultMode = s.pricingMode || 'fixed'
      const offering = await ProviderServiceOffering.create({
        providerId: providerDoc._id,
        serviceId: s._id,
        pricingMode: defaultMode,
        status: 'draft',
        availability: [
          { day: 'mon', available: false },
          { day: 'tue', available: false },
          { day: 'wed', available: false },
          { day: 'thu', available: false },
          { day: 'fri', available: false },
          { day: 'sat', available: false },
          { day: 'sun', available: false },
        ],
      })
      created.push({ id: String(offering._id), serviceId: String(s._id) })
    }

    // Flip onboarding status to in_progress if at least one was created
    if (created.length > 0) {
      providerDoc.onboardingStatus = 'in_progress'
      providerDoc.onboardingStartedAt = providerDoc.onboardingStartedAt || new Date()
      await providerDoc.save()
    }

    return res.json({ initialized: created })
  } catch (err) {
    console.error('POST /api/provider-offerings/initialize error:', err)
    return res.status(500).json({ error: 'Failed to initialize offerings' })
  }
})

// GET /api/provider-offerings - list current provider's offerings
router.get('/', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req, { lean: true })
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const docs = await ProviderServiceOffering.find({ providerId: providerDoc._id }).populate('serviceId').lean()
    const rows = docs.map((d) => ({
      id: String(d._id),
      serviceId: String(d.serviceId?._id || d.serviceId),
      serviceName: d.serviceId?.name || '',
      pricingMode: d.pricingMode || 'fixed',
      fixedPrice: typeof d.fixedPrice === 'number' ? d.fixedPrice : null,
      hourlyRate: typeof d.hourlyRate === 'number' ? d.hourlyRate : null,
      availability: Array.isArray(d.availability) ? d.availability : [],
      emergencyAvailable: !!d.emergencyAvailable,
      providerDescription: d.providerDescription || '',
      active: !!d.active,
      status: d.status || 'draft',
    }))
    return res.json(rows)
  } catch (err) {
    console.error('GET /api/provider-offerings error:', err)
    return res.status(500).json({ error: 'Failed to load offerings' })
  }
})

// GET /api/provider-offerings/public - list active offerings from approved/active providers for customers
router.get('/public', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { city, province, category, search } = req.query || {}
    const qCity = typeof city === 'string' ? city.trim() : ''
    const qProvince = typeof province === 'string' ? province.trim() : ''
    const qCategory = typeof category === 'string' ? category.trim() : ''
    const qSearch = typeof search === 'string' ? search.trim().toLowerCase() : ''

    // Only include offerings that are marked active
    const docs = await ProviderServiceOffering.find({ active: true, status: 'active' })
      .populate({ path: 'serviceId', populate: { path: 'categoryId' } })
      .populate('providerId')
      .lean()

    const rows = []
    for (const d of docs) {
      const service = d.serviceId
      const provider = d.providerId
      if (!service || !provider) continue
      // Service must be active
      if (String(service.status || 'active') !== 'active') continue
      // Provider must be approved and not inactive/deleted
      const appStatus = String(provider.applicationStatus || 'pending')
      const acctStatus = String(provider.status || 'pending')
      if (appStatus !== 'approved') continue
      if (['inactive', 'deleted', 'deletion_pending', 'rejected'].includes(acctStatus)) continue

      // Category filter by name if provided
      const catName = service.categoryId?.name || ''
      if (qCategory && catName.toLowerCase() !== qCategory.toLowerCase()) continue

      // Location filtering: match city directly or by serviceAreas if provided.
      // If city matches via serviceAreas, do not enforce provider province equality.
      let matchCity = false
      let matchArea = false
      if (qCity) {
        const pCity = String(provider.city || '').toLowerCase()
        const pAreas = Array.isArray(provider.serviceAreas) ? provider.serviceAreas.map((x) => String(x).toLowerCase()) : []
        matchCity = pCity === qCity.toLowerCase()
        matchArea = pAreas.includes(qCity.toLowerCase())
        if (!matchCity && !matchArea) continue
      }
      if (qProvince) {
        const pProv = String(provider.province || '').toLowerCase()
        // Apply province filter only when no city filter was provided,
        // or when the city matched by provider.city (not by service areas).
        const shouldCheckProvince = !qCity || matchCity
        if (shouldCheckProvince && pProv !== qProvince.toLowerCase()) continue
      }

      // Search text across service name and provider name
      if (qSearch) {
        const sName = String(service.name || '').toLowerCase()
        const pName = String(provider.businessName || '').toLowerCase()
        if (!sName.includes(qSearch) && !pName.includes(qSearch)) continue
      }

      rows.push({
        id: String(d._id),
        serviceId: String(service._id),
        serviceName: service.name || '',
        categoryName: catName,
        providerId: String(provider._id),
        providerName: provider.businessName || '',
        providerCity: provider.city || '',
        providerProvince: provider.province || '',
        providerServiceAreas: Array.isArray(provider.serviceAreas) ? provider.serviceAreas : [],
        pricingMode: d.pricingMode || 'fixed',
        fixedPrice: typeof d.fixedPrice === 'number' ? d.fixedPrice : null,
        hourlyRate: typeof d.hourlyRate === 'number' ? d.hourlyRate : null,
        availability: Array.isArray(d.availability) ? d.availability : [],
        emergencyAvailable: !!d.emergencyAvailable,
        providerDescription: d.providerDescription || '',
        active: !!d.active,
        status: d.status || 'active',
      })
    }

    return res.json(rows)
  } catch (err) {
    console.error('GET /api/provider-offerings/public error:', err)
    return res.status(500).json({ error: 'Failed to load public provider offerings' })
  }
})

// PATCH /api/provider-offerings/onboarding-status - set in_progress or skipped
router.patch('/onboarding-status', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req)
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const { status } = req.body || {}
    const s = String(status || '')
    const allowed = ['in_progress', 'skipped']
    if (!allowed.includes(s)) return res.status(400).json({ error: 'Invalid onboarding status' })
    if (s === 'in_progress') {
      providerDoc.onboardingStatus = 'in_progress'
      providerDoc.onboardingStartedAt = providerDoc.onboardingStartedAt || new Date()
      providerDoc.onboardingSkippedAt = null
    } else if (s === 'skipped') {
      providerDoc.onboardingStatus = 'skipped'
      providerDoc.onboardingSkippedAt = new Date()
    }
    if (!providerDoc.welcomeAcknowledged) providerDoc.welcomeAcknowledged = true
    await providerDoc.save()
    return res.json({ onboardingStatus: providerDoc.onboardingStatus })
  } catch (err) {
    console.error('PATCH /api/provider-offerings/onboarding-status error:', err)
    return res.status(500).json({ error: 'Failed to update onboarding status' })
  }
})

// PATCH /api/provider-offerings/:id - update single offering with validations
router.patch('/:id', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req)
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const { id } = req.params
    const offering = await ProviderServiceOffering.findById(id).populate('serviceId')
    if (!offering) return res.status(404).json({ error: 'Offering not found' })
    if (String(offering.providerId) !== String(providerDoc._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot modify another provider’s offering' })
    }

    const service = offering.serviceId
    const { pricingMode, fixedPrice, hourlyRate, availability, emergencyAvailable, providerDescription, active, status } = req.body || {}

    // Validate pricing mode compatibility with service settings
    const allowedModes = ['fixed', 'hourly', 'both']
    const nextMode = pricingMode ? String(pricingMode).toLowerCase() : offering.pricingMode
    if (!allowedModes.includes(nextMode)) {
      return res.status(400).json({ error: 'Invalid pricingMode' })
    }
    const serviceMode = String(service?.pricingMode || 'fixed')
    if (serviceMode === 'fixed' && nextMode !== 'fixed') {
      return res.status(422).json({ error: 'Service allows fixed price only' })
    }
    if (serviceMode === 'hourly' && nextMode !== 'hourly') {
      return res.status(422).json({ error: 'Service allows hourly rate only' })
    }

    // Validate prices within admin ranges
    const sPriceMin = service?.priceMin
    const sPriceMax = service?.priceMax
    const sHourlyMin = service?.hourlyRateMin
    const sHourlyMax = service?.hourlyRateMax

    function inRange(val, min, max) {
      if (val === null || val === undefined) return false
      if (typeof val !== 'number' || Number.isNaN(val)) return false
      if (typeof min === 'number' && val < min) return false
      if (typeof max === 'number' && val > max) return false
      return true
    }

    if (nextMode === 'fixed' || nextMode === 'both') {
      if (!inRange(fixedPrice, sPriceMin, sPriceMax)) {
        return res.status(422).json({ error: 'fixedPrice out of allowed range' })
      }
    }
    if (nextMode === 'hourly' || nextMode === 'both') {
      if (!inRange(hourlyRate, sHourlyMin, sHourlyMax)) {
        return res.status(422).json({ error: 'hourlyRate out of allowed range' })
      }
    }
    if (nextMode === 'both') {
      if (fixedPrice === null || fixedPrice === undefined || hourlyRate === null || hourlyRate === undefined) {
        return res.status(422).json({ error: 'Both fixedPrice and hourlyRate are required when pricingMode is both' })
      }
    }

    // Validate availability times
    const nextAvailability = Array.isArray(availability) ? availability : offering.availability
    for (const a of nextAvailability) {
      if (!a || !a.day) continue
      if (a.available) {
        if (!isValidTime(a.startTime) || !isValidTime(a.endTime)) {
          return res.status(422).json({ error: `Invalid time for ${a.day}` })
        }
        if (compareTimes(a.startTime, a.endTime) >= 0) {
          return res.status(422).json({ error: `Start time must be before end time for ${a.day}` })
        }
      }
    }

    // Apply updates
    offering.pricingMode = nextMode
    if (fixedPrice !== undefined) offering.fixedPrice = fixedPrice
    if (hourlyRate !== undefined) offering.hourlyRate = hourlyRate
    if (availability !== undefined) offering.availability = nextAvailability
    if (typeof emergencyAvailable === 'boolean') offering.emergencyAvailable = emergencyAvailable
    if (typeof providerDescription === 'string') offering.providerDescription = providerDescription
    if (typeof active === 'boolean') offering.active = active
    if (typeof status === 'string') offering.status = status
    await offering.save()

    const updated = await ProviderServiceOffering.findById(offering._id).populate('serviceId').lean()
    return res.json({
      id: String(updated._id),
      serviceId: String(updated.serviceId?._id || updated.serviceId),
      serviceName: updated.serviceId?.name || '',
      pricingMode: updated.pricingMode,
      fixedPrice: typeof updated.fixedPrice === 'number' ? updated.fixedPrice : null,
      hourlyRate: typeof updated.hourlyRate === 'number' ? updated.hourlyRate : null,
      availability: Array.isArray(updated.availability) ? updated.availability : [],
      emergencyAvailable: !!updated.emergencyAvailable,
      providerDescription: updated.providerDescription || '',
      active: !!updated.active,
      status: updated.status || 'draft',
    })
  } catch (err) {
    console.error('PATCH /api/provider-offerings/:id error:', err)
    return res.status(500).json({ error: 'Failed to update offering' })
  }
})

// POST /api/provider-offerings/complete - finalize onboarding
router.post('/complete', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req)
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    providerDoc.onboardingStatus = 'completed'
    providerDoc.onboardingCompletedAt = new Date()
    if (!providerDoc.welcomeAcknowledged) providerDoc.welcomeAcknowledged = true
    await providerDoc.save()

    return res.json({ completed: true, onboardingStatus: providerDoc.onboardingStatus })
  } catch (err) {
    console.error('POST /api/provider-offerings/complete error:', err)
    return res.status(500).json({ error: 'Failed to complete onboarding' })
  }
})

// PATCH /api/provider-offerings/onboarding-status - set in_progress or skipped
router.patch('/onboarding-status', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { providerDoc } = await getCurrentProvider(req)
    if (!providerDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const { status } = req.body || {}
    const s = String(status || '')
    const allowed = ['in_progress', 'skipped']
    if (!allowed.includes(s)) return res.status(400).json({ error: 'Invalid onboarding status' })
    if (s === 'in_progress') {
      providerDoc.onboardingStatus = 'in_progress'
      providerDoc.onboardingStartedAt = providerDoc.onboardingStartedAt || new Date()
      providerDoc.onboardingSkippedAt = null
    } else if (s === 'skipped') {
      providerDoc.onboardingStatus = 'skipped'
      providerDoc.onboardingSkippedAt = new Date()
    }
    if (!providerDoc.welcomeAcknowledged) providerDoc.welcomeAcknowledged = true
    await providerDoc.save()
    return res.json({ onboardingStatus: providerDoc.onboardingStatus })
  } catch (err) {
    console.error('PATCH /api/provider-offerings/onboarding-status error:', err)
    return res.status(500).json({ error: 'Failed to update onboarding status' })
  }
})

module.exports = router