"""
CortexCraft IDE — Socket.IO real-time collaboration server.
Events: join_room, code_change, language_change, cursor_move
"""
import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)

# rooms[room_id] = { code, language, users: {sid: {id,name}}, cursors: {uid: {...}} }
rooms: dict = {}
# sid -> room_id (for fast disconnect lookup)
sid_to_room: dict = {}


def _users_list(room_id: str):
    """Return serialisable user list for a room."""
    return list(rooms[room_id]["users"].values()) if room_id in rooms else []


# ── Connect / Disconnect ─────────────────────────────────────────────────────
@sio.event
async def connect(sid, environ, auth=None):
    print(f"[SOCKET] ✅ connected  sid={sid}")


@sio.event
async def disconnect(sid):
    print(f"[SOCKET] ❌ disconnected  sid={sid}")
    room_id = sid_to_room.pop(sid, None)
    if not room_id or room_id not in rooms:
        return

    # Remove user
    rooms[room_id]["users"].pop(sid, None)

    # Broadcast updated presence
    users = _users_list(room_id)
    await sio.emit("presence", {"users": users}, room=room_id)
    print(f"[SOCKET] presence after disconnect → room={room_id}  users={[u['name'] for u in users]}")

    # Clean up empty rooms
    if not rooms[room_id]["users"]:
        del rooms[room_id]
        print(f"[SOCKET] room deleted: {room_id}")


# ── Join room ────────────────────────────────────────────────────────────────
@sio.on("join_room")
async def join_room(sid, data):
    raw_room  = (data.get("roomId") or "general").strip()
    user_id   = data.get("userId",   sid)
    user_name = data.get("userName", "Anonymous")

    # ── Sanitize: if someone accidentally sends a full URL extract just the
    #             query-param value (e.g. "http://localhost:5173/code?room=AB12-CD34")
    from urllib.parse import urlparse, parse_qs
    try:
        parsed = urlparse(raw_room)
        if parsed.scheme in ("http", "https"):
            params = parse_qs(parsed.query)
            raw_room = (params.get("room") or params.get("ROOM") or [raw_room])[0]
    except Exception:
        pass

    room_id = raw_room.upper()
    print(f"[SOCKET] join_room  sid={sid}  room={room_id}  user={user_name}")

    # Create room if first visitor
    if room_id not in rooms:
        rooms[room_id] = {
            "code": (
                f"# CortexCraft Collaborative IDE\n"
                f"# Room: {room_id}\n\n"
                f"print('Hello, World!')\n"
            ),
            "language": "python",
            "users":   {},
            "cursors": {},
        }

    # Register in Socket.IO room
    await sio.enter_room(sid, room_id)
    rooms[room_id]["users"][sid] = {"id": user_id, "name": user_name}
    sid_to_room[sid] = room_id

    # 1️⃣  Send current state to the joiner only
    await sio.emit(
        "init_state",
        {
            "code":     rooms[room_id]["code"],
            "language": rooms[room_id]["language"],
            "cursors":  list(rooms[room_id]["cursors"].values()),
        },
        to=sid,
    )

    # 2️⃣  Broadcast updated presence to EVERYONE in the room (including joiner)
    users = _users_list(room_id)
    await sio.emit("presence", {"users": users}, room=room_id)
    print(f"[SOCKET] presence broadcast → room={room_id}  users={[u['name'] for u in users]}")


# ── Code change ───────────────────────────────────────────────────────────────
@sio.on("code_change")
async def code_change(sid, data):
    room_id  = data.get("roomId", "")
    new_code = data.get("code", "")
    if room_id not in rooms:
        return
    rooms[room_id]["code"] = new_code
    await sio.emit("code_update", {"code": new_code}, room=room_id, skip_sid=sid)


# ── Language change ───────────────────────────────────────────────────────────
@sio.on("language_change")
async def language_change(sid, data):
    room_id  = data.get("roomId", "")
    new_lang = data.get("language", "python")
    if room_id not in rooms:
        return
    rooms[room_id]["language"] = new_lang
    await sio.emit("language_update", {"language": new_lang}, room=room_id, skip_sid=sid)


# ── Cursor tracking ───────────────────────────────────────────────────────────
@sio.on("cursor_move")
async def cursor_move(sid, data):
    room_id = data.get("roomId", "")
    uid     = data.get("userId", "")
    if room_id not in rooms or not uid:
        return
    rooms[room_id]["cursors"][uid] = data
    await sio.emit("cursor_update", data, room=room_id, skip_sid=sid)
