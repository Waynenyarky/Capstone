#!/usr/bin/env node

/**
 * Cleanup conflicting maintenance approvals.
 *
 * Dry run (default):
 *   MONGO_URI=... node backend/scripts/cleanup-conflicting-maintenance-approvals.js
 *
 * Apply changes:
 *   MONGO_URI=... APPLY=true node backend/scripts/cleanup-conflicting-maintenance-approvals.js
 */

const mongoose = require('mongoose')
const AdminApproval = require('../services/admin-service/src/models/AdminApproval')

function toDate(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function getWindow(approval) {
  const details = approval?.requestDetails || {}
  if (details.action !== 'enable') return null
  const start = toDate(details.scheduledStartAt) || toDate(approval.createdAt)
  const end = toDate(details.expectedResumeAt)
  if (!start || !end || end <= start) return null
  return { start, end }
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end
}

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!mongoUri) {
    console.error('MONGO_URI or MONGODB_URI is required')
    process.exit(1)
  }

  const apply = String(process.env.APPLY || '').toLowerCase() === 'true'

  await mongoose.connect(mongoUri)
  console.log(`Connected to ${mongoose.connection.name}`)

  try {
    const approvals = await AdminApproval.find({
      requestType: 'maintenance_mode',
      status: { $in: ['pending', 'approved'] },
      'requestDetails.action': 'enable',
    })
      .sort({ createdAt: -1 })
      .lean()

    const keepIds = new Set()
    const cancelIds = new Set()

    for (const approval of approvals) {
      const window = getWindow(approval)
      if (!window) {
        keepIds.add(approval.approvalId)
        continue
      }

      if (keepIds.has(approval.approvalId) || cancelIds.has(approval.approvalId)) continue

      keepIds.add(approval.approvalId)

      for (const other of approvals) {
        if (other.approvalId === approval.approvalId) continue
        if (keepIds.has(other.approvalId) || cancelIds.has(other.approvalId)) continue

        const otherWindow = getWindow(other)
        if (!otherWindow) continue

        if (overlaps(window, otherWindow)) {
          cancelIds.add(other.approvalId)
        }
      }
    }

    console.log(`Found ${cancelIds.size} conflicting approval(s)`)
    if (cancelIds.size > 0) {
      console.log('Conflicting approval IDs:')
      for (const id of cancelIds) console.log(`- ${id}`)
    }

    if (!apply) {
      console.log('Dry run only. Set APPLY=true to mark these as cancelled.')
      return
    }

    if (cancelIds.size === 0) {
      console.log('No conflicts to update.')
      return
    }

    const result = await AdminApproval.updateMany(
      { approvalId: { $in: Array.from(cancelIds) }, status: { $in: ['pending', 'approved'] } },
      {
        $set: {
          status: 'cancelled',
          'metadata.cancelledReason': 'cleanup_conflicting_schedule',
          'metadata.cancelledAt': new Date(),
        },
      }
    )

    console.log(`Updated ${result.modifiedCount || 0} approval(s) to cancelled`)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected')
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
