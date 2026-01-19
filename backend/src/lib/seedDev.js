const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Role = require('../models/Role')
const { getStaffRoles } = require('../lib/roleHelpers')
// Removed provider seeding; unified user model

async function seedDevDataIfEmpty() {
  try {
    // Patch existing users missing passwordHash to allow login flows in dev
    try {
      const missing = await User.find({
        $or: [
          { passwordHash: { $exists: false } },
          { passwordHash: null },
          { passwordHash: '' },
        ],
      })
      let patched = 0
      for (const doc of missing) {
        const defaultPass = doc.email === '1' ? '1' : 'changeme'
        doc.passwordHash = await bcrypt.hash(defaultPass, 10)
        await doc.save()
        patched++
      }
      if (patched > 0) {
        console.warn(`Patched ${patched} user(s) with a default password. Advise password reset.`)
      }
    } catch (patchErr) {
      console.warn('Password patch step failed:', patchErr.message)
    }

    // Only seed when SEED_DEV is explicitly set to 'true'. This prevents accidental
    // re-seeding in development when you want to persist manual DB changes.
    const enabled = process.env.SEED_DEV === 'true'
    if (!enabled) return

    const userCount = await User.countDocuments()

    // Seed Roles first
    const roles = [
      { name: 'Admin', slug: 'admin' },
      { name: 'Business Owner', slug: 'business_owner' },
      { name: 'LGU Manager', slug: 'lgu_manager' },
      { name: 'LGU Officer', slug: 'lgu_officer' },
      { name: 'LGU Inspector', slug: 'inspector' },
      { name: 'CSO', slug: 'cso' },
    ]

    for (const r of roles) {
      await Role.findOneAndUpdate({ slug: r.slug }, r, { upsert: true, new: true })
    }

    const tempPassword = process.env.SEED_TEMP_PASSWORD || 'TempPass123!'
    const tempPasswordHash = await bcrypt.hash(tempPassword, 10)

    // Always ensure at least three admin accounts exist for testing/approval flows
    const ensureAdminAccounts = async () => {
      const adminRoleDoc = await Role.findOne({ slug: 'admin' })
      const adminUsers = [
        { email: 'admin@example.com', firstName: 'Alice', lastName: 'Admin', phoneNumber: '+10000000090' },
        { email: 'admin2@example.com', firstName: 'Alex', lastName: 'Admin', phoneNumber: '+10000000091' },
        { email: 'admin3@example.com', firstName: 'Avery', lastName: 'Admin', phoneNumber: '+10000000092' },
      ]
      for (const admin of adminUsers) {
        await User.findOneAndUpdate(
          { email: admin.email },
          {
            role: adminRoleDoc ? adminRoleDoc._id : undefined,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            phoneNumber: admin.phoneNumber || `+1${Date.now()}`,
            passwordHash: tempPasswordHash,
            termsAccepted: true,
            mustChangeCredentials: true,
            mustSetupMfa: true,
            mfaEnabled: false,
            mfaMethod: '',
            mfaSecret: '',
            isStaff: false,
          },
          { upsert: true, new: true, runValidators: false }
        )
      }
    }
    await ensureAdminAccounts()

    // Ensure all staff roles have seeded accounts with temp credentials to mimic first login
    const ensureStaffAccounts = async () => {
      const staffRoles = getStaffRoles()
      const roleDocs = await Role.find({ slug: { $in: staffRoles } })
      const roleMap = new Map(roleDocs.map((r) => [r.slug, r]))

      const staffUsers = [
        { email: 'officer@example.com', firstName: 'Larry', lastName: 'Officer', phoneNumber: '+1-555-0303', role: 'lgu_officer' },
        { email: 'manager@example.com', firstName: 'Mary', lastName: 'Manager', phoneNumber: '+1-555-0404', role: 'lgu_manager' },
        { email: 'inspector@example.com', firstName: 'Ian', lastName: 'Inspector', phoneNumber: '+1-555-0505', role: 'inspector' },
        { email: 'cso@example.com', firstName: 'Charlie', lastName: 'Support', phoneNumber: '+1-555-0606', role: 'cso' },
      ]

      for (const staff of staffUsers) {
        const roleDoc = roleMap.get(staff.role)
        await User.findOneAndUpdate(
          { email: staff.email },
          {
            role: roleDoc ? roleDoc._id : undefined,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phoneNumber: staff.phoneNumber || '',
            passwordHash: tempPasswordHash,
            termsAccepted: true,
            mustChangeCredentials: true,
            mustSetupMfa: true,
            mfaEnabled: false,
            mfaMethod: '',
            mfaSecret: '',
            isStaff: true,
            isActive: true,
          },
          { upsert: true, new: true, runValidators: false }
        )
      }
    }
    await ensureStaffAccounts()

    // Ensure core demo accounts always exist (used by smoke tests)
    const ensureUser = async (email, roleSlug, firstName, lastName, phoneNumber, overrides = {}) => {
      const roleDoc = await Role.findOne({ slug: roleSlug })
      if (!roleDoc) return
      const passwordHash = overrides.passwordHash || tempPasswordHash
      await User.findOneAndUpdate(
        { email },
        {
          role: roleDoc._id,
          firstName,
          lastName,
          email,
          phoneNumber: phoneNumber || '',
          passwordHash,
          termsAccepted: overrides.termsAccepted ?? true,
          mustChangeCredentials: overrides.mustChangeCredentials ?? false,
          mustSetupMfa: overrides.mustSetupMfa ?? false,
          mfaEnabled: overrides.mfaEnabled ?? false,
          mfaMethod: overrides.mfaMethod ?? '',
          mfaSecret: overrides.mfaSecret ?? '',
          isStaff: overrides.isStaff ?? false,
          isActive: overrides.isActive ?? true,
        },
        { upsert: true, new: true, runValidators: false }
      )
    }
    await ensureUser('admin@example.com', 'admin', 'Alice', 'Admin', '+10000000090', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    })
    await ensureUser('business@example.com', 'business_owner', 'Bob', 'Business', '+10000000093', {
      mustChangeCredentials: true,
    })

    // Seed users if empty
    if (userCount === 0) {
      const usersPath = path.join(__dirname, '..', 'data', 'seeds', 'users.json')
      let usersSeed = []
      try {
        const raw = fs.readFileSync(usersPath, 'utf-8')
        usersSeed = JSON.parse(raw)
      } catch (err) {
        console.warn('No users seed file found or invalid JSON:', err.message)
      }

      if (Array.isArray(usersSeed) && usersSeed.length > 0) {
        for (const u of usersSeed) {
          // Check if user already exists
          const existingUser = await User.findOne({ email: u.email })
          if (existingUser) {
            continue // Skip if user already exists
          }

          const passwordHash = await bcrypt.hash(u.passwordPlain || 'changeme', 10)
          const roleSlug = u.role || 'business_owner'
          const roleDoc = await Role.findOne({ slug: roleSlug })
          if (!roleDoc) {
            console.warn(`Skipping user ${u.email}: role '${roleSlug}' not found`)
            continue
          }

          // Use findOneAndUpdate with upsert to avoid duplicate key errors
          await User.findOneAndUpdate(
            { email: u.email },
            {
              role: roleDoc._id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              phoneNumber: u.phoneNumber || '',
              passwordHash,
              termsAccepted: u.termsAccepted ?? true,
            },
            { upsert: true, new: true, runValidators: false }
          )
        }
      }

      // Always ensure dev admin (email: "1", password: "1") exists
      // Removed automatic creation of admin user "1" as per request
      /*
      let adminDoc = await User.findOne({ email: '1' }).lean()
      if (!adminDoc) {
        const passwordHash = await bcrypt.hash('1', 10)
        await User.create({
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: '1',
          phoneNumber: '',
          termsAccepted: true,
          passwordHash,
        })
      }
      */
    }

    // Provider seeding removed

    console.log('Dev seed loader run complete.')
  } catch (err) {
    console.error('Dev seed loader failed:', err)
  }
}

module.exports = { seedDevDataIfEmpty }
