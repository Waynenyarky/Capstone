# Session 1: Prototype Monitoring Results

**Project**: BizClear Capstone (Business Permit System)  
**Date**: March 11, 2026  
**Environment**: Docker containers (real service measurements)

---

## Sample Performance Table

### AI Track Results (LOB Model Service - Docker)

| Test Case | Result | Identified Bottleneck |
|-----------|--------|----------------------|
| LOB Prediction (cold start) | **1246 ms** | Model loading / first request overhead |
| LOB Prediction (warm, run 1) | 33 ms | Normal inference time |
| LOB Prediction (warm, run 2) | 4.8 ms | Cached/optimized path |
| LOB Prediction (warm, run 3) | 6.4 ms | Consistent warm performance |
| IPFS Node Query | 27 ms | Fast, no bottleneck |

### Blockchain Track Results (Gas Cost Estimates)

| Contract Function | Gas Cost | Identified Bottleneck |
|-------------------|----------|----------------------|
| logAuditHash | 65,856 gas | Expensive storage operations (SSTORE) |
| logCriticalEvent (large data) | 52,425 gas | String storage increases cost |
| logAdminApproval | 48,606 gas | Multiple string validations + storage |
| verifyHash (read-only) | 8,800 gas | Minimal cost - view function |

---

## Analysis Summary

### AI Track Analysis
- **Critical Bottleneck**: Cold start takes **1246ms** (~1.2 seconds) - unacceptable for user experience
- **Warm Performance**: After first request, predictions take only **5-33ms** - acceptable
- **Root Cause**: Model loading happens on first request, not at container startup
- **Impact**: First user of the day experiences slow response

### Blockchain Track Analysis
- **Most Expensive**: `logAuditHash` at 65,856 gas due to storage writes
- **Cheapest**: `verifyHash` at 8,800 gas (read-only, no state changes)
- **Gas Cost Drivers**: 
  - SSTORE operations (writing to blockchain storage)
  - Event emissions with large data payloads
  - String length directly impacts cost

---

## Identified Bottlenecks (Priority Order)

| Priority | Bottleneck | Impact | Severity |
|----------|------------|--------|----------|
| 1 | **AI Model Cold Start** | 1246ms delay on first request | HIGH |
| 2 | logAuditHash gas cost | 65,856 gas per audit entry | MEDIUM |
| 3 | Service connection overhead | ~500ms first connection | LOW |

---

## Next Steps for Session 2: Plan Your Fix

**Recommended Fix Target**: AI Model Cold Start (1246ms → target <100ms)

**Potential Solutions**:
1. **Preload model at container startup** instead of lazy loading
2. **Add health check endpoint** that warms up the model
3. **Implement model caching** to prevent reloading

---

## Commands Used for Testing

```bash
# Test LOB Model prediction
curl -X POST http://localhost:5050/predict \
  -H "Content-Type: application/json" \
  -d '{"businessDescription": "Sari-sari store selling snacks"}'

# Test with timing
curl -s -w "Time: %{time_total}s\n" -X POST http://localhost:5050/predict \
  -H "Content-Type: application/json" \
  -d '{"businessDescription": "Restaurant and catering"}' -o /dev/null
```
