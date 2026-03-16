# BizClear IPFS Usage Cost & Feasibility Report

**Prepared for:** Capstone presentation (Mar 2026)
**Scope:** Current measured IPFS usage in this environment, projected recurring cost, and practical cost-control strategy for LGU-scale rollout

---

## 1) Executive Summary

- **Current system IPFS cost is effectively $0/month in direct provider fees** because runtime is configured to `IPFS_PROVIDER=local` (self-hosted Kubo in Docker), not a paid managed pinning service.
- The active IPFS node currently stores only a very small dataset (about **0.30 MB repo size**, 2 recursive pins), so present storage cost is negligible.
- The real IPFS cost risk is **future storage/bandwidth growth** as documents accumulate, because uploads are pinned and there is no broad retention/lifecycle policy yet.
- If you later switch to Pinata free tier, internal project docs indicate **1 GB storage + 10 GB bandwidth/month**. At moderate LGU document volumes, this can be exceeded quickly.

---

## 2) What was checked

### 2.1 Runtime and provider path

- Runtime environment supports `local | pinata | infura` provider modes in all major backend services:
  - `auth-service`: @backend/services/auth-service/src/lib/ipfsService.js#18-110
  - `business-service`: @backend/services/business-service/src/lib/ipfsService.js#25-85
  - `admin-service`: @backend/services/admin-service/src/lib/ipfsService.js#18-110
- Current project defaults to local IPFS:
  - @.env.example#45-48
  - Docker wiring to Kubo container: @docker-compose.yml#46-56, @docker-compose.yml#152-156, @docker-compose.yml#191-193

### 2.2 Active usage surfaces (where IPFS is used)

1. **Business owner uploads** (registration/renewal/owner ID documents):
   - @backend/services/business-service/src/routes/profile.js#733-830
   - @backend/services/business-service/src/routes/profile.js#1020-1100
   - @backend/services/business-service/src/routes/profile.js#109-161
2. **Auth avatars** (with IPFS-first fallback to local):
   - @backend/services/auth-service/src/routes/profileAvatar.js#44-106
   - @backend/services/auth-service/src/routes/profileAvatar.js#153-207
3. **Admin form template uploads**:
   - @backend/services/admin-service/src/routes/formDefinitions.js#941-992
4. **Cleanup behavior** (unpin during profile deletion path):
   - @backend/services/business-service/src/services/businessProfileService.js#2536-2553

### 2.3 Measured current node footprint (this environment)

Measured via container commands against `capstone-ipfs`:

- `RepoSize`: **310,783 bytes (~0.30 MB)**
- `NumObjects`: **3**
- Recursive pins: **2**
- Largest pinned object observed: **229,855 bytes (~0.22 MB)**

Interpretation: current actual stored content is very small.

---

## 3) Cost model

## 3.1 Current mode: local self-hosted IPFS

### Direct provider fee

- **$0/month** (no Pinata/Infura key configured, local provider path).

### Infrastructure cost

Local mode still has infra cost on your host/cloud VM:

- Storage cost formula: `Stored_GB × $/GB-month`
- Bandwidth cost formula: `Egress_GB × $/GB`

At current 0.30 MB used, cost is near-zero. Even with common cloud storage pricing bands, the storage line item is effectively negligible right now.

### Important practical limit

Internal repo stats show `StorageMax: 10 GB` in this node snapshot. If document growth is unmanaged, that threshold can eventually be reached.

---

## 3.2 Optional managed mode: Pinata (if enabled)

The project setup guide states Pinata free tier as:

- **1 GB storage**
- **10 GB bandwidth/month**

Reference: @temp/docs/PINATA_SETUP.md#7-8, @temp/docs/PINATA_SETUP.md#108-113

So if you migrate from local to Pinata free plan, cost remains $0 only while staying under those limits.

---

## 4) Growth scenarios (LGU operations)

To stay consistent with your blockchain report, we reuse the monthly document-event volume baseline of **400 `storeDocument` operations/month** from:

- @docs/BLOCKCHAIN_GAS_COST_FEASIBILITY_REPORT.md#113-114

> Note: `storeDocument` count is an on-chain anchor proxy, not exact file count, but it is a practical planning baseline.

### 4.1 Storage growth projection

| Avg file size | New storage/month (400 files) | Time to 1 GB | Time to 10 GB |
|---|---:|---:|---:|
| 0.5 MB | 200 MB | ~5.0 months | ~50 months |
| 2.0 MB | 800 MB | ~1.25 months | ~12.5 months |
| 5.0 MB | 2,000 MB (2.0 GB) | ~0.5 months | ~5 months |

### 4.2 What this means financially

- **Local mode:** no direct IPFS subscription, but disk and network consumption rise with usage.
- **Pinata free mode:** likely suitable for demos/pilot, but can be exceeded quickly at medium document sizes.
- **Production LGU scale:** plan for either
  1. paid managed pinning budget, or
  2. self-hosted IPFS + explicit storage/egress budgeting and lifecycle controls.

---

## 5) Cost and capacity risks found

1. **Pinned-growth risk:** uploads are pinned by default in service flows, so storage naturally accumulates.
   - Example pin calls: @backend/services/business-service/src/routes/profile.js#777-780, @backend/services/auth-service/src/routes/profileAvatar.js#53-55
2. **Limited lifecycle cleanup:** unpin is present, but primarily tied to profile deletion flow.
   - @backend/services/business-service/src/services/businessProfileService.js#2536-2553
3. **Fallback split storage:** when IPFS is unavailable, files fall back to local uploads path, creating mixed storage behavior.
   - @backend/services/business-service/src/routes/profile.js#762-767, @backend/services/auth-service/src/routes/profileAvatar.js#89-100
4. **Upload-size governance gap (auth avatar multipart):** no explicit file-size limit in avatar multipart upload route (unlike business/admin routes that set limits), increasing worst-case storage risk.
   - Avatar route: @backend/services/auth-service/src/routes/profileAvatar.js#126-141
   - Business limit (10 MB): @backend/services/business-service/src/routes/profile.js#69-79
   - Admin limit (10 MB): @backend/services/admin-service/src/routes/formDefinitions.js#38-41

---

## 6) Recommended IPFS cost-control plan (same style as gas report)

### Phase 1 — Metering and visibility (immediate)

1. Add a scheduled daily metrics job collecting:
   - repo size, pin count, monthly upload bytes, monthly gateway egress bytes
2. Persist metrics in MongoDB and expose admin dashboard panel.
3. Set warning thresholds at 60/80/90% of chosen storage budget.

**Exit criteria:** daily trend graph and alerting are active.

### Phase 2 — Upload policy controls

1. Add hard per-file size limits consistently across all upload entrypoints.
2. Add file-type allowlist and optional image/PDF compression before pinning.
3. Add duplicate-content check (hash compare) before uploading identical files.

**Exit criteria:** all upload endpoints enforce size/type policy; duplicate upload rate reduced.

### Phase 3 — Lifecycle and retention

1. Define retention policy by document class (legal-critical vs replaceable).
2. Unpin superseded versions after legal retention period.
3. Add periodic orphan CID sweep (DB reference check vs pinned set).

**Exit criteria:** net monthly retained bytes flatten to target envelope.

### Phase 4 — Provider strategy

1. Keep local IPFS for development and internal pilots.
2. For production, choose either:
   - managed pinning with explicit monthly cap, or
   - self-hosted cluster with provisioned storage and observability
3. Document SLA and recovery process for gateway outages.

**Exit criteria:** deployment profile selected with approved monthly budget.

### Phase 5 — Validation (mandatory)

1. Run 30-day pilot with real upload/view traffic.
2. Compare actual usage vs projected model.
3. Confirm storage and bandwidth stay within budget target.

**Acceptance gates:**

- Measured storage growth stays within approved plan.
- No critical document retrieval failures.
- Monthly IPFS spend (or infra-equivalent cost) is predictable and auditable.

---

## 7) Reproducibility checks

```bash
# Running container status
docker ps | grep capstone-ipfs

# Repo size and object count
docker exec capstone-ipfs ipfs repo stat --enc=json

# Recursive pin count
docker exec capstone-ipfs sh -lc "ipfs pin ls --type=recursive -q | wc -l"

# Browse app-linked CIDs from DB
node backend/services/business-service/scripts/browseApplicationIpfs.js
```

Script references:

- App documents browser: @backend/services/business-service/scripts/browseApplicationIpfs.js#1-181
- Auth IPFS browser/stats: @backend/services/auth-service/scripts/browseIpfs.js#82-111

---

## 8) Bottom line for panel Q&A

- **Today:** IPFS direct spend is effectively **$0/month** in your current local setup.
- **Risk:** cost can rise with scale due to cumulative pinned storage and bandwidth, not because of blockchain gas.
- **Defense answer:** BizClear controls blockchain gas via hash-anchoring + batching, and controls IPFS cost via metering, upload limits, retention policy, and provider budgeting.
- **Decision note:** IPFS is financially feasible for LGU deployment, provided lifecycle governance is implemented before large-scale rollout.
