const express = require('express')
const router = express.Router()

// Using PSGC-like dataset package
const {
  getProvinces,
  getMunicipalitiesByProvince,
} = require('philippine-administrative-divisions')

// GET /api/locations/provinces
router.get('/provinces', (req, res) => {
  try {
    const provinces = getProvinces() || []
    const data = provinces.map((name) => ({ name, value: name }))
    return res.json(data)
  } catch (err) {
    console.error('GET /api/locations/provinces error:', err)
    return res.status(500).json({ error: 'Failed to fetch provinces' })
  }
})

// GET /api/locations/cities?province=NAME
router.get('/cities', (req, res) => {
  const { province } = req.query || {}
  if (!province) return res.status(400).json({ error: 'province is required' })
  try {
    const cities = getMunicipalitiesByProvince(String(province)) || []
    const data = cities.map((name) => ({ name, value: name }))
    return res.json(data)
  } catch (err) {
    console.error('GET /api/locations/cities error:', err)
    return res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

module.exports = router