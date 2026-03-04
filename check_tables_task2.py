import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
    exit(1)

supabase: Client = create_client(url, key)

tables_to_check = ['jobs', 'invoices', 'job_wallets', 'job_wallet_ledger', 'wallet_ledger']

print("Verifying schema tables...")
for table in tables_to_check:
    try:
        response = supabase.table(table).select("*", count="exact").limit(1).execute()
        print(f"✅ Table '{table}' exists.")
    except Exception as e:
        print(f"❌ Table '{table}' check FAILED/MISSING.")
