import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables manually since python-dotenv might not look in the right place by default
# But I'll just hardcode the path to be safe, or assume standard load_dotenv works if I point it
load_dotenv('/app/backend/.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
    exit(1)

supabase: Client = create_client(url, key)

tables_to_check = [
    'organisations',
    'profiles',
    'clients',
    'quotes',
    'quote_sections',
    'quote_line_items',
    'jobs',
    'job_line_items',
    'variations',
    'invoices',
    'invoice_line_items',
    'money_pots',
    'cashflow_entries',
    'quote_templates'
]

print("Verifying schema tables...")
all_exist = True
for table in tables_to_check:
    try:
        # Just selecting count to verify existence
        response = supabase.table(table).select("*", count="exact").limit(1).execute()
        print(f"✅ Table '{table}' exists. Rows: {response.count}")
    except Exception as e:
        print(f"❌ Table '{table}' check FAILED: {e}")
        all_exist = False

if all_exist:
    print("\nSUCCESS: All critical tables verify against the schema.")
else:
    print("\nWARNING: Some tables are missing or inaccessible.")
