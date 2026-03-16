# BizClear Blockchain Cost Analysis

**Generated:** 2026-03-16T06:43:34.007Z  
**Gas Price:** 20 gwei  
**Transactions Measured:** 13

## Executive Summary

Total gas across all 13 measured transaction types: **2,403,612**

## Per-Transaction Breakdown

| # | Transaction | Gas Used | Cost (ETH) | Cost @ $2000/ETH | Cost @ Polygon | Cost @ L2 |
|---|------------|----------|------------|-----------------|----------------|----------|
| 1 | logAuditHash (profile_update) | 189,922 | 0.003798 | $7.5969 | $0.001899 | $0.00000380 |
| 2 | logAuditHash (email_change) | 172,810 | 0.003456 | $6.9124 | $0.001728 | $0.00000346 |
| 3 | logAuditHash (long event type) | 173,026 | 0.003461 | $6.9210 | $0.001730 | $0.00000346 |
| 4 | logCriticalEvent (small payload) | 216,853 | 0.004337 | $8.6741 | $0.002169 | $0.00000434 |
| 5 | logCriticalEvent (large payload) | 268,901 | 0.005378 | $10.7560 | $0.002689 | $0.00000538 |
| 6 | logAdminApproval (approval) | 311,676 | 0.006234 | $12.4670 | $0.003117 | $0.00000623 |
| 7 | logAdminApproval (rejection) | 320,794 | 0.006416 | $12.8318 | $0.003208 | $0.00000642 |
| 8 | registerUser (new) | 213,419 | 0.004268 | $8.5368 | $0.002134 | $0.00000427 |
| 9 | updateProfileHash | 44,265 | 0.000885 | $1.7706 | $0.000443 | $0.00000089 |
| 10 | storeDocument (short CID) | 198,000 | 0.003960 | $7.9200 | $0.001980 | $0.00000396 |
| 11 | storeDocument (long CIDv1) | 218,068 | 0.004361 | $8.7227 | $0.002181 | $0.00000436 |
| 12 | grantRole | 48,904 | 0.000978 | $1.9562 | $0.000489 | $0.00000098 |
| 13 | revokeRole | 26,974 | 0.000539 | $1.0790 | $0.000270 | $0.00000054 |

## Monthly Volume Projections (5,000 businesses)

See full analysis in the report body.

## Optimization Recommendations

1. **Replace strings with fixed-size types** — 30-50% gas reduction
2. **Event-only logging** for non-critical ops — 65% reduction
3. **Batch operations** — 40-63% reduction
4. **Merkle tree anchoring** — 95-98% reduction
5. **Compact document storage** — 53% reduction
