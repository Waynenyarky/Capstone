#!/usr/bin/env node
/**
 * IPFS Browser Script
 * 
 * This script helps you browse and verify IPFS files stored in your system.
 * Similar to MongoDB Compass, but for IPFS!
 * 
 * Usage:
 *   node scripts/browseIpfs.js                    # List all IPFS files
 *   node scripts/browseIpfs.js --user email@example.com  # Show files for specific user
 *   node scripts/browseIpfs.js --cid QmXxxx...     # Get info about specific CID
 *   node scripts/browseIpfs.js --stats             # Show IPFS statistics
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const ipfsService = require('../src/lib/ipfsService')

// Models
const User = require('../src/models/User')
let IdVerification
try {
  IdVerification = require('../src/models/IdVerification')
} catch (e) {
  // Model might not exist
  IdVerification = null
}

let BusinessProfile
try {
  BusinessProfile = require('../src/models/BusinessProfile')
} catch (e) {
  // Model might not exist
  BusinessProfile = null
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/capstone_project'
const IPFS_GATEWAY = process.env.IPFS_GATEWAY_URL || 'http://localhost:8080/ipfs/'

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkIpfsConnection() {
  log('\n🔍 Checking IPFS connection...', 'cyan')
  
  if (!ipfsService.isAvailable()) {
    log('❌ IPFS service is not available!', 'red')
    log('   Make sure IPFS is running:', 'yellow')
    log('   - Docker: docker-compose up -d ipfs', 'yellow')
    log('   - Local: ipfs daemon', 'yellow')
    return false
  }
  
  try {
    // Try to get IPFS node info
    const ipfsClient = require('ipfs-http-client').create({ 
      url: process.env.IPFS_API_URL || 'http://127.0.0.1:5001' 
    })
    const id = await ipfsClient.id()
    log(`✅ IPFS connected!`, 'green')
    log(`   Node ID: ${id.id}`, 'cyan')
    log(`   Gateway: ${IPFS_GATEWAY}`, 'cyan')
    return true
  } catch (error) {
    log(`❌ Cannot connect to IPFS: ${error.message}`, 'red')
    return false
  }
}

async function getIpfsStats() {
  log('\n📊 IPFS Statistics', 'bright')
  log('─'.repeat(50), 'cyan')
  
  try {
    const ipfsClient = require('ipfs-http-client').create({ 
      url: process.env.IPFS_API_URL || 'http://127.0.0.1:5001' 
    })
    
    // Get repo stats
    const stats = await ipfsClient.repo.stat()
    const sizeMB = (parseInt(stats.repoSize) / 1024 / 1024).toFixed(2)
    const numObjects = parseInt(stats.numObjects)
    
    log(`Storage Size: ${sizeMB} MB`, 'green')
    log(`Number of Objects: ${numObjects}`, 'green')
    
    // Get pinned files
    const pins = []
    for await (const pin of ipfsClient.pin.ls()) {
      pins.push(pin)
    }
    log(`Pinned Files: ${pins.length}`, 'green')
    
    return { sizeMB, numObjects, pinnedCount: pins.length }
  } catch (error) {
    log(`❌ Error getting stats: ${error.message}`, 'red')
    return null
  }
}

async function listAllFiles() {
  log('\n📁 All IPFS Files in Database', 'bright')
  log('═'.repeat(80), 'cyan')
  
  // Get all users with IPFS files
  const usersWithAvatars = await User.find(
    { avatarIpfsCid: { $ne: '', $exists: true } },
    { email: 1, firstName: 1, lastName: 1, avatarIpfsCid: 1 }
  ).lean()
  
  const usersWithProfiles = await User.find(
    { profileIpfsCid: { $ne: '', $exists: true } },
    { email: 1, profileIpfsCid: 1 }
  ).lean()
  
  // Get ID verification files
  let idVerifications = []
  if (IdVerification) {
    idVerifications = await IdVerification.find(
      { 
        $or: [
          { frontImageIpfsCid: { $ne: '', $exists: true } },
          { backImageIpfsCid: { $ne: '', $exists: true } }
        ]
      },
      { userId: 1, frontImageIpfsCid: 1, backImageIpfsCid: 1 }
    ).populate('userId', 'email').lean()
  }
  
  let fileCount = 0
  
  // Display avatars
  if (usersWithAvatars.length > 0) {
    log('\n🖼️  Avatar Images:', 'yellow')
    usersWithAvatars.forEach(user => {
      fileCount++
      log(`   ${fileCount}. ${user.email || `${user.firstName} ${user.lastName}`}`, 'cyan')
      log(`      CID: ${user.avatarIpfsCid}`, 'green')
      log(`      URL: ${IPFS_GATEWAY}${user.avatarIpfsCid}`, 'blue')
    })
  }
  
  // Display profiles
  if (usersWithProfiles.length > 0) {
    log('\n📄 Profile JSON Files:', 'yellow')
    usersWithProfiles.forEach(user => {
      fileCount++
      log(`   ${fileCount}. ${user.email}`, 'cyan')
      log(`      CID: ${user.profileIpfsCid}`, 'green')
      log(`      URL: ${IPFS_GATEWAY}${user.profileIpfsCid}`, 'blue')
    })
  }
  
  // Display ID verification files
  if (idVerifications.length > 0) {
    log('\n🆔 ID Verification Documents:', 'yellow')
    idVerifications.forEach(doc => {
      if (doc.frontImageIpfsCid) {
        fileCount++
        log(`   ${fileCount}. ${doc.userId?.email || 'Unknown'} - Front ID`, 'cyan')
        log(`      CID: ${doc.frontImageIpfsCid}`, 'green')
        log(`      URL: ${IPFS_GATEWAY}${doc.frontImageIpfsCid}`, 'blue')
      }
      if (doc.backImageIpfsCid) {
        fileCount++
        log(`   ${fileCount}. ${doc.userId?.email || 'Unknown'} - Back ID`, 'cyan')
        log(`      CID: ${doc.backImageIpfsCid}`, 'green')
        log(`      URL: ${IPFS_GATEWAY}${doc.backImageIpfsCid}`, 'blue')
      }
    })
  }
  
  if (fileCount === 0) {
    log('\n   No IPFS files found in database.', 'yellow')
    log('   Files are stored when users upload avatars or documents.', 'yellow')
  } else {
    log(`\n✅ Total: ${fileCount} files`, 'green')
  }
}

async function showUserFiles(email) {
  log(`\n👤 IPFS Files for: ${email}`, 'bright')
  log('─'.repeat(50), 'cyan')
  
  const user = await User.findOne({ email }).lean()
  if (!user) {
    log(`❌ User not found: ${email}`, 'red')
    return
  }
  
  let hasFiles = false
  
  if (user.avatarIpfsCid) {
    hasFiles = true
    log('\n🖼️  Avatar:', 'yellow')
    log(`   CID: ${user.avatarIpfsCid}`, 'green')
    log(`   URL: ${IPFS_GATEWAY}${user.avatarIpfsCid}`, 'blue')
  }
  
  if (user.profileIpfsCid) {
    hasFiles = true
    log('\n📄 Profile JSON:', 'yellow')
    log(`   CID: ${user.profileIpfsCid}`, 'green')
    log(`   URL: ${IPFS_GATEWAY}${user.profileIpfsCid}`, 'blue')
  }
  
  let idVerification = null
  if (IdVerification) {
    idVerification = await IdVerification.findOne({ userId: user._id }).lean()
  }
  if (idVerification) {
    if (idVerification.frontImageIpfsCid) {
      hasFiles = true
      log('\n🆔 ID Front:', 'yellow')
      log(`   CID: ${idVerification.frontImageIpfsCid}`, 'green')
      log(`   URL: ${IPFS_GATEWAY}${idVerification.frontImageIpfsCid}`, 'blue')
    }
    if (idVerification.backImageIpfsCid) {
      hasFiles = true
      log('\n🆔 ID Back:', 'yellow')
      log(`   CID: ${idVerification.backImageIpfsCid}`, 'green')
      log(`   URL: ${IPFS_GATEWAY}${idVerification.backImageIpfsCid}`, 'blue')
    }
  }
  
  if (!hasFiles) {
    log('\n   No IPFS files found for this user.', 'yellow')
  }
}

async function getCidInfo(cid) {
  log(`\n🔍 Information for CID: ${cid}`, 'bright')
  log('─'.repeat(50), 'cyan')
  
  try {
    const ipfsClient = require('ipfs-http-client').create({ 
      url: process.env.IPFS_API_URL || 'http://127.0.0.1:5001' 
    })
    
    // Check if file exists
    let fileInfo
    try {
      const stat = await ipfsClient.files.stat(`/ipfs/${cid}`)
      fileInfo = stat
    } catch (error) {
      // Try using ls instead
      try {
        const files = []
        for await (const file of ipfsClient.ls(cid)) {
          files.push(file)
        }
        if (files.length > 0) {
          fileInfo = files[0]
        }
      } catch (err) {
        log(`❌ Cannot find file with CID: ${cid}`, 'red')
        log(`   Error: ${err.message}`, 'yellow')
        return
      }
    }
    
    // Check if pinned
    let isPinned = false
    try {
      const pins = []
      for await (const pin of ipfsClient.pin.ls({ paths: [cid] })) {
        pins.push(pin)
      }
      isPinned = pins.length > 0
    } catch (error) {
      // Not pinned or doesn't exist
    }
    
    log(`\n✅ File found!`, 'green')
    if (fileInfo.size) {
      const sizeKB = (parseInt(fileInfo.size) / 1024).toFixed(2)
      log(`   Size: ${sizeKB} KB (${fileInfo.size} bytes)`, 'cyan')
    }
    log(`   Pinned: ${isPinned ? '✅ Yes' : '❌ No'}`, isPinned ? 'green' : 'yellow')
    log(`   Gateway URL: ${IPFS_GATEWAY}${cid}`, 'blue')
    
    // Try to determine file type
    try {
      const chunks = []
      for await (const chunk of ipfsClient.cat(cid)) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      const header = buffer.slice(0, 10).toString('hex')
      
      let fileType = 'Unknown'
      if (header.startsWith('ffd8ff')) fileType = 'JPEG Image'
      else if (header.startsWith('89504e47')) fileType = 'PNG Image'
      else if (header.startsWith('25504446')) fileType = 'PDF Document'
      else if (buffer.toString('utf8', 0, 1) === '{') fileType = 'JSON Data'
      
      log(`   Type: ${fileType}`, 'cyan')
    } catch (error) {
      // Couldn't determine type
    }
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red')
  }
}

async function listPinnedFiles() {
  log('\n📌 All Pinned Files in IPFS', 'bright')
  log('─'.repeat(50), 'cyan')
  
  try {
    const ipfsClient = require('ipfs-http-client').create({ 
      url: process.env.IPFS_API_URL || 'http://127.0.0.1:5001' 
    })
    
    const pins = []
    for await (const pin of ipfsClient.pin.ls()) {
      pins.push(pin)
    }
    
    if (pins.length === 0) {
      log('   No pinned files found.', 'yellow')
      return
    }
    
    log(`\n✅ Found ${pins.length} pinned files:\n`, 'green')
    
    pins.forEach((pin, index) => {
      const cid = typeof pin === 'string' ? pin : pin.cid?.toString() || pin.path || 'Unknown'
      const type = pin.type || 'recursive'
      log(`   ${index + 1}. ${cid}`, 'cyan')
      log(`      Type: ${type}`, 'green')
      log(`      URL: ${IPFS_GATEWAY}${cid}`, 'blue')
    })
    
  } catch (error) {
    log(`❌ Error listing pins: ${error.message}`, 'red')
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  const userEmail = args.find(arg => arg.startsWith('--user='))?.split('=')[1] || 
                    (args.includes('--user') && args[args.indexOf('--user') + 1])
  const cid = args.find(arg => arg.startsWith('--cid='))?.split('=')[1] || 
              (args.includes('--cid') && args[args.indexOf('--cid') + 1])
  const showStats = args.includes('--stats')
  const showPins = args.includes('--pins')
  
  log('\n🌐 IPFS Browser', 'bright')
  log('═'.repeat(80), 'cyan')
  
  // Check IPFS connection
  const ipfsAvailable = await checkIpfsConnection()
  
  // Connect to MongoDB
  try {
    await mongoose.connect(MONGO_URI)
    log('✅ Connected to MongoDB', 'green')
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`, 'red')
    process.exit(1)
  }
  
  try {
    // Show stats
    if (showStats) {
      await getIpfsStats()
    }
    
    // Show pinned files
    if (showPins) {
      await listPinnedFiles()
    }
    
    // Show specific CID info
    if (cid) {
      await getCidInfo(cid)
    }
    // Show user files
    else if (userEmail) {
      await showUserFiles(userEmail)
    }
    // List all files
    else {
      await listAllFiles()
      if (ipfsAvailable) {
        log('\n💡 Tip: Use --stats to see IPFS storage statistics', 'yellow')
        log('   Use --pins to see all pinned files in IPFS', 'yellow')
        log('   Use --user=email@example.com to see files for a specific user', 'yellow')
        log('   Use --cid=QmXxxx... to get info about a specific CID', 'yellow')
      }
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    console.error(error)
  } finally {
    await mongoose.disconnect()
    log('\n✅ Done!', 'green')
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { listAllFiles, showUserFiles, getCidInfo, getIpfsStats }
