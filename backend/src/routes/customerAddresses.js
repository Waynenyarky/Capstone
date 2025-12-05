const express = require('express')
const mongoose = require('mongoose')
const { Joi, validateBody } = require('../middleware/validation')
const respond = require('../middleware/respond')
const CustomerAddress = require('../models/CustomerAddress')
const User = require('../models/User')
const { getMunicipalitiesByProvince, getProvinces } = require('philippine-administrative-divisions')

const router = express.Router()

async function getRequester(req) {
  const idHeader = req.headers['x-user-id']
  const emailHeader = req.headers['x-user-email']
  let doc = null
  if (idHeader) {
    try { doc = await User.findById(idHeader) } catch { doc = null }
  }
  if (!doc && emailHeader) {
    doc = await User.findOne({ email: emailHeader })
  }
  return doc
}

const addressPayloadSchema = Joi.object({
  label: Joi.string().allow('', null),
  streetAddress: Joi.string().allow('', null),
  city: Joi.string().min(1).max(200).required(),
  province: Joi.string().min(1).max(200).required(),
  zipCode: Joi.string().allow('', null),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  makePrimary: Joi.boolean().optional(),
})

function validateProvinceCity(province, city) {
  const provinces = getProvinces() || []
  if (!provinces.includes(String(province))) return false
  const cities = getMunicipalitiesByProvince(String(province)) || []
  return cities.includes(String(city))
}

// GET /api/customer-addresses - list addresses for current user
router.get('/', async (req, res) => {
  try {
    const requester = await getRequester(req)
    if (!requester) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const docs = await CustomerAddress.find({ userId: requester._id }).lean()
    return res.json((docs || []).map((d) => ({
      id: String(d._id),
      userId: String(d.userId),
      label: d.label || '',
      streetAddress: d.streetAddress || '',
      city: d.city || '',
      province: d.province || '',
      zipCode: d.zipCode || '',
      latitude: d.latitude,
      longitude: d.longitude,
      isPrimary: !!d.isPrimary,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })))
  } catch (err) {
    console.error('GET /api/customer-addresses error:', err)
    return respond.error(res, 500, 'addresses_load_failed', 'Failed to load addresses')
  }
})

// GET /api/customer-addresses/active - get primary address for current user
router.get('/active', async (req, res) => {
  try {
    const requester = await getRequester(req)
    if (!requester) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const doc = await CustomerAddress.findOne({ userId: requester._id, isPrimary: true }).lean()
    if (!doc) return respond.error(res, 404, 'no_active_address', 'No active address set')
    return res.json({
      id: String(doc._id),
      userId: String(doc.userId),
      label: doc.label || '',
      streetAddress: doc.streetAddress || '',
      city: doc.city || '',
      province: doc.province || '',
      zipCode: doc.zipCode || '',
      latitude: doc.latitude,
      longitude: doc.longitude,
      isPrimary: !!doc.isPrimary,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  } catch (err) {
    console.error('GET /api/customer-addresses/active error:', err)
    return respond.error(res, 500, 'active_address_load_failed', 'Failed to load active address')
  }
})

// POST /api/customer-addresses - create an address for current user
router.post('/', validateBody(addressPayloadSchema), async (req, res) => {
  try {
    const requester = await getRequester(req)
    if (!requester) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const { label, streetAddress, city, province, zipCode, latitude, longitude, makePrimary } = req.body || {}
    // Validate province and city pairing against PSGC data
    if (!validateProvinceCity(province, city)) return respond.error(res, 400, 'invalid_area', 'City does not belong to selected province')

    const doc = await CustomerAddress.create({
      userId: requester._id,
      label: label || '',
      streetAddress: streetAddress || '',
      city: String(city),
      province: String(province),
      zipCode: zipCode || '',
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      isPrimary: false,
    })

    const count = await CustomerAddress.countDocuments({ userId: requester._id })
    const shouldMakePrimary = !!makePrimary || count === 1
    if (shouldMakePrimary) {
      await CustomerAddress.updateMany({ userId: requester._id }, { $set: { isPrimary: false } })
      await CustomerAddress.findByIdAndUpdate(doc._id, { $set: { isPrimary: true } })
    }

    const created = await CustomerAddress.findById(doc._id).lean()
    return res.status(201).json({
      id: String(created._id),
      userId: String(created.userId),
      label: created.label || '',
      streetAddress: created.streetAddress || '',
      city: created.city || '',
      province: created.province || '',
      zipCode: created.zipCode || '',
      latitude: created.latitude,
      longitude: created.longitude,
      isPrimary: !!created.isPrimary,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  } catch (err) {
    console.error('POST /api/customer-addresses error:', err)
    return respond.error(res, 500, 'address_create_failed', 'Failed to create address')
  }
})

const addressUpdateSchema = Joi.object({
  label: Joi.string().allow('', null),
  streetAddress: Joi.string().allow('', null),
  city: Joi.string().min(1).max(200).optional(),
  province: Joi.string().min(1).max(200).optional(),
  zipCode: Joi.string().allow('', null),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
})

// PATCH /api/customer-addresses/:id - update address (owned by current user)
router.patch('/:id', validateBody(addressUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params
    const requester = await getRequester(req)
    if (!requester) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const doc = await CustomerAddress.findById(id)
    if (!doc || String(doc.userId) !== String(requester._id)) return respond.error(res, 404, 'address_not_found', 'Address not found')

    const { label, streetAddress, city, province, zipCode, latitude, longitude } = req.body || {}
    if (province || city) {
      const nextProvince = typeof province === 'string' ? province : doc.province
      const nextCity = typeof city === 'string' ? city : doc.city
      if (!validateProvinceCity(nextProvince, nextCity)) return respond.error(res, 400, 'invalid_area', 'City does not belong to selected province')
      doc.province = String(nextProvince)
      doc.city = String(nextCity)
    }
    if (typeof label === 'string') doc.label = label
    if (typeof streetAddress === 'string') doc.streetAddress = streetAddress
    if (typeof zipCode === 'string') doc.zipCode = zipCode
    if (typeof latitude === 'number') doc.latitude = latitude
    if (typeof longitude === 'number') doc.longitude = longitude
    await doc.save()

    const updated = await CustomerAddress.findById(id).lean()
    return res.json({
      id: String(updated._id),
      userId: String(updated.userId),
      label: updated.label || '',
      streetAddress: updated.streetAddress || '',
      city: updated.city || '',
      province: updated.province || '',
      zipCode: updated.zipCode || '',
      latitude: updated.latitude,
      longitude: updated.longitude,
      isPrimary: !!updated.isPrimary,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (err) {
    console.error('PATCH /api/customer-addresses/:id error:', err)
    return respond.error(res, 500, 'address_update_failed', 'Failed to update address')
  }
})

// PATCH /api/customer-addresses/:id/set-primary - make an address primary
router.patch('/:id/set-primary', async (req, res) => {
  try {
    const { id } = req.params
    const requester = await getRequester(req)
    if (!requester) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const doc = await CustomerAddress.findById(id)
    if (!doc || String(doc.userId) !== String(requester._id)) return respond.error(res, 404, 'address_not_found', 'Address not found')
    await CustomerAddress.updateMany({ userId: requester._id }, { $set: { isPrimary: false } })
    await CustomerAddress.findByIdAndUpdate(id, { $set: { isPrimary: true } })
    const updated = await CustomerAddress.findById(id).lean()
    return res.json({
      id: String(updated._id),
      userId: String(updated.userId),
      label: updated.label || '',
      streetAddress: updated.streetAddress || '',
      city: updated.city || '',
      province: updated.province || '',
      zipCode: updated.zipCode || '',
      latitude: updated.latitude,
      longitude: updated.longitude,
      isPrimary: !!updated.isPrimary,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (err) {
    console.error('PATCH /api/customer-addresses/:id/set-primary error:', err)
    return respond.error(res, 500, 'set_primary_failed', 'Failed to set primary address')
  }
})

// DELETE /api/customer-addresses/:id - delete address
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const requester = await getRequester(req)
    if (!requester) return respond.error(res, 401, 'unauthorized', 'Unauthorized: user not found')
    const doc = await CustomerAddress.findById(id)
    if (!doc || String(doc.userId) !== String(requester._id)) return respond.error(res, 404, 'address_not_found', 'Address not found')
    await CustomerAddress.findByIdAndDelete(id)
    return res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/customer-addresses/:id error:', err)
    return respond.error(res, 500, 'address_delete_failed', 'Failed to delete address')
  }
})

module.exports = router