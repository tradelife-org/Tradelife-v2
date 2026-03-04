#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any

class TradeLifeAITester:
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

    def test_ai_health_endpoint(self):
        """Test the AI health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/ai/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if both models responded
                flash_ok = data.get('flash', {}).get('status') == 'connected'
                pro_ok = data.get('pro', {}).get('status') == 'connected'
                
                if flash_ok and pro_ok:
                    self.log_result("AI Health Check", True, {
                        "status_code": response.status_code,
                        "response_data": data,
                        "flash_status": "connected",
                        "pro_status": "connected"
                    })
                else:
                    self.log_result("AI Health Check", False, {
                        "status_code": response.status_code,
                        "response_data": data,
                        "error": "One or both models failed to connect",
                        "flash_status": data.get('flash', {}).get('status'),
                        "pro_status": data.get('pro', {}).get('status'),
                        "flash_error": data.get('flash', {}).get('error'),
                        "pro_error": data.get('pro', {}).get('error')
                    })
                    
            elif response.status_code == 503:
                data = response.json()
                self.log_result("AI Health Check", False, {
                    "status_code": response.status_code,
                    "response_data": data,
                    "error": "Service unavailable - models not connecting"
                })
            else:
                self.log_result("AI Health Check", False, {
                    "status_code": response.status_code,
                    "error": f"Unexpected status code: {response.status_code}"
                })
                
        except requests.RequestException as e:
            self.log_result("AI Health Check", False, {
                "error": f"Request failed: {str(e)}"
            })

    def test_endpoint_exists(self):
        """Test that the health endpoint exists and responds"""
        try:
            response = requests.get(f"{self.base_url}/api/ai/health", timeout=5)
            
            success = response.status_code in [200, 503]  # Both are valid responses
            
            self.log_result("Health Endpoint Exists", success, {
                "status_code": response.status_code,
                "content_type": response.headers.get('content-type', ''),
                "error": None if success else f"Unexpected status: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("Health Endpoint Exists", False, {
                "error": f"Endpoint not reachable: {str(e)}"
            })

    def test_gemini_api_key_configured(self):
        """Test that GEMINI_API_KEY is configured by checking the health endpoint response"""
        try:
            response = requests.get(f"{self.base_url}/api/ai/health", timeout=5)
            data = response.json()
            
            # If we get a proper response structure, the API key is likely configured
            has_models = 'models' in data
            has_flash = 'flash' in data
            has_pro = 'pro' in data
            
            # Check if the errors are about missing API key vs wrong model names
            flash_error = data.get('flash', {}).get('error', '')
            pro_error = data.get('pro', {}).get('error', '')
            
            api_key_missing = 'API_KEY' in str(flash_error) or 'API_KEY' in str(pro_error)
            
            if has_models and has_flash and has_pro and not api_key_missing:
                self.log_result("GEMINI_API_KEY Configured", True, {
                    "response_structure": "Valid",
                    "models_defined": data.get('models', {})
                })
            else:
                self.log_result("GEMINI_API_KEY Configured", False, {
                    "error": "API key appears to be missing or invalid",
                    "flash_error": flash_error,
                    "pro_error": pro_error
                })
                
        except Exception as e:
            self.log_result("GEMINI_API_KEY Configured", False, {
                "error": f"Could not verify API key configuration: {str(e)}"
            })

    def test_build_compilation(self):
        """Test that the app is running (indicates successful build)"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            
            success = response.status_code in [200, 307, 404]  # Next.js can redirect or show 404 for /
            
            self.log_result("Build Compilation", success, {
                "status_code": response.status_code,
                "app_running": success,
                "error": None if success else f"App not responding: {response.status_code}"
            })
            
        except requests.RequestException as e:
            self.log_result("Build Compilation", False, {
                "error": f"App not running: {str(e)}"
            })

    def run_all_tests(self):
        """Run all tests and return summary"""
        print("🔍 Running TradeLife AI Integration Tests...")
        print("=" * 50)
        
        # Test order: basic first, then specific functionality
        self.test_build_compilation()
        self.test_endpoint_exists()
        self.test_gemini_api_key_configured()
        self.test_ai_health_endpoint()
        
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
    tester = TradeLifeAITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = tester.get_detailed_results()
    with open('/app/test_reports/ai_health_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /app/test_reports/ai_health_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())