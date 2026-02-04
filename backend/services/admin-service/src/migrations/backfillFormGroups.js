/**
 * Migration: Backfill FormGroups and add formGroupId + industryScope to FormDefinitions
 *
 * Run after deploying FormGroup model and FormDefinition schema changes.
 * Safe to run multiple times (idempotent for already-migrated docs).
 *
 * Usage: node backfillFormGroups.js
 * Or: MONGO_URI=... node backend/services/admin-service/src/migrations/backfillFormGroups.js
 */

const mongoose = require('mongoose')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') })

const FormGroup = require('../models/FormGroup')
const FormDefinition = require('../models/FormDefinition')
const { INDUSTRY_SCOPE_LABELS } = require('../../../../shared/constants')

function industryScopeFromBusinessTypes(businessTypes) {
  if (!businessTypes || businessTypes.length === 0) return 'all'
  if (businessTypes.length === 1) return businessTypes[0]
  return 'all'
}

async function backfill() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || ''
  if (!mongoUri) {
    console.error('Error: MONGO_URI environment variable is required')
    process.exit(1)
  }

  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('Connected')

    const definitions = await FormDefinition.find({}).lean()
    if (definitions.length === 0) {
      console.log('No form definitions found. Nothing to migrate.')
      await mongoose.disconnect()
      return
    }

    const groupKey = (formType, industryScope) => `${formType}:${industryScope}`
    const groupMap = new Map()

    for (const def of definitions) {
      if (def.formGroupId) {
        console.log(`  Skipping already migrated: ${def._id}`)
        continue
      }

      const industryScope = def.industryScope || industryScopeFromBusinessTypes(def.businessTypes)
      const key = groupKey(def.formType, industryScope)

      let group = groupMap.get(key)
      if (!group) {
        let existing = await FormGroup.findOne({ formType: def.formType, industryScope })
        if (existing) {
          group = existing
        } else {
          const typeLabels = {
            registration: 'Business Registration',
            permit: 'Business Permit',
            renewal: 'Business Renewal',
            cessation: 'Cessation',
            violation: 'Violation',
            appeal: 'Appeal',
          }
          const displayName = `${typeLabels[def.formType] || def.formType} - ${INDUSTRY_SCOPE_LABELS[industryScope] || industryScope}`
          existing = await FormGroup.create({
            formType: def.formType,
            industryScope,
            displayName,
          })
          console.log(`  Created FormGroup: ${displayName}`)
          group = existing
        }
        groupMap.set(key, group)
      }

      await FormDefinition.updateOne(
        { _id: def._id },
        {
          $set: {
            formGroupId: group._id,
            industryScope,
          },
        }
      )
      console.log(`  Updated FormDefinition ${def._id} -> formGroupId ${group._id}`)
    }

    console.log('Backfill completed successfully')
    await mongoose.disconnect()
  } catch (err) {
    console.error('Backfill failed:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

backfill()
