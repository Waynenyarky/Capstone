const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Role = require('../models/Role')
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
        const docs = []
        for (const u of usersSeed) {
          const passwordHash = await bcrypt.hash(u.passwordPlain || 'changeme', 10)
          const roleSlug = u.role || 'business_owner'
          const roleDoc = await Role.findOne({ slug: roleSlug })
          if (!roleDoc) {
            console.warn(`Skipping user ${u.email}: role '${roleSlug}' not found`)
            continue
          }

          docs.push({
            role: roleDoc._id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            phoneNumber: u.phoneNumber || '',
            passwordHash,
            termsAccepted: u.termsAccepted ?? true,
          })
        }
        if (docs.length > 0) await User.insertMany(docs)
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
