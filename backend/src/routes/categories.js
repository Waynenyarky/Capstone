const express = require('express')
const mongoose = require('mongoose')
const Category = require('../models/Category')

const router = express.Router()

// Fallback store when DB is not connected
const demoCategories = [
  {
    id: 'cat-1',
    icon: 'home',
    name: 'Home Care',
    description: 'General home care services',
    status: 'active',
    action: 'View',
  },
  {
    id: 'cat-2',
    icon: 'medicine',
    name: 'Medical',
    description: 'At-home medical support',
    status: 'inactive',
    action: 'View',
  },
]

function isDBConnected() {
  return mongoose.connection?.readyState === 1
}

// GET /api/categories
router.get('/', async (req, res) => {
  if (!isDBConnected()) {
    return res.json(demoCategories)
  }
  try {
    const docs = await Category.find({}).lean()
    const data = docs.map((d) => ({
      id: String(d._id),
      icon: d.icon || null,
      name: d.name,
      description: d.description || '',
      status: d.status || 'active',
      action: 'View',
    }))
    return res.json(data)
  } catch (err) {
    console.error('GET /api/categories error:', err)
    return res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// POST /api/categories
router.post('/', async (req, res) => {
  const { icon, name, description, status } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name is required' })
  const normName = String(name).trim()

  if (!isDBConnected()) {
    const exists = demoCategories.some((c) => String(c.name || '').trim().toLowerCase() === normName.toLowerCase())
    if (exists) return res.status(409).json({ error: 'name must be unique' })
    const newCategory = {
      id: `cat-${Date.now()}`,
      icon: icon || null,
      name: normName,
      description: description || '',
      status: status || 'active',
      action: 'View',
    }
    demoCategories.unshift(newCategory)
    return res.status(201).json(newCategory)
  }

  try {
    // Case-insensitive uniqueness check
    const dup = await Category.findOne({ name: { $regex: `^${normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
    if (dup) return res.status(409).json({ error: 'name must be unique' })

    const doc = await Category.create({ icon, name: normName, description, status })
    const created = {
      id: String(doc._id),
      icon: doc.icon || null,
      name: doc.name,
      description: doc.description || '',
      status: doc.status || 'active',
      action: 'View',
    }
    return res.status(201).json(created)
  } catch (err) {
    console.error('POST /api/categories error:', err)
    return res.status(500).json({ error: 'Failed to create category' })
  }
})

// PATCH /api/categories/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { icon, name, description, status } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name is required' })
  const normName = String(name).trim()

  if (!isDBConnected()) {
    const idx = demoCategories.findIndex((c) => String(c.id) === String(id))
    if (idx < 0) return res.status(404).json({ error: 'Category not found' })
    const exists = demoCategories.some((c) => String(c.id) !== String(id) && String(c.name || '').trim().toLowerCase() === normName.toLowerCase())
    if (exists) return res.status(409).json({ error: 'name must be unique' })
    const prev = demoCategories[idx]
    const updated = {
      ...prev,
      icon: icon !== undefined ? (icon || null) : (prev.icon || null),
      name: name !== undefined ? normName : prev.name,
      description: description !== undefined ? description : (prev.description || ''),
      status: status !== undefined ? status : (prev.status || 'active'),
      action: 'View',
    }
    demoCategories[idx] = updated
    return res.json(updated)
  }

  try {
    const doc = await Category.findById(id)
    if (!doc) return res.status(404).json({ error: 'Category not found' })
    // Check name uniqueness if it changes
    if (name !== undefined) {
      const dup = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: `^${normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      })
      if (dup) return res.status(409).json({ error: 'name must be unique' })
    }
    if (icon !== undefined) doc.icon = icon
    if (name !== undefined) doc.name = normName
    if (description !== undefined) doc.description = description
    if (status !== undefined) doc.status = status
    await doc.save()
    const updated = {
      id: String(doc._id),
      icon: doc.icon || null,
      name: doc.name,
      description: doc.description || '',
      status: doc.status || 'active',
      action: 'View',
    }
    return res.json(updated)
  } catch (err) {
    console.error('PATCH /api/categories/:id error:', err)
    return res.status(500).json({ error: 'Failed to update category' })
  }
})

module.exports = router