import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing Supabase keys in .env")
    exit(1)

supabase: Client = create_client(url, key)

print("Verifying Migration 00006 Tables...")

tables_to_check = ['job_wallet_ledger', 'quote_snapshots']
all_exist = True

for table in tables_to_check:
    try:
        # Check if table exists by selecting 1 row
        response = supabase.table(table).select("*").limit(1).execute()
        print(f"✅ Table '{table}' exists.")
    except Exception as e:
        print(f"❌ Table '{table}' check FAILED: {e}")
        all_exist = False

if all_exist:
    print("\n✅ Ledger & Snapshot tables verified.")
else:
    print("\n❌ Ledger/Snapshot tables MISSING. Please apply migration 00006_financial_engine.sql")

# Verify Bucket?
print("\nVerifying Storage Bucket 'gallery'...")
try:
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]
    if 'gallery' in bucket_names:
        print("✅ Bucket 'gallery' exists.")
    else:
        print("❌ Bucket 'gallery' MISSING.")
        # Try creating it via API if possible
        try:
            res = supabase.storage.create_bucket('gallery', {'public': True})
            print("✅ Bucket 'gallery' created via API.")
        except Exception as e:
            print(f"❌ Bucket creation failed: {e}")
except Exception as e:
    print(f"❌ Bucket check failed: {e}")
