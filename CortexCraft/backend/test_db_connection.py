import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Manually parse .env to avoid dependency on dotenv if not installed in basic env
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), 'app', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip()

async def test_conn():
    load_env()
    db_url = os.getenv("DATABASE_URL")
    print(f"Loaded DATABASE_URL: {db_url}")
    if not db_url:
        print("DATABASE_URL is not set in environment.")
        return
        
    try:
        client = AsyncIOMotorClient(db_url, serverSelectionTimeoutMS=5000)
        # Ping the server
        await client.admin.command('ping')
        print("SUCCESS: Successfully connected to MongoDB Atlas!")
        db = client["cortexcraft"]
        collections = await db.list_collection_names()
        print(f"Collections in database 'cortexcraft': {collections}")
    except Exception as e:
        print(f"FAILED: Could not connect to MongoDB. Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
