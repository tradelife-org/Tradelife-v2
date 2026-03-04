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

# Using raw requests for bucket creation as supabase-py might have version mismatch?
# But bucket ID should be string. 'gallery' is string.
# Maybe I should pass object?
# API doc says POST /storage/v1/bucket { "id": "gallery", "name": "gallery", "public": true }
# Let's try raw HTTP request.

headers = {
    "Authorization": f"Bearer {key}",
    "apikey": key,
    "Content-Type": "application/json"
}

payload = {
    "id": "gallery",
    "name": "gallery",
    "public": True
}

try:
    res = requests.post(f"{url}/storage/v1/bucket", json=payload, headers=headers)
    if res.status_code == 200 or res.status_code == 201:
        print("✅ Bucket 'gallery' created via REST.")
    elif res.status_code == 400 and "already exists" in res.text:
        print("✅ Bucket 'gallery' already exists.")
    else:
        print(f"❌ Bucket creation failed: {res.status_code} {res.text}")
except Exception as e:
    print(f"❌ Request failed: {e}")
