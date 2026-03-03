import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="TradeLife v2 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mnmqfhdyypeiioscerjv.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


class AcceptQuoteRequest(BaseModel):
    share_token: str


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "tradelife-v2"}


@app.post("/api/health")
async def accept_quote_via_health(body: AcceptQuoteRequest):
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient() as client:
        # Fetch quote by share_token
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/quotes",
            params={"select": "id,status", "share_token": f"eq.{body.share_token}"},
            headers=headers,
        )
        quotes = resp.json()

        if not quotes or len(quotes) == 0:
            return {"success": False, "error": "Quote not found"}

        quote = quotes[0]

        if quote["status"] == "ACCEPTED":
            return {"success": True}

        if quote["status"] != "SENT":
            return {"success": False, "error": "This quote cannot be accepted in its current state"}

        # Update to ACCEPTED
        update_resp = await client.patch(
            f"{SUPABASE_URL}/rest/v1/quotes",
            params={"id": f"eq.{quote['id']}"},
            headers=headers,
            json={"status": "ACCEPTED"},
        )

        if update_resp.status_code >= 400:
            return {"success": False, "error": f"Update failed: {update_resp.text}"}

        return {"success": True}
