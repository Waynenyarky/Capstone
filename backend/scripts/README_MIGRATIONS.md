# Data Migration Scripts

This directory contains scripts for migrating existing data to IPFS and blockchain.

## Scripts

### 1. migrateFilesToIpfs.js

Migrates existing files from local filesystem (`/uploads/`) to IPFS and updates MongoDB records with IPFS CIDs.

**Usage:**
```bash
# Dry run (preview changes)
node scripts/migrateFilesToIpfs.js --dry-run

# Migrate all files
node scripts/migrateFilesToIpfs.js

# Migrate only auth service files
node scripts/migrateFilesToIpfs.js --service=auth

# Migrate only business service files
node scripts/migrateFilesToIpfs.js --service=business
```

**What it migrates:**
- Avatar images (`/uploads/avatars/`)
- ID verification documents (`/uploads/ids/`)
- Business registration documents (`/uploads/business-registration/`)
- BIR certificates and other business documents

**Features:**
- Skips files that already have IPFS CIDs
- Maintains backward compatibility (keeps original URLs)
- Pins files to IPFS for persistence
- Provides detailed progress and error reporting

### 2. migrateUsersToBlockchain.js

Migrates user data to the blockchain:
1. Calculates SHA256 hash of user profile data
2. Stores hash in UserRegistry contract
3. Uploads full profile JSON to IPFS
4. Stores IPFS CID in DocumentStorage contract
5. Updates MongoDB with blockchain references

**Usage:**
```bash
# Dry run (preview changes)
node scripts/migrateUsersToBlockchain.js --dry-run

# Migrate all users
node scripts/migrateUsersToBlockchain.js

# Migrate first 10 users (for testing)
node scripts/migrateUsersToBlockchain.js --limit=10
```

**What it does:**
- Calculates profile hash for each user
- Registers user in UserRegistry contract
- Uploads profile JSON to IPFS
- Stores profile document in DocumentStorage contract
- Updates MongoDB with blockchain references

**Features:**
- Skips users already migrated
- Generates deterministic Ethereum addresses for users (for migration)
- Provides detailed progress and error reporting
- Includes delay between transactions to avoid overwhelming blockchain

## Prerequisites

Before running migration scripts:

1. **IPFS Node**: Start IPFS node or configure IPFS provider
   ```bash
   # Local IPFS
   ipfs daemon
   
   # Or set environment variables for remote IPFS
   export IPFS_PROVIDER=pinata|infura
   export PINATA_API_KEY=...
   ```

2. **Blockchain Network**: Start Ganache or connect to Ethereum network
   ```bash
   # Start Ganache
   ganache-cli
   
   # Or set environment variables
   export GANACHE_RPC_URL=http://127.0.0.1:7545
   export DEPLOYER_PRIVATE_KEY=0x...
   ```

3. **Deploy Contracts**: Deploy smart contracts first
   ```bash
   cd blockchain
   npm run migrate --network ganache
   ```

4. **Set Contract Addresses**: Update environment variables
   ```env
   ACCESS_CONTROL_CONTRACT_ADDRESS=0x...
   USER_REGISTRY_CONTRACT_ADDRESS=0x...
   DOCUMENT_STORAGE_CONTRACT_ADDRESS=0x...
   AUDIT_LOG_CONTRACT_ADDRESS=0x...
   ```

5. **MongoDB Connection**: Ensure MongoDB is accessible
   ```env
   MONGO_URI=mongodb://localhost:27017/capstone_project
   ```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/capstone_project

# IPFS
IPFS_PROVIDER=local
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/

# Blockchain
GANACHE_RPC_URL=http://127.0.0.1:7545
DEPLOYER_PRIVATE_KEY=0x...

# Contract Addresses (set after deployment)
ACCESS_CONTROL_CONTRACT_ADDRESS=0x...
USER_REGISTRY_CONTRACT_ADDRESS=0x...
DOCUMENT_STORAGE_CONTRACT_ADDRESS=0x...
AUDIT_LOG_CONTRACT_ADDRESS=0x...
```

## Migration Strategy

### Recommended Order

1. **Deploy Contracts** (one-time)
   ```bash
   cd blockchain
   npm run migrate --network ganache
   ```

2. **Migrate Files to IPFS** (can be done incrementally)
   ```bash
   # Start with dry run
   node scripts/migrateFilesToIpfs.js --dry-run
   
   # Then migrate
   node scripts/migrateFilesToIpfs.js
   ```

3. **Migrate Users to Blockchain** (can be done incrementally)
   ```bash
   # Start with small batch
   node scripts/migrateUsersToBlockchain.js --limit=10
   
   # Then migrate all
   node scripts/migrateUsersToBlockchain.js
   ```

### Incremental Migration

Both scripts support incremental migration:
- Files already migrated (have IPFS CIDs) are skipped
- Users already migrated (have profileHash) are skipped
- You can run scripts multiple times safely

### Rollback

If you need to rollback:
- IPFS files remain on IPFS (can be unpinned if needed)
- Blockchain data is immutable (cannot be deleted)
- MongoDB records can be updated to remove blockchain references
- Original files in `/uploads/` are preserved (not deleted)

## Troubleshooting

### IPFS Not Available
```
❌ IPFS service is not available
```
**Solution**: Start IPFS node or configure IPFS provider in environment variables

### Blockchain Not Available
```
❌ Blockchain service is not available
```
**Solution**: Start Ganache or check blockchain network configuration

### Contract Not Found
```
❌ UserRegistry contract not available
```
**Solution**: Deploy contracts first and set contract addresses in environment variables

### File Not Found
```
⚠️  File not found: /uploads/avatars/...
```
**Solution**: File may have been deleted. Script will skip and continue.

### Gas Estimation Failed
```
❌ Error: gas required exceeds allowance
```
**Solution**: Ensure deployer account has sufficient ETH balance

## Notes

- Migration scripts are idempotent (safe to run multiple times)
- Original files are not deleted (preserved for backup)
- MongoDB records are updated but original data is maintained
- Blockchain data is immutable (cannot be changed after migration)
- IPFS files should be pinned for persistence (scripts do this automatically)
