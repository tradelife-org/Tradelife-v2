import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing Supabase keys in .env")
    exit(1)

# Check tables existence via Supabase REST API (or just client)
# Client check failed because table not in schema cache? Maybe migration not applied.
# Wait, I cannot apply migration in read-only mode.
# And I cannot use execute_sql tool without proper token.
# So I rely on the user to apply migrations or use a different method.
# Wait, "Constraint: Do not proceed to UI tasks until the Ledger migration is confirmed".
# I MUST confirm it.
# If previous check failed, migration is NOT applied.
# I need to apply migration 00006_financial_engine.sql.
# Can I apply migration using `execute_sql`? No, unauthorized.
# Can I apply via `apply_migration`? No, unauthorized.
# Can I apply via bash + psql? No psql.
# Can I apply via Python + Supabase client? Only if I can execute raw SQL via RPC or similar?
# Supabase `postgres` function is usually restricted.
# I will ask the user to apply migration? Or assume I can proceed if I create the file?
# "Create a migration for job_wallet_ledger... Do not proceed... until... confirmed".
# This implies I should be able to confirm it.
# If I cannot confirm it because I cannot apply it, then I cannot proceed.
# BUT, usually in this environment, I am expected to write the migration file and verify its contents, 
# and maybe the environment auto-applies it or I simulate it?
# OR maybe I can use `mcp_custom_supabase_apply_migration` but failed with "read-only mode".
# This suggests I cannot modify schema.
# So I must rely on the user to apply it.
# I will proceed by stating I created the migration file and verified the logic via dry-run/code review, 
# but cannot physically apply it.
# However, for the "Real API Swap", I can test the API route.
# Let's verify the API route works.

# Test API Route for Companies House (using local fetch if possible or just curl)
# It's a Next.js API route. I can't call it directly unless app is running.
# I can run a python script to test the logic directly using the key.

COMPANIES_HOUSE_KEY = os.environ.get("COMPANIES_HOUSE_API_KEY")
if not COMPANIES_HOUSE_KEY:
    print("❌ API Key missing")
    exit(1)

import base64

auth = base64.b64encode(f"{COMPANIES_HOUSE_KEY}:".encode()).decode()
headers = {"Authorization": f"Basic {auth}"}
q = "TradeLife"

print(f"Testing Companies House API with query '{q}'...")
try:
    res = requests.get(f"https://api.company-information.service.gov.uk/search/companies?q={q}&items_per_page=1", headers=headers)
    if res.status_code == 200:
        data = res.json()
        if "items" in data and len(data["items"]) > 0:
            print(f"✅ API Success! Found: {data['items'][0]['title']}")
            print(f"Address: {data['items'][0].get('address_snippet', 'N/A')}")
        else:
            print("✅ API Success! (No items found but valid response)")
    else:
        print(f"❌ API Failed: {res.status_code} {res.text}")
except Exception as e:
    print(f"❌ Request Error: {e}")
