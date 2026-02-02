#!/usr/bin/env node
/**
 * Seed Inspector module test data for mobile app testing.
 * Inserts Inspections, Violations, Notifications, and BusinessProfiles
 * so all Inspector screens show data: Dashboard, My Schedule, Assigned Inspections,
 * Inspection History, Violations, and Notifications.
 *
 * Usage: node scripts/seed-inspector-data.js [--reset]
 *   --reset  Clear existing inspector test data before seeding
 *
 * Requires: MONGO_URI or MONGODB_URI in .env
 * Creates officer@example.com and business@example.com if missing (no SEED_DEV needed).
 */

const path = require('path')
const fs = require('fs')

// Load .env from backend or root
const backendEnv = path.join(__dirname, '..', '.env')
const rootEnv = path.join(__dirname, '..', '..', '.env')
if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv })
} else if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv })
} else {
  require('dotenv').config()
}

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const SEED_BUSINESS_ID_PREFIX = 'biz_seed_'
const SEED_VIOLATION_ID_PREFIX = 'VIO-SEED-'
const stamp = () => Date.now().toString(36)

async function main() {
  const args = process.argv.slice(2)
  const reset = args.includes('--reset')

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
  if (!uri) {
    console.error('Error: MONGO_URI or MONGODB_URI not set. Add to .env or set in environment.')
    process.exit(1)
  }
  const uriDisplay = uri.replace(/:[^:@]+@/, ':****@')
  console.log('Using MongoDB:', uriDisplay)

  try {
    await mongoose.connect(uri)
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }

  const User = require('../src/models/User')
  const Role = require('../src/models/Role')
  const BusinessProfile = require('../src/models/BusinessProfile')
  const Inspection = require('../src/models/Inspection')
  const Violation = require('../src/models/Violation')
  const Notification = require('../src/models/Notification')

  try {
    // Ensure inspector role exists
    let inspectorRole = await Role.findOne({ slug: 'inspector' })
    if (!inspectorRole) {
      inspectorRole = await Role.create({ name: 'LGU Inspector', slug: 'inspector' })
      console.log('Created inspector role')
    }

    const inspectorEmail = 'waynenrq@gmail.com'
    const inspectorPassword = 'TempPass123!'

    // Prevent duplicate test accounts: keep exactly one waynenrq@gmail.com
    const allWithEmail = await User.find({ email: inspectorEmail }).populate('role').sort({ _id: 1 }).lean()
    if (allWithEmail.length > 1) {
      const duplicateIds = allWithEmail.slice(1).map((u) => u._id)
      console.log(`Removing ${duplicateIds.length} duplicate user(s) for ${inspectorEmail} so one account is used for login and seed.`)
      await Inspection.deleteMany({ inspectorId: { $in: duplicateIds } })
      await Violation.deleteMany({ inspectorId: { $in: duplicateIds } })
      await Notification.deleteMany({ userId: { $in: duplicateIds } })
      await User.deleteMany({ _id: { $in: duplicateIds } })
      console.log('  Cleared duplicates and their inspector data.')
    }

    // Ensure waynenrq@gmail.com exists and is corrected for inspector testing (single account)
    let inspector = await User.findOne({ email: inspectorEmail }).populate('role')
    if (!inspector) {
      const passwordHash = await bcrypt.hash(inspectorPassword, 10)
      inspector = await User.create({
        email: inspectorEmail,
        firstName: 'John Wayne',
        lastName: 'Inspector',
        phoneNumber: `+${Date.now().toString().slice(-10)}`,
        role: inspectorRole._id,
        passwordHash,
        termsAccepted: true,
        isStaff: true,
        isActive: true,
        mustChangeCredentials: false,
        mustSetupMfa: false,
      })
      await inspector.populate('role')
      console.log('Created inspector account: waynenrq@gmail.com')
    } else {
      // Always correct existing account so login uses this _id and seeded data matches
      inspector.role = inspectorRole._id
      inspector.passwordHash = await bcrypt.hash(inspectorPassword, 10)
      inspector.isStaff = true
      inspector.isActive = true
      inspector.mustChangeCredentials = false
      inspector.mustSetupMfa = false
      await inspector.save()
      await inspector.populate('role')
      console.log('Corrected waynenrq@gmail.com: inspector role, isStaff=true, password=TempPass123!')
    }

    // Ensure officer and business_owner roles exist; create stub users if missing (so seed runs without SEED_DEV)
    let officerRole = await Role.findOne({ slug: 'lgu_officer' })
    if (!officerRole) {
      officerRole = await Role.create({ name: 'LGU Officer', slug: 'lgu_officer' })
      console.log('Created lgu_officer role')
    }
    let businessOwnerRole = await Role.findOne({ slug: 'business_owner' })
    if (!businessOwnerRole) {
      businessOwnerRole = await Role.create({ name: 'Business Owner', slug: 'business_owner' })
      console.log('Created business_owner role')
    }

    let officer = await User.findOne({ email: 'officer@example.com' }).populate('role')
    if (!officer) {
      const officerHash = await bcrypt.hash('TempPass123!', 10)
      officer = await User.create({
        email: 'officer@example.com',
        firstName: 'Larry',
        lastName: 'Officer',
        phoneNumber: '+1555030303',
        role: officerRole._id,
        passwordHash: officerHash,
        termsAccepted: true,
        isStaff: true,
        isActive: true,
        mustChangeCredentials: false,
        mustSetupMfa: false,
      })
      await officer.populate('role')
      console.log('Created officer@example.com (for assignedBy on inspections)')
    }

    let businessOwner = await User.findOne({ email: 'business@example.com' }).populate('role')
    if (!businessOwner) {
      const bizHash = await bcrypt.hash('TempPass123!', 10)
      businessOwner = await User.create({
        email: 'business@example.com',
        firstName: 'Bob',
        lastName: 'Business',
        phoneNumber: '+1555090001',
        role: businessOwnerRole._id,
        passwordHash: bizHash,
        termsAccepted: true,
        isStaff: false,
        isActive: true,
        mustChangeCredentials: false,
        mustSetupMfa: false,
      })
      await businessOwner.populate('role')
      console.log('Created business@example.com (owner of seed businesses)')
    }

    const inspectorId = inspector._id
    const officerId = officer._id
    const businessOwnerId = businessOwner._id

    if (reset) {
      console.log('Resetting inspector test data...')
      await Inspection.deleteMany({ inspectorId })
      await Violation.deleteMany({ inspectorId })
      await Notification.deleteMany({ userId: inspectorId })
      console.log('  Cleared inspections, violations, notifications')
    }

    // Reassign any existing seed data to this inspector (fixes wrong inspectorId from old runs)
    const inspectResult = await Inspection.updateMany(
      { businessId: { $regex: /^biz_seed_/ }, inspectorId: { $ne: inspectorId } },
      { $set: { inspectorId } }
    )
    if (inspectResult.modifiedCount > 0) {
      console.log(`  Reassigned ${inspectResult.modifiedCount} seed inspections to waynenrq@gmail.com (_id: ${inspectorId})`)
    }
    const vioResult = await Violation.updateMany(
      { violationId: { $regex: /^VIO-SEED-/ }, inspectorId: { $ne: inspectorId } },
      { $set: { inspectorId } }
    )
    if (vioResult.modifiedCount > 0) {
      console.log(`  Reassigned ${vioResult.modifiedCount} seed violations to waynenrq@gmail.com`)
    }
    const notifResult = await Notification.updateMany(
      { userId: { $ne: inspectorId }, message: { $regex: /Seed Cafe|Seed Retail/ } },
      { $set: { userId: inspectorId } }
    )
    if (notifResult.modifiedCount > 0) {
      console.log(`  Reassigned ${notifResult.modifiedCount} seed notifications to waynenrq@gmail.com`)
    }

    // Get or create BusinessProfile with seed businesses
    let profile = await BusinessProfile.findOne({ userId: businessOwnerId })
    const biz1 = `${SEED_BUSINESS_ID_PREFIX}1`
    const biz2 = `${SEED_BUSINESS_ID_PREFIX}2`
    const timestamp = Date.now()

    if (!profile) {
      profile = await BusinessProfile.create({
        userId: businessOwnerId,
        businesses: [
          {
            businessId: biz1,
            isPrimary: true,
            businessName: 'Seed Cafe & Restaurant',
            registeredBusinessName: 'Seed Cafe Inc',
            businessRegistrationNumber: `BRN-SEED-${timestamp}-1`,
            registrationStatus: 'proposed',
          },
          {
            businessId: biz2,
            isPrimary: false,
            businessName: 'Seed Retail Store',
            registeredBusinessName: 'Seed Retail Corp',
            businessRegistrationNumber: `BRN-SEED-${timestamp}-2`,
            registrationStatus: 'proposed',
          },
        ],
      })
      console.log('Created BusinessProfile with 2 businesses')
    } else {
      const hasBiz1 = profile.businesses?.some((b) => b.businessId === biz1)
      const hasBiz2 = profile.businesses?.some((b) => b.businessId === biz2)
      if (!hasBiz1) {
        profile.businesses.push({
          businessId: biz1,
          isPrimary: profile.businesses.length === 0,
          businessName: 'Seed Cafe & Restaurant',
          registeredBusinessName: 'Seed Cafe Inc',
          businessRegistrationNumber: `BRN-SEED-${timestamp}-1`,
          registrationStatus: 'proposed',
        })
      }
      if (!hasBiz2) {
        profile.businesses.push({
          businessId: biz2,
          isPrimary: false,
          businessName: 'Seed Retail Store',
          registeredBusinessName: 'Seed Retail Corp',
          businessRegistrationNumber: `BRN-SEED-${timestamp}-2`,
          registrationStatus: 'proposed',
        })
      }
      await profile.save()
      console.log('Updated BusinessProfile with seed businesses')
    }

    const profileId = profile._id

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)
    const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
    const tomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Create inspections
    const inspections = []

    // Today - pending (Dashboard "today" count)
    inspections.push(
      await Inspection.create({
        inspectorId,
        businessProfileId: profileId,
        businessId: biz1,
        permitType: 'initial',
        inspectionType: 'initial',
        scheduledDate: startOfToday,
        status: 'pending',
        assignedBy: officerId,
      }),
      await Inspection.create({
        inspectorId,
        businessProfileId: profileId,
        businessId: biz2,
        permitType: 'renewal',
        inspectionType: 'renewal',
        scheduledDate: new Date(startOfToday.getTime() + 2 * 60 * 60 * 1000),
        status: 'in_progress',
        startedAt: now,
        assignedBy: officerId,
      })
    )

    // Tomorrow - pending
    inspections.push(
      await Inspection.create({
        inspectorId,
        businessProfileId: profileId,
        businessId: biz1,
        permitType: 'initial',
        inspectionType: 'follow_up',
        scheduledDate: tomorrow,
        status: 'pending',
        assignedBy: officerId,
      })
    )

    // Last week - pending
    inspections.push(
      await Inspection.create({
        inspectorId,
        businessProfileId: profileId,
        businessId: biz2,
        permitType: 'renewal',
        inspectionType: 'renewal',
        scheduledDate: lastWeek,
        status: 'pending',
        assignedBy: officerId,
      })
    )

    // Yesterday - completed
    const completed1 = await Inspection.create({
      inspectorId,
      businessProfileId: profileId,
      businessId: biz1,
      permitType: 'renewal',
      inspectionType: 'renewal',
      scheduledDate: yesterday,
      status: 'completed',
      overallResult: 'passed',
      completedAt: now,
      assignedBy: officerId,
    })
    inspections.push(completed1)

    // Last week - completed
    const completed2 = await Inspection.create({
      inspectorId,
      businessProfileId: profileId,
      businessId: biz2,
      permitType: 'initial',
      inspectionType: 'initial',
      scheduledDate: lastWeek,
      status: 'completed',
      overallResult: 'failed',
      completedAt: yesterday,
      assignedBy: officerId,
    })
    inspections.push(completed2)

    // Next week - pending
    inspections.push(
      await Inspection.create({
        inspectorId,
        businessProfileId: profileId,
        businessId: biz1,
        permitType: 'renewal',
        inspectionType: 'follow_up',
        scheduledDate: nextWeek,
        status: 'pending',
        assignedBy: officerId,
      })
    )

    // Extra today - pending (Dashboard "today" count, Schedule, Assigned)
    inspections.push(
      await Inspection.create({
        inspectorId,
        businessProfileId: profileId,
        businessId: biz2,
        permitType: 'initial',
        inspectionType: 'initial',
        scheduledDate: new Date(startOfToday.getTime() + 4 * 60 * 60 * 1000),
        status: 'pending',
        assignedBy: officerId,
      })
    )

    // Extra completed - Inspection History
    const completed3 = await Inspection.create({
      inspectorId,
      businessProfileId: profileId,
      businessId: biz1,
      permitType: 'initial',
      inspectionType: 'follow_up',
      scheduledDate: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      overallResult: 'passed',
      completedAt: yesterday,
      assignedBy: officerId,
    })
    inspections.push(completed3)

    console.log(`Created ${inspections.length} inspections`)

    // Create violations (unique IDs per run)
    const vStamp = stamp()
    const complianceDeadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const violations = [
      await Violation.create({
        inspectionId: completed1._id,
        violationId: `${SEED_VIOLATION_ID_PREFIX}001-${vStamp}`,
        violationType: 'sanitation',
        description: 'Improper waste disposal observed',
        severity: 'minor',
        complianceDeadline,
        status: 'open',
        inspectorId,
      }),
      await Violation.create({
        inspectionId: completed1._id,
        violationId: `${SEED_VIOLATION_ID_PREFIX}002-${vStamp}`,
        violationType: 'fire_safety',
        description: 'Fire extinguisher not properly mounted',
        severity: 'major',
        complianceDeadline,
        status: 'resolved',
        inspectorId,
      }),
      await Violation.create({
        inspectionId: completed2._id,
        violationId: `${SEED_VIOLATION_ID_PREFIX}003-${vStamp}`,
        violationType: 'health',
        description: 'Food handling certificate expired',
        severity: 'critical',
        complianceDeadline,
        status: 'open',
        inspectorId,
      }),
      await Violation.create({
        inspectionId: completed3._id,
        violationId: `${SEED_VIOLATION_ID_PREFIX}004-${vStamp}`,
        violationType: 'sanitation',
        description: 'Storage area not properly labeled',
        severity: 'minor',
        complianceDeadline,
        status: 'open',
        inspectorId,
      }),
      await Violation.create({
        inspectionId: completed3._id,
        violationId: `${SEED_VIOLATION_ID_PREFIX}005-${vStamp}`,
        violationType: 'fire_safety',
        description: 'Emergency exit sign missing',
        severity: 'major',
        complianceDeadline,
        status: 'resolved',
        inspectorId,
      }),
    ]
    console.log(`Created ${violations.length} violations`)

    // Create notifications
    const notifications = [
      await Notification.create({
        userId: inspectorId,
        type: 'inspection_assigned',
        title: 'New Inspection Assigned',
        message: 'You have been assigned to inspect Seed Cafe & Restaurant today.',
        relatedEntityType: 'inspection',
        relatedEntityId: String(inspections[0]._id),
        read: false,
      }),
      await Notification.create({
        userId: inspectorId,
        type: 'inspection_assigned',
        title: 'Inspection Scheduled',
        message: 'Inspection for Seed Retail Store has been scheduled for tomorrow.',
        relatedEntityType: 'inspection',
        relatedEntityId: String(inspections[2]._id),
        read: true,
        readAt: now,
      }),
      await Notification.create({
        userId: inspectorId,
        type: 'inspection_schedule_changed',
        title: 'Schedule Change',
        message: 'The inspection for Seed Cafe has been rescheduled to next week.',
        relatedEntityType: 'inspection',
        relatedEntityId: String(inspections[5]._id),
        read: false,
      }),
      await Notification.create({
        userId: inspectorId,
        type: 'appeal_outcome',
        title: 'Appeal Resolved',
        message: 'The appeal for a violation has been resolved in your favor.',
        relatedEntityType: 'violation',
        relatedEntityId: String(violations[1]._id),
        read: false,
      }),
      await Notification.create({
        userId: inspectorId,
        type: 'inspection_assigned',
        title: 'New Assignment',
        message: 'Seed Cafe & Restaurant – initial inspection scheduled for today.',
        relatedEntityType: 'inspection',
        relatedEntityId: String(inspections[inspections.length - 2]._id),
        read: false,
      }),
      await Notification.create({
        userId: inspectorId,
        type: 'inspection_schedule_changed',
        title: 'Reminder',
        message: 'Seed Retail Store inspection is due tomorrow.',
        relatedEntityType: 'inspection',
        relatedEntityId: String(inspections[2]._id),
        read: false,
      }),
    ]
    console.log(`Created ${notifications.length} notifications`)

    // Summary
    const todayCount = inspections.filter(
      (i) => i.scheduledDate >= startOfToday && i.scheduledDate <= endOfToday
    ).length
    const pendingCount = inspections.filter((i) => i.status === 'pending' || i.status === 'in_progress').length
    const completedCount = inspections.filter((i) => i.status === 'completed').length

    console.log('')
    console.log('Inspector seed data complete.')
    console.log('')
    console.log('Summary:')
    console.log(`  Inspections: ${inspections.length} (today: ${todayCount}, pending: ${pendingCount}, completed: ${completedCount})`)
    console.log(`  Violations:  ${violations.length} (open + resolved)`)
    console.log(`  Notifications: ${notifications.length}`)
    console.log('')
    console.log('Login to test (mobile app):')
    console.log('  Email:    waynenrq@gmail.com')
    console.log('  Password: TempPass123!')
    console.log('  Inspector _id (JWT sub when logged in):', String(inspectorId))
    console.log('')
    console.log('Test checklist – verify each Inspector screen:')
    console.log('  1. Dashboard     – Today, Pending, Completed counts (non-zero)')
    console.log('  2. My Schedule  – Calendar with inspections this month')
    console.log('  3. Assigned     – List of pending/in-progress inspections')
    console.log('  4. History      – List of completed inspections')
    console.log('  5. Violations   – List of issued violations (open/resolved)')
    console.log('  6. Notifications – List of assignment/schedule/appeal notifications')
    console.log('')
    const verifyInspect = await Inspection.countDocuments({ inspectorId })
    const verifyVio = await Violation.countDocuments({ inspectorId })
    const verifyNotif = await Notification.countDocuments({ userId: inspectorId })
    if (verifyInspect === 0 || verifyVio === 0 || verifyNotif === 0) {
      console.log('')
      console.log('WARNING: Verification counts after seed:', { inspections: verifyInspect, violations: verifyVio, notifications: verifyNotif })
      console.log('Backend must use the SAME MongoDB (same MONGO_URI in backend/.env).')
    }
    console.log('')
    console.log('If app still empty: backend now resolves waynenrq@gmail.com by email – restart backend, log out and log in again.')
    console.log('BASE_URL (mobile/app/.env): Android emulator http://10.0.2.2:3000 | Device http://YOUR_PC_IP:3000')
  } catch (err) {
    console.error('Error:', err.message)
    if (err.code === 11000) {
      console.error('Duplicate key - try running with --reset to clear existing data first')
    }
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

main()
