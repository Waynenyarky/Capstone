const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Provider = require('../models/Provider')

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
          docs.push({
            role: u.role || 'customer',
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
    }

    // Seed providers from JSON referencing users by email
    const providersPath = path.join(__dirname, '..', 'data', 'seeds', 'providers.json')
    let providersSeed = []
    try {
      const rawProv = fs.readFileSync(providersPath, 'utf-8')
      providersSeed = JSON.parse(rawProv)
    } catch (err) {
      // optional file
    }

    if (Array.isArray(providersSeed) && providersSeed.length > 0) {
      for (const p of providersSeed) {
        if (!p.userEmail) continue
        const user = await User.findOne({ email: p.userEmail }).lean()
        if (!user) continue
        const exists = await Provider.findOne({ userId: user._id }).lean()
        if (exists) continue
        await Provider.create({
          userId: user._id,
          businessName: p.businessName || '',
          servicesCategories: Array.isArray(p.servicesCategories) ? p.servicesCategories : [],
          streetAddress: p.streetAddress || '',
          city: p.city || '',
          province: p.province || '',
          zipCode: p.zipCode || '',
          status: p.status || 'pending',
        })
      }
    }

    console.log('Dev seed loader run complete.')
  } catch (err) {
    console.error('Dev seed loader failed:', err)
  }
}

module.exports = { seedDevDataIfEmpty }
