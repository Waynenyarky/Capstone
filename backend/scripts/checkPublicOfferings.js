/*
 * Diagnostic script: inspect providers, service areas, and active public offerings.
 * Usage:
 *   node backend/scripts/checkPublicOfferings.js --city="San Carlos City" [--province="Pangasinan"]
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const Provider = require('../src/models/Provider')
const Service = require('../src/models/Service')
const ProviderServiceOffering = require('../src/models/ProviderServiceOffering')
const ServiceAreaConfig = require('../src/models/ServiceAreaConfig')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

async function main() {
  try {
    const uri = process.env.MONGO_URI
    if (!uri) {
      console.error('MONGO_URI not set in backend/.env. Please configure your DB connection.')
      process.exit(1)
    }
    await connectDB(uri)
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Check MONGO_URI and connectivity.')
      process.exit(1)
    }

    const { city = '', province = '' } = parseArgs()
    const qCity = String(city || '').trim()
    const qProvince = String(province || '').trim()
    console.log('Diagnostics with filters:', { city: qCity || '(none)', province: qProvince || '(none)' })

    // Service Areas configuration
    const cfg = await ServiceAreaConfig.findOne({}).lean()
    const areas = Array.isArray(cfg?.areas) ? cfg.areas : []
    const activeAreas = areas.filter((grp) => grp && grp.active !== false)
    console.log(`ServiceAreaConfig: ${areas.length} groups (${activeAreas.length} active)\n`)
    if (qCity) {
      const matches = activeAreas.filter((grp) => (grp.cities || []).map((c) => String(c).toLowerCase()).includes(qCity.toLowerCase()))
      console.log(`City '${qCity}' present in active groups:`, matches.map((m) => m.province))
    }

    // Providers overview
    const providers = await Provider.find({}).lean()
    console.log(`\nProviders: ${providers.length}`)
    for (const p of providers) {
      const areasLC = Array.isArray(p.serviceAreas) ? p.serviceAreas.map((x) => String(x).toLowerCase()) : []
      const servesCity = qCity ? (areasLC.includes(qCity.toLowerCase()) || String(p.city || '').toLowerCase() === qCity.toLowerCase()) : false
      const approved = String(p.applicationStatus || 'pending') === 'approved'
      const acct = String(p.status || 'pending')
      console.log(`- ${p.businessName || '(unnamed)'} | city=${p.city || ''} prov=${p.province || ''} | app=${p.applicationStatus || 'pending'} acct=${acct} | areas=${(p.serviceAreas || []).join(', ')}`)
      if (qCity && servesCity) console.log('  -> serves queried city')
      if (!approved) console.log('  ! not approved')
      if (['inactive','deleted','deletion_pending','rejected'].includes(acct)) console.log('  ! account status excludes from public')
    }

    // Offerings overview
    const docs = await ProviderServiceOffering.find({}).populate({ path: 'serviceId' }).populate('providerId').lean()
    const pubEligible = []
    const excluded = []
    for (const d of docs) {
      const service = d.serviceId
      const provider = d.providerId
      if (!service || !provider) {
        excluded.push({ id: String(d._id), serviceName: service?.name || '(unknown)', providerName: provider?.businessName || '(unknown)', reasons: ['missing service/provider'] })
        continue
      }
      const reasons = []
      if (!d.active) reasons.push('offering.active=false')
      if (String(d.status || '') !== 'active') reasons.push(`offering.status=${d.status}`)
      if (String(service.status || '') !== 'active') reasons.push(`service.status=${service.status}`)
      const appStatus = String(provider.applicationStatus || 'pending')
      const acctStatus = String(provider.status || 'pending')
      if (appStatus !== 'approved') reasons.push(`provider.applicationStatus=${appStatus}`)
      if (['inactive','deleted','deletion_pending','rejected'].includes(acctStatus)) reasons.push(`provider.status=${acctStatus}`)

      // Location filter
      let locOk = true
      if (qCity) {
        const pCityLC = String(provider.city || '').toLowerCase()
        const areasLC = Array.isArray(provider.serviceAreas) ? provider.serviceAreas.map((x) => String(x).toLowerCase()) : []
        const byCity = pCityLC === qCity.toLowerCase()
        const byArea = areasLC.includes(qCity.toLowerCase())
        locOk = byCity || byArea
        if (!locOk) reasons.push('location: city not matched (city nor serviceAreas)')
      }
      if (qProvince) {
        const pProvLC = String(provider.province || '').toLowerCase()
        const pCityLC = String(provider.city || '').toLowerCase()
        const areasLC = Array.isArray(provider.serviceAreas) ? provider.serviceAreas.map((x) => String(x).toLowerCase()) : []
        const byCity = qCity && pCityLC === qCity.toLowerCase()
        const byArea = qCity && areasLC.includes(qCity.toLowerCase())
        const shouldCheckProvince = !qCity || byCity
        if (shouldCheckProvince && pProvLC !== qProvince.toLowerCase()) {
          reasons.push('province mismatch')
        }
      }

      if (reasons.length === 0) {
        pubEligible.push({ id: String(d._id), serviceName: service.name, providerName: provider.businessName })
      } else {
        excluded.push({ id: String(d._id), serviceName: service.name, providerName: provider.businessName, reasons })
      }
    }

    console.log(`\nOfferings total: ${docs.length}`)
    console.log(`Public-eligible offerings: ${pubEligible.length}`)
    for (const r of pubEligible) {
      console.log(`  + [${r.id}] ${r.serviceName} by ${r.providerName}`)
    }
    console.log(`\nExcluded offerings: ${excluded.length}`)
    for (const r of excluded) {
      const reasons = Array.isArray(r.reasons) ? r.reasons : [String(r.reason || 'unknown')]
      console.log(`  - [${r.id}] ${r.serviceName} by ${r.providerName} :: ${reasons.join('; ')}`)
    }

  } catch (err) {
    console.error('Diagnostics failed:', err)
    process.exit(1)
  } finally {
    try { await mongoose.disconnect() } catch (_) {}
  }
}

main()