import asyncio
import motor.motor_asyncio
from bson import ObjectId
from datetime import datetime, timedelta
import random

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "cortexcraft"

messages_templates = [
    "Anyone got the syllabus for the mid-terms?",
    "Maths sample papers are so tough this time!",
    "Just shared the Physics notes in the drive, check it out.",
    "Bhai boards ki taiyari kaisi chal rhi hai?",
    "Class 11 Science is way harder than 10th lol.",
    "Anyone up for a group study session tonight?",
    "Does anyone have the Chemistry lab practical manual?",
    "I'm struggling with Trigonometry, can someone help?",
    "History is so boring, how do you guys memorize dates?",
    "Sample paper link: http://localhost:8000/notes/sample-1.pdf",
    "Finally finished the English project!",
    "Practical exams are starting from next week."
]

student_names = ["Aryan", "Simran", "Kabir", "Sneha", "Rohan", "Ishita", "Yash", "Ananya", "Varun", "Mehak", "Abhinav", "Kriti"]

async def seed_data():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # 1. Clear existing servers/channels if needed (Optional, but better to just add)
    # We will create a fresh Academic Server
    server_data = {
        "name": "Academic Vortex (Grade 6-12)",
        "initials": "AV",
        "isActive": True
    }
    server_result = await db["servers"].insert_one(server_data)
    server_id = str(server_result.inserted_id)
    
    print(f"Created Server: {server_data['name']}")

    # 2. Create Channels for Class 6 to 12
    channels = []
    for grade in range(6, 13):
        channel_name = f"grade-{grade}-squad"
        if grade >= 10:
            channel_name = f"grade-{grade}-board-prep"
            
        chan = {
            "name": channel_name,
            "type": "text",
            "server_id": server_id
        }
        res = await db["channels"].insert_one(chan)
        channels.append({"id": str(res.inserted_id), "name": channel_name})
        print(f"Created Channel: {channel_name}")

    # 3. Add Mock Messages to look "Real-time"
    for chan in channels:
        # Add 5-8 random messages per channel
        num_msgs = random.randint(5, 10)
        for i in range(num_msgs):
            sender = random.choice(student_names)
            content = random.choice(messages_templates)
            # Create a spread of timestamps in the last 24 hours
            time_ago = random.randint(1, 1440) 
            msg_time = datetime.utcnow() - timedelta(minutes=time_ago)
            
            msg = {
                "channel_id": chan["id"],
                "sender_id": f"student_{random.randint(100, 999)}",
                "sender_name": sender,
                "content": content,
                "timestamp": msg_time,
                "is_system": False
            }
            await db["messages"].insert_one(msg)
            
    print("Seed complete! Community is now populated with Student data.")

if __name__ == "__main__":
    asyncio.run(seed_data())
