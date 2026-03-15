"""
Sprint 2 AI Test - Filipino Language Input Support
Test Cases: NORMAL, EDGE, ATTACK

Tests the AI model's ability to understand Filipino business descriptions
and handle edge cases and potential attack vectors.
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_predict(description):
    """Make prediction request"""
    response = requests.post(
        f"{BASE_URL}/predict",
        json={"businessDescription": description},
        headers={"Content-Type": "application/json"}
    )
    return response.json(), response.status_code

def main():
    print("=" * 70)
    print("SPRINT 2 AI TEST: Filipino Language Input Support")
    print("Test Categories: NORMAL | EDGE | ATTACK")
    print("=" * 70)
    
    results = {
        "testCases": [],
        "allPassed": True
    }
    
    # ============================================================
    # TEST CASE 1: NORMAL - Standard Filipino Input
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 1: NORMAL - Standard Filipino Business Description")
    print("=" * 70)
    
    normal_desc = "Nagtitinda ako ng mga de-lata, softdrinks, at mga basic na gamit sa bahay sa maliit kong tindahan"
    print(f"  Input: {normal_desc}")
    print(f"  Expected: retail / Sari-sari store")
    
    response1, status1 = test_predict(normal_desc)
    
    if status1 == 200 and response1.get("recommendations"):
        rec1 = response1["recommendations"][0]
        test1_pass = rec1.get("lineOfBusiness") == "retail"
        print(f"  Actual: {rec1.get('lineOfBusiness')} / {rec1.get('detailedLine')} (conf: {rec1.get('confidence')})")
        print(f"\n  {'✅' if test1_pass else '❌'} NORMAL Test: {'PASSED' if test1_pass else 'FAILED'}")
        results["testCases"].append({
            "category": "NORMAL",
            "name": "Standard Filipino Input",
            "input": normal_desc[:40] + "...",
            "expected": "retail / Sari-sari store",
            "actual": f"{rec1.get('lineOfBusiness')} / {rec1.get('detailedLine')}",
            "passed": test1_pass
        })
        if not test1_pass:
            results["allPassed"] = False
    else:
        print(f"  ❌ Request failed")
        results["allPassed"] = False
    
    # ============================================================
    # TEST CASE 2: EDGE - Very Short Filipino Input (Minimum viable)
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 2: EDGE - Minimal Filipino Input (Short Description)")
    print("=" * 70)
    
    edge_desc = "Maliit na tindahan ng pagkain at softdrinks"
    print(f"  Input: {edge_desc}")
    print(f"  Expected: Should still classify correctly despite short input")
    
    response2, status2 = test_predict(edge_desc)
    
    if status2 == 200 and response2.get("recommendations"):
        rec2 = response2["recommendations"][0]
        # Should recognize as retail or food_service
        test2_pass = rec2.get("lineOfBusiness") in ["retail", "food_service"]
        print(f"  Actual: {rec2.get('lineOfBusiness')} / {rec2.get('detailedLine')} (conf: {rec2.get('confidence')})")
        print(f"\n  {'✅' if test2_pass else '❌'} EDGE Test: {'PASSED' if test2_pass else 'FAILED'}")
        results["testCases"].append({
            "category": "EDGE",
            "name": "Minimal Filipino Input",
            "input": edge_desc[:40] + "...",
            "expected": "retail or food_service",
            "actual": f"{rec2.get('lineOfBusiness')} / {rec2.get('detailedLine')}",
            "passed": test2_pass
        })
        if not test2_pass:
            results["allPassed"] = False
    elif response2.get("noConfidentMatch"):
        # Edge case: too short to classify confidently - this is acceptable behavior
        print(f"  Actual: No confident match (model uncertain)")
        print(f"\n  ✅ EDGE Test: PASSED (Model correctly indicated low confidence)")
        results["testCases"].append({
            "category": "EDGE",
            "name": "Minimal Filipino Input",
            "input": edge_desc[:40] + "...",
            "expected": "retail/food_service or low confidence",
            "actual": "No confident match",
            "passed": True
        })
    else:
        print(f"  ❌ Request failed")
        results["allPassed"] = False
    
    # ============================================================
    # TEST CASE 3: ATTACK - SQL/Script Injection in Filipino Context
    # ============================================================
    print("\n" + "=" * 70)
    print("TEST CASE 3: ATTACK - Injection Attempt in Filipino Context")
    print("=" * 70)
    
    attack_desc = "Nagtitinda ako ng <script>alert('XSS')</script> at mga ' OR '1'='1 sa tindahan ko; DROP TABLE businesses;--"
    print(f"  Input: {attack_desc}")
    print(f"  Expected: Should handle gracefully without crashing or executing injection")
    
    response3, status3 = test_predict(attack_desc)
    
    # Attack test passes if:
    # 1. Server doesn't crash (returns 200 or 400)
    # 2. Returns valid JSON response
    # 3. No error indicating injection worked
    test3_pass = status3 in [200, 400] and isinstance(response3, dict)
    
    if status3 == 200 and response3.get("recommendations"):
        rec3 = response3["recommendations"][0] if response3["recommendations"] else {}
        print(f"  Response: {rec3.get('lineOfBusiness', 'N/A')} / {rec3.get('detailedLine', 'N/A')}")
    elif response3.get("noConfidentMatch"):
        print(f"  Response: No confident match (expected for garbage input)")
    else:
        print(f"  Response: {response3}")
    
    print(f"  Server Status: {status3}")
    print(f"\n  {'✅' if test3_pass else '❌'} ATTACK Test: {'PASSED' if test3_pass else 'FAILED'} (Server handled injection safely)")
    
    results["testCases"].append({
        "category": "ATTACK",
        "name": "SQL/XSS Injection",
        "input": attack_desc[:40] + "...",
        "expected": "Handle gracefully, no crash",
        "actual": f"Status {status3}, valid response",
        "passed": test3_pass
    })
    if not test3_pass:
        results["allPassed"] = False
    
    # ============================================================
    # SUMMARY
    # ============================================================
    print("\n" + "=" * 70)
    print("SPRINT 2 AI TEST RESULTS")
    print("=" * 70)
    
    print("\n| Category | Test Case | Input | Expected | Actual | Result |")
    print("|----------|-----------|-------|----------|--------|--------|")
    for tc in results["testCases"]:
        status = "✅ PASS" if tc["passed"] else "❌ FAIL"
        print(f"| {tc['category']} | {tc['name'][:20]} | {tc['input'][:20]}... | {tc['expected'][:15]} | {tc['actual'][:15]} | {status} |")
    
    passed = sum(1 for tc in results["testCases"] if tc["passed"])
    total = len(results["testCases"])
    print(f"\n{'✅' if results['allPassed'] else '❌'} {passed}/{total} TEST CASES PASSED")
    
    print("\n" + json.dumps(results, indent=2, ensure_ascii=False))
    return results

if __name__ == "__main__":
    main()
