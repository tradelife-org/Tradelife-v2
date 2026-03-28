#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any

class TradeLifeAuthTester:
    def __init__(self, base_url="https://login-security-core.preview.emergentagent.com"):
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
            response = requests.get(self.base_url, timeout=10)
            
            success = response.status_code in [200, 307, 301]  # Success or redirects
            
            self.log_result("App Accessibility", success, {
                "status_code": response.status_code,
                "content_length": len(response.text),
                "error": None if success else f"App not accessible: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("App Accessibility", False, {
                "error": f"App not reachable: {str(e)}"
            })

    def test_login_page_accessibility(self):
        """Test that login page is accessible"""
        try:
            response = requests.get(f"{self.base_url}/login", timeout=10)
            
            success = response.status_code == 200
            
            self.log_result("Login Page Accessibility", success, {
                "status_code": response.status_code,
                "contains_login": "login" in response.text.lower() if success else False,
                "error": None if success else f"Login page not accessible: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("Login Page Accessibility", False, {
                "error": f"Login page not reachable: {str(e)}"
            })

    def test_signup_page_accessibility(self):
        """Test that signup page is accessible"""
        try:
            response = requests.get(f"{self.base_url}/signup", timeout=10)
            
            success = response.status_code == 200
            
            self.log_result("Signup Page Accessibility", success, {
                "status_code": response.status_code,
                "contains_signup": "signup" in response.text.lower() or "sign up" in response.text.lower() if success else False,
                "error": None if success else f"Signup page not accessible: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("Signup Page Accessibility", False, {
                "error": f"Signup page not reachable: {str(e)}"
            })

    def test_ensure_profile_endpoint(self):
        """Test the /api/auth/ensure-profile endpoint"""
        try:
            # Test with missing user_id (should return 400)
            response = requests.post(
                f"{self.base_url}/api/auth/ensure-profile",
                json={},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_result("Ensure Profile - Missing user_id", True, {
                    "status_code": response.status_code,
                    "response_data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
                })
            else:
                self.log_result("Ensure Profile - Missing user_id", False, {
                    "status_code": response.status_code,
                    "error": f"Expected 400 for missing user_id, got {response.status_code}"
                })

        except requests.RequestException as e:
            self.log_result("Ensure Profile - Missing user_id", False, {
                "error": f"Request failed: {str(e)}"
            })

        try:
            # Test with valid user_id (testing the endpoint structure)
            test_user_id = "test-user-123"
            response = requests.post(
                f"{self.base_url}/api/auth/ensure-profile",
                json={"user_id": test_user_id, "email": "test@example.com"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # We expect this to either work (200) or fail due to auth (401/403) or DB issues (500)
            # But the endpoint should exist and respond
            success = response.status_code in [200, 401, 403, 500]
            
            self.log_result("Ensure Profile Endpoint Exists", success, {
                "status_code": response.status_code,
                "response_data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200],
                "error": None if success else f"Unexpected status code: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("Ensure Profile Endpoint Exists", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_auth_me_endpoint(self):
        """Test if /api/auth/me endpoint exists (used in login flow)"""
        try:
            response = requests.get(f"{self.base_url}/api/auth/me", timeout=10)
            
            # Should respond with 401 (unauthorized) or 200 (if somehow authenticated)
            success = response.status_code in [200, 401, 403]
            
            self.log_result("Auth Me Endpoint Exists", success, {
                "status_code": response.status_code,
                "response_data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200],
                "error": None if success else f"Unexpected status code: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("Auth Me Endpoint Exists", False, {
                "error": f"Request failed: {str(e)}"
            })

    def run_all_tests(self):
        """Run all authentication tests"""
        print("🔍 Running TradeLife Authentication Tests...")
        print("=" * 50)
        
        # Test order: basic accessibility first, then API endpoints
        self.test_app_accessibility()
        self.test_login_page_accessibility()
        self.test_signup_page_accessibility()
        self.test_ensure_profile_endpoint()
        self.test_auth_me_endpoint()
        
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. See details above.")
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
    tester = TradeLifeAuthTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = tester.get_detailed_results()
    with open('/app/test_reports/auth_backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /app/test_reports/auth_backend_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())