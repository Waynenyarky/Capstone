# Phase 9: Blockchain Cost Analysis & Optimization

## Overview

Now that all features are finalized and the system is generating real blockchain transactions across all workflows (auditing, approvals, document storage, user registry), this phase performs a comprehensive gas cost analysis of every on-chain transaction type, documents the findings, and proposes concrete optimizations to reduce costs — critical for any future migration from Ganache (free local chain) to a real L1/L2 network.

## Prerequisites

- All prior phases (0–8) must be complete
- All cron jobs, notification triggers, and business workflows must be wired and functional
- The comprehensive seeder (Phase 0B) should have been re-run so the system has 700+ records with blockchain transactions
- Ganache must be running and all contracts deployed

## Why This Matters

Right now BizClear runs on Ganache where gas is free. But:
- If the system ever moves to a testnet or mainnet (even a cheap L2 like Polygon or Arbitrum), **every transaction has a real cost**
- The current design stores **full strings on-chain** (event types, user IDs, JSON details) which is extremely expensive
- Without cost data, we can't make informed decisions about what belongs on-chain vs off-chain
- This analysis is required for the capstone's technical documentation

---

## Part 1: Gas Cost Measurement Script

**File:** `blockchain/scripts/measure-gas-costs.js`

This script calls every state-changing contract function with realistic parameters and records the gas used.

### Transactions to Measure

#### AuditLog Contract

| # | Function | Test Parameters | What It Represents |
|---|----------|----------------|-------------------|
| 1 | `logAuditHash(bytes32, string)` | `(sha256Hash, 'profile_update')` | Most common operation — every audit log entry anchors a hash |
| 2 | `logAuditHash(bytes32, string)` | `(sha256Hash, 'email_change')` | Same function, different event type (measures if string length affects gas) |
| 3 | `logAuditHash(bytes32, string)` | `(sha256Hash, 'business_application_submitted')` | Longer event type string |
| 4 | `logCriticalEvent(string, string, string)` | `('security_alert', '507f1f77bcf86cd799439011', '{"action":"failed_login","ip":"192.168.1.1","attempts":5}')` | Critical event with typical JSON payload |
| 5 | `logCriticalEvent(string, string, string)` | `('restricted_field_attempt', '507f1f77bcf86cd799439011', '{"field":"role","from":"business_owner","to":"admin","ip":"10.0.0.1","blocked":true}')` | Critical event with larger JSON payload |
| 6 | `logAdminApproval(string, string, string, string, bool, string)` | `('APR-2025-0001', 'permit_approval', 'userId123', 'officerId456', true, '{"businessName":"Santos Sari-Sari Store","reason":"All documents verified"}')` | Admin approval with typical payload |
| 7 | `logAdminApproval(...)` | Same but with `approved: false` and longer rejection reason | Rejection with detailed reason |

#### UserRegistry Contract

| # | Function | Test Parameters | What It Represents |
|---|----------|----------------|-------------------|
| 8 | `registerUser(string, address, bytes32)` | `('507f1f77bcf86cd799439011', accountAddress, profileHash)` | New user registration (first-time) |
| 9 | `registerUser(string, address, bytes32)` | Same userId, new profileHash | User profile update (re-registration) |
| 10 | `updateProfileHash(string, bytes32)` | `('507f1f77bcf86cd799439011', newHash)` | Profile hash update only |

#### DocumentStorage Contract

| # | Function | Test Parameters | What It Represents |
|---|----------|----------------|-------------------|
| 11 | `storeDocument(string, uint8, string)` | `('userId', 0, 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')` | Avatar document (IPFS CID ~46 chars) |
| 12 | `storeDocument(string, uint8, string)` | `('userId', 3, 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')` | Business registration doc (CIDv1 ~59 chars) |

#### AccessControl Contract

| # | Function | Test Parameters | What It Represents |
|---|----------|----------------|-------------------|
| 13 | `grantRole(address, bytes32)` | `(newAddress, AUDITOR_ROLE)` | Grant a role (one-time setup cost) |
| 14 | `revokeRole(address, bytes32)` | `(address, AUDITOR_ROLE)` | Revoke a role |

### Script Structure

```javascript
#!/usr/bin/env node
const { Web3 } = require('web3')
const path = require('path')

const GANACHE_URL = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545'
const GAS_PRICE_GWEI = 20 // matches truffle-config.js

const results = []

async function measureGas(label, txPromise) {
  const gasEstimate = await txPromise.estimateGas({ from: account })
  const receipt = await txPromise.send({ from: account, gas: Math.floor(gasEstimate * 1.2) })
  const gasUsed = Number(receipt.gasUsed)
  const costWei = gasUsed * GAS_PRICE_GWEI * 1e9
  const costEth = costWei / 1e18

  results.push({
    label,
    gasEstimate: Number(gasEstimate),
    gasUsed,
    costEth,
    costUSD_ETH_2000: costEth * 2000,   // at $2000/ETH (mainnet reference)
    costUSD_ETH_0_50: costEth * 0.50,   // at $0.50/MATIC (Polygon reference)
    costUSD_L2: costEth * 0.001,         // L2 (Arbitrum/Optimism with ~1000x cheaper gas)
    txHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
  })

  return receipt
}

async function main() {
  // ... connect, load contracts, run all 14 measurements ...

  // Output results as table
  console.table(results.map(r => ({
    'Transaction': r.label,
    'Gas Used': r.gasUsed.toLocaleString(),
    'Cost (ETH)': r.costEth.toFixed(6),
    'Cost @ $2000/ETH': `$${r.costUSD_ETH_2000.toFixed(4)}`,
    'Cost @ Polygon': `$${r.costUSD_ETH_0_50.toFixed(6)}`,
    'Cost @ L2': `$${r.costUSD_L2.toFixed(8)}`,
  })))

  // Also write to JSON for the report
  const fs = require('fs')
  fs.writeFileSync(
    path.join(__dirname, '..', 'reports', 'gas-cost-analysis.json'),
    JSON.stringify({ measuredAt: new Date().toISOString(), gasPrice: `${GAS_PRICE_GWEI} gwei`, results }, null, 2)
  )

  // Write markdown report
  generateMarkdownReport(results)
}
```

### Expected Output Format

```
┌──────────────────────────────────────┬──────────┬────────────┬─────────────────┬────────────────┐
│ Transaction                          │ Gas Used │ Cost (ETH) │ Cost @ $2000/ETH│ Cost @ Polygon │
├──────────────────────────────────────┼──────────┼────────────┼─────────────────┼────────────────┤
│ logAuditHash (profile_update)        │   ~85000 │ 0.001700   │ $3.4000         │ $0.000850      │
│ logAuditHash (long event type)       │   ~87000 │ 0.001740   │ $3.4800         │ $0.000870      │
│ logCriticalEvent (small payload)     │  ~120000 │ 0.002400   │ $4.8000         │ $0.001200      │
│ logCriticalEvent (large payload)     │  ~145000 │ 0.002900   │ $5.8000         │ $0.001450      │
│ logAdminApproval (approval)          │  ~160000 │ 0.003200   │ $6.4000         │ $0.001600      │
│ logAdminApproval (rejection)         │  ~175000 │ 0.003500   │ $7.0000         │ $0.001750      │
│ registerUser (new)                   │  ~110000 │ 0.002200   │ $4.4000         │ $0.001100      │
│ registerUser (update)                │   ~65000 │ 0.001300   │ $2.6000         │ $0.000650      │
│ updateProfileHash                    │   ~50000 │ 0.001000   │ $2.0000         │ $0.000500      │
│ storeDocument (short CID)            │   ~95000 │ 0.001900   │ $3.8000         │ $0.000950      │
│ storeDocument (long CID)             │  ~100000 │ 0.002000   │ $4.0000         │ $0.001000      │
│ grantRole                            │   ~55000 │ 0.001100   │ $2.2000         │ $0.000550      │
│ revokeRole                           │   ~35000 │ 0.000700   │ $1.4000         │ $0.000350      │
└──────────────────────────────────────┴──────────┴────────────┴─────────────────┴────────────────┘
```

(Exact values will be measured — the above are estimates based on typical Solidity storage costs.)

---

## Part 2: Volume Analysis

Using the seeded data and real system activity, calculate the **monthly transaction volume** and **monthly cost** for a realistic deployment.

### Transaction Volume Estimates

Based on a city with ~5,000 registered businesses:

| Operation | Frequency | Monthly Volume | Gas/Tx | Monthly Gas |
|-----------|-----------|---------------|--------|-------------|
| `logAuditHash` (application submissions) | Per application | ~200 | ~85,000 | 17,000,000 |
| `logAuditHash` (profile updates) | Per profile change | ~100 | ~85,000 | 8,500,000 |
| `logAuditHash` (inspections) | Per inspection | ~300 | ~85,000 | 25,500,000 |
| `logAuditHash` (violations) | Per violation | ~50 | ~85,000 | 4,250,000 |
| `logCriticalEvent` (security alerts) | Per alert | ~30 | ~130,000 | 3,900,000 |
| `logAdminApproval` | Per approval/rejection | ~200 | ~165,000 | 33,000,000 |
| `registerUser` | Per new user | ~50 | ~110,000 | 5,500,000 |
| `updateProfileHash` | Per profile update | ~100 | ~50,000 | 5,000,000 |
| `storeDocument` | Per document upload | ~400 | ~95,000 | 38,000,000 |
| **Total** | | **~1,430/month** | | **~140,650,000** |

### Monthly Cost Projections

| Network | Gas Price | Monthly Cost | Annual Cost |
|---------|-----------|-------------|-------------|
| Ethereum Mainnet | 20 gwei @ $2000/ETH | **~$5,626** | **~$67,512** |
| Polygon PoS | 30 gwei @ $0.50/MATIC | **~$2.11** | **~$25.32** |
| Arbitrum One | ~0.1 gwei @ $2000/ETH | **~$0.28** | **~$3.36** |
| Optimism | ~0.001 gwei @ $2000/ETH | **~$0.003** | **~$0.04** |
| Ganache (current) | N/A | **$0** | **$0** |

---

## Part 3: Cost Analysis by Data Pattern

Analyze **why** each transaction costs what it does:

### Storage Cost Breakdown

```
Ethereum storage cost reference:
- SSTORE (new slot):    20,000 gas
- SSTORE (update):       5,000 gas
- Calldata (per byte):      16 gas (non-zero), 4 gas (zero)
- Memory (per word):         3 gas
- Log/Event (per topic):   375 gas
- Log/Event (per byte):      8 gas
```

### Per-Contract Analysis

**AuditLog — `logAuditHash`:**
- Stores: 1 new mapping entry (`hashExists[hash] = true`) → 20,000 gas
- Stores: 1 new struct in dynamic array (`auditHashEntries.push(...)`) → ~40,000 gas
  - bytes32 hash: 1 slot (20,000 gas first write)
  - string eventType: 1+ slots depending on length
  - uint256 timestamp: 1 slot
  - address loggedBy: 1 slot
- Emits: `AuditHashLogged` event → ~1,000 gas
- **Problem:** The `eventType` string is stored on-chain. A 30-char string costs ~20,000 gas for storage. This is pure waste — it could be an enum (uint8) for ~200 gas.

**AuditLog — `logCriticalEvent`:**
- Stores: 1 struct with 3 strings (`eventType`, `userId`, `details`) → **very expensive**
- A 200-byte JSON `details` string costs ~60,000 gas for storage alone
- **Problem:** Full JSON payloads stored on-chain. The `details` field is the biggest cost driver.

**AuditLog — `logAdminApproval`:**
- Stores: 1 struct with 4 strings + 1 bool → **most expensive operation**
- `approvalId`, `eventType`, `userId`, `approverId`, `details` all stored as strings
- **Problem:** `userId` and `approverId` could be bytes32 (MongoDB ObjectId → hex). `approvalId` could be bytes32. This would cut ~40,000 gas per call.

**UserRegistry — `registerUser`:**
- Stores: new mapping entry + struct + array push → ~80,000 gas
- String `userId` stored on-chain → unnecessary, could be bytes32

**DocumentStorage — `storeDocument`:**
- Stores: struct with string userId + string ipfsCid → ~60,000 gas
- Array push for versioning → ~20,000 gas
- **Problem:** IPFS CID stored as string (~46-59 chars). CIDv0 is already a base58-encoded multihash that could be stored as bytes32 + uint8 (codec).

---

## Part 4: Optimization Recommendations

### Optimization 1: Replace Strings with Fixed-Size Types (Save ~30-50% gas)

**Current:**
```solidity
struct CriticalEventEntry {
    string eventType;    // "security_alert" — variable length, expensive
    string userId;       // "507f1f77bcf86cd799439011" — 24 hex chars
    string details;      // JSON blob — extremely expensive
    uint256 timestamp;
    address loggedBy;
}
```

**Proposed:**
```solidity
struct CriticalEventEntry {
    bytes32 eventTypeHash;  // keccak256("security_alert") — fixed 32 bytes
    bytes24 userId;         // MongoDB ObjectId fits in 24 bytes (12 bytes hex)
    bytes32 detailsHash;    // keccak256(JSON) — store hash, keep JSON off-chain
    uint256 timestamp;
    address loggedBy;
}
```

**Impact:** `logCriticalEvent` drops from ~130,000 gas to ~65,000 gas (~50% reduction). The full `details` JSON is kept in MongoDB (already there) and only the hash goes on-chain for tamper-proofing.

### Optimization 2: Event-Only Logging for Non-Critical Operations (Save ~70% gas)

For `logAuditHash`, the data is already stored in `hashExists[hash]` for verification. The full struct in `auditHashEntries[]` is redundant — it can be replaced with an event (which costs ~8 gas/byte vs ~20,000 gas/slot for storage).

**Current:**
```solidity
function logAuditHash(bytes32 hash, string memory eventType) external onlyAuditor {
    require(!hashExists[hash], "Hash already logged");
    hashExists[hash] = true;
    auditHashEntries.push(AuditHashEntry(hash, eventType, block.timestamp, msg.sender));
    emit AuditHashLogged(hash, eventType, block.timestamp, msg.sender);
}
```

**Proposed:**
```solidity
function logAuditHash(bytes32 hash, bytes32 eventTypeHash) external onlyAuditor {
    require(!hashExists[hash], "Hash already logged");
    hashExists[hash] = true;
    totalHashes++;
    emit AuditHashLogged(hash, eventTypeHash, block.timestamp, msg.sender);
}
```

**Impact:** `logAuditHash` drops from ~85,000 gas to ~30,000 gas (~65% reduction). The `auditHashEntries` array push is eliminated. Historical data is still available via event logs (indexable, queryable, but not from other contracts). The `hashExists` mapping remains for on-chain verification.

### Optimization 3: Batch Operations (Save ~40% on high-volume periods)

Instead of 1 transaction per audit log, batch multiple hashes into a single transaction:

```solidity
function logAuditHashBatch(bytes32[] calldata hashes, bytes32[] calldata eventTypeHashes) external onlyAuditor {
    require(hashes.length == eventTypeHashes.length, "Length mismatch");
    require(hashes.length <= 50, "Batch too large");
    for (uint i = 0; i < hashes.length; i++) {
        if (!hashExists[hashes[i]]) {
            hashExists[hashes[i]] = true;
            totalHashes++;
            emit AuditHashLogged(hashes[i], eventTypeHashes[i], block.timestamp, msg.sender);
        }
    }
}
```

**Impact:** The per-tx overhead (21,000 gas base) is amortized across N hashes. For a batch of 10: base cost is 21,000 + 10 * ~9,000 = ~111,000 gas total vs 10 * ~30,000 = ~300,000 gas individually (**63% savings**).

**Backend change:** `blockchainQueue.js` already uses an in-memory queue. Modify it to flush every N items or every M seconds instead of processing one-by-one.

### Optimization 4: Merkle Tree Anchoring (Save ~95% gas for high-volume scenarios)

Instead of writing every audit hash on-chain, accumulate hashes in a Merkle tree off-chain and periodically anchor just the root:

```
Off-chain (MongoDB):                  On-chain:
┌─────────┐ ┌─────────┐
│ Hash A  │ │ Hash B  │              Only the Merkle root
└────┬────┘ └────┬────┘              gets written on-chain
     └─────┬─────┘                   once per hour/day
       ┌───┴───┐
       │ AB    │ ┌─────────┐
       └───┬───┘ │ Hash C  │
           └──┬──┴────┬────┘
           ┌──┴───────┴──┐
           │ Merkle Root │  ──────→  anchorMerkleRoot(bytes32 root, uint256 count)
           └─────────────┘
```

```solidity
function anchorMerkleRoot(bytes32 root, uint256 leafCount, uint256 periodStart, uint256 periodEnd) external onlyAuditor {
    merkleRoots.push(MerkleAnchor(root, leafCount, periodStart, periodEnd, block.timestamp));
    emit MerkleRootAnchored(root, leafCount, periodStart, periodEnd);
}
```

**Impact:** 1,430 monthly transactions → ~30 transactions (one anchor per day) or ~1 per hour. Gas cost drops from ~140M gas/month to ~3M gas/month (**~98% reduction**).

**Trade-off:** Verification requires a Merkle proof (off-chain computation + on-chain root check). More complex but standard practice for audit systems.

### Optimization 5: Remove On-Chain String Storage in DocumentStorage

**Current:** Stores `string userId` and `string ipfsCid` — expensive string storage.

**Proposed:**
```solidity
function storeDocumentV2(bytes24 userId, uint8 docType, bytes32 cidHash) external onlyDocumentManager {
    documents[userId][docType].push(DocumentEntry(cidHash, block.timestamp, msg.sender));
    emit DocumentStored(userId, docType, cidHash, block.timestamp);
}
```

The full IPFS CID remains in MongoDB/IPFS. The on-chain record only stores the hash for verification.

**Impact:** ~95,000 gas → ~45,000 gas per document (~53% reduction).

---

## Part 5: Optimization Impact Summary

| Optimization | Affected Ops | Gas Reduction | Implementation Effort |
|---|---|---|---|
| 1. Fixed-size types | All | 30-50% | Medium (contract + backend changes) |
| 2. Event-only logging | `logAuditHash` | 65% | Low (contract change, backend unchanged) |
| 3. Batch operations | `logAuditHash` | 40-63% | Low (backend queue change) |
| 4. Merkle tree anchoring | All audit hashes | 95-98% | High (new off-chain logic, proof system) |
| 5. Compact document storage | `storeDocument` | 53% | Medium (contract + backend) |

### Combined Impact (applying Optimizations 1 + 2 + 3):

| Metric | Current | After Opt 1+2+3 | Savings |
|---|---|---|---|
| Monthly gas (1,430 tx) | ~140,650,000 | ~45,000,000 | **68%** |
| Monthly cost @ Ethereum | ~$5,626 | ~$1,800 | **$3,826/mo** |
| Monthly cost @ Polygon | ~$2.11 | ~$0.68 | **$1.43/mo** |
| Monthly cost @ Arbitrum | ~$0.28 | ~$0.09 | **$0.19/mo** |

### Combined Impact (applying ALL optimizations including Merkle):

| Metric | Current | After All | Savings |
|---|---|---|---|
| Monthly on-chain tx | ~1,430 | ~30 | **98%** |
| Monthly gas | ~140,650,000 | ~2,700,000 | **98%** |
| Monthly cost @ Ethereum | ~$5,626 | ~$108 | **$5,518/mo** |

---

## Part 6: Generated Report Document

**File:** `blockchain/reports/blockchain-cost-analysis.md`

The script generates a comprehensive markdown report containing:

1. **Executive Summary** — total gas used, cost projections per network
2. **Per-Transaction Breakdown Table** — measured gas, cost at various price points
3. **Monthly Volume Projections** — based on realistic Alaminos City usage
4. **Cost Driver Analysis** — which operations cost the most and why
5. **Storage Pattern Analysis** — bytes stored on-chain per operation
6. **Optimization Recommendations** — ranked by impact/effort ratio
7. **Before/After Comparison** — projected savings per optimization
8. **Network Comparison** — Ganache vs Polygon vs Arbitrum vs Mainnet
9. **Appendix: Raw Measurements** — JSON data from the measurement script

---

## Script Outputs

Running the phase produces:

| Output | Path | Description |
|---|---|---|
| Gas measurements (JSON) | `blockchain/reports/gas-cost-analysis.json` | Raw data from all 14 measurements |
| Full report (Markdown) | `blockchain/reports/blockchain-cost-analysis.md` | The comprehensive analysis document |
| Console table | stdout | Quick summary during script execution |

---

## Acceptance Criteria

1. `node blockchain/scripts/measure-gas-costs.js` runs successfully against a fresh Ganache deployment with all contracts
2. All 14 transaction types are measured and recorded
3. `blockchain/reports/gas-cost-analysis.json` contains measured `gasUsed` for every transaction type
4. `blockchain/reports/blockchain-cost-analysis.md` contains:
   - Per-transaction gas table with real measured values
   - Monthly volume projections for a ~5,000 business city
   - Cost projections for Ethereum, Polygon, Arbitrum
   - At least 4 concrete optimization recommendations with estimated savings
   - Before/after cost comparison table
5. The report identifies the top 3 most expensive operations and explains WHY they're expensive (storage patterns)
6. All cost projections use the actual measured gas values (not estimates)

## Rollback Plan

This phase is purely analytical — it creates new files only (`blockchain/scripts/`, `blockchain/reports/`). No existing code is modified. Rollback = delete those files.
