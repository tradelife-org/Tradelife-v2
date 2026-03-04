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

print("--- Orphan Check (Data Health) ---")

try:
    # 1. Fetch All Quotes
    print("Fetching Quotes...")
    quotes_res = supabase.table("quotes").select("id").execute()
    all_quote_ids = {row['id'] for row in quotes_res.data}
    total_quotes = len(all_quote_ids)
    
    # 2. Fetch Line Items
    print("Fetching Line Items...")
    lines_res = supabase.table("quote_line_items").select("quote_id").execute()
    quotes_with_lines = {row['quote_id'] for row in lines_res.data}
    
    # 3. Analysis
    orphans = all_quote_ids - quotes_with_lines
    count_orphans = len(orphans)
    
    print(f"\nTotal Quotes: {total_quotes}")
    print(f"Quotes with Lines: {len(quotes_with_lines)}")
    print(f"Orphaned Quotes (No Lines): {count_orphans}")
    
    if count_orphans > 0:
        print(f"⚠️ Discrepancy Found: {count_orphans} quotes have no line items.")
        print(f"Orphan IDs: {list(orphans)}")
    else:
        print("✅ Data Health Verified: All quotes have at least one line item.")

except Exception as e:
    print(f"❌ Error during check: {e}")
