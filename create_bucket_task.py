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

print("Attempting to create bucket 'gallery'...")
try:
    # API create_bucket(id, options)
    # The 'id' param is 'gallery'
    res = supabase.storage.create_bucket('gallery', {'public': True})
    print(f"✅ Bucket 'gallery' created: {res}")
except Exception as e:
    # Error usually includes "Bucket already exists"
    if "Bucket already exists" in str(e):
        print("✅ Bucket 'gallery' already exists.")
    else:
        print(f"❌ Bucket creation failed: {e}")
