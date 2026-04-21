const express = require('express')
const router = express.Router()
const { requireJwt, requireRole, optionalJwt } = require('../middleware/auth')
const respond = require('../middleware/respond')
const Announcement = require('../models/Announcement')
const { createAuditLog } = require('../lib/auditLogger')

router.get('/', optionalJwt, async (req, res) => {
  try {
    const isAdmin = req._userRole === 'admin'
    const now = new Date()
    let filter = {
      status: 'published',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }
    if (isAdmin) {
      filter = {}
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
    const { title, body, priority, isActive, expiresAt, status } = req.body
    const isDraft = status === 'draft'
    if (!isDraft && (!title || !body)) {
      return respond.error(res, 400, 'missing_fields', 'Title and body are required for published announcements')
    }

    const announcement = await Announcement.create({
      title: title || '',
      body: body || '',
      priority: priority || 'normal',
      status: status || 'draft',
      isActive: isDraft ? false : isActive !== false,
      expiresAt: expiresAt || null,
      createdBy: req._userId,
    })

    // Create audit log
    await createAuditLog(
      req._userId,
      'announcement_created',
      'announcement',
      null,
      JSON.stringify({ title, body, priority, status, isActive, expiresAt }),
      req._userRole,
      {
        announcementId: announcement._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    return respond.success(res, 201, announcement)
  } catch (err) {
    console.error('POST /api/admin/announcements error:', err)
    return respond.error(res, 500, 'create_error', 'Failed to create announcement')
  }
})

router.put('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { title, body, priority, isActive, expiresAt, status } = req.body
    const isDraft = status === 'draft'
    if (!isDraft && (!title || !body)) {
      return respond.error(res, 400, 'missing_fields', 'Title and body are required for published announcements')
    }

    // Get the current announcement for audit logging
    const currentAnnouncement = await Announcement.findById(req.params.id)
    if (!currentAnnouncement) {
      return respond.error(res, 404, 'not_found', 'Announcement not found')
    }

    const oldValues = {
      title: currentAnnouncement.title,
      body: currentAnnouncement.body,
      priority: currentAnnouncement.priority,
      status: currentAnnouncement.status,
      isActive: currentAnnouncement.isActive,
      expiresAt: currentAnnouncement.expiresAt,
    }

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, body, priority, status, isActive, expiresAt, updatedBy: req._userId },
      { new: true }
    )
    if (!announcement) return respond.error(res, 404, 'not_found', 'Announcement not found')

    // Create audit log
    await createAuditLog(
      req._userId,
      'announcement_updated',
      'announcement',
      JSON.stringify(oldValues),
      JSON.stringify({ title, body, priority, status, isActive, expiresAt }),
      req._userRole,
      {
        announcementId: announcement._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    return respond.success(res, 200, announcement)
  } catch (err) {
    console.error('PUT /api/admin/announcements/:id error:', err)
    return respond.error(res, 500, 'update_error', 'Failed to update announcement')
  }
})

router.delete('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) return respond.error(res, 404, 'not_found', 'Announcement not found')

    // Create audit log before deletion
    await createAuditLog(
      req._userId,
      'announcement_deleted',
      'announcement',
      JSON.stringify({
        title: announcement.title,
        body: announcement.body,
        priority: announcement.priority,
        status: announcement.status,
        isActive: announcement.isActive,
        expiresAt: announcement.expiresAt,
      }),
      null,
      req._userRole,
      {
        announcementId: announcement._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    await Announcement.findByIdAndDelete(req.params.id)
    return respond.success(res, 200, { deleted: true })
  } catch (err) {
    console.error('DELETE /api/admin/announcements/:id error:', err)
    return respond.error(res, 500, 'delete_error', 'Failed to delete announcement')
  }
})

module.exports = router
