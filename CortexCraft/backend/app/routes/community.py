from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import os
import secrets
from config.db import get_database
from bson import ObjectId
from datetime import datetime
import asyncio

router = APIRouter()

class ServerCreate(BaseModel):
    name: str
    initials: str

class ChannelCreate(BaseModel):
    server_id: str
    name: str
    
class MessageEdit(BaseModel):
    content: str
    user_id: str

class ConnectionManager:
    def __init__(self):
        # Maps channel_id to a dict of websocket -> user_info dict
        self.active_connections: Dict[str, Dict[WebSocket, dict]] = {}

    async def connect(self, websocket: WebSocket, channel_id: str, user_id: str, user_name: str):
        await websocket.accept()
        if channel_id not in self.active_connections:
            self.active_connections[channel_id] = {}
        self.active_connections[channel_id][websocket] = {"id": user_id, "name": user_name}

    def disconnect(self, websocket: WebSocket, channel_id: str):
        if channel_id in self.active_connections:
            if websocket in self.active_connections[channel_id]:
                del self.active_connections[channel_id][websocket]
            if not self.active_connections[channel_id]:
                del self.active_connections[channel_id]

    async def broadcast_event(self, channel_id: str, event_type: str, data: dict):
        if channel_id in self.active_connections:
            message = {"type": event_type, "data": data}
            dead_connections = []
            for connection in self.active_connections[channel_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            
            for dead in dead_connections:
                self.disconnect(dead, channel_id)

    async def broadcast_presence(self, channel_id: str):
        if channel_id in self.active_connections:
            users_map = {}
            for user_info in self.active_connections[channel_id].values():
                users_map[user_info["id"]] = user_info
            users_list = list(users_map.values())
            await self.broadcast_event(channel_id, "presence", {"users": users_list})

manager = ConnectionManager()

@router.websocket("/ws/community/{channel_id}/{user_id}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str, user_id: str, user_name: str):
    await manager.connect(websocket, channel_id, user_id, user_name)
    db = get_database()
    
    # Broadcast Presence 
    await manager.broadcast_presence(channel_id)

    # Broadcast Join System Message
    join_msg = {
        "_id": str(ObjectId()),
        "channel_id": channel_id,
        "sender_id": "system",
        "sender_name": "System",
        "content": f"{user_name} joined the channel.",
        "timestamp": datetime.utcnow().isoformat(),
        "is_system": True
    }
    await manager.broadcast_event(channel_id, "message", join_msg)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                event_type = payload.get("type", "message")
            except json.JSONDecodeError:
                event_type = "message"
                payload = {"content": data}

            if event_type == "typing":
                await manager.broadcast_event(
                    channel_id, 
                    "typing", 
                    {"user_id": user_id, "user_name": user_name, "is_typing": payload.get("is_typing", False)}
                )
                continue

            if event_type == "reaction":
                await manager.broadcast_event(
                    channel_id,
                    "reaction_add",
                    {"message_id": payload.get("message_id"), "emoji": payload.get("emoji"), "user_id": user_id}
                )
                # Ideally, you'd save this to DB, but for now, we'll relay it real-time.
                continue

            # Standard Message handling
            content = payload.get("content", "")
            attachment_url = payload.get("attachment_url", None)

            if not content.strip() and not attachment_url:
                continue

            new_msg = {
                "channel_id": channel_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "content": content,
                "attachment_url": attachment_url,
                "timestamp": datetime.utcnow()
            }
            if db is not None:
                result = await db["messages"].insert_one(new_msg.copy())
                new_msg["_id"] = str(result.inserted_id)
                new_msg["timestamp"] = new_msg["timestamp"].isoformat()
            else:
                new_msg["_id"] = str(ObjectId())
                new_msg["timestamp"] = datetime.utcnow().isoformat()

            new_msg["is_system"] = False
            await manager.broadcast_event(channel_id, "message", new_msg)

            # --- INNOVATION: AI COGNITIVE WATCHDOG ---
            asyncio.create_task(run_cognitive_watchdog(channel_id, user_name, content))

    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_id)
        await manager.broadcast_presence(channel_id)
        leave_msg = {
            "_id": str(ObjectId()),
            "channel_id": channel_id,
            "sender_id": "system",
            "sender_name": "System",
            "content": f"{user_name} left chat.",
            "timestamp": datetime.utcnow().isoformat(),
            "is_system": True
        }
        await manager.broadcast_event(channel_id, "message", leave_msg)

async def run_cognitive_watchdog(channel_id: str, sender_name: str, content: str):
    from groq import Groq
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or len(content.split()) < 4: return
    try:
        client = Groq(api_key=api_key)
        prompt = (
            "You are a Fact-Check AI called 'CortexWatch'. Scan the chat message for technical errors. "
            "If error found, respond ONLY 'Correction: [details]'. Else respond 'SAFE'.\n\n"
            f"Message from {sender_name}: '{content}'"
        )
        completion = client.chat.completions.create(model="llama-3.1-8b-instant", messages=[{"role": "user", "content": prompt}], temperature=0.0, max_tokens=100)
        res = completion.choices[0].message.content.strip()
        if "Correction:" in res:
            watchdog_msg = {"_id": str(ObjectId()), "channel_id": channel_id, "sender_id": "watchdog", "sender_name": "CortexWatch 🛡️", "content": f"{res} (Verified correction)", "timestamp": datetime.utcnow().isoformat(), "is_system": True, "is_watchdog": True}
            await asyncio.sleep(1.2)
            await manager.broadcast_event(channel_id, "message", watchdog_msg)
    except Exception: pass

@router.get("/community/servers")
async def get_servers():
    db = get_database()
    if db is None:
        return []
    try:
        cursor = db["servers"].find()
        servers = []
        async for server in cursor:
            server["id"] = str(server["_id"])
            del server["_id"]
            servers.append(server)
    except Exception as e:
        print(f"Error fetching servers: {e}")
        return []
    
    if not servers:
        # Default initialization
        default_servers = [
            {"name": "Frontend Guild", "initials": "FG", "isActive": True},
            {"name": "Backend Bros", "initials": "BB", "isActive": False},
            {"name": "AI Research", "initials": "AI", "isActive": False}
        ]
        for ds in default_servers:
            result = await db["servers"].insert_one(ds.copy())
            ds["id"] = str(result.inserted_id)
            servers.append(ds)

    return servers

@router.post("/community/servers")
async def create_server(server: ServerCreate):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    new_server = server.dict()
    new_server["isActive"] = False
    result = await db["servers"].insert_one(new_server.copy())
    new_server["id"] = str(result.inserted_id)
    return new_server

@router.get("/community/channels/{server_id}")
async def get_channels(server_id: str):
    db = get_database()
    if db is None:
        return []
    
    try:
        cursor = db["channels"].find({"server_id": server_id})
        channels = []
        async for channel in cursor:
            channel["id"] = str(channel["_id"])
            del channel["_id"]
            channels.append(channel)
    except Exception as e:
        print(f"Error fetching channels: {e}")
        return []

    if not channels and len(server_id) < 10:
        # It's an initial default fetch attempt if they were never created properly, just create some defaults
        default_channels = [
            {"name": "general", "type": "text", "server_id": server_id},
            {"name": "help-and-support", "type": "text", "server_id": server_id},
            {"name": "projects-showcase", "type": "text", "server_id": server_id}
        ]
        for dc in default_channels:
            result = await db["channels"].insert_one(dc.copy())
            dc["id"] = str(result.inserted_id)
            channels.append(dc)

    return channels

@router.post("/community/channels")
async def create_channel(channel: ChannelCreate):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    new_channel = channel.dict()
    new_channel["type"] = "text"
    result = await db["channels"].insert_one(new_channel.copy())
    new_channel["id"] = str(result.inserted_id)
    return new_channel

@router.get("/community/messages/{channel_id}")
async def get_messages(channel_id: str):
    db = get_database()
    if db is None:
        return []
    
    try:
        cursor = db["messages"].find({"channel_id": channel_id}).sort("timestamp", 1).limit(100)
        messages = []
        async for msg in cursor:
            msg["_id"] = str(msg["_id"]) 
            msg["timestamp"] = msg["timestamp"].isoformat()
            msg["is_system"] = msg.get("is_system", False)
            messages.append(msg)
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return []
    return messages

@router.put("/community/messages/{message_id}")
async def update_message(message_id: str, edit_data: MessageEdit):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        obj_id = ObjectId(message_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid message ID")
        
    msg = await db["messages"].find_one({"_id": obj_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if msg["sender_id"] != edit_data.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to edit this message")
        
    await db["messages"].update_one({"_id": obj_id}, {"$set": {"content": edit_data.content, "edited": True}})
    
    # Broadcast edit
    await manager.broadcast_event(
        msg["channel_id"], 
        "message_edit", 
        {"_id": message_id, "content": edit_data.content}
    )
    return {"status": "success"}

@router.delete("/community/messages/{message_id}")
async def delete_message(message_id: str, user_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        obj_id = ObjectId(message_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid message ID")
        
    msg = await db["messages"].find_one({"_id": obj_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if msg["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this message")
        
    await db["messages"].delete_one({"_id": obj_id})
    
    # Broadcast delete
    await manager.broadcast_event(
        msg["channel_id"], 
        "message_delete", 
        {"_id": message_id}
    )
    return {"status": "success"}

@router.post("/community/upload")
async def upload_file(file: UploadFile = File(...)):
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{secrets.token_hex(8)}.{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
        
    return {"url": f"http://localhost:8000/uploads/{filename}"}
