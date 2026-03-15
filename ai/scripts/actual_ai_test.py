"""
ACTUAL AI Performance Test
Tests the real Docker LOB model service with actual HTTP requests
"""

import time
import requests
import json

BASE_URL = "http://localhost:5050"

def test_predict(description, run_number):
    """Make actual prediction request and measure time"""
    start = time.perf_counter()
    
    response = requests.post(
        f"{BASE_URL}/predict",
        json={"businessDescription": description},
        headers={"Content-Type": "application/json"}
    )
    
    end = time.perf_counter()
    duration_ms = (end - start) * 1000
    
    return {
        "run": run_number,
        "duration_ms": duration_ms,
        "status": response.status_code,
        "success": response.status_code == 200
    }

def main():
    print("=" * 70)
    print("ACTUAL AI PERFORMANCE TEST (Real Docker Service)")
    print("=" * 70)
    
    # Test descriptions
    test_cases = [
        "Sari-sari store selling snacks and beverages",
        "Computer repair shop with hardware sales",
        "Restaurant and catering services with food delivery",
        "Bakery selling bread and pastries",
        "Hardware store selling construction materials"
    ]
    
    # Warm up the service first
    print("\n🔥 Warming up the service...")
    try:
        requests.post(f"{BASE_URL}/predict", 
                     json={"businessDescription": "test warm up request"},
                     timeout=10)
    except Exception as e:
        print(f"Warm-up failed: {e}")
        return
    
    print("✓ Service is ready")
    
    # ============================================================
    # TEST: Multiple prediction requests
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST: /predict API Response Times")
    print("=" * 70)
    
    all_results = []
    
    for i, description in enumerate(test_cases):
        print(f"\nTest case {i + 1}: {description[:40]}...")
        
        # Run 3 times per test case
        for run in range(3):
            result = test_predict(description, run + 1)
            all_results.append(result)
            print(f"  Run {run + 1}: {result['duration_ms']:.2f} ms")
    
    # Calculate statistics
    successful = [r for r in all_results if r["success"]]
    if successful:
        times = [r["duration_ms"] for r in successful]
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print("\n" + "=" * 70)
        print("ACTUAL MEASURED RESULTS")
        print("=" * 70)
        
        print(f"""
📊 API Response Time Statistics:
   Total requests: {len(all_results)}
   Successful: {len(successful)}
   
   Min time: {min_time:.2f} ms
   Max time: {max_time:.2f} ms
   Average time: {avg_time:.2f} ms
""")
        
        # Show individual results
        print("| Run | Duration (ms) | Status |")
        print("|-----|---------------|--------|")
        for i, r in enumerate(all_results[:10]):  # Show first 10
            print(f"| {i+1:3} | {r['duration_ms']:13.2f} | {'✓' if r['success'] else '✗'} |")
        
        if len(all_results) > 10:
            print(f"| ... | ... | ... |")
            print(f"| (showing 10 of {len(all_results)} results) |")
        
        return {
            "total_requests": len(all_results),
            "successful": len(successful),
            "min_ms": min_time,
            "max_ms": max_time,
            "avg_ms": avg_time,
            "all_times": times
        }
    else:
        print("❌ No successful requests!")
        return None

if __name__ == "__main__":
    results = main()
    if results:
        print("\n✅ Test completed successfully!")
        print(json.dumps(results, indent=2))
