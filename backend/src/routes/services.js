const express = require('express')
const mongoose = require('mongoose')
const Service = require('../models/Service')

const router = express.Router()

// Fallback store when DB is not connected
const demoServices = []

function isDBConnected() {
  return mongoose.connection?.readyState === 1
}

// GET /api/services
router.get('/', async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.json(demoServices)
    }
    const docs = await Service.find({}).lean()
    const data = docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      description: d.description || '',
      status: d.status || 'active',
      categoryId: d.categoryId ? String(d.categoryId) : null,
      image: d.image || null,
      pricingMode: d.pricingMode || 'fixed',
      priceMin: typeof d.priceMin === 'number' ? d.priceMin : null,
      priceMax: typeof d.priceMax === 'number' ? d.priceMax : null,
      hourlyRateMin: typeof d.hourlyRateMin === 'number' ? d.hourlyRateMin : null,
      hourlyRateMax: typeof d.hourlyRateMax === 'number' ? d.hourlyRateMax : null,
      createdAt: d.createdAt,
    }))
    return res.json(data)
  } catch (err) {
    console.error('GET /api/services error:', err)
    return res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { name, description, status, categoryId, image, pricingMode, priceMin, priceMax, hourlyRateMin, hourlyRateMax } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name is required' })
    const normName = String(name).trim()
    if (!image || !image.dataURL) return res.status(400).json({ error: 'image.dataURL is required' })
    const mode = String(pricingMode || '').toLowerCase()
    const allowedModes = ['fixed', 'hourly', 'both']
    if (!allowedModes.includes(mode)) return res.status(400).json({ error: 'pricingMode must be one of fixed, hourly, both' })

    // Normalize numeric price range (optional)
    const minVal = priceMin !== undefined && priceMin !== null ? Number(priceMin) : null
    const maxVal = priceMax !== undefined && priceMax !== null ? Number(priceMax) : null
    const hMinVal = hourlyRateMin !== undefined && hourlyRateMin !== null ? Number(hourlyRateMin) : null
    const hMaxVal = hourlyRateMax !== undefined && hourlyRateMax !== null ? Number(hourlyRateMax) : null
    if (minVal !== null && Number.isNaN(minVal)) return res.status(400).json({ error: 'priceMin must be a number' })
    if (maxVal !== null && Number.isNaN(maxVal)) return res.status(400).json({ error: 'priceMax must be a number' })
    if (hMinVal !== null && Number.isNaN(hMinVal)) return res.status(400).json({ error: 'hourlyRateMin must be a number' })
    if (hMaxVal !== null && Number.isNaN(hMaxVal)) return res.status(400).json({ error: 'hourlyRateMax must be a number' })
    if (minVal !== null && maxVal !== null && minVal > maxVal) return res.status(422).json({ error: 'priceMin must be less than or equal to priceMax' })
    if (hMinVal !== null && hMaxVal !== null && hMinVal > hMaxVal) return res.status(422).json({ error: 'hourlyRateMin must be less than or equal to hourlyRateMax' })

    // Enforce presence of price settings depending on mode
    if (mode === 'fixed') {
      if (minVal === null || maxVal === null) return res.status(400).json({ error: 'Fixed pricing requires priceMin and priceMax' })
    } else if (mode === 'hourly') {
      if (hMinVal === null || hMaxVal === null) return res.status(400).json({ error: 'Hourly pricing requires hourlyRateMin and hourlyRateMax' })
    } else if (mode === 'both') {
      if (minVal === null || maxVal === null || hMinVal === null || hMaxVal === null) {
        return res.status(400).json({ error: 'Both pricing requires fixed price range and hourly rate range' })
      }
    }

    if (!isDBConnected()) {
      const exists = demoServices.some((s) => String(s.name || '').trim().toLowerCase() === normName.toLowerCase())
      if (exists) return res.status(409).json({ error: 'name must be unique' })
      const newService = {
        id: `svc-${Date.now()}`,
        name: normName,
        description: description || '',
        status: status || 'active',
        categoryId: categoryId || null,
        image: {
          filename: image.filename || null,
          dataURL: image.dataURL,
          contentType: image.contentType || null,
        },
        pricingMode: mode,
        priceMin: minVal,
        priceMax: maxVal,
        hourlyRateMin: hMinVal,
        hourlyRateMax: hMaxVal,
        createdAt: new Date().toISOString(),
      }
      demoServices.unshift(newService)
      return res.status(201).json(newService)
    }

    // Case-insensitive uniqueness check
    const dup = await Service.findOne({ name: { $regex: `^${normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
    if (dup) return res.status(409).json({ error: 'name must be unique' })

    const doc = await Service.create({
      name: normName,
      description: description || '',
      status: status || 'active',
      categoryId: categoryId || null,
      image: {
        filename: image.filename || null,
        dataURL: image.dataURL,
        contentType: image.contentType || null,
      },
      pricingMode: mode,
      priceMin: minVal,
      priceMax: maxVal,
      hourlyRateMin: hMinVal,
      hourlyRateMax: hMaxVal,
    })
    const created = {
      id: String(doc._id),
      name: doc.name,
      description: doc.description || '',
      status: doc.status || 'active',
      categoryId: doc.categoryId ? String(doc.categoryId) : null,
      image: doc.image || null,
      pricingMode: doc.pricingMode || 'fixed',
      priceMin: typeof doc.priceMin === 'number' ? doc.priceMin : null,
      priceMax: typeof doc.priceMax === 'number' ? doc.priceMax : null,
      hourlyRateMin: typeof doc.hourlyRateMin === 'number' ? doc.hourlyRateMin : null,
      hourlyRateMax: typeof doc.hourlyRateMax === 'number' ? doc.hourlyRateMax : null,
      createdAt: doc.createdAt,
    }
    return res.status(201).json(created)
  } catch (err) {
    console.error('POST /api/services error:', err)
    return res.status(500).json({ error: 'Failed to create service' })
  }
})

// PATCH /api/services/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, status, categoryId, image, pricingMode, priceMin, priceMax, hourlyRateMin, hourlyRateMax } = req.body || {}
    const hasName = typeof name === 'string'
    const normName = hasName ? String(name).trim() : undefined

    // Normalize numeric price range (optional)
    const minVal = priceMin !== undefined && priceMin !== null ? Number(priceMin) : undefined
    const maxVal = priceMax !== undefined && priceMax !== null ? Number(priceMax) : undefined
    const hMinVal = hourlyRateMin !== undefined && hourlyRateMin !== null ? Number(hourlyRateMin) : undefined
    const hMaxVal = hourlyRateMax !== undefined && hourlyRateMax !== null ? Number(hourlyRateMax) : undefined
    if (minVal !== undefined && Number.isNaN(minVal)) return res.status(400).json({ error: 'priceMin must be a number' })
    if (maxVal !== undefined && Number.isNaN(maxVal)) return res.status(400).json({ error: 'priceMax must be a number' })
    if (hMinVal !== undefined && Number.isNaN(hMinVal)) return res.status(400).json({ error: 'hourlyRateMin must be a number' })
    if (hMaxVal !== undefined && Number.isNaN(hMaxVal)) return res.status(400).json({ error: 'hourlyRateMax must be a number' })
    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) return res.status(422).json({ error: 'priceMin must be less than or equal to priceMax' })
    if (hMinVal !== undefined && hMaxVal !== undefined && hMinVal > hMaxVal) return res.status(422).json({ error: 'hourlyRateMin must be less than or equal to hourlyRateMax' })

    if (!isDBConnected()) {
      const idx = demoServices.findIndex((s) => String(s.id) === String(id))
      if (idx < 0) return res.status(404).json({ error: 'Service not found' })
      const current = demoServices[idx]
      if (hasName) {
        const exists = demoServices.some((s) => String(s.id) !== String(id) && String(s.name || '').trim().toLowerCase() === normName.toLowerCase())
        if (exists) return res.status(409).json({ error: 'name must be unique' })
      }
      const next = { ...current }
      if (typeof name === 'string') next.name = normName
      if (typeof description === 'string') next.description = description
      if (typeof status === 'string') next.status = status
      if (typeof categoryId === 'string') next.categoryId = categoryId
      if (typeof pricingMode === 'string') next.pricingMode = String(pricingMode).toLowerCase()
      if (image && image.dataURL) next.image = { filename: image.filename || null, dataURL: image.dataURL, contentType: image.contentType || null }
      if (minVal !== undefined) next.priceMin = minVal
      if (maxVal !== undefined) next.priceMax = maxVal
      if (hMinVal !== undefined) next.hourlyRateMin = hMinVal
      if (hMaxVal !== undefined) next.hourlyRateMax = hMaxVal
      demoServices[idx] = next
      return res.json(next)
    }

    const doc = await Service.findById(id)
    if (!doc) return res.status(404).json({ error: 'Service not found' })
    // Check name uniqueness if changed
    if (hasName) {
      const dup = await Service.findOne({
        _id: { $ne: id },
        name: { $regex: `^${normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      })
      if (dup) return res.status(409).json({ error: 'name must be unique' })
      doc.name = normName
    }
    if (typeof description === 'string') doc.description = description
    if (typeof status === 'string') doc.status = status
    if (typeof categoryId === 'string' || typeof categoryId === 'object') doc.categoryId = categoryId
    if (typeof pricingMode === 'string') doc.pricingMode = String(pricingMode).toLowerCase()
    if (image && image.dataURL) {
      doc.image = {
        filename: image.filename || null,
        dataURL: image.dataURL,
        contentType: image.contentType || null,
      }
    }
    if (minVal !== undefined) doc.priceMin = minVal
    if (maxVal !== undefined) doc.priceMax = maxVal
    if (hMinVal !== undefined) doc.hourlyRateMin = hMinVal
    if (hMaxVal !== undefined) doc.hourlyRateMax = hMaxVal
    await doc.save()
    const updated = {
      id: String(doc._id),
      name: doc.name,
      description: doc.description || '',
      status: doc.status || 'active',
      categoryId: doc.categoryId ? String(doc.categoryId) : null,
      image: doc.image || null,
      pricingMode: doc.pricingMode || 'fixed',
      priceMin: typeof doc.priceMin === 'number' ? doc.priceMin : null,
      priceMax: typeof doc.priceMax === 'number' ? doc.priceMax : null,
      hourlyRateMin: typeof doc.hourlyRateMin === 'number' ? doc.hourlyRateMin : null,
      hourlyRateMax: typeof doc.hourlyRateMax === 'number' ? doc.hourlyRateMax : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
    return res.json(updated)
  } catch (err) {
    console.error('PATCH /api/services/:id error:', err)
    return res.status(500).json({ error: 'Failed to update service' })
  }
})

module.exports = router