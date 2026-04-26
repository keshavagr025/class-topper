import asyncio
import motor.motor_asyncio

async def check():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['cortexcraft']
        servers = await db['servers'].find().to_list(100)
        print(f"DEBUG: Found {len(servers)} servers in DB")
        for s in servers:
            print(f" - {s['name']} (ID: {s['_id']})")
    except Exception as e:
        print(f"DEBUG ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check())
