#!/usr/bin/env node
/**
 * Inspect documents stored for the application(s) in the DB.
 * Shows lguDocuments keys, formData file-like keys, and what the LGU review API returns as documents.
 *
 * Usage (from repo root or backend/services/business-service):
 *   node scripts/inspectApplicationDocuments.js
 *
 * Requires: MONGO_URI or MONGO_URI_LOCAL in .env
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') })
const mongoose = require('mongoose')

const envUri = process.env.MONGO_URI || 'mongodb://localhost:27017/capstone_project'
const isAtlas = envUri.includes('mongodb+srv')
const localUri = process.env.MONGO_URI_LOCAL ||
  `mongodb://${process.env.MONGO_APP_USER || 'capstone_app'}:${process.env.MONGO_APP_PASSWORD || 'devapppass'}@localhost:27017/capstone_project?authSource=admin`
const MONGO_URI = process.env.MONGO_URI_LOCAL || (isAtlas && process.env.USE_ATLAS !== '1' ? localUri : envUri)

// Admin service uses its own BusinessProfile path; business-service has one too. Use business-service for single source.
const BusinessProfile = require('../src/models/BusinessProfile')

function getDocumentUrl(legacyUrl, ipfsCid, gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://localhost:8080/ipfs/') {
  if (ipfsCid && typeof ipfsCid === 'string' && ipfsCid.trim()) {
    const clean = gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`
    return `${clean}${ipfsCid.trim()}`
  }
  return legacyUrl || ''
}

async function run() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB\n')

  const profiles = await BusinessProfile.find({ businesses: { $exists: true, $ne: [] } })
    .select('userId businesses')
    .lean()

  if (!profiles.length) {
    console.log('No applications (businesses) found in DB.')
    await mongoose.disconnect()
    return
  }

  for (const profile of profiles) {
    for (const biz of profile.businesses || []) {
      const appRef = biz.applicationReferenceNumber || biz.businessId || '—'
      console.log('═'.repeat(70))
      console.log('Application:', appRef)
      console.log('Business ID:', biz.businessId)
      console.log('Status:', biz.applicationStatus || '—')
      console.log('')

      const lgu = biz.lguDocuments || {}
      console.log('lguDocuments (stored in DB):')
      const lguKeys = Object.keys(lgu).sort()
      if (lguKeys.length === 0) {
        console.log('   (empty)')
      } else {
        for (const k of lguKeys) {
          const v = lgu[k]
          const hasValue = typeof v === 'string' && v.trim()
          console.log(`   ${k}: ${hasValue ? `"${v.substring(0, 20)}..." (${v.length} chars)` : '(empty)'}`)
        }
      }

      console.log('')
      console.log('formData keys that look like file fields (array with cid, or string):')
      const formData = biz.formData && typeof biz.formData === 'object' ? biz.formData : {}
      const fileLikeKeys = Object.keys(formData).filter((key) => {
        const v = formData[key]
        if (Array.isArray(v) && v.length > 0) {
          const first = v[0]
          return first && typeof first === 'object' && (first.cid != null || (first.response && first.response.cid != null))
        }
        return false
      })
      if (fileLikeKeys.length === 0) {
        console.log('   (none)')
      } else {
        fileLikeKeys.forEach((key) => {
          const v = formData[key]
          let cid = ''
          if (Array.isArray(v) && v[0]) {
            cid = v[0].cid || v[0].response?.cid || '(no cid)'
          } else if (typeof v === 'string') {
            cid = v
          }
          console.log(`   ${key}: ${cid ? `cid="${cid.substring(0, 24)}..."` : '(no cid)'}`)
        })
      }

      console.log('')
      console.log('Documents object as returned by LGU review API (fixed + dynamic from lguDocuments):')
      const fixedKeys = ['idPicture', 'ctc', 'barangayClearance', 'dtiSecCda', 'leaseOrLandTitle', 'occupancyPermit', 'healthCertificate']
      const docs = {}
      fixedKeys.forEach((base) => {
        const ipfsKey = `${base}IpfsCid`
        docs[base] = getDocumentUrl(lgu[base], lgu[ipfsKey])
      })
      Object.keys(lgu || {}).forEach((k) => {
        if (k.endsWith('IpfsCid')) {
          const baseKey = k.slice(0, -7) // 'IpfsCid' is 7 chars
          if (!docs[baseKey]) docs[baseKey] = getDocumentUrl(null, lgu[k])
        }
      })
      const docKeys = Object.keys(docs).sort()
      docKeys.forEach((k) => {
        const url = docs[k]
        console.log(`   ${k}: ${url ? 'has URL' : '(no URL)'}`)
      })

      console.log('')
    }
  }

  console.log('═'.repeat(70))
  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
