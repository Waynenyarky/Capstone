const express = require('express')
const mongoose = require('mongoose')
const ServiceAreaConfig = require('../models/ServiceAreaConfig')
const { getMunicipalitiesByProvince } = require('philippine-administrative-divisions')

const router = express.Router()

function isDBConnected() {
  return mongoose.connection?.readyState === 1
}

async function getConfigDoc() {
  if (!isDBConnected()) return null
  let doc = await ServiceAreaConfig.findOne({}).lean()
  if (!doc) {
    const created = await ServiceAreaConfig.create({ areas: [] })
    doc = created.toObject()
  }
  return doc
}

// GET /api/service-areas
router.get('/', async (req, res) => {
  try {
    const doc = await getConfigDoc()
    if (!doc) return res.json([])
    const areas = Array.isArray(doc.areas) ? doc.areas : []
    return res.json(areas)
  } catch (err) {
    console.error('GET /api/service-areas error:', err)
    return res.status(500).json({ error: 'Failed to fetch service areas' })
  }
})

// PATCH /api/service-areas (admin only)
router.patch('/', async (req, res) => {
  try {
    const roleHeader = String(req.headers['x-user-role'] || '').toLowerCase()
    if (roleHeader !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin role required' })
    }
    const { areas } = req.body || {}
    if (!Array.isArray(areas)) {
      return res.status(400).json({ error: 'areas must be an array of { province, cities[] }' })
    }
    // Normalize and validate province-city mappings
    const normalized = areas
      .filter((grp) => grp && typeof grp === 'object')
      .map((grp) => ({
        province: String(grp.province || '').trim(),
        cities: Array.isArray(grp.cities)
          ? Array.from(new Set(grp.cities.map((c) => String(c || '').trim()).filter((c) => c.length > 0)))
          : [],
        active: grp.active === false ? false : true,
      }))
      .filter((grp) => grp.province.length > 0 && grp.cities.length > 0)

    // Validate cities belong to province using the library
    const invalid = []
    for (const grp of normalized) {
      try {
        const validCities = (getMunicipalitiesByProvince(grp.province) || []).map((n) => String(n).trim().toLowerCase())
        for (const city of grp.cities) {
          if (!validCities.includes(String(city).trim().toLowerCase())) {
            invalid.push({ province: grp.province, city })
          }
        }
      } catch (_) {
        // If province is unknown, mark all as invalid
        for (const city of grp.cities) {
          invalid.push({ province: grp.province, city })
        }
      }
    }
    if (invalid.length > 0) {
      return res.status(422).json({ error: 'One or more cities do not belong to the selected province', invalid })
    }

    if (!isDBConnected()) {
      // No DB: just echo back for dev purposes
      return res.json(normalized)
    }
    let doc = await ServiceAreaConfig.findOne({})
    if (!doc) {
      doc = new ServiceAreaConfig({ areas: normalized })
    } else {
      doc.areas = normalized
    }
    await doc.save()
    return res.json(Array.isArray(doc.areas) ? doc.areas : [])
  } catch (err) {
    console.error('PATCH /api/service-areas error:', err)
    return res.status(500).json({ error: 'Failed to update service areas' })
  }
})

module.exports = router