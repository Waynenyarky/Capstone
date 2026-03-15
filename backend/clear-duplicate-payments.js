/**
 * Script to identify and remove duplicate payments for a business
 * 
 * Usage: node scripts/clear-duplicate-payments.js [businessId]
 * 
 * This script:
 * 1. Fetches all payments for a business
 * 2. Groups them by paymentType + description + amount
 * 3. Keeps only the first (oldest) payment in each group
 * 4. Deletes the duplicates
 */

const mongoose = require('mongoose')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/capstone'

// Payment schema (simplified for this script)
const PaymentSchema = new mongoose.Schema({
  businessId: String,
  paymentType: String,
  description: String,
  amount: Number,
  status: String,
  dueDate: Date,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'payments', timestamps: true })

const Payment = mongoose.model('Payment', PaymentSchema)

async function findDuplicatePayments(businessId) {
  const payments = await Payment.find({ businessId }).sort({ createdAt: 1 }).lean()
  
  console.log(`\nFound ${payments.length} total payments for business ${businessId}\n`)
  
  // Group payments by key fields
  const groups = {}
  
  for (const payment of payments) {
    const key = `${payment.paymentType}|${payment.description}|${payment.amount}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(payment)
  }
  
  // Find duplicates (groups with more than 1 payment)
  const duplicates = []
  const toKeep = []
  
  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      console.log(`\nDuplicate group: ${key}`)
      console.log(`  - Keeping: ${group[0]._id} (created: ${group[0].createdAt})`)
      toKeep.push(group[0])
      
      for (let i = 1; i < group.length; i++) {
        console.log(`  - DUPLICATE: ${group[i]._id} (created: ${group[i].createdAt})`)
        duplicates.push(group[i])
      }
    } else {
      toKeep.push(group[0])
    }
  }
  
  return { duplicates, toKeep, total: payments.length }
}

async function deleteDuplicates(duplicates, dryRun = true) {
  if (duplicates.length === 0) {
    console.log('\nNo duplicates to delete.')
    return
  }
  
  console.log(`\n${dryRun ? '[DRY RUN] Would delete' : 'Deleting'} ${duplicates.length} duplicate payment(s)...`)
  
  if (dryRun) {
    console.log('\nTo actually delete, run with --execute flag')
    return
  }
  
  for (const dup of duplicates) {
    await Payment.deleteOne({ _id: dup._id })
    console.log(`  Deleted: ${dup._id} (${dup.description} - ₱${dup.amount})`)
  }
  
  console.log(`\nSuccessfully deleted ${duplicates.length} duplicate payment(s)`)
}

async function main() {
  const args = process.argv.slice(2)
  const businessId = args.find(arg => !arg.startsWith('--'))
  const execute = args.includes('--execute')
  const listAll = args.includes('--list-all')
  
  if (!businessId && !listAll) {
    console.log('Usage: node scripts/clear-duplicate-payments.js <businessId> [--execute] [--list-all]')
    console.log('')
    console.log('Options:')
    console.log('  --execute    Actually delete duplicates (default is dry run)')
    console.log('  --list-all   List all businesses with duplicate payments')
    process.exit(1)
  }
  
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected!')
    
    if (listAll) {
      // Find all businesses with potential duplicates
      const allPayments = await Payment.find({}).lean()
      const businessGroups = {}
      
      for (const p of allPayments) {
        if (!businessGroups[p.businessId]) {
          businessGroups[p.businessId] = []
        }
        businessGroups[p.businessId].push(p)
      }
      
      console.log('\nBusinesses with potential duplicate payments:\n')
      
      for (const [bid, payments] of Object.entries(businessGroups)) {
        const groups = {}
        for (const p of payments) {
          const key = `${p.paymentType}|${p.description}|${p.amount}`
          if (!groups[key]) groups[key] = []
          groups[key].push(p)
        }
        
        const dupCount = Object.values(groups).filter(g => g.length > 1).reduce((sum, g) => sum + g.length - 1, 0)
        if (dupCount > 0) {
          console.log(`  ${bid}: ${payments.length} payments, ${dupCount} duplicates`)
        }
      }
      
      console.log('\nRun with a specific businessId to see details and clean up.')
    } else {
      const { duplicates, toKeep, total } = await findDuplicatePayments(businessId)
      
      console.log(`\n--- Summary ---`)
      console.log(`Total payments: ${total}`)
      console.log(`Unique payments to keep: ${toKeep.length}`)
      console.log(`Duplicates to remove: ${duplicates.length}`)
      
      if (duplicates.length > 0) {
        const totalDupAmount = duplicates.reduce((sum, d) => sum + (d.amount || 0), 0)
        console.log(`Total duplicate amount: ₱${totalDupAmount.toLocaleString()}`)
      }
      
      await deleteDuplicates(duplicates, !execute)
    }
    
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB.')
  }
}

main()
