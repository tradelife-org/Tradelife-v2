#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

class TradeLifeBackendTester:
    def __init__(self, base_url="http://localhost:3000"):
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
        if details.get('response_data'):
            print(f"   Response: {json.dumps(details['response_data'], indent=2)}")

    def test_app_accessibility(self):
        """Test that the main app is accessible"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            success = response.status_code in [200, 307]  # Next.js can redirect
            
            self.log_result("App Accessibility", success, {
                "status_code": response.status_code,
                "content_type": response.headers.get('content-type', ''),
                "error": None if success else f"App not accessible: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("App Accessibility", False, {
                "error": f"App not reachable: {str(e)}"
            })

    def test_classify_endpoint(self):
        """Test the /api/classify endpoint with mock transactions"""
        mock_transactions = [
            {"id": "tx-1", "merchant": "Screwfix", "amount": 120, "description": "Screwfix Direct", "date": "2025-01-15"},
            {"id": "tx-2", "merchant": "Tesco", "amount": 45, "description": "Tesco Superstore", "date": "2025-01-15"},
            {"id": "tx-3", "merchant": "Shell", "amount": 60, "description": "Shell Fuel Station", "date": "2025-01-14"},
            {"id": "tx-4", "merchant": "Amazon", "amount": 30, "description": "Amazon.co.uk", "date": "2025-01-14"}
        ]

        try:
            response = requests.post(
                f"{self.base_url}/api/classify",
                json={"transactions": mock_transactions},
                headers={"Content-Type": "application/json"},
                timeout=30  # AI classification can take time
            )
            
            if response.status_code == 200:
                data = response.json()
                transactions = data.get('transactions', [])
                
                if len(transactions) == 4:
                    # Check hardcoded rules work
                    screwfix = next((t for t in transactions if t['merchant'] == 'Screwfix'), None)
                    tesco = next((t for t in transactions if t['merchant'] == 'Tesco'), None)
                    
                    screwfix_correct = screwfix and screwfix['type'] == 'business' and screwfix['category'] == 'materials'
                    tesco_correct = tesco and tesco['type'] == 'personal' and tesco['category'] == 'groceries'
                    
                    all_have_confidence = all(t.get('confidence', 0) > 0 for t in transactions)
                    
                    if screwfix_correct and tesco_correct and all_have_confidence:
                        self.log_result("API Classification", True, {
                            "status_code": response.status_code,
                            "transactions_classified": len(transactions),
                            "screwfix_classification": f"{screwfix['type']}/{screwfix['category']}" if screwfix else "Missing",
                            "tesco_classification": f"{tesco['type']}/{tesco['category']}" if tesco else "Missing",
                            "response_data": data
                        })
                    else:
                        self.log_result("API Classification", False, {
                            "status_code": response.status_code,
                            "error": "Classification rules not working correctly",
                            "screwfix_correct": screwfix_correct,
                            "tesco_correct": tesco_correct,
                            "all_have_confidence": all_have_confidence,
                            "response_data": data
                        })
                else:
                    self.log_result("API Classification", False, {
                        "status_code": response.status_code,
                        "error": f"Expected 4 transactions, got {len(transactions)}",
                        "response_data": data
                    })
            else:
                self.log_result("API Classification", False, {
                    "status_code": response.status_code,
                    "error": f"Classification failed: {response.text}",
                    "response_data": response.text
                })
                
        except requests.RequestException as e:
            self.log_result("API Classification", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_transactions_get_endpoint(self):
        """Test the /api/transactions GET endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/api/transactions?org_id=default",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'transactions' in data:
                    self.log_result("Transactions GET", True, {
                        "status_code": response.status_code,
                        "transaction_count": len(data['transactions']),
                        "response_structure": "Valid"
                    })
                else:
                    self.log_result("Transactions GET", False, {
                        "status_code": response.status_code,
                        "error": "Missing 'transactions' field in response",
                        "response_data": data
                    })
            else:
                self.log_result("Transactions GET", False, {
                    "status_code": response.status_code,
                    "error": f"GET transactions failed: {response.text}"
                })
                
        except requests.RequestException as e:
            self.log_result("Transactions GET", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_transactions_post_endpoint(self):
        """Test the /api/transactions POST endpoint"""
        test_transaction = [{
            "id": "test-tx-1",
            "amount": 25,
            "description": "Test Transaction",
            "merchant": "Test Merchant",
            "date": "2025-01-15",
            "type": "business",
            "category": "test",
            "confidence": 0.95
        }]

        try:
            response = requests.post(
                f"{self.base_url}/api/transactions",
                json={"transactions": test_transaction, "org_id": "test"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'transactions' in data:
                    self.log_result("Transactions POST", True, {
                        "status_code": response.status_code,
                        "saved_transactions": len(data['transactions']),
                        "response_structure": "Valid"
                    })
                else:
                    self.log_result("Transactions POST", False, {
                        "status_code": response.status_code,
                        "error": "Missing 'transactions' field in response",
                        "response_data": data
                    })
            else:
                self.log_result("Transactions POST", False, {
                    "status_code": response.status_code,
                    "error": f"POST transactions failed: {response.text}"
                })
                
        except requests.RequestException as e:
            self.log_result("Transactions POST", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_user_rules_get_endpoint(self):
        """Test the /api/user-rules GET endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/api/user-rules?org_id=default",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'rules' in data:
                    self.log_result("User Rules GET", True, {
                        "status_code": response.status_code,
                        "rules_count": len(data['rules']),
                        "response_structure": "Valid"
                    })
                else:
                    self.log_result("User Rules GET", False, {
                        "status_code": response.status_code,
                        "error": "Missing 'rules' field in response",
                        "response_data": data
                    })
            else:
                self.log_result("User Rules GET", False, {
                    "status_code": response.status_code,
                    "error": f"GET user rules failed: {response.text}"
                })
                
        except requests.RequestException as e:
            self.log_result("User Rules GET", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_user_rules_post_endpoint(self):
        """Test the /api/user-rules POST endpoint"""
        test_rule = {
            "merchant": "test-merchant",
            "type": "business",
            "category": "materials",
            "org_id": "test"
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/user-rules",
                json=test_rule,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'rule' in data:
                    self.log_result("User Rules POST", True, {
                        "status_code": response.status_code,
                        "rule_saved": True,
                        "response_structure": "Valid"
                    })
                else:
                    self.log_result("User Rules POST", False, {
                        "status_code": response.status_code,
                        "error": "Missing 'rule' field in response",
                        "response_data": data
                    })
            else:
                self.log_result("User Rules POST", False, {
                    "status_code": response.status_code,
                    "error": f"POST user rules failed: {response.text}"
                })
                
        except requests.RequestException as e:
            self.log_result("User Rules POST", False, {
                "error": f"Request failed: {str(e)}"
            })

    def run_all_tests(self):
        """Run all tests and return summary"""
        print("🔍 Running TradeLife Backend API Tests...")
        print("=" * 50)
        
        # Test order: basic accessibility first, then API endpoints
        self.test_app_accessibility()
        self.test_classify_endpoint()
        self.test_transactions_get_endpoint()
        self.test_transactions_post_endpoint()
        self.test_user_rules_get_endpoint()
        self.test_user_rules_post_endpoint()
        
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print("⚠️  Some backend tests failed. See details above.")
            return False

    def get_detailed_results(self):
        """Return detailed test results"""
        return {
            "summary": {
                "tests_run": self.tests_run,
                "tests_passed": self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%"
            },
            "results": self.results
        }

def main():
    tester = TradeLifeBackendTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = tester.get_detailed_results()
    with open('/app/test_reports/tradelife_backend_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Backend test results saved to: /app/test_reports/tradelife_backend_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())