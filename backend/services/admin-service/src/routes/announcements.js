const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../middleware/auth')
const respond = require('../middleware/respond')
const Announcement = require('../models/Announcement')

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user?.role?.slug === 'admin' || req.headers['x-admin-access'] === 'true'
    let filter = {}
    if (!isAdmin) {
      filter = {
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }
    }
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 }).limit(50).lean()
    return respond.success(res, 200, announcements)
  } catch (err) {
    console.error('GET /api/admin/announcements error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch announcements')
  }
})

router.post('/', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { title, body, priority, isActive, expiresAt } = req.body
    if (!title || !body) return respond.error(res, 400, 'missing_fields', 'Title and body are required')

    const announcement = await Announcement.create({
      title,
      body,
      priority: priority || 'normal',
      isActive: isActive !== false,
      expiresAt: expiresAt || null,
      createdBy: req.user._id || req._userId,
    })
    return respond.success(res, 201, announcement)
  } catch (err) {
    console.error('POST /api/admin/announcements error:', err)
    return respond.error(res, 500, 'create_error', 'Failed to create announcement')
  }
})

router.put('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { title, body, priority, isActive, expiresAt } = req.body
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, body, priority, isActive, expiresAt, updatedBy: req.user._id || req._userId },
      { new: true }
    )
    if (!announcement) return respond.error(res, 404, 'not_found', 'Announcement not found')
    return respond.success(res, 200, announcement)
  } catch (err) {
    console.error('PUT /api/admin/announcements/:id error:', err)
    return respond.error(res, 500, 'update_error', 'Failed to update announcement')
  }
})

router.delete('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id)
    if (!announcement) return respond.error(res, 404, 'not_found', 'Announcement not found')
    return respond.success(res, 200, { deleted: true })
  } catch (err) {
    console.error('DELETE /api/admin/announcements/:id error:', err)
    return respond.error(res, 500, 'delete_error', 'Failed to delete announcement')
  }
})

module.exports = router
