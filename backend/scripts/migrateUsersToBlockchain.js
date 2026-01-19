/**
 * Migration Script: Migrate Users to Blockchain
 * 
 * This script migrates user data to the blockchain:
 * 1. Calculates profile data hash for each user
 * 2. Stores hash in UserRegistry contract
 * 3. Stores IPFS CID of full profile JSON in DocumentStorage contract
 * 4. Updates MongoDB with blockchain references
 * 
 * Usage:
 *   node scripts/migrateUsersToBlockchain.js [--dry-run] [--limit=N]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

// Import services
const userRegistryService = require('../services/audit-service/src/lib/userRegistryService');
const documentStorageService = require('../services/audit-service/src/lib/documentStorageService');
const ipfsService = require('../services/auth-service/src/lib/ipfsService') || require('../services/business-service/src/lib/ipfsService');
const blockchainService = require('../services/audit-service/src/lib/blockchainService');

// Import models
const User = require('../services/auth-service/src/models/User');

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0');

/**
 * Calculate SHA256 hash of user profile data
 */
function calculateProfileHash(user) {
  // Create a JSON object with relevant profile data
  const profileData = {
    userId: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    username: user.username,
    office: user.office,
    isStaff: user.isStaff,
    isActive: user.isActive,
    role: user.role ? (typeof user.role === 'object' ? user.role.slug : user.role) : null,
    avatarIpfsCid: user.avatarIpfsCid || null,
    mfaEnabled: user.mfaEnabled,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Convert to JSON string and hash
  const jsonString = JSON.stringify(profileData, Object.keys(profileData).sort());
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Upload user profile JSON to IPFS
 */
async function uploadProfileToIpfs(user) {
  const profileData = {
    userId: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    username: user.username,
    office: user.office,
    isStaff: user.isStaff,
    isActive: user.isActive,
    role: user.role ? (typeof user.role === 'object' ? user.role.slug : user.role) : null,
    avatarIpfsCid: user.avatarIpfsCid || null,
    mfaEnabled: user.mfaEnabled,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // Include full user document for complete data
    fullProfile: user.toObject(),
  };

  const { cid } = await ipfsService.uploadJSON(profileData);
  await ipfsService.pinFile(cid).catch(err => {
    console.warn(`   ⚠️  Failed to pin profile: ${cid}`, err.message);
  });

  return cid;
}

/**
 * Get or generate Ethereum address for user
 * For migration, we'll use a deterministic address based on userId
 * In production, users should have their own Ethereum addresses
 */
function getUserEthereumAddress(userId) {
  // For migration: generate deterministic address from userId
  // In production, this should come from user's wallet
  const hash = crypto.createHash('sha256').update(String(userId)).digest('hex');
  // Use first 40 chars of hash + '0x' prefix (Ethereum addresses are 42 chars)
  // Note: This is a simplified approach for migration. In production, users should connect their wallets.
  return `0x${hash.substring(0, 40)}`;
}

/**
 * Migrate a single user to blockchain
 */
async function migrateUser(user) {
  try {
    const userId = String(user._id);
    console.log(`\n   Processing user: ${userId} (${user.email})`);

    // Calculate profile hash
    const profileHash = calculateProfileHash(user);
    console.log(`   Profile hash: ${profileHash.substring(0, 16)}...`);

    // Get or generate Ethereum address
    const userAddress = getUserEthereumAddress(userId);
    console.log(`   Ethereum address: ${userAddress}`);

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would register user in UserRegistry`);
      console.log(`   [DRY RUN] Would upload profile to IPFS`);
      return { success: true, skipped: false };
    }

    // Upload profile to IPFS
    let profileIpfsCid = null;
    try {
      profileIpfsCid = await uploadProfileToIpfs(user);
      console.log(`   ✅ Profile uploaded to IPFS: ${profileIpfsCid}`);
    } catch (error) {
      console.error(`   ❌ Failed to upload profile to IPFS:`, error.message);
      return { success: false, error: error.message };
    }

    // Register user in UserRegistry
    try {
      const result = await userRegistryService.registerUser(userId, userAddress, profileHash);
      if (result.success) {
        console.log(`   ✅ User registered in UserRegistry: ${result.txHash}`);
      } else {
        console.error(`   ❌ Failed to register user:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`   ❌ Error registering user:`, error.message);
      return { success: false, error: error.message };
    }

    // Store profile document in DocumentStorage
    try {
      const docResult = await documentStorageService.storeDocument(
        userId,
        'OTHER', // Profile data is stored as 'OTHER' document type
        profileIpfsCid
      );
      if (docResult.success) {
        console.log(`   ✅ Profile document stored: ${docResult.txHash}`);
      } else {
        console.warn(`   ⚠️  Failed to store profile document:`, docResult.error);
      }
    } catch (error) {
      console.warn(`   ⚠️  Error storing profile document:`, error.message);
    }

    // Update MongoDB with blockchain references (optional - for tracking)
    // Note: The blockchain is the source of truth, MongoDB is just for indexing
    user.profileHash = profileHash;
    user.profileIpfsCid = profileIpfsCid;
    user.userEthereumAddress = userAddress;
    await user.save();

    return { success: true, skipped: false, profileHash, profileIpfsCid };
  } catch (error) {
    console.error(`   ❌ Error migrating user ${user._id}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting user migration to blockchain...');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be saved)'}`);
  console.log(`   Limit: ${LIMIT > 0 ? LIMIT : 'all users'}`);

  // Initialize blockchain services
  try {
    await blockchainService.initialize();
    if (!blockchainService.isAvailable()) {
      console.error('❌ Blockchain service is not available. Please check configuration.');
      process.exit(1);
    }

    await userRegistryService.initialize();
    await documentStorageService.initialize();

    if (!ipfsService.isAvailable()) {
      console.error('❌ IPFS service is not available. Please start IPFS node or configure IPFS provider.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not set in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get users to migrate
    let query = User.find();
    if (LIMIT > 0) {
      query = query.limit(LIMIT);
    }
    const users = await query.exec();
    console.log(`\n📋 Found ${users.length} users to migrate`);

    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    // Migrate each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n[${i + 1}/${users.length}]`);

      // Check if already migrated
      if (user.profileHash && user.profileIpfsCid) {
        console.log(`   ⏭️  User already migrated, skipping`);
        results.skipped++;
        continue;
      }

      const result = await migrateUser(user);
      if (result.success) {
        results.migrated++;
      } else {
        results.errors++;
      }

      results.details.push({
        userId: String(user._id),
        email: user.email,
        success: result.success,
        error: result.error || null,
      });

      // Small delay to avoid overwhelming the blockchain
      if (!DRY_RUN && i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Migrated: ${results.migrated}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);

    if (results.errors > 0) {
      console.log('\n❌ Errors occurred during migration. Check logs above.');
    } else {
      console.log(`\n${DRY_RUN ? '✅ Dry run completed. Use without --dry-run to apply changes.' : '✅ Migration completed!'}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { main, migrateUser, calculateProfileHash };
