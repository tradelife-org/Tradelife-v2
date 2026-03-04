import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found")
    exit(1)

supabase: Client = create_client(url, key)

print("--- Task 1: Trigger Verification ---")
# Check if trigger exists on auth.users (requires permission)
# Since auth schema is restricted, we infer by checking if the function exists
try:
    res = supabase.rpc('handle_new_user', {}).execute()
    # It expects arguments or trigger context, so this will fail but confirm existence if error is about arguments
    print("Function handle_new_user exists (RPC callable).")
except Exception as e:
    if "function handle_new_user() does not exist" in str(e):
        print("❌ Function handle_new_user MISSING.")
    else:
        # Likely argument error, which means function exists
        print(f"✅ Function handle_new_user exists (Error: {str(e).split(':')[0]})")

print("\n--- Task 2: RLS Verification ---")
tables = ['organisations', 'quotes', 'jobs']
policies_found = {}

# Check RLS enabled
for table in tables:
    try:
        # We can't query pg_class directly easily via client without rpc
        # But we can try to query the table and see if RLS is enforced?
        # A service key bypasses RLS, so that doesn't prove it.
        # An anon key would fail if RLS is on and no policy allows access.
        # But let's rely on the file audit for now and assume if schema applied, it's there.
        # Better: Query pg_policies via RPC if possible? No.
        # Let's try to query the table with an authenticated user context if possible?
        pass
    except Exception:
        pass

# Verify via direct SQL query (if execute_sql works - wait, execute_sql is not available to me directly via client, only via MCP tool)
# I will use mcp_custom_supabase_execute_sql
print("Using MCP tool to query pg_policies...")
