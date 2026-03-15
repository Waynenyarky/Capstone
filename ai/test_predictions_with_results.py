#!/usr/bin/env python3
"""
Test AI Predictions with Actual Results
Shows what the AI actually classifies for test cases
"""

import requests
import json
import time

BASE_URL = "http://localhost:5050"

def test_prediction_with_results(description, test_number):
    """Make prediction and show actual results"""
    print(f"\n--- Test Case {test_number} ---")
    print(f"Input: '{description}'")
    
    start = time.perf_counter()
    
    response = requests.post(
        f"{BASE_URL}/predict",
        json={"businessDescription": description},
        headers={"Content-Type": "application/json"}
    )
    
    end = time.perf_counter()
    duration_ms = (end - start) * 1000
    
    if response.status_code == 200:
        result = response.json()
        recommendations = result.get('recommendations', [])
        
        print(f"Response Time: {duration_ms:.2f} ms")
        print(f"Recommendations:")
        
        if recommendations:
            for i, rec in enumerate(recommendations[:3]):  # Show top 3
                confidence = rec.get('confidence', 0) * 100
                lob = rec.get('lineOfBusiness', 'Unknown')
                detailed = rec.get('detailedLine', 'Unknown')
                print(f"  {i+1}. {detailed} ({lob}) - {confidence:.1f}% confidence")
        else:
            print("  No recommendations returned")
            
        return {
            'test': test_number,
            'input': description,
            'response_time_ms': duration_ms,
            'recommendations': recommendations,
            'success': True
        }
    else:
        print(f"ERROR: {response.status_code} - {response.text}")
        return {
            'test': test_number,
            'input': description,
            'response_time_ms': duration_ms,
            'predictions': [],
            'success': False,
            'error': response.text
        }

def main():
    print("=" * 70)
    print("AI PREDICTION TEST WITH ACTUAL RESULTS")
    print("=" * 70)
    
    # Test cases from A.1 Sprint 1 AI Prototype Plan
    test_cases = [
        "computer repair shop",  # Happy Path
        "store",                 # Edge Case: Minimal description
        "software development"   # Edge Case: Technical business
    ]
    
    all_results = []
    
    # Warm up
    print("\n🔥 Warming up service...")
    try:
        requests.post(f"{BASE_URL}/predict", 
                     json={"businessDescription": "warm up"},
                     timeout=10)
        print("✓ Service ready")
    except Exception as e:
        print(f"❌ Service not ready: {e}")
        return
    
    # Run tests
    for i, description in enumerate(test_cases, 1):
        result = test_prediction_with_results(description, i)
        all_results.append(result)
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY OF ACTUAL AI PREDICTIONS")
    print("=" * 70)
    
    successful = [r for r in all_results if r['success']]
    
    if successful:
        print(f"\nSuccessful Tests: {len(successful)}/{len(all_results)}")
        
        # Show detailed results table
        print("\n| Test | Input Description | Primary Recommendation | Confidence | Time (ms) |")
        print("|------|------------------|----------------------|------------|-----------|")
        
        for result in successful:
            recommendations = result['recommendations']
            primary = recommendations[0] if recommendations else {}
            detailed = primary.get('detailedLine', 'None')
            confidence = primary.get('confidence', 0) * 100
            
            # Truncate long descriptions
            input_short = result['input'][:30] + "..." if len(result['input']) > 30 else result['input']
            detailed_short = detailed[:25] + "..." if len(detailed) > 25 else detailed
            
            print(f"| {result['test']:4} | {input_short:<16} | {detailed_short:<22} | {confidence:>8.1f}% | {result['response_time_ms']:>8.2f} |")
        
        # Performance stats
        times = [r['response_time_ms'] for r in successful]
        avg_time = sum(times) / len(times)
        
        print(f"\nPerformance Statistics:")
        print(f"  Average Response Time: {avg_time:.2f} ms")
        print(f"  Min Response Time: {min(times):.2f} ms")
        print(f"  Max Response Time: {max(times):.2f} ms")
        print(f"  Success Rate: {len(successful)/len(all_results)*100:.1f}%")
        
        return {
            'total_tests': len(all_results),
            'successful': len(successful),
            'results': successful,
            'avg_response_time_ms': avg_time
        }
    else:
        print("❌ No successful tests!")
        return None

if __name__ == "__main__":
    results = main()
    if results:
        print(f"\n✅ Test completed!")
        print(json.dumps(results, indent=2))
