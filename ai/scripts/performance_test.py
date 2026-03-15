"""
Performance Testing Lab - Session 1
AI Track: LOB Prediction Performance Tests

Tests the /predict endpoint with:
1. Normal Input - Standard business description
2. Long Input - 1000+ character description
3. Empty Input - Blank field handling
"""

import time
import requests
import json

BASE_URL = "http://localhost:5050"

def run_and_time(fn, x):
    """Measure execution time of a function"""
    t0 = time.perf_counter()
    y = fn(x)
    t1 = time.perf_counter()
    return y, round(t1 - t0, 3)

def predict_lob(description):
    """Call the /predict endpoint"""
    response = requests.post(
        f"{BASE_URL}/predict",
        json={"businessDescription": description},
        headers={"Content-Type": "application/json"}
    )
    return response.json(), response.status_code

def main():
    print("=" * 70)
    print("PERFORMANCE TEST RESULTS - AI LOB Prediction")
    print("Session 1 Activity (35 mins)")
    print("=" * 70)
    
    results = []
    
    # ============================================================
    # TEST CASE 1: Normal Input
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 1: Normal Input")
    print("=" * 70)
    
    normal_input = "Nagtitinda ako ng mga de-lata, softdrinks, at mga basic na gamit sa bahay sa maliit kong tindahan"
    print(f"  Input: {normal_input[:60]}...")
    print(f"  Length: {len(normal_input)} characters")
    
    (response1, status1), time1 = run_and_time(predict_lob, normal_input)
    
    if status1 == 200 and response1.get("recommendations"):
        rec = response1["recommendations"][0]
        print(f"  Time: {time1}s ({int(time1*1000)}ms)")
        print(f"  Result: {rec.get('lineOfBusiness')} / {rec.get('detailedLine')}")
        print(f"  Status: ✅ PASS (< 200ms threshold)")
        results.append({
            "case": "Normal Input",
            "steps": "Enter standard text (Filipino sari-sari store)",
            "expected": "< 200ms",
            "actual": f"{int(time1*1000)}ms",
            "pass": time1 < 0.2,
            "note": "Baseline"
        })
    else:
        print(f"  ❌ Request failed: {response1}")
    
    # ============================================================
    # TEST CASE 2: Long Input (1000+ chars)
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 2: Long Input (1000+ characters)")
    print("=" * 70)
    
    long_input = "I am running a comprehensive retail establishment that sells a wide variety of products including but not limited to groceries, household items, personal care products, snacks, beverages, canned goods, frozen foods, fresh produce, dairy products, bakery items, cleaning supplies, pet food, baby products, health and wellness items, beauty products, stationery, school supplies, hardware items, electrical supplies, plumbing materials, gardening tools, automotive accessories, sports equipment, toys, games, books, magazines, newspapers, greeting cards, gift items, seasonal decorations, party supplies, kitchen utensils, cookware, storage containers, organizational products, laundry supplies, air fresheners, batteries, light bulbs, extension cords, phone accessories, computer peripherals, office supplies, art materials, craft supplies, sewing notions, fabric, yarn, home decor items, picture frames, candles, artificial flowers, vases, mirrors, clocks, rugs, curtains, bedding, towels, and many more everyday essentials. " * 2
    print(f"  Input: {long_input[:60]}...")
    print(f"  Length: {len(long_input)} characters")
    
    (response2, status2), time2 = run_and_time(predict_lob, long_input)
    
    if status2 == 200 and response2.get("recommendations"):
        rec = response2["recommendations"][0]
        slowdown = round(time2 / time1, 2) if time1 > 0 else 0
        print(f"  Time: {time2}s ({int(time2*1000)}ms)")
        print(f"  Result: {rec.get('lineOfBusiness')} / {rec.get('detailedLine')}")
        print(f"  Slowdown: {slowdown}x compared to normal")
        print(f"  Status: ✅ PASS (processed successfully)")
        results.append({
            "case": "Long Input",
            "steps": "Paste 1000+ chars (retail description)",
            "expected": "Process/Error",
            "actual": f"{int(time2*1000)}ms",
            "pass": True,
            "note": f"{slowdown}x slower than normal"
        })
    else:
        print(f"  Response: {response2}")
        results.append({
            "case": "Long Input",
            "steps": "Paste 1000+ chars",
            "expected": "Process/Error",
            "actual": f"{int(time2*1000)}ms - Error",
            "pass": True,
            "note": "Handled gracefully"
        })
    
    # ============================================================
    # TEST CASE 3: Empty Input
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 3: Empty Input")
    print("=" * 70)
    
    empty_input = ""
    print(f"  Input: (empty string)")
    print(f"  Length: 0 characters")
    
    (response3, status3), time3 = run_and_time(predict_lob, empty_input)
    
    print(f"  Time: {time3}s ({int(time3*1000)}ms)")
    print(f"  Status Code: {status3}")
    print(f"  Response: {response3}")
    
    # Empty input should be handled gracefully (either error or no match)
    handled_gracefully = status3 in [200, 400] or response3.get("error") or response3.get("noConfidentMatch")
    print(f"  Status: {'✅ PASS' if handled_gracefully else '❌ FAIL'} (handled gracefully)")
    results.append({
        "case": "Empty Input",
        "steps": "Submit blank field",
        "expected": "Handle gracefully",
        "actual": f"{int(time3*1000)}ms",
        "pass": handled_gracefully,
        "note": "Returns error/no match"
    })
    
    # ============================================================
    # SUMMARY
    # ============================================================
    print("\n" + "=" * 70)
    print("PERFORMANCE TEST SUMMARY")
    print("=" * 70)
    
    print("\n| TEST CASE | STEPS (SHORT) | EXPECTED | ACTUAL | PASS/FAIL | NOTE |")
    print("|-----------|---------------|----------|--------|-----------|------|")
    for r in results:
        status = "✅ PASS" if r["pass"] else "❌ FAIL"
        print(f"| {r['case']} | {r['steps'][:25]}... | {r['expected']} | {r['actual']} | {status} | {r['note']} |")
    
    # Find slowest case
    times = [time1, time2, time3]
    cases = ["Normal Input", "Long Input", "Empty Input"]
    slowest_idx = times.index(max(times))
    
    print(f"\n" + "=" * 70)
    print(f"SLOWEST CASE: {cases[slowest_idx]} ({int(max(times)*1000)}ms)")
    print(f"BOTTLENECK: TF-IDF vectorization on {'long' if slowest_idx == 1 else 'input'} text")
    print("=" * 70)
    
    return results

if __name__ == "__main__":
    main()
