"""
Sprint 2 AI Test - Filipino Translation Feature
Tests the new includeFilipino parameter in /predict endpoint
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_predict(description, include_filipino=False):
    """Make prediction request with optional Filipino translation"""
    response = requests.post(
        f"{BASE_URL}/predict",
        json={
            "businessDescription": description,
            "includeFilipino": include_filipino
        },
        headers={"Content-Type": "application/json"}
    )
    return response.json(), response.status_code

def main():
    print("=" * 70)
    print("SPRINT 2 AI TEST: Filipino Translation Feature")
    print("=" * 70)
    
    results = {
        "testCases": [],
        "allPassed": True
    }
    
    # ============================================================
    # TEST CASE 1: Sari-sari Store (English only - BEFORE state)
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 1: Sari-sari Store (English only - BEFORE)")
    print("=" * 70)
    
    response1, status1 = test_predict("Sari-sari store selling snacks and beverages", include_filipino=False)
    
    if status1 == 200 and "recommendations" in response1:
        rec1 = response1["recommendations"][0] if response1["recommendations"] else {}
        has_filipino_before = "lineOfBusinessFilipino" in rec1
        print(f"  Response: {json.dumps(rec1, indent=2)[:200]}...")
        print(f"  Has Filipino translation: {has_filipino_before}")
        
        test1_pass = not has_filipino_before  # Should NOT have Filipino when not requested
        print(f"\n  {'✅' if test1_pass else '❌'} Test 1: {'PASSED' if test1_pass else 'FAILED'}")
        results["testCases"].append({
            "name": "English Only (Before)",
            "beforeState": "English responses only",
            "afterState": f"lineOfBusiness: {rec1.get('lineOfBusiness', 'N/A')}",
            "passed": test1_pass,
            "improvement": "BASELINE"
        })
    else:
        print(f"  ❌ Request failed: {response1}")
        results["allPassed"] = False
    
    # ============================================================
    # TEST CASE 2: Sari-sari Store (With Filipino - AFTER state)
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 2: Sari-sari Store (With Filipino - AFTER)")
    print("=" * 70)
    
    response2, status2 = test_predict("Sari-sari store selling snacks and beverages", include_filipino=True)
    
    if status2 == 200 and "recommendations" in response2:
        rec2 = response2["recommendations"][0] if response2["recommendations"] else {}
        has_filipino_after = "lineOfBusinessFilipino" in rec2
        print(f"  Response: {json.dumps(rec2, indent=2)}")
        print(f"  Has Filipino translation: {has_filipino_after}")
        print(f"  lineOfBusinessFilipino: {rec2.get('lineOfBusinessFilipino', 'N/A')}")
        print(f"  detailedLineFilipino: {rec2.get('detailedLineFilipino', 'N/A')}")
        
        test2_pass = has_filipino_after
        print(f"\n  {'✅' if test2_pass else '❌'} Test 2: {'PASSED' if test2_pass else 'FAILED'}")
        results["testCases"].append({
            "name": "With Filipino Translation",
            "beforeState": "English responses only",
            "afterState": f"Adds Filipino: {rec2.get('lineOfBusinessFilipino', 'N/A')}",
            "passed": test2_pass,
            "improvement": "EXPANDED FEATURE"
        })
        if not test2_pass:
            results["allPassed"] = False
    else:
        print(f"  ❌ Request failed: {response2}")
        results["allPassed"] = False
    
    # ============================================================
    # TEST CASE 3: Restaurant (With Filipino)
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 3: Restaurant (With Filipino)")
    print("=" * 70)
    
    response3, status3 = test_predict("Restaurant serving Filipino food and catering services", include_filipino=True)
    
    if status3 == 200 and "recommendations" in response3:
        rec3 = response3["recommendations"][0] if response3["recommendations"] else {}
        print(f"  lineOfBusiness: {rec3.get('lineOfBusiness', 'N/A')}")
        print(f"  lineOfBusinessFilipino: {rec3.get('lineOfBusinessFilipino', 'N/A')}")
        print(f"  detailedLine: {rec3.get('detailedLine', 'N/A')}")
        print(f"  detailedLineFilipino: {rec3.get('detailedLineFilipino', 'N/A')}")
        
        has_filipino = "lineOfBusinessFilipino" in rec3
        test3_pass = has_filipino
        print(f"\n  {'✅' if test3_pass else '❌'} Test 3: {'PASSED' if test3_pass else 'FAILED'}")
        results["testCases"].append({
            "name": "Restaurant Filipino",
            "beforeState": "English responses only",
            "afterState": f"Filipino: {rec3.get('lineOfBusinessFilipino', 'N/A')}",
            "passed": test3_pass,
            "improvement": "EXPANDED FEATURE"
        })
        if not test3_pass:
            results["allPassed"] = False
    else:
        print(f"  ❌ Request failed: {response3}")
        results["allPassed"] = False
    
    # ============================================================
    # SUMMARY
    # ============================================================
    print("\n" + "=" * 70)
    print("SPRINT 2 AI TEST RESULTS")
    print("=" * 70)
    
    print("\n| Test Case | Before State | After State | Result |")
    print("|-----------|--------------|-------------|--------|")
    for tc in results["testCases"]:
        print(f"| {tc['name'][:20]} | {tc['beforeState'][:20]} | {tc['afterState'][:25]} | {'✅ PASS' if tc['passed'] else '❌ FAIL'} |")
    
    print(f"\n{'✅ ALL TESTS PASSED' if results['allPassed'] else '❌ SOME TESTS FAILED'}")
    
    return results

if __name__ == "__main__":
    results = main()
    print("\n✅ Sprint 2 AI test completed!")
    print(json.dumps(results, indent=2))
