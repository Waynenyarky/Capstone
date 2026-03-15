"""
AI Performance Optimization Test
Measures the impact of caching build_label_to_taxonomy_map()

OPTIMIZATION APPLIED:
- Before: build_label_to_taxonomy_map() rebuilt the entire mapping on every /predict call
- After: Mapping is cached after first call, reused for all subsequent requests
"""

import time
import json
import os

# Simulate the taxonomy structure
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")

# Load taxonomy
with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
    taxonomy = json.load(f)

print("=" * 70)
print("AI PERFORMANCE OPTIMIZATION TEST")
print("build_label_to_taxonomy_map() Caching")
print("=" * 70)

# Count taxonomy entries
total_entries = sum(len(entry.get("detailedLines", [])) for entry in taxonomy)
print(f"\nTaxonomy size: {len(taxonomy)} categories, {total_entries} detailed lines")

# ============================================================
# BEFORE: No caching - rebuild on every call
# ============================================================

def build_label_to_taxonomy_map_OLD():
    """OLD implementation - rebuilds mapping every time."""
    mapping = {}
    for entry in taxonomy:
        tc = entry["taxCode"]
        lob = entry["lineOfBusiness"]
        for i, dl in enumerate(entry["detailedLines"]):
            psic = entry["psicCodes"][i] if i < len(entry["psicCodes"]) else ""
            mapping[f"{tc}|{dl}"] = {
                "taxCode": tc,
                "lineOfBusiness": lob,
                "detailedLine": dl,
                "psicCode": psic,
            }
    return mapping

# ============================================================
# AFTER: With caching - build once, reuse forever
# ============================================================

_label_to_taxonomy_cache = None

def build_label_to_taxonomy_map_NEW():
    """NEW implementation - caches result after first call."""
    global _label_to_taxonomy_cache
    
    if _label_to_taxonomy_cache is not None:
        return _label_to_taxonomy_cache
    
    mapping = {}
    for entry in taxonomy:
        tc = entry["taxCode"]
        lob = entry["lineOfBusiness"]
        for i, dl in enumerate(entry["detailedLines"]):
            psic = entry["psicCodes"][i] if i < len(entry["psicCodes"]) else ""
            mapping[f"{tc}|{dl}"] = {
                "taxCode": tc,
                "lineOfBusiness": lob,
                "detailedLine": dl,
                "psicCode": psic,
            }
    
    _label_to_taxonomy_cache = mapping
    return mapping

# ============================================================
# Performance Test
# ============================================================

NUM_REQUESTS = 1000  # Simulate 1000 prediction requests

print(f"\nSimulating {NUM_REQUESTS} prediction requests...")
print("-" * 70)

# Test OLD implementation
print("\n📊 BEFORE OPTIMIZATION (no caching):")
old_times = []
for i in range(NUM_REQUESTS):
    start = time.perf_counter()
    _ = build_label_to_taxonomy_map_OLD()
    end = time.perf_counter()
    old_times.append((end - start) * 1000)  # Convert to ms

old_total = sum(old_times)
old_avg = old_total / NUM_REQUESTS
print(f"   Total time for {NUM_REQUESTS} calls: {old_total:.2f} ms")
print(f"   Average per call: {old_avg:.4f} ms")

# Test NEW implementation
print("\n📊 AFTER OPTIMIZATION (with caching):")
_label_to_taxonomy_cache = None  # Reset cache
new_times = []
for i in range(NUM_REQUESTS):
    start = time.perf_counter()
    _ = build_label_to_taxonomy_map_NEW()
    end = time.perf_counter()
    new_times.append((end - start) * 1000)  # Convert to ms

new_total = sum(new_times)
new_avg = new_total / NUM_REQUESTS
new_first = new_times[0]
new_cached_avg = sum(new_times[1:]) / (NUM_REQUESTS - 1)
print(f"   First call (builds cache): {new_first:.4f} ms")
print(f"   Subsequent calls (cached): {new_cached_avg:.6f} ms avg")
print(f"   Total time for {NUM_REQUESTS} calls: {new_total:.2f} ms")
print(f"   Average per call: {new_avg:.4f} ms")

# ============================================================
# Results Summary
# ============================================================

print("\n" + "=" * 70)
print("PERFORMANCE COMPARISON")
print("=" * 70)

savings_total = old_total - new_total
savings_percent = (savings_total / old_total) * 100
speedup = old_avg / new_avg if new_avg > 0 else float('inf')

print(f"""
| Metric                      | BEFORE      | AFTER       | IMPROVEMENT    |
|-----------------------------|-------------|-------------|----------------|
| Total time ({NUM_REQUESTS} calls)      | {old_total:>8.2f} ms | {new_total:>8.2f} ms | ↓ {savings_percent:.1f}% faster   |
| Average per call            | {old_avg:>8.4f} ms | {new_avg:>8.4f} ms | {speedup:.1f}x speedup     |
| First call                  | {old_times[0]:>8.4f} ms | {new_first:>8.4f} ms | (cache build)  |
| Subsequent calls            | {old_avg:>8.4f} ms | {new_cached_avg:>8.6f} ms | ↓ {((old_avg - new_cached_avg) / old_avg * 100):.1f}% faster   |
""")

print("=" * 70)
print("OPTIMIZATION SUMMARY")
print("=" * 70)

print(f"""
┌─────────────────────────────────────────────────────────────────────┐
│ BEFORE OPTIMIZATION                                                 │
│ - build_label_to_taxonomy_map() called on EVERY /predict request    │
│ - Rebuilds entire mapping ({total_entries} entries) each time                │
│ - Wasted CPU cycles on redundant work                               │
├─────────────────────────────────────────────────────────────────────┤
│ AFTER OPTIMIZATION                                                  │
│ - Mapping built ONCE on first request, then cached                  │
│ - Subsequent calls return cached result instantly                   │
│ - {speedup:.0f}x faster on average across {NUM_REQUESTS} requests                        │
├─────────────────────────────────────────────────────────────────────┤
│ REAL-WORLD IMPACT                                                   │
│ - Faster API response times for business owners                     │
│ - Reduced server CPU usage                                          │
│ - Better scalability under high load                                │
└─────────────────────────────────────────────────────────────────────┘
""")

# Output data for submission
print("\n📄 Data for submission document:")
print(json.dumps({
    "optimization": "build_label_to_taxonomy_map caching",
    "num_requests": NUM_REQUESTS,
    "taxonomy_entries": total_entries,
    "before_total_ms": round(old_total, 2),
    "after_total_ms": round(new_total, 2),
    "before_avg_ms": round(old_avg, 4),
    "after_avg_ms": round(new_avg, 4),
    "after_cached_avg_ms": round(new_cached_avg, 6),
    "savings_percent": round(savings_percent, 1),
    "speedup": round(speedup, 1)
}, indent=2))
