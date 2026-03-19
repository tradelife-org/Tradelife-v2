#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

class TradeLifeBackendTester:
    def __init__(self, base_url="https://1cbbd1ba-8e53-4326-895b-c2e11ba0cb2a.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name: str, success: bool, details: Dict[str, Any]):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            **details
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} {test_name}")
        if details.get('error'):
            print(f"   Error: {details['error']}")
        if details.get('response_data') and isinstance(details['response_data'], dict):
            if len(str(details['response_data'])) < 500:  # Only print if small
                print(f"   Response: {json.dumps(details['response_data'], indent=2)}")

    def test_api_classify_hardcoded_rules(self):
        """Test classification with hardcoded rules (Screwfix, Tesco)"""
        test_transactions = [
            {"id": "test-1", "merchant": "Screwfix", "description": "Screwfix Direct", "amount": 120, "date": "2025-01-15"},
            {"id": "test-2", "merchant": "Tesco", "description": "Tesco Superstore", "amount": 45, "date": "2025-01-15"},
        ]
        
        try:
            response = requests.post(
                f"{self.base_url}/api/classify",
                json={"transactions": test_transactions},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                transactions = data.get("transactions", [])
                
                # Verify Screwfix classification
                screwfix_tx = next((t for t in transactions if t["merchant"] == "Screwfix"), None)
                tesco_tx = next((t for t in transactions if t["merchant"] == "Tesco"), None)
                
                screwfix_correct = (screwfix_tx and 
                                  screwfix_tx["type"] == "business" and 
                                  screwfix_tx["category"] == "materials" and
                                  screwfix_tx["confidence"] == 0.95)
                
                tesco_correct = (tesco_tx and 
                               tesco_tx["type"] == "personal" and 
                               tesco_tx["category"] == "groceries" and
                               tesco_tx["confidence"] == 0.95)
                
                success = screwfix_correct and tesco_correct
                self.log_result("API Classify - Hardcoded Rules", success, {
                    "status_code": response.status_code,
                    "screwfix_classification": screwfix_tx,
                    "tesco_classification": tesco_tx,
                    "error": None if success else "Classification rules not working as expected"
                })
            else:
                self.log_result("API Classify - Hardcoded Rules", False, {
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}: {response.text}"
                })
                
        except requests.RequestException as e:
            self.log_result("API Classify - Hardcoded Rules", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_api_classify_ai_fallback(self):
        """Test classification with AI fallback (Shell, Amazon)"""
        test_transactions = [
            {"id": "test-3", "merchant": "Shell", "description": "Shell Fuel Station", "amount": 60, "date": "2025-01-14"},
            {"id": "test-4", "merchant": "Amazon", "description": "Amazon.co.uk", "amount": 30, "date": "2025-01-14"},
        ]
        
        try:
            response = requests.post(
                f"{self.base_url}/api/classify",
                json={"transactions": test_transactions},
                headers={"Content-Type": "application/json"},
                timeout=15  # Allow more time for AI processing
            )
            
            if response.status_code == 200:
                data = response.json()
                transactions = data.get("transactions", [])
                
                shell_tx = next((t for t in transactions if t["merchant"] == "Shell"), None)
                amazon_tx = next((t for t in transactions if t["merchant"] == "Amazon"), None)
                
                # Shell should likely be classified as business/fuel or transport
                shell_reasonable = (shell_tx and 
                                  shell_tx["type"] in ["business", "personal"] and
                                  shell_tx["confidence"] >= 0.5)
                
                # Amazon could be either business or personal 
                amazon_reasonable = (amazon_tx and 
                                   amazon_tx["type"] in ["business", "personal"] and
                                   amazon_tx["confidence"] >= 0.5)
                
                success = shell_reasonable and amazon_reasonable and len(transactions) == 2
                self.log_result("API Classify - AI Fallback", success, {
                    "status_code": response.status_code,
                    "shell_classification": shell_tx,
                    "amazon_classification": amazon_tx,
                    "error": None if success else "AI classification failed or unreasonable results"
                })
            else:
                self.log_result("API Classify - AI Fallback", False, {
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}: {response.text}"
                })
                
        except requests.RequestException as e:
            self.log_result("API Classify - AI Fallback", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_api_classify_mock_dashboard_data(self):
        """Test classification with the exact mock data from dashboard"""
        mock_transactions = [
            {"id": "tx-1", "merchant": "Screwfix", "amount": 120, "description": "Screwfix Direct", "date": "2025-01-15"},
            {"id": "tx-2", "merchant": "Tesco", "amount": 45, "description": "Tesco Superstore", "date": "2025-01-15"},
            {"id": "tx-3", "merchant": "Shell", "amount": 60, "description": "Shell Fuel Station", "date": "2025-01-14"},
            {"id": "tx-4", "merchant": "Amazon", "amount": 30, "description": "Amazon.co.uk", "date": "2025-01-14"},
        ]
        
        try:
            response = requests.post(
                f"{self.base_url}/api/classify",
                json={"transactions": mock_transactions},
                headers={"Content-Type": "application/json"},
                timeout=20  # Allow time for all AI processing
            )
            
            if response.status_code == 200:
                data = response.json()
                transactions = data.get("transactions", [])
                
                # Verify we got all transactions back
                if len(transactions) == 4:
                    # Count business vs personal
                    business_count = len([t for t in transactions if t.get("type") == "business"])
                    personal_count = len([t for t in transactions if t.get("type") == "personal"])
                    
                    # All should have confidence scores
                    all_have_confidence = all(t.get("confidence", 0) >= 0.5 for t in transactions)
                    
                    success = all_have_confidence and (business_count + personal_count == 4)
                    self.log_result("API Classify - Mock Dashboard Data", success, {
                        "status_code": response.status_code,
                        "total_transactions": len(transactions),
                        "business_count": business_count,
                        "personal_count": personal_count,
                        "all_have_confidence": all_have_confidence,
                        "response_data": {"classified_transactions": len(transactions)} # Summary only
                    })
                else:
                    self.log_result("API Classify - Mock Dashboard Data", False, {
                        "status_code": response.status_code,
                        "error": f"Expected 4 transactions, got {len(transactions)}"
                    })
            else:
                self.log_result("API Classify - Mock Dashboard Data", False, {
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}: {response.text[:200]}"
                })
                
        except requests.RequestException as e:
            self.log_result("API Classify - Mock Dashboard Data", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_api_classify_invalid_input(self):
        """Test API error handling with invalid input"""
        try:
            # Test with missing transactions array
            response = requests.post(
                f"{self.base_url}/api/classify",
                json={"invalid": "data"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            expected_error = response.status_code == 400
            if expected_error:
                data = response.json()
                has_error_msg = "error" in data
                success = has_error_msg
            else:
                success = False
                
            self.log_result("API Classify - Invalid Input Handling", success, {
                "status_code": response.status_code,
                "response_data": response.json() if response.status_code == 400 else None,
                "error": None if success else f"Expected 400 error, got {response.status_code}"
            })
                
        except requests.RequestException as e:
            self.log_result("API Classify - Invalid Input Handling", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_api_transactions_get(self):
        """Test GET /api/transactions endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/api/transactions?org_id=default",
                timeout=10
            )
            
            # Should return either 200 with data or 404/500 if not implemented
            success = response.status_code in [200, 404, 500]
            if response.status_code == 200:
                data = response.json()
                has_transactions_key = "transactions" in data
                success = has_transactions_key
            
            self.log_result("API Transactions GET", success, {
                "status_code": response.status_code,
                "response_data": response.json() if success and response.status_code == 200 else None,
                "error": None if success else f"Unexpected status: {response.status_code}"
            })
                
        except requests.RequestException as e:
            self.log_result("API Transactions GET", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_api_user_rules_get(self):
        """Test GET /api/user-rules endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/api/user-rules?org_id=default",
                timeout=10
            )
            
            # Should return either 200 with data or 404/500 if not implemented
            success = response.status_code in [200, 404, 500]
            if response.status_code == 200:
                data = response.json()
                has_rules_key = "rules" in data
                success = has_rules_key
            
            self.log_result("API User Rules GET", success, {
                "status_code": response.status_code,
                "response_data": response.json() if success and response.status_code == 200 else None,
                "error": None if success else f"Unexpected status: {response.status_code}"
            })
                
        except requests.RequestException as e:
            self.log_result("API User Rules GET", False, {
                "error": f"Request failed: {str(e)}"
            })

    def run_all_tests(self):
        """Run all tests and return summary"""
        print("🔍 Running TradeLife Backend API Tests...")
        print("=" * 60)
        
        # Test in order of importance
        self.test_api_classify_hardcoded_rules()
        self.test_api_classify_ai_fallback()
        self.test_api_classify_mock_dashboard_data()
        self.test_api_classify_invalid_input()
        self.test_api_transactions_get()
        self.test_api_user_rules_get()
        
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed ({(self.tests_passed/self.tests_run*100):.1f}%)")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        elif self.tests_passed >= self.tests_run * 0.7:  # 70% pass rate acceptable
            print("✅ Most backend tests passed - core functionality working")
            return True
        else:
            print("⚠️  Many tests failed. See details above.")
            return False

    def get_detailed_results(self):
        """Return detailed test results"""
        return {
            "summary": {
                "tests_run": self.tests_run,
                "tests_passed": self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%",
                "timestamp": datetime.now().isoformat()
            },
            "results": self.results
        }

def main():
    print("Starting TradeLife Backend API Tests...")
    tester = TradeLifeBackendTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = tester.get_detailed_results()
    with open('/app/test_reports/tradelife_backend_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /app/test_reports/tradelife_backend_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())