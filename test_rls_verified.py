import os
import time
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env
load_dotenv('/app/frontend/.env')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
anon_key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
service_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not anon_key or not service_key:
    print("❌ Error: Missing keys in .env")
    exit(1)

# Admin client
admin_client: Client = create_client(url, service_key)

def create_verified_user(email, password, full_name):
    try:
        user_attributes = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name}
        }
        res = admin_client.auth.admin.create_user(user_attributes)
        user = res.user
        
        if user:
            # Sign in to get session
            client = create_client(url, anon_key)
            session_res = client.auth.sign_in_with_password({"email": email, "password": password})
            if session_res.user:
                return client, session_res.user
            else:
                print(f"Sign in failed for {email}")
                return None, None
        else:
            print(f"Admin create user failed for {email}")
            return None, None
    except Exception as e:
        print(f"Failed to create user {email}: {e}")
        return None, None

def ensure_org_and_profile(user_id, email, full_name):
    try:
        # Check if exists
        # Use table() instead of from_()
        p = admin_client.table("profiles").select("*").eq("id", user_id).execute()
        if p.data:
            return p.data[0]['org_id']

        print(f"⚠️ Manual seeding for {email}")
        
        # Create Org
        # Insert returns data directly in recent versions? Let's assume yes or add execute()
        # Explicitly chaining .execute() is safer
        org_data = {"name": f"{full_name}'s Org"}
        # For python client, insert returns a builder, .execute() returns APIResponse
        # If we want data back, we rely on Prefer: return=representation header which is default?
        # Let's try explicit .execute()
        org_res = admin_client.table("organisations").insert(org_data).execute()
        
        if not org_res.data:
             print("Failed to create org (no data returned)")
             return None
        org_id = org_res.data[0]['id']

        # Create Profile
        profile_data = {
            "id": user_id,
            "org_id": org_id,
            "full_name": full_name,
            "email": email,
            "role": "owner"
        }
        admin_client.table("profiles").insert(profile_data).execute()
        
        return org_id
    except Exception as e:
        print(f"Manual seed failed: {e}")
        # import traceback
        # traceback.print_exc()
        return None

def cleanup_user(user_id):
    if user_id:
        try:
            admin_client.auth.admin.delete_user(user_id)
            print(f"Cleaned up user {user_id}")
        except Exception as e:
            print(f"Cleanup failed for {user_id}: {e}")

print("--- Starting RLS Verification (Resilient Mode v2) ---")

unique_id = uuid.uuid4().hex[:6]
email_a = f"alice.v2.{unique_id}@example.com"
email_b = f"bob.v2.{unique_id}@example.com"
password = "TestPassword123!"

user_a_client, user_a = create_verified_user(email_a, password, "Alice V2")
user_b_client, user_b = create_verified_user(email_b, password, "Bob V2")

if not user_a or not user_b:
    print("❌ User creation failed. Aborting.")
    if user_a: cleanup_user(user_a.id)
    if user_b: cleanup_user(user_b.id)
    exit(1)

print(f"✅ Users Created: A ({user_a.id}), B ({user_b.id})")

# Ensure setup
org_id_a = ensure_org_and_profile(user_a.id, email_a, "Alice V2")
org_id_b = ensure_org_and_profile(user_b.id, email_b, "Bob V2")

if not org_id_a or not org_id_b:
    print("❌ Failed to setup Org/Profile. Aborting.")
    cleanup_user(user_a.id)
    cleanup_user(user_b.id)
    exit(1)

try:
    # 2. Verify RLS Isolation (Task 2)
    print("\n--- Verifying Task 2 (RLS Isolation) ---")
    
    # Test A: User A querying organisations table
    all_orgs_view_a = user_a_client.table("organisations").select("*", count="exact").execute()
    count_a = len(all_orgs_view_a.data)
    
    if count_a == 1 and all_orgs_view_a.data[0]['id'] == org_id_a:
        print(f"✅ RLS Verified: User A sees exactly 1 org.")
    else:
        print(f"❌ RLS Failed: User A sees {count_a} orgs.")
        print(f"Dump: {all_orgs_view_a.data}")

    # Test B: User A trying to access User B's org directly by ID
    res = user_a_client.table("organisations").select("*").eq("id", org_id_b).execute()
    if len(res.data) == 0:
        print("✅ RLS Verified: User A cannot fetch User B's org by ID.")
    else:
        print("❌ RLS Failed: User A fetched User B's org!")

    # Test C: Cross-Tenant Data Access (Quotes)
    print("\n--- Verifying Quotes RLS ---")
    quote_payload = {
        "org_id": org_id_b,
        "quote_amount_net": 1000,
        "quote_amount_gross": 1200,
        "vat_rate": 2000,
        "reference": "Quote-B-RLS"
    }
    
    try:
        # User B creates quote
        q_res = user_b_client.table("quotes").insert(quote_payload).execute()
        if q_res.data:
            quote_id = q_res.data[0]['id']
            print(f"✅ User B created quote {quote_id}")
            
            # User A tries to read this quote
            qa_res = user_a_client.table("quotes").select("*").eq("id", quote_id).execute()
            if len(qa_res.data) == 0:
                print("✅ RLS Verified: User A cannot see User B's quote.")
            else:
                print("❌ RLS Failed: User A saw User B's quote!")
        else:
            print("❌ User B failed to create quote.")
    except Exception as e:
         print(f"Quote creation error: {e}")

except Exception as e:
    print(f"Test Execution Error: {e}")
    import traceback
    traceback.print_exc()

finally:
    print("\n--- Cleaning Up ---")
    cleanup_user(user_a.id)
    cleanup_user(user_b.id)
