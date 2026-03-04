import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TradeLife Command Center API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/tradelife")
client = AsyncIOMotorClient(MONGO_URL)
db = client.tradelife

# --- Models ---
# Not strictly used for return types if returning dicts, but good for docs
class Job(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    client_name: str
    status: str 
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    value_gross: int 

# --- Routes ---

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "tradelife-command-center"}

@app.post("/api/daily-brief")
async def get_daily_brief():
    """
    Summarize Burn Rate, Recognized Revenue, and Next 3 Schedule Items.
    """
    # 1. Burn Rate (Expenses in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    pipeline_burn = [
        {
            "$match": {
                "category": "EXPENSE",
                "created_at": {"$gte": thirty_days_ago}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }
        }
    ]
    burn_cursor = db.ledger.aggregate(pipeline_burn)
    burn_result = await burn_cursor.to_list(length=1)
    monthly_burn = burn_result[0]["total"] if burn_result else 0
    
    # 2. Recognized Revenue (Last 30 days)
    pipeline_rev = [
        {
            "$match": {
                "category": "RECOGNIZED_REVENUE",
                "created_at": {"$gte": thirty_days_ago}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }
        }
    ]
    rev_cursor = db.ledger.aggregate(pipeline_rev)
    rev_result = await rev_cursor.to_list(length=1)
    recognized_revenue = rev_result[0]["total"] if rev_result else 0
    
    # 3. Next 3 Schedule Items (Jobs starting soon or active)
    now = datetime.utcnow()
    schedule_cursor = db.jobs.find(
        {"start_date": {"$gte": now}}
    ).sort("start_date", 1).limit(3)
    
    schedule_items = []
    async for job in schedule_cursor:
        schedule_items.append({
            "id": str(job["_id"]), # Convert ObjectId to string
            "title": job["title"],
            "date": job["start_date"]
        })

    return {
        "burn_rate": monthly_burn,
        "recognized_revenue": recognized_revenue,
        "schedule_items": schedule_items
    }

@app.get("/api/widgets")
async def get_widgets_data():
    # 1. Attention Needed
    attention_cursor = db.jobs.find({"status": {"$in": ["SNAGGING", "DELAYED"]}}).limit(5)
    attention_needed = []
    async for j in attention_cursor:
        attention_needed.append({
            "id": str(j["_id"]),
            "title": j["title"],
            "issue": "Requires Update"
        })
    
    # 2. Active Projects
    active_cursor = db.jobs.find({"status": "ON_SITE"}).limit(5)
    active_projects = []
    async for j in active_cursor:
        active_projects.append({
            "id": str(j["_id"]),
            "title": j["title"],
            "client": j.get("client_name", "Unknown")
        })
    
    # 3. Live Projects
    live_cursor = db.jobs.find({"status": {"$in": ["ON_SITE", "BOOKED"]}}).limit(3)
    live_projects = []
    async for j in live_cursor:
        live_projects.append({
            "id": str(j["_id"]),
            "title": j["title"],
            "progress": 75 # Mock
        })
    
    # 4. TTE Schedule
    tte_cursor = db.jobs.find({"start_date": {"$gte": datetime.utcnow()}}).sort("start_date", 1).limit(5)
    tte_schedule = []
    async for j in tte_cursor:
        tte_schedule.append({
            "id": str(j["_id"]),
            "title": j["title"],
            "date": j["start_date"]
        })
    
    # 5. Financial Overview
    pipeline_fin = [
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    fin_cursor = db.ledger.aggregate(pipeline_fin)
    fin_data = {}
    async for doc in fin_cursor:
        fin_data[doc["_id"]] = doc["total"]
        
    financial_overview = {
        "revenue": fin_data.get("RECOGNIZED_REVENUE", 0),
        "expenses": fin_data.get("EXPENSE", 0),
        "retention": fin_data.get("RETENTION_HELD", 0)
    }

    return {
        "attention_needed": attention_needed,
        "active_projects": active_projects,
        "live_projects": live_projects,
        "tte_schedule": tte_schedule,
        "urgent_tasks": [], # Placeholder
        "financial_overview": financial_overview
    }

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
