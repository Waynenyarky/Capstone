/**
 * Seed LOB Training Examples
 *
 * Populates the LobTrainingExample collection from the AI dataset JSON.
 * Each multi-recommendation entry is flattened into separate rows.
 * The script is idempotent — only seeds when the collection is empty.
 *
 * Usage:
 *   node backend/services/business-service/src/seed/seedLobTrainingExamples.js
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') })

const LobTrainingExample = require('../models/LobTrainingExample')

// Host/repo: ai is at project root (5 levels up from src/seed). Docker: ai is at /backend/ai/datasets (mounted).
// Default dataset can be the extended (bootstrapped) one so resets seed more examples; no external API used.
function getDatasetPath() {
  if (process.env.LOB_DATASET_PATH && fs.existsSync(process.env.LOB_DATASET_PATH)) {
    return process.env.LOB_DATASET_PATH
  }
  const fromSeed = (levelsUp, ...rest) => path.resolve(__dirname, '..', ...Array(levelsUp).fill('..'), ...rest)
  const candidates = [
    fromSeed(4, 'ai', 'datasets', 'lob_recommendation_dataset.json'),  // Docker: /backend/ai/datasets (try first)
    fromSeed(5, 'ai', 'datasets', 'lob_recommendation_dataset.json'),  // Local: project root
    fromSeed(4, 'ai', 'datasets', 'lob_recommendation_dataset_bootstrapped.json'),  // Fallback: extended set
    fromSeed(5, 'ai', 'datasets', 'lob_recommendation_dataset_bootstrapped.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function getDatasetPathForLog() {
  if (process.env.LOB_DATASET_PATH) return [process.env.LOB_DATASET_PATH]
  const fromSeed = (levelsUp, ...rest) => path.resolve(__dirname, '..', ...Array(levelsUp).fill('..'), ...rest)
  return [
    fromSeed(4, 'ai', 'datasets', 'lob_recommendation_dataset.json'),
    fromSeed(5, 'ai', 'datasets', 'lob_recommendation_dataset.json'),
    fromSeed(4, 'ai', 'datasets', 'lob_recommendation_dataset_bootstrapped.json'),
    fromSeed(5, 'ai', 'datasets', 'lob_recommendation_dataset_bootstrapped.json'),
  ]
}

const DATASET_PATH = getDatasetPath()

async function seedIfEmpty() {
  const count = await LobTrainingExample.countDocuments()
  if (count > 0) {
    return { seeded: false, count }
  }

  if (!DATASET_PATH) {
    return { seeded: false, count: 0, skipped: 'dataset_not_found', triedPaths: getDatasetPathForLog() }
  }

  const raw = fs.readFileSync(DATASET_PATH, 'utf-8')
  const dataset = JSON.parse(raw)

  const docs = []
  for (const entry of dataset) {
    const desc = (entry.businessDescription || '').trim()
    if (!desc) continue
    for (const rec of entry.recommendations || []) {
      if (!rec.taxCode || !rec.detailedLine) continue
      // Skip entries with empty lineOfBusiness
      if (!rec.lineOfBusiness || rec.lineOfBusiness.trim() === '') continue
      docs.push({
        businessDescription: desc,
        taxCode: rec.taxCode,
        lineOfBusiness: rec.lineOfBusiness || '',
        detailedLine: rec.detailedLine,
        psicCode: rec.psicCode || '',
      })
    }
  }

  if (docs.length > 0) {
    await LobTrainingExample.insertMany(docs)
  }

  return { seeded: true, count: docs.length }
}

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || ''
  if (!uri) {
    console.error('MONGO_URI is not set')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const result = await seedIfEmpty()
  if (result.seeded) {
    console.log(`Seeded ${result.count} LOB training examples`)
  } else {
    console.log(`LOB training examples already seeded (${result.count} docs)`)
  }
  await mongoose.disconnect()
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1) })
}

module.exports = { seedIfEmpty }
