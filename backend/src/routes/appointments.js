const express = require('express')
const mongoose = require('mongoose')
const dayjs = require('dayjs')
const User = require('../models/User')
const Provider = require('../models/Provider')
const Service = require('../models/Service')
const ProviderServiceOffering = require('../models/ProviderServiceOffering')
const CustomerAddress = require('../models/CustomerAddress')
const Appointment = require('../models/Appointment')

const router = express.Router()

function isDBConnected() {
  return mongoose.connection?.readyState === 1
}

async function getCurrentUser(req) {
  const idHeader = req.headers['x-user-id']
  const emailHeader = req.headers['x-user-email']
  let userDoc = null
  if (idHeader) {
    try { userDoc = await User.findById(idHeader).lean() } catch (_) { userDoc = null }
  }
  if (!userDoc && emailHeader) {
    userDoc = await User.findOne({ email: emailHeader }).lean()
  }
  if (!userDoc) return { error: 'Unauthorized: user not found' }
  return { userDoc }
}

function dayKeyFromDate(date) {
  // dayjs().day(): 0=Sunday .. 6=Saturday
  const d = dayjs(date)
  const idx = d.day()
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[idx]
}

function isWithinAvailability(availability = [], when) {
  if (!when) return false
  const key = dayKeyFromDate(when)
  const entry = (Array.isArray(availability) ? availability : []).find((a) => a && a.day === key)
  if (!entry || !entry.available) return false
  const t = dayjs(when)
  if (entry.startTime && entry.endTime) {
    const [sH, sM] = String(entry.startTime).split(':').map((v) => parseInt(v, 10))
    const [eH, eM] = String(entry.endTime).split(':').map((v) => parseInt(v, 10))
    const start = t.hour(sH).minute(sM).second(0)
    const end = t.hour(eH).minute(eM).second(59)
    return t.isAfter(start.subtract(1, 'second')) && t.isBefore(end.add(1, 'second'))
  }
  // If times not set, treat entire day as available
  return true
}

// POST /api/appointments - create an appointment request (customer)
router.post('/', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { userDoc } = await getCurrentUser(req)
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })

    const {
      offeringId,
      serviceId,
      providerId,
      serviceAddressId,
      appointment, // ISO or parseable datetime
      notes,
      pricingSelection,
      estimatedHours,
    } = req.body || {}

    if (!offeringId) return res.status(400).json({ error: 'offeringId is required' })
    if (!serviceId) return res.status(400).json({ error: 'serviceId is required' })
    if (!providerId) return res.status(400).json({ error: 'providerId is required' })
    if (!serviceAddressId) return res.status(400).json({ error: 'serviceAddressId is required' })
    if (!appointment) return res.status(400).json({ error: 'appointment datetime is required' })

    const when = dayjs(appointment)
    if (!when.isValid()) return res.status(400).json({ error: 'Invalid appointment datetime' })
    if (when.isBefore(dayjs())) return res.status(400).json({ error: 'Appointment cannot be in the past' })

    const offering = await ProviderServiceOffering.findById(offeringId).populate('serviceId').populate('providerId').lean()
    if (!offering) return res.status(404).json({ error: 'Offering not found' })
    if (!offering.active || offering.status !== 'active') return res.status(400).json({ error: 'Offering is not active' })

    const service = offering.serviceId
    const provider = offering.providerId
    if (!service || !provider) return res.status(400).json({ error: 'Invalid offering data' })
    if (String(service._id) !== String(serviceId)) return res.status(400).json({ error: 'Service mismatch' })
    if (String(provider._id) !== String(providerId)) return res.status(400).json({ error: 'Provider mismatch' })

    // Validate provider is approved/active
    const appStatus = String(provider.applicationStatus || 'pending')
    const acctStatus = String(provider.status || 'pending')
    if (appStatus !== 'approved') return res.status(400).json({ error: 'Provider not approved' })
    if (['inactive', 'deleted', 'deletion_pending', 'rejected'].includes(acctStatus)) return res.status(400).json({ error: 'Provider not active' })

    // Validate address belongs to current user
    const addressDoc = await CustomerAddress.findById(serviceAddressId).lean()
    if (!addressDoc || String(addressDoc.userId) !== String(userDoc._id)) {
      return res.status(403).json({ error: 'Invalid service address' })
    }

    // Validate availability
    if (!isWithinAvailability(offering.availability, when)) {
      return res.status(400).json({ error: 'Selected date/time is outside provider availability' })
    }

    // Pricing selection validation
    const mode = String(offering.pricingMode || 'fixed')
    let chosen = String(pricingSelection || '')
    if (mode === 'fixed') chosen = 'fixed'
    if (mode === 'hourly') chosen = 'hourly'
    if (mode === 'both' && !['fixed', 'hourly'].includes(chosen)) {
      return res.status(400).json({ error: 'pricingSelection must be fixed or hourly' })
    }
    if (chosen === 'hourly') {
      const hrs = Number(estimatedHours || 0)
      if (!(hrs > 0)) return res.status(400).json({ error: 'estimatedHours must be greater than 0 for hourly pricing' })
    }

    const created = await Appointment.create({
      customerUserId: userDoc._id,
      providerId: provider._id,
      serviceId: service._id,
      offeringId: offering._id,
      serviceAddressId,
      appointmentAt: when.toDate(),
      notes: typeof notes === 'string' ? notes.trim() : '',
      pricingSelection: chosen,
      estimatedHours: chosen === 'hourly' ? Number(estimatedHours || 0) : null,
      status: 'requested',
      createdByEmail: req.headers['x-user-email'] || '',
      createdByUserId: req.headers['x-user-id'] || null,
    })

    return res.status(201).json({
      id: String(created._id),
      status: created.status,
      appointmentAt: created.appointmentAt,
      notes: created.notes,
      pricingSelection: created.pricingSelection,
      estimatedHours: created.estimatedHours,
    })
  } catch (err) {
    console.error('POST /api/appointments error:', err)
    return res.status(500).json({ error: 'Failed to create appointment' })
  }
})

// GET /api/appointments/customer - list current customer's appointments
router.get('/customer', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
    const { userDoc } = await getCurrentUser(req)
    if (!userDoc) return res.status(401).json({ error: 'Unauthorized: user not found' })
    const { status } = req.query || {}
    const query = { customerUserId: userDoc._id }
    if (status && ['requested', 'accepted', 'declined', 'cancelled', 'completed'].includes(String(status))) {
      query.status = String(status)
    }
    const docs = await Appointment.find(query)
      .populate('providerId')
      .populate('serviceId')
      .populate('offeringId')
      .lean()

    const rows = docs.map((d) => ({
      id: String(d._id),
      status: d.status,
      appointmentAt: d.appointmentAt,
      notes: d.notes || '',
      pricingSelection: d.pricingSelection,
      estimatedHours: d.estimatedHours,
      serviceName: d.serviceId?.name || '',
      providerName: d.providerId?.businessName || '',
      pricingMode: d.offeringId?.pricingMode || 'fixed',
      fixedPrice: typeof d.offeringId?.fixedPrice === 'number' ? d.offeringId.fixedPrice : null,
      hourlyRate: typeof d.offeringId?.hourlyRate === 'number' ? d.offeringId.hourlyRate : null,
    }))
    return res.json(rows)
  } catch (err) {
    console.error('GET /api/appointments/customer error:', err)
    return res.status(500).json({ error: 'Failed to load appointments' })
  }
})

// GET /api/appointments/provider - list current provider's appointments
router.get('/provider', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
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

    const providerDoc = await Provider.findOne({ userId: userDoc._id }).lean()
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const { status } = req.query || {}
    const query = { providerId: providerDoc._id }
    if (status && ['requested', 'accepted', 'declined', 'cancelled', 'completed'].includes(String(status))) {
      query.status = String(status)
    }
    const docs = await Appointment.find(query)
      .populate('serviceId')
      .populate('offeringId')
      .lean()

    const rows = docs.map((d) => ({
      id: String(d._id),
      status: d.status,
      appointmentAt: d.appointmentAt,
      notes: d.notes || '',
      pricingSelection: d.pricingSelection,
      estimatedHours: d.estimatedHours,
      serviceName: d.serviceId?.name || '',
      pricingMode: d.offeringId?.pricingMode || 'fixed',
      fixedPrice: typeof d.offeringId?.fixedPrice === 'number' ? d.offeringId.fixedPrice : null,
      hourlyRate: typeof d.offeringId?.hourlyRate === 'number' ? d.offeringId.hourlyRate : null,
    }))
    return res.json(rows)
  } catch (err) {
    console.error('GET /api/appointments/provider error:', err)
    return res.status(500).json({ error: 'Failed to load provider appointments' })
  }
})

// PATCH /api/appointments/:id/review - provider accepts/declines a requested appointment
router.patch('/:id/review', async (req, res) => {
  try {
    if (!isDBConnected()) return res.status(503).json({ error: 'Database not connected' })
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

    const providerDoc = await Provider.findOne({ userId: userDoc._id }).lean()
    if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' })

    const appointmentId = req.params.id
    if (!appointmentId) return res.status(400).json({ error: 'Appointment id required' })
    const appt = await Appointment.findById(appointmentId)
    if (!appt) return res.status(404).json({ error: 'Appointment not found' })
    if (String(appt.providerId) !== String(providerDoc._id)) {
      return res.status(403).json({ error: 'Forbidden: appointment belongs to a different provider' })
    }
    if (appt.status !== 'requested') {
      return res.status(400).json({ error: 'Only requested appointments can be reviewed' })
    }

    const { decision, notes } = req.body || {}
    const d = String(decision || '').toLowerCase()
    if (!['accept', 'decline'].includes(d)) {
      return res.status(400).json({ error: 'decision must be accept or decline' })
    }

    appt.status = d === 'accept' ? 'accepted' : 'declined'
    appt.reviewedAt = new Date()
    appt.reviewedByEmail = req.headers['x-user-email'] || ''
    appt.reviewedByUserId = req.headers['x-user-id'] || null
    appt.decisionNotes = typeof notes === 'string' ? notes.trim() : ''
    await appt.save()

    return res.json({
      id: String(appt._id),
      status: appt.status,
      appointmentAt: appt.appointmentAt,
      notes: appt.notes || '',
      decisionNotes: appt.decisionNotes || '',
      reviewedAt: appt.reviewedAt,
    })
  } catch (err) {
    console.error('PATCH /api/appointments/:id/review error:', err)
    return res.status(500).json({ error: 'Failed to review appointment' })
  }
})

module.exports = router