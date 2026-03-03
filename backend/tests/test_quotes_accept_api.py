"""
TradeLife v2 - Backend API Tests for /api/quotes/accept endpoint
Tests the Next.js API route for accepting quotes via share_token
"""
import pytest
import requests

# IMPORTANT: Using localhost:3000 as external preview proxy blocks /api/* routes
BASE_URL = "http://localhost:3000"

# Supabase credentials for resetting test data
SUPABASE_URL = "https://mnmqfhdyypeiioscerjv.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubXFmaGR5eXBlaWlvc2Nlcmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU0NDcwMywiZXhwIjoyMDg4MTIwNzAzfQ.GJsDhTdlP_pgL_HpHldl7Jc9R0xap8IF_h5wZ3zF5F4"

# Test share tokens
SENT_QUOTE_TOKEN = "360323344677cd9a6a7315750c3e7a335e0dd7ab09862e19704dd8e7cf2b6714"
DRAFT_QUOTE_TOKEN = "28f265ecf6ac322cb9c224f726e142a77b935daff384fc0f6587c79ac5d53988"


def reset_quote_status(share_token: str, status: str):
    """Helper to reset quote status via Supabase REST API"""
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{SUPABASE_URL}/rest/v1/quotes?share_token=eq.{share_token}"
    response = requests.patch(url, headers=headers, json={"status": status})
    return response.status_code in [200, 204]


class TestQuotesAcceptEndpoint:
    """Tests for POST /api/quotes/accept endpoint"""

    @pytest.fixture(autouse=True)
    def setup_sent_quote(self):
        """Reset SENT quote status before each test"""
        reset_quote_status(SENT_QUOTE_TOKEN, "SENT")
        yield
        # Cleanup: reset to SENT after test
        reset_quote_status(SENT_QUOTE_TOKEN, "SENT")

    def test_accept_sent_quote_success(self):
        """POST /api/quotes/accept - accepts a SENT quote by share_token, returns {success: true}"""
        response = requests.post(
            f"{BASE_URL}/api/quotes/accept",
            json={"share_token": SENT_QUOTE_TOKEN},
            headers={"Content-Type": "application/json"},
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True, f"Expected success: true, got {data}"

    def test_accept_already_accepted_quote_idempotent(self):
        """POST /api/quotes/accept - idempotent: re-accepting ACCEPTED quote returns {success: true}"""
        # First accept the quote
        response1 = requests.post(
            f"{BASE_URL}/api/quotes/accept",
            json={"share_token": SENT_QUOTE_TOKEN},
            headers={"Content-Type": "application/json"},
        )
        assert response1.status_code == 200, f"First accept failed: {response1.text}"
        
        # Accept again - should be idempotent
        response2 = requests.post(
            f"{BASE_URL}/api/quotes/accept",
            json={"share_token": SENT_QUOTE_TOKEN},
            headers={"Content-Type": "application/json"},
        )
        
        assert response2.status_code == 200, f"Expected 200 on re-accept, got {response2.status_code}: {response2.text}"
        data = response2.json()
        assert data.get("success") is True, f"Expected success: true on idempotent call, got {data}"

    def test_accept_draft_quote_rejected_400(self):
        """POST /api/quotes/accept - rejects DRAFT quote with 400"""
        response = requests.post(
            f"{BASE_URL}/api/quotes/accept",
            json={"share_token": DRAFT_QUOTE_TOKEN},
            headers={"Content-Type": "application/json"},
        )
        
        assert response.status_code == 400, f"Expected 400 for DRAFT quote, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is False, f"Expected success: false, got {data}"

    def test_accept_invalid_share_token_404(self):
        """POST /api/quotes/accept - returns 404 for invalid share_token"""
        invalid_token = "invalid_token_that_does_not_exist_12345"
        response = requests.post(
            f"{BASE_URL}/api/quotes/accept",
            json={"share_token": invalid_token},
            headers={"Content-Type": "application/json"},
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid token, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is False, f"Expected success: false, got {data}"
        assert "not found" in data.get("error", "").lower(), f"Expected 'not found' in error, got {data}"

    def test_accept_missing_share_token_400(self):
        """POST /api/quotes/accept - returns 400 for missing share_token"""
        response = requests.post(
            f"{BASE_URL}/api/quotes/accept",
            json={},
            headers={"Content-Type": "application/json"},
        )
        
        assert response.status_code == 400, f"Expected 400 for missing token, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is False, f"Expected success: false, got {data}"
        assert "missing" in data.get("error", "").lower(), f"Expected 'missing' in error, got {data}"


class TestPublicRoutes:
    """Tests for public routes that should work without authentication"""

    def test_view_quote_page_loads(self):
        """GET /view/[share_token] - public quote page loads without auth"""
        response = requests.get(f"{BASE_URL}/view/{SENT_QUOTE_TOKEN}")
        
        assert response.status_code == 200, f"Expected 200 for public view, got {response.status_code}"
        # Page should contain quote-related content
        assert "TradeLife" in response.text or "quote" in response.text.lower(), "Page content missing expected text"

    def test_login_page_loads(self):
        """GET /login - login page loads"""
        response = requests.get(f"{BASE_URL}/login")
        
        assert response.status_code == 200, f"Expected 200 for login page, got {response.status_code}"
        assert "Sign in" in response.text or "login" in response.text.lower(), "Login page content missing"

    def test_signup_page_loads(self):
        """GET /signup - signup page loads"""
        response = requests.get(f"{BASE_URL}/signup")
        
        assert response.status_code == 200, f"Expected 200 for signup page, got {response.status_code}"
        assert "Sign up" in response.text or "signup" in response.text.lower(), "Signup page content missing"

    def test_quotes_page_redirects_unauthenticated(self):
        """GET /quotes - redirects to /login when unauthenticated (307)"""
        response = requests.get(f"{BASE_URL}/quotes", allow_redirects=False)
        
        # Should redirect (307 or 302) to login
        assert response.status_code in [307, 302], f"Expected redirect (307/302), got {response.status_code}"
        location = response.headers.get("Location", "")
        assert "/login" in location, f"Expected redirect to /login, got Location: {location}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
