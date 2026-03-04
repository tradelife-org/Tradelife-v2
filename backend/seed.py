import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random

# Use localhost for seeding inside the container if MONGO_URL not set
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/tradelife")

async def seed():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.tradelife
    
    # Clear existing
    await db.jobs.delete_many({})
    await db.ledger.delete_many({})
    
    print("Cleared existing data.")
    
    # --- Jobs ---
    jobs = []
    statuses = ["ENQUIRY", "BOOKED", "ON_SITE", "COMPLETED", "SNAGGING", "SIGNED_OFF", "CANCELLED"]
    
    for i in range(1, 11):
        status = random.choice(statuses)
        start_date = datetime.utcnow() + timedelta(days=random.randint(-10, 30))
        end_date = start_date + timedelta(days=random.randint(5, 20))
        
        job = {
            "title": f"Job #{i} - {random.choice(['Kitchen Reno', 'Bathroom Fit', 'Extension', 'Loft Conversion'])}",
            "client_name": f"Client {i}",
            "status": status,
            "start_date": start_date,
            "end_date": end_date,
            "value_gross": random.randint(100000, 5000000), # 1k to 50k GBP
            "created_at": datetime.utcnow()
        }
        jobs.append(job)
        
    await db.jobs.insert_many(jobs)
    print(f"Inserted {len(jobs)} jobs.")
    
    # --- Ledger ---
    ledger_entries = []
    categories = ["EXPENSE", "RECOGNIZED_REVENUE", "RETENTION_HELD", "RETENTION_RELEASED"]
    
    for i in range(1, 50):
        category = random.choice(categories)
        amount = random.randint(1000, 500000) # 10 to 5000 GBP
        
        # Make expenses negative conceptually? 
        # The prompt implies "Burn Rate" is sum of expenses. Usually stored as positive amounts with category tag.
        # But `transaction_type` helps distinguish credit/debit.
        
        transaction_type = "DEBIT" if category in ["EXPENSE", "RETENTION_HELD"] else "CREDIT"
        
        entry = {
            "amount": amount,
            "category": category,
            "description": f"Transaction {i}",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 60)),
            "transaction_type": transaction_type
        }
        ledger_entries.append(entry)
        
    await db.ledger.insert_many(ledger_entries)
    print(f"Inserted {len(ledger_entries)} ledger entries.")
    
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
