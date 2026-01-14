# Blockchain Audit System Documentation

This document describes the blockchain audit logging system integrated into the backend API.

## Overview

The blockchain audit system provides immutable logging of profile edits and critical events using Ethereum smart contracts. The system uses a hybrid approach:

- **Off-chain storage with hash verification**: Regular audit logs are stored in MongoDB with their hash stored on the blockchain
- **On-chain storage**: Critical admin approval events are stored fully on the blockchain for maximum visibility

## Architecture

```
Profile Update → MongoDB Update → Create Audit Log → Calculate Hash → Store Hash on Blockchain
                                                                    ↓
                                                              Ganache Transaction
                                                                    ↓
                                                              Smart Contract Event
```

## Setup

### 1. Prerequisites

- Ganache running locally (default: `http://127.0.0.1:7545`)
- Smart contract deployed (see `blockchain/hardhat_smart_contract/README.md`)
- Backend dependencies installed (`npm install`)

### 2. Environment Variables

Add these to your backend `.env` file:

```env
# Ganache Configuration
GANACHE_RPC_URL=http://127.0.0.1:7545

# Deployer Account Private Key (from Ganache Account 0)
DEPLOYER_PRIVATE_KEY=0x...

# Contract Address (from contract deployment)
AUDIT_CONTRACT_ADDRESS=0x...
```

### 3. Initialize Blockchain Service

The blockchain service initializes automatically when the backend server starts. Check the console for:

```
✅ Blockchain service initialized
   Network: ganache (Chain ID: 1337)
   Contract: 0x...
   Account: 0x...
   Balance: 100.0 ETH
```

If you see warnings instead, check your environment variables.

## How It Works

### Profile Updates

When a user updates their profile:

1. **Update MongoDB**: Profile data is updated in the database
2. **Create Audit Log**: An `AuditLog` document is created with:
   - User ID
   - Event type (`profile_update`, `name_update`, `contact_update`)
   - Field changed
   - Old and new values
   - Role
   - Metadata (IP, user agent, etc.)
3. **Calculate Hash**: SHA256 hash is calculated from the audit log data
4. **Store Hash on Blockchain**: Hash is logged to the smart contract (non-blocking)
5. **Update Audit Log**: Transaction hash and block number are saved to MongoDB

### Admin Approvals

When an admin approval is processed:

1. **Create Approval Request**: Admin creates an approval request
2. **Collect Approvals**: Two admins must approve/reject
3. **Store on Blockchain**: Full approval details are stored on-chain (visible in Ganache)
4. **Update Status**: Approval status is updated in MongoDB

## API Endpoints

### Audit Logging (Automatic)

Audit logs are created automatically when:
- Profile is updated (`PATCH /api/auth/profile`)
- Business profile is updated (`POST /api/business/profile`)
- Admin approvals are processed (`POST /api/admin/approvals/:approvalId/approve`)

### Verification Endpoints

You can add these endpoints to verify audit logs:

```javascript
// GET /api/audit/history/:userId - Get audit history for a user
// GET /api/audit/verify/:auditLogId - Verify a specific audit log
// GET /api/audit/stats - Get verification statistics
```

## Data Models

### AuditLog (MongoDB)

```javascript
{
  userId: ObjectId,
  eventType: String, // 'profile_update', 'email_change', etc.
  fieldChanged: String, // 'email', 'firstName', etc.
  oldValue: String,
  newValue: String,
  hash: String, // SHA256 hash (unique, indexed)
  txHash: String, // Blockchain transaction hash
  blockNumber: Number,
  role: String,
  metadata: Object,
  verified: Boolean,
  verifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### AdminApproval (MongoDB)

```javascript
{
  approvalId: String, // Unique ID
  requestType: String,
  userId: ObjectId,
  requestedBy: ObjectId,
  requestDetails: Object,
  approvals: [{
    adminId: ObjectId,
    approved: Boolean,
    comment: String,
    timestamp: Date
  }],
  status: String, // 'pending', 'approved', 'rejected'
  requiredApprovals: Number, // Default: 2
  txHash: String,
  blockNumber: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Verification

### Verify a Single Audit Log

```javascript
const auditVerifier = require('./lib/auditVerifier');

const result = await auditVerifier.verifyAuditLog(auditLogId);
// Returns: { verified: boolean, matches: boolean, details: {...} }
```

### Get User Audit History

```javascript
const result = await auditVerifier.getAuditHistory(userId, {
  limit: 50,
  skip: 0,
  eventType: 'profile_update'
});
```

### Verify Chain Integrity

```javascript
const result = await auditVerifier.verifyChainIntegrity([auditLogId1, auditLogId2, ...]);
// Returns: { verified: number, failed: number, results: [...] }
```

## Viewing in Ganache

1. **Open Ganache UI**
2. **Go to Transactions tab** - See all blockchain transactions
3. **Click a transaction** to see:
   - Transaction hash
   - Block number
   - Gas used
   - Event logs (emitted events)

### Event Types in Ganache

- **AuditHashLogged**: Regular audit logs (hash stored)
- **CriticalEventLogged**: Critical events (full data stored)
- **AdminApprovalLogged**: Admin approvals (full data stored)

## Error Handling

The system is designed to be non-blocking:

- **Profile updates succeed** even if blockchain logging fails
- Errors are logged to console but don't break the API
- Failed blockchain logs can be retried later

### Common Issues

1. **Blockchain service not initialized**
   - Check environment variables
   - Verify Ganache is running
   - Check contract address is correct

2. **Transaction failures**
   - Check account has enough ETH
   - Verify contract address
   - Check network connectivity

3. **Hash verification fails**
   - Data may have been tampered with
   - Check MongoDB record integrity
   - Verify blockchain connection

## Security Considerations

1. **Private Key Security**
   - Never commit private keys to version control
   - Use environment variables
   - Rotate keys regularly in production

2. **Hash Verification**
   - Always verify hashes before trusting data
   - Use the verification utilities provided
   - Monitor for hash mismatches

3. **Admin Approvals**
   - Require 2+ approvals for critical changes
   - Prevent self-approval
   - Log all approval actions

## Production Considerations

For production deployment:

1. **Use a real Ethereum network** (testnet or mainnet)
2. **Secure private key storage** (use a wallet service or hardware wallet)
3. **Monitor gas costs** (on-chain storage costs gas)
4. **Implement retry logic** for failed transactions
5. **Add monitoring** for blockchain connectivity
6. **Consider batching** multiple hashes into single transaction (gas optimization)

## Testing

Test the blockchain integration:

```bash
# Start Ganache
# Deploy contracts
cd blockchain/hardhat_smart_contract
npm run deploy

# Start backend
cd ../../backend
npm run dev

# Make a profile update via API
# Check Ganache for the transaction
```

## Support

For issues or questions:
- Check Ganache logs
- Review backend console output
- Verify environment variables
- Check contract deployment status
