import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError

MONGODB_URL   = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "cortexcraft"

client = None
db     = None

async def connect_to_mongo():
    global client, db
    try:
        # We set a shorter timeout so it doesn't hang the lifecycle for 30s if unreachable
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        db     = client[DATABASE_NAME]
        
        # Trigger a simple command to verify connectivity
        await client.admin.command('ping')
        print(f"✅ [DB] Successfully connected to MongoDB: {DATABASE_NAME}")
    except ServerSelectionTimeoutError:
        print("❌ [DB] ERROR: Could not connect to MongoDB Atlas.")
        print("👉 Possible reasons:")
        print("   1. Your current IP might not be whitelisted on MongoDB Atlas.")
        print("   2. Network connection issue or Firewall blocking port 27017.")
        print("   3. Database URL is incorrect.")
        print("\n🔧 Try using local MongoDB or check your Atlas 'Network Access' settings.")
        
        # Fallback to local if Atlas failed (Optional, but helps keep app running)
        if "mongodb+srv" in MONGODB_URL:
             print("🔄 Attempting to fallback to Local MongoDB (localhost:27017)...")
             try:
                 client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
                 db = client[DATABASE_NAME]
                 await client.admin.command('ping')
                 print(f"✅ [DB] Fallback successful! Connected to Local MongoDB.")
             except:
                 print("❌ [DB] Local MongoDB also unavailable.")
                 db = None
    except Exception as e:
        print(f"❌ [DB] Unexpected error connecting to MongoDB: {e}")
        db = None

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("[DB] Closed MongoDB connection")

def get_database():
    return db
