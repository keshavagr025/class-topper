import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

async def check():
    try:
        db_url = os.getenv("DATABASE_URL") or os.getenv("MONGODB_URL") or "mongodb://localhost:27017"
        client = motor.motor_asyncio.AsyncIOMotorClient(db_url)
        db = client['cortexcraft']
        servers = await db['servers'].find().to_list(100)
        print(f"DEBUG: Found {len(servers)} servers in DB")
        for s in servers:
            print(f" - {s['name']} (ID: {s['_id']})")
    except Exception as e:
        print(f"DEBUG ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check())
