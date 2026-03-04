#!/usr/bin/env python3

import requests
import json
import sys
import os
from datetime import datetime

# Let's try to test Gemini models directly with the available API key
def test_gemini_models_directly():
    """Test different Gemini model names directly with the API"""
    api_key = "AIzaSyC9vwp8SHWKyEuqZoWp7mjSMEtxMC5DeBI"  # From .env file
    
    # Possible model names based on research
    models_to_test = [
        "gemini-3.1-pro",
        "gemini-3-flash", 
        "gemini-3.1-flash",
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ]
    
    print("🔍 Testing different Gemini model names directly...")
    print("=" * 60)
    
    working_models = []
    
    for model_name in models_to_test:
        print(f"\nTesting: {model_name}")
        try:
            # Test using Google's REST API directly
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            }
            payload = {
                "contents": [{"parts": [{"text": "Say OK"}]}]
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {model_name} - WORKS")
                working_models.append(model_name)
            else:
                print(f"❌ {model_name} - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
                except:
                    print(f"   Error: {response.text[:100]}")
        
        except Exception as e:
            print(f"❌ {model_name} - Exception: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"🎯 Working models found: {working_models}")
    
    return working_models

def main():
    working_models = test_gemini_models_directly()
    
    # Save results
    results = {
        "timestamp": datetime.now().isoformat(),
        "working_models": working_models,
        "issues_found": {
            "incorrect_model_names": {
                "current_flash": "gemini-3-flash",
                "current_pro": "gemini-3-pro",
                "suggested_flash": "gemini-3-flash" if "gemini-3-flash" in working_models else working_models[0] if working_models else "gemini-2.5-flash",
                "suggested_pro": "gemini-3.1-pro" if "gemini-3.1-pro" in working_models else "gemini-2.5-pro"
            }
        }
    }
    
    with open('/app/test_reports/gemini_model_test.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Results saved to: /app/test_reports/gemini_model_test.json")
    
    if working_models:
        print("\n🛠️  RECOMMENDED FIXES:")
        print(f"   Update /app/frontend/lib/ai/gemini.ts:")
        if "gemini-3-flash" not in working_models:
            suggested_flash = working_models[0] if working_models else "gemini-2.5-flash"
            print(f"   - Change GEMINI_FLASH = 'gemini-3-flash' to '{suggested_flash}'")
        if "gemini-3.1-pro" in working_models:
            print(f"   - Change GEMINI_PRO = 'gemini-3-pro' to 'gemini-3.1-pro'")
        elif "gemini-2.5-pro" in working_models:
            print(f"   - Change GEMINI_PRO = 'gemini-3-pro' to 'gemini-2.5-pro'")
    
    return 1 if not working_models else 0

if __name__ == "__main__":
    sys.exit(main())