import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import json
from groq import Groq

router = APIRouter()

class ReviewRequest(BaseModel):
    code: str
    language: str

class CodeRoomManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.room_code: Dict[str, str] = {}
        self.room_language: Dict[str, str] = {}
        self.room_users: Dict[str, Dict[WebSocket, dict]] = {}
        # cursor: room_id -> {user_id: {line, column, name, color}}
        self.room_cursors: Dict[str, Dict[str, dict]] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user_id: str, user_name: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
            self.room_code[room_id] = f"# Welcome to CortexCraft Collaborative IDE\n# Room: {room_id}\n\nprint('Hello, World!')\n"
            self.room_language[room_id] = "python"
            self.room_users[room_id] = {}
            self.room_cursors[room_id] = {}

        self.active_rooms[room_id].append(websocket)
        self.room_users[room_id][websocket] = {"id": user_id, "name": user_name}

        await websocket.send_json({
            "type": "init_state",
            "code": self.room_code[room_id],
            "language": self.room_language[room_id],
            # Send existing cursors so new joiner sees teammates immediately
            "cursors": list(self.room_cursors.get(room_id, {}).values()),
        })
        await self.broadcast_presence(room_id)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_rooms:
            user_info = self.room_users.get(room_id, {}).get(websocket)
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
            if websocket in self.room_users.get(room_id, {}):
                del self.room_users[room_id][websocket]
            # Remove this user's cursor
            if user_info and room_id in self.room_cursors:
                self.room_cursors[room_id].pop(user_info["id"], None)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
                del self.room_code[room_id]
                del self.room_language[room_id]
                del self.room_users[room_id]
                self.room_cursors.pop(room_id, None)

    async def broadcast_presence(self, room_id: str):
        if room_id not in self.active_rooms:
            return
        users = list(self.room_users[room_id].values())
        for conn in self.active_rooms[room_id]:
            try:
                await conn.send_json({"type": "presence", "users": users})
            except Exception:
                pass

    async def broadcast_code_update(self, room_id: str, new_code: str, sender: WebSocket):
        self.room_code[room_id] = new_code
        for conn in self.active_rooms.get(room_id, []):
            if conn != sender:
                try:
                    await conn.send_json({"type": "code_update", "code": new_code})
                except Exception:
                    pass

    async def broadcast_language_update(self, room_id: str, new_lang: str, sender: WebSocket):
        self.room_language[room_id] = new_lang
        for conn in self.active_rooms.get(room_id, []):
            if conn != sender:
                try:
                    await conn.send_json({"type": "language_update", "language": new_lang})
                except Exception:
                    pass

    async def broadcast_cursor(self, room_id: str, cursor_data: dict, sender: WebSocket):
        """Store + fanout cursor position to all peers except sender."""
        user_id = cursor_data.get("userId")
        if room_id in self.room_cursors and user_id:
            self.room_cursors[room_id][user_id] = cursor_data
        for conn in self.active_rooms.get(room_id, []):
            if conn != sender:
                try:
                    await conn.send_json({"type": "cursor_update", **cursor_data})
                except Exception:
                    pass


manager = CodeRoomManager()


@router.websocket("/ws/code/{room_id}/{user_id}/{user_name}")
async def code_endpoint(websocket: WebSocket, room_id: str, user_id: str, user_name: str):
    await manager.connect(room_id, websocket, user_id, user_name)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                ptype = payload.get("type")
                if ptype == "code_change":
                    await manager.broadcast_code_update(room_id, payload.get("code", ""), websocket)
                elif ptype == "language_change":
                    await manager.broadcast_language_update(room_id, payload.get("language", "python"), websocket)
                elif ptype == "cursor_update":
                    await manager.broadcast_cursor(room_id, payload, websocket)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast_presence(room_id)


class ExecuteRequest(BaseModel):
    code: str
    language: str

@router.post("/code/execute")
async def execute_code(req: ExecuteRequest):
    """
    Simulates code execution using Groq LLM.
    Works on all platforms (Windows/Linux/Mac) without subprocess issues.
    """
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

        client = Groq(api_key=api_key)

        prompt = (
            f"You are a {req.language} code interpreter. "
            f"Execute the following {req.language} code EXACTLY as a real interpreter would. "
            "Output ONLY what the program would print to stdout/stderr. "
            "Do NOT explain anything. Do NOT add markdown. Do NOT add extra text. "
            "If there is a runtime error, output the exact error message as a real interpreter would. "
            "If the code produces no output, respond with exactly: (no output)\n\n"
            f"Code:\n{req.code}"
        )

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=1024,
        )

        output = completion.choices[0].message.content.strip()

        # Check if LLM returned an error simulation
        is_error = any(kw in output.lower() for kw in [
            "error:", "traceback", "syntaxerror", "nameerror", "typeerror",
            "valueerror", "indexerror", "exception", "runtimeerror", "stderr"
        ])

        return {
            "stdout": "" if is_error else output,
            "stderr": output if is_error else "",
            "exit_code": 1 if is_error else 0,
            "timed_out": False
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────
# AI CODE REVIEW  (Groq)
# ─────────────────────────
@router.post("/code/review")
async def review_code(req: ReviewRequest):
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment.")

        client = Groq(api_key=api_key)

        prompt = (
            f"You are a Socratic Code Mentor. Your primary goal is to GUIDE the student to the answer, NOT to provide the code directly. "
            f"Review the following {req.language} code. "
            "1. If there is a bug, DO NOT FIX IT. Instead, describe the behavior the bug might cause and ask a question that leads the student to find the mistake. "
            "2. Use metaphors to explain complex concepts. "
            "3. Ask 'what if' questions to encourage edge-case thinking. "
            "4. NEVER provide more than 2 lines of code in your response. "
            "5. Use friendly, encouraging tone. Avoid jargon where possible.\n\n"
            f"Code:\n```{req.language}\n{req.code}\n```"
        )

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048,
        )

        return {"review": completion.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))