# BizClear Blockchain Cost Analysis

**Prepared for:** Capstone Project — BizClear Business Permit System  
**Date:** March 2026  
**Gas Price Assumption:** 20 gwei  
**Measurement Method:** Estimated from Solidity storage cost model; run `node blockchain/scripts/measure-gas-costs.js` against Ganache for actual values

---

## 1. Executive Summary

BizClear uses four Solidity smart contracts on a local Ganache blockchain to provide tamper-proof audit logging, user registration, document storage, and access control. While gas is free on Ganache, understanding the cost structure is critical for any future migration to a public network (Polygon, Arbitrum, or Ethereum mainnet).

**Key findings:**
- The system generates approximately **1,430 blockchain transactions per month** for a city with ~5,000 registered businesses
- At Ethereum mainnet prices ($2,000/ETH, 20 gwei), this would cost **~$5,626/month** ($67,512/year)
- At Polygon prices ($0.50/MATIC, 30 gwei), this drops to **~$2.11/month**
- The most expensive operations are `logAdminApproval` and `logCriticalEvent` due to on-chain string storage
- **Five optimizations** can reduce costs by 68-98% depending on implementation scope

---

## 2. Per-Transaction Gas Breakdown

| # | Contract | Function | Description | Est. Gas | Cost @ $2000/ETH | Cost @ Polygon |
|---|----------|----------|-------------|----------|-------------------|----------------|
| 1 | AuditLog | `logAuditHash` (short event) | Most common — anchors a SHA-256 hash | ~85,000 | $3.40 | $0.00085 |
| 2 | AuditLog | `logAuditHash` (medium event) | Same function, different event type | ~86,000 | $3.44 | $0.00086 |
| 3 | AuditLog | `logAuditHash` (long event) | Longer event type string | ~87,000 | $3.48 | $0.00087 |
| 4 | AuditLog | `logCriticalEvent` (small) | Security alert with short JSON payload | ~120,000 | $4.80 | $0.00120 |
| 5 | AuditLog | `logCriticalEvent` (large) | Security alert with large JSON payload | ~145,000 | $5.80 | $0.00145 |
| 6 | AuditLog | `logAdminApproval` (approve) | Permit approval with metadata | ~160,000 | $6.40 | $0.00160 |
| 7 | AuditLog | `logAdminApproval` (reject) | Rejection with detailed reason | ~175,000 | $7.00 | $0.00175 |
| 8 | UserRegistry | `registerUser` (new) | First-time user registration | ~110,000 | $4.40 | $0.00110 |
| 9 | UserRegistry | `registerUser` (update) | Re-registration with new hash | ~65,000 | $2.60 | $0.00065 |
| 10 | UserRegistry | `updateProfileHash` | Profile hash update only | ~50,000 | $2.00 | $0.00050 |
| 11 | DocumentStorage | `storeDocument` (CIDv0) | IPFS CID ~46 chars | ~95,000 | $3.80 | $0.00095 |
| 12 | DocumentStorage | `storeDocument` (CIDv1) | IPFS CID ~59 chars | ~100,000 | $4.00 | $0.00100 |
| 13 | AccessControl | `grantRole` | One-time role setup | ~55,000 | $2.20 | $0.00055 |
| 14 | AccessControl | `revokeRole` | Role revocation | ~35,000 | $1.40 | $0.00035 |

> **Note:** These are estimates based on Solidity storage cost models. Run the measurement script for actual values.

---

## 3. Monthly Volume Projections

Based on Alaminos City (~5,000 registered businesses, ~50 new registrations/month):

| Operation | Trigger | Monthly Volume | Gas/Tx | Monthly Gas |
|-----------|---------|---------------|--------|-------------|
| `logAuditHash` (applications) | Per application submitted | ~200 | ~85,000 | 17,000,000 |
| `logAuditHash` (profile updates) | Per profile change | ~100 | ~85,000 | 8,500,000 |
| `logAuditHash` (inspections) | Per inspection completed | ~300 | ~85,000 | 25,500,000 |
| `logAuditHash` (violations) | Per violation issued | ~50 | ~85,000 | 4,250,000 |
| `logCriticalEvent` | Per security alert | ~30 | ~130,000 | 3,900,000 |
| `logAdminApproval` | Per approval/rejection | ~200 | ~165,000 | 33,000,000 |
| `registerUser` | Per new user | ~50 | ~110,000 | 5,500,000 |
| `updateProfileHash` | Per profile update | ~100 | ~50,000 | 5,000,000 |
| `storeDocument` | Per document upload | ~400 | ~95,000 | 38,000,000 |
| **Total** | | **~1,430** | | **~140,650,000** |

---

## 4. Monthly Cost Projections by Network

| Network | Gas Price | ETH/Token Price | Monthly Cost | Annual Cost |
|---------|-----------|-----------------|-------------|-------------|
| **Ethereum Mainnet** | 20 gwei | $2,000/ETH | **$5,626** | **$67,512** |
| **Polygon PoS** | 30 gwei | $0.50/MATIC | **$2.11** | **$25.32** |
| **Arbitrum One** | ~0.1 gwei | $2,000/ETH | **$0.28** | **$3.36** |
| **Optimism** | ~0.001 gwei | $2,000/ETH | **$0.003** | **$0.04** |
| **Ganache (current)** | N/A | N/A | **$0** | **$0** |

---

## 5. Cost Driver Analysis

### Why Are Some Operations So Expensive?

Ethereum storage cost reference:
- `SSTORE` (new slot): **20,000 gas** — writing 32 bytes to a new storage slot
- `SSTORE` (update): **5,000 gas** — updating an existing slot
- Calldata (per byte): **16 gas** (non-zero), **4 gas** (zero)
- Event log (per topic): **375 gas**
- Event log (per byte): **8 gas**

### Top 3 Most Expensive Operations

#### 1. `logAdminApproval` (~160,000-175,000 gas)

**Why:** Stores a struct with **4 strings + 1 bool** on-chain:
- `approvalId` (string): 1+ storage slots (~20,000 gas)
- `eventType` (string): 1+ storage slots (~20,000 gas)
- `userId` (string): 1+ storage slots (~20,000 gas)
- `approverId` (string): 1+ storage slots (~20,000 gas)
- `details` (string, JSON): 2-4 storage slots (~40,000-80,000 gas)
- Array push overhead: ~20,000 gas
- Event emission: ~2,000 gas

**The problem:** `userId` and `approverId` are MongoDB ObjectIds (24 hex chars = 12 bytes). They could fit in `bytes12` instead of dynamic strings, saving ~35,000 gas per call.

#### 2. `logCriticalEvent` (~120,000-145,000 gas)

**Why:** Stores **3 strings** on-chain (`eventType`, `userId`, `details`). The `details` field is the biggest driver — a 200-byte JSON blob costs ~60,000 gas for storage alone.

**The problem:** The full JSON payload doesn't need to be on-chain. Only its hash is needed for tamper-proofing.

#### 3. `storeDocument` (~95,000-100,000 gas)

**Why:** Stores `string userId` + `string ipfsCid` + array push. IPFS CIDs are 46-59 characters, consuming 2+ storage slots.

**The problem:** CIDv0 is a base58-encoded multihash that could be stored as `bytes32 + uint8` instead of a variable-length string.

---

## 6. Optimization Recommendations

### Optimization 1: Replace Strings with Fixed-Size Types

**Effort:** Medium | **Gas Reduction:** 30-50%

**Current:**
```solidity
struct CriticalEventEntry {
    string eventType;    // "security_alert" — variable length
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
    bytes24 userId;         // MongoDB ObjectId fits in 12 bytes
    bytes32 detailsHash;    // keccak256(JSON) — hash only, JSON stays in MongoDB
    uint256 timestamp;
    address loggedBy;
}
```

**Impact:** `logCriticalEvent` drops from ~130,000 gas to ~65,000 gas.

---

### Optimization 2: Event-Only Logging for Non-Critical Operations

**Effort:** Low | **Gas Reduction:** 65%

Remove the `auditHashEntries[]` array storage in `logAuditHash`. The `hashExists[hash]` mapping already provides on-chain verification. Historical entries can be reconstructed from event logs.

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

**Impact:** ~85,000 gas → ~30,000 gas per call.

---

### Optimization 3: Batch Operations

**Effort:** Low | **Gas Reduction:** 40-63%

Batch multiple hashes into a single transaction to amortize the 21,000 gas base transaction cost:

```solidity
function logAuditHashBatch(
    bytes32[] calldata hashes,
    bytes32[] calldata eventTypeHashes
) external onlyAuditor {
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

**Impact:** Batch of 10 hashes: ~111,000 gas total vs ~300,000 gas individually (**63% savings**).

**Backend change:** Modify `blockchainQueue.js` to flush every N items or every M seconds.

---

### Optimization 4: Merkle Tree Anchoring

**Effort:** High | **Gas Reduction:** 95-98%

Accumulate audit hashes off-chain in a Merkle tree and anchor only the root on-chain periodically:

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
           │ Merkle Root │  ──→  anchorMerkleRoot(root, count)
           └─────────────┘
```

**Impact:** 1,430 monthly transactions → ~30 transactions. Gas cost drops from ~140M to ~3M gas/month.

**Trade-off:** Verification requires Merkle proofs (off-chain computation + on-chain root check).

---

### Optimization 5: Compact Document Storage

**Effort:** Medium | **Gas Reduction:** 53%

Replace string storage with fixed-size hashes:

```solidity
function storeDocumentV2(
    bytes24 userId,
    uint8 docType,
    bytes32 cidHash
) external onlyDocumentManager {
    documents[userId][docType].push(DocumentEntry(cidHash, block.timestamp, msg.sender));
    emit DocumentStored(userId, docType, cidHash, block.timestamp);
}
```

**Impact:** ~95,000 gas → ~45,000 gas per document.

---

## 7. Combined Optimization Impact

### Applying Optimizations 1 + 2 + 3 (Low-Medium Effort)

| Metric | Current | After | Savings |
|--------|---------|-------|---------|
| Monthly gas (1,430 tx) | ~140,650,000 | ~45,000,000 | **68%** |
| Monthly cost @ Ethereum | ~$5,626 | ~$1,800 | **$3,826/mo** |
| Monthly cost @ Polygon | ~$2.11 | ~$0.68 | **$1.43/mo** |
| Monthly cost @ Arbitrum | ~$0.28 | ~$0.09 | **$0.19/mo** |

### Applying ALL Optimizations Including Merkle (High Effort)

| Metric | Current | After | Savings |
|--------|---------|-------|---------|
| Monthly on-chain tx | ~1,430 | ~30 | **98%** |
| Monthly gas | ~140,650,000 | ~2,700,000 | **98%** |
| Monthly cost @ Ethereum | ~$5,626 | ~$108 | **$5,518/mo** |
| Monthly cost @ Polygon | ~$2.11 | ~$0.04 | **$2.07/mo** |

---

## 8. Recommendation Priority Matrix

| Priority | Optimization | Gas Reduction | Effort | When to Implement |
|----------|-------------|---------------|--------|-------------------|
| **1** | Event-only logging (Opt 2) | 65% on `logAuditHash` | Low | Before any mainnet deploy |
| **2** | Batch operations (Opt 3) | 40-63% on batched calls | Low | Before any mainnet deploy |
| **3** | Fixed-size types (Opt 1) | 30-50% on all ops | Medium | Contract V2 upgrade |
| **4** | Compact documents (Opt 5) | 53% on `storeDocument` | Medium | Contract V2 upgrade |
| **5** | Merkle tree (Opt 4) | 95-98% overall | High | For production at scale |

---

## 9. Network Recommendation

For a Philippine LGU system like BizClear:

| Scenario | Recommended Network | Monthly Cost | Why |
|----------|-------------------|-------------|-----|
| **Development/Testing** | Ganache (current) | $0 | Free, fast, local |
| **Pilot deployment** | Polygon PoS | ~$2/mo | Cheapest real network |
| **Production (basic)** | Arbitrum One | ~$0.28/mo | Lower fees than Polygon at scale |
| **Production (optimized)** | Polygon + Merkle trees | ~$0.04/mo | Negligible cost |
| **Maximum trust** | Ethereum mainnet | ~$5,626/mo | Only if regulatory requirement |

**Recommendation:** Deploy to **Polygon PoS** with Optimizations 1-3 applied. This provides real blockchain security at under $1/month.

---

## Appendix: Running the Measurement Script

```bash
# Ensure Ganache is running and contracts are deployed
cd blockchain
npx truffle migrate --reset
node scripts/measure-gas-costs.js
```

This will generate:
- `blockchain/reports/gas-cost-analysis.json` — raw measurements
- `blockchain/reports/blockchain-cost-analysis.md` — this report (with actual values)
