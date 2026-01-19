# Integration Tests

Integration tests for IPFS → blockchain flow and data verification.

## Test Files

### 1. ipfs-blockchain.test.js

Tests the complete IPFS → blockchain flow:
- File upload to IPFS
- CID storage in DocumentStorage contract
- CID retrieval from blockchain
- File retrieval from IPFS
- Document version history

**Run:**
```bash
npm test -- ipfs-blockchain.test.js
```

### 2. user-registry.test.js

Tests the user registry → blockchain flow:
- User registration in UserRegistry contract
- Profile hash storage and retrieval
- Profile JSON upload to IPFS
- Profile document storage in DocumentStorage
- End-to-end user migration flow

**Run:**
```bash
npm test -- user-registry.test.js
```

## Prerequisites

Before running integration tests:

1. **IPFS Node**: Start IPFS node
   ```bash
   ipfs daemon
   ```

2. **Blockchain Network**: Start Ganache
   ```bash
   ganache-cli
   ```

3. **Deploy Contracts**: Deploy smart contracts
   ```bash
   cd blockchain
   npm run migrate --network ganache
   ```

4. **Set Environment Variables**: Create `.env` file
   ```env
   MONGO_URI=mongodb://localhost:27017/capstone_test
   GANACHE_RPC_URL=http://127.0.0.1:7545
   DEPLOYER_PRIVATE_KEY=0x...
   ACCESS_CONTROL_CONTRACT_ADDRESS=0x...
   USER_REGISTRY_CONTRACT_ADDRESS=0x...
   DOCUMENT_STORAGE_CONTRACT_ADDRESS=0x...
   AUDIT_LOG_CONTRACT_ADDRESS=0x...
   IPFS_API_URL=http://127.0.0.1:5001
   ```

## Running Tests

```bash
# Run all integration tests
npm test -- __tests__/integration/

# Run specific test file
npm test -- __tests__/integration/ipfs-blockchain.test.js

# Run with verbose output
npm test -- __tests__/integration/ --verbose
```

## Test Coverage

- ✅ IPFS file upload and retrieval
- ✅ IPFS CID storage in blockchain
- ✅ Document version history
- ✅ User registration in blockchain
- ✅ Profile hash storage and retrieval
- ✅ Profile document storage
- ✅ End-to-end data flow verification

## Notes

- Tests use test accounts and data (isolated from production)
- Tests clean up after themselves
- Tests are idempotent (can be run multiple times)
- Tests require IPFS and blockchain to be running
