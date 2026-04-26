import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Hash, Users, Plus, X,
  Settings, User as UserIcon, Send, Search, Bell, Edit2, Trash2, PlusCircle, Paperclip, ShieldCheck
} from 'lucide-react';
import '../index.css';
import '../community.css';
import DiscordSettings from '../components/chat/DiscordSettings';

interface Server {
  id: string;
  name: string;
  initials: string;
  isActive?: boolean;
}

interface Channel {
  id: string;
  server_id: string;
  name: string;
  type: string;
}

interface Message {
  _id: string;
  sender_name: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  timestamp: string;
  is_system?: boolean;
  is_watchdog?: boolean;
  edited?: boolean;
}

interface OnlineUser {
  id: string;
  name: string;
}

const Community = () => {
    const [servers, setServers] = useState<Server[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeServer, setActiveServer] = useState<string>("");
    const [activeChannel, setActiveChannel] = useState<string>("");
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [typingUsers, setTypingUsers] = useState<{[key:string]: string}>({});
    const [reactions, setReactions] = useState<{[key:string]: {[emoji:string]: number}}>({});
    
    // User Identity Logic
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [nameInput, setNameInput] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<any>(null);

    // Modals state
    const [showServerModal, setShowServerModal] = useState(false);
    const [newServerName, setNewServerName] = useState("");
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Edit message state
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<any>(null);

    // Load initial user
    useEffect(() => {
        const storedUser = localStorage.getItem("cortexcraft_user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const fetchServers = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/community/servers`);
            if (res.ok) {
                const data = await res.json();
                setServers(data);
                if (data.length > 0 && !activeServer) {
                    setActiveServer(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch servers", error);
        }
    };

    const fetchChannels = useCallback(async () => {
        if (!activeServer) return;
        try {
            const res = await fetch(`http://localhost:8000/api/community/channels/${activeServer}`);
            if (res.ok) {
                const data = await res.json();
                setChannels(data);
                if (data.length > 0) {
                    setActiveChannel(data[0].id);
                } else {
                    setActiveChannel("");
                }
            }
        } catch (error) {
            console.error("Failed to fetch channels", error);
        }
    }, [activeServer]);

    const fetchMessages = useCallback(async () => {
        if (!activeChannel) return;
        try {
            const res = await fetch(`http://localhost:8000/api/community/messages/${activeChannel}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                scrollToBottom();
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    }, [activeChannel]);

    useEffect(() => {
        if (currentUser) fetchServers();
    }, [currentUser]);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // WebSocket Connection handling
    useEffect(() => {
        if (!currentUser || !activeChannel) return;

        if (wsRef.current) wsRef.current.close();

        const wsUrl = `ws://localhost:8000/api/ws/community/${activeChannel}/${currentUser.id}/${encodeURIComponent(currentUser.name)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            if (payload.type === 'message') {
                setMessages((prev) => [...prev, payload.data]);
                scrollToBottom();
            } else if (payload.type === 'presence') {
                setOnlineUsers(payload.data.users || []);
            } else if (payload.type === 'message_edit') {
                setMessages((prev) => prev.map(m => m._id === payload.data._id ? { ...m, content: payload.data.content, edited: true } : m));
            } else if (payload.type === 'message_delete') {
                setMessages((prev) => prev.filter(m => m._id !== payload.data._id));
            } else if (payload.type === 'typing') {
                const { user_id, user_name, is_typing } = payload.data;
                if (user_id === currentUser.id) return;
                setTypingUsers(prev => {
                    const next = { ...prev };
                    if (is_typing) next[user_id] = user_name;
                    else delete next[user_id];
                    return next;
                });
            } else if (payload.type === 'reaction_add') {
                const { message_id, emoji } = payload.data;
                setReactions(prev => {
                    const msgReactions = { ...(prev[message_id] || {}) };
                    msgReactions[emoji] = (msgReactions[emoji] || 0) + 1;
                    return { ...prev, [message_id]: msgReactions };
                });
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [activeChannel, currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (nameInput.trim().length > 2) {
            const newUser = {
                id: "user_" + Math.random().toString(36).substr(2, 9),
                name: nameInput.trim(),
                username: nameInput.trim().toLowerCase().replace(/\s+/g, '_')
            };
            localStorage.setItem("cortexcraft_user", JSON.stringify(newUser));
            setCurrentUser(newUser);
        }
    };

    const handleTyping = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
            }
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        let attachment_url = null;
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);
            try {
                const res = await fetch("http://localhost:8000/api/community/upload", {
                    method: "POST",
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    attachment_url = data.url;
                }
            } catch (error) {
                console.error("Upload failed", error);
            }
        }

        wsRef.current.send(JSON.stringify({ content: newMessage, attachment_url }));
        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleReact = (msgId: string, emoji: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: 'reaction', message_id: msgId, emoji }));
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!currentUser) return;
        try {
            await fetch(`http://localhost:8000/api/community/messages/${msgId}?user_id=${currentUser.id}`, { method: 'DELETE' });
        } catch (e) { console.error(e); }
    };

    const handleEditMessageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !editingMsgId || !editContent.trim()) return;
        try {
            await fetch(`http://localhost:8000/api/community/messages/${editingMsgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent, user_id: currentUser.id })
            });
            setEditingMsgId(null);
            setEditContent("");
        } catch (e) { console.error(e); }
    };

    const handleCreateServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newServerName.trim()) {
            const initials = newServerName.substring(0, 2).toUpperCase();
            try {
                const res = await fetch(`http://localhost:8000/api/community/servers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newServerName.trim(), initials })
                });
                if (res.ok) {
                    const serv = await res.json();
                    setServers([...servers, serv]);
                    setActiveServer(serv.id);
                    setShowServerModal(false);
                    setNewServerName("");
                }
            } catch (e) {}
        }
    };

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newChannelName.trim() && activeServer) {
            try {
                const res = await fetch(`http://localhost:8000/api/community/channels`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newChannelName.trim().replace(/\s+/g, '-').toLowerCase(), server_id: activeServer })
                });
                if (res.ok) {
                    const chan = await res.json();
                    setChannels([...channels, chan]);
                    setActiveChannel(chan.id);
                    setShowChannelModal(false);
                    setNewChannelName("");
                }
            } catch (e) {}
        }
    };

    const handleUpdateProfile = (updatedProps: any) => {
        if (currentUser) {
            const updated = { ...currentUser, ...updatedProps };
            localStorage.setItem("cortexcraft_user", JSON.stringify(updated));
            setCurrentUser(updated);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("cortexcraft_user");
        setCurrentUser(null);
        setShowSettingsModal(false);
    };

    const filteredMessages = messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!currentUser) {
        return (
            <div className="community-layout animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
                    zIndex: 0
                }}></div>
                <div className="glass-card" style={{ 
                    position: 'relative',
                    zIndex: 1,
                    width: '100%', 
                    maxWidth: '460px', 
                    padding: '48px',
                    background: 'rgba(15,17,26,0.85)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '32px',
                    boxShadow: '0 50px 120px rgba(0,0,0,0.8)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '26px',
                        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        margin: '0 auto 36px',
                        boxShadow: '0 25px 50px rgba(124,58,237,0.4)',
                        transform: 'rotate(-5deg)'
                    }}>
                        🧠
                    </div>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '14px', letterSpacing: '-1.5px', color: '#fff' }}>The Core awaits</h2>
                    <p style={{ color: '#949ba4', marginBottom: '40px', fontSize: '1.1rem', lineHeight: 1.5 }}>Connect to the CortexCraft neuron network.</p>
                    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
                        <div>
                            <label style={{color: '#a78bfa', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '10px'}}>Establish Identity</label>
                            <input 
                                type="text" 
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Ghost in the Shell"
                                style={{ 
                                    width: '100%',
                                    padding: '16px 20px', 
                                    background: 'rgba(0,0,0,0.4)', 
                                    border: '1px solid rgba(124,58,237,0.2)', 
                                    borderRadius: '16px', 
                                    color: '#fff', 
                                    fontSize: '1.1rem', 
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'rgba(124,58,237,0.2)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="ds-btn-primary" style={{width: '100%', padding: '18px', fontSize: '1.1rem', borderRadius: '16px'}} disabled={nameInput.trim().length < 3}>
                            Sync Mind →
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const typingList = Object.values(typingUsers);

    return (
        <div className="community-layout animate-fade-in relative">
            {/* Servers Sidebar */}
            <div className="servers-sidebar">
                <div className="server-icon active" style={{marginBottom: '12px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)'}} title="Hub Alpha">
                    <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Cortex" style={{width: '24px', filter: 'brightness(0) invert(1)'}} />
                </div>
                <div style={{width: '28px', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px'}}></div>
                
                {servers.map((server) => (
                    <div 
                        key={server.id} 
                        className={`server-icon ${activeServer === server.id ? 'active' : ''}`}
                        title={server.name}
                        onClick={() => setActiveServer(server.id)}
                    >
                        {server.initials}
                    </div>
                ))}
                <div className="server-icon add-server" title="New Galaxy" onClick={() => setShowServerModal(true)}>
                    <PlusCircle size={22} />
                </div>
            </div>

            {/* Channels Sidebar */}
            <div className="channels-sidebar">
                <div className="channels-header">
                    <div className="ds-status-dot" style={{position: 'static', marginRight: 10}}></div>
                    <h2>{servers.find(s => s.id === activeServer)?.name || "Orbit Hub"}</h2>
                </div>
                <div className="channels-list">
                    <div className="channel-category" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        Neurons
                        <PlusCircle size={14} style={{cursor: 'pointer', opacity: 0.5}} onClick={() => setShowChannelModal(true)} />
                    </div>
                    {channels.map((channel) => (
                        <div 
                            key={channel.id} 
                            className={`channel-item ${activeChannel === channel.id ? 'active' : ''}`}
                            onClick={() => {
                                setMessages([]); 
                                setActiveChannel(channel.id);
                            }}
                        >
                            <Hash size={16} style={{opacity: 0.4}} />
                            {channel.name}
                        </div>
                    ))}
                </div>
                
                {/* User Info Footer with Glow */}
                <div className="user-controls" style={{background: 'rgba(0,0,0,0.4)', margin: '10px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="user-avatar" style={{width: 36, height: 36}}>
                        {currentUser.name.charAt(0).toUpperCase()}
                        <div className="ds-status-dot"></div>
                    </div>
                    <div className="user-info">
                        <p className="user-name" style={{fontSize: '0.85rem'}}>{currentUser.name}</p>
                        <p className="user-status" style={{fontSize: '0.65rem'}}>Synchronized</p>
                    </div>
                    <Settings 
                        size={16} 
                        className="settings-icon" 
                        style={{padding: 6}} 
                        onClick={() => setShowSettingsModal(true)} 
                    />
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-area">
                <div className="chat-header">
                    <div className="header-left">
                        <div style={{fontSize: '18px', marginRight: 10, color: '#a78bfa'}}>#</div>
                        <h2>{channels.find(c => c.id === activeChannel)?.name || "Void"}</h2>
                    </div>
                    <div className="header-right">
                        <div className="search-bar" style={{background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)'}}>
                            <Search size={14} style={{opacity: 0.3, marginRight: 8}} />
                            <input 
                                type="text" 
                                placeholder="Search memories..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Users size={18} className="header-icon" />
                    </div>
                </div>

                <div className="chat-messages">
                    {!activeChannel ? (
                        <div className="empty-chat animate-fade-in" style={{marginTop: 'auto', marginBottom: 'auto'}}>
                            <div style={{width: 80, height: 80, borderRadius: '28px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 40px rgba(124,58,237,0.1)'}}>
                                <PlusCircle size={32} color="#a78bfa" />
                            </div>
                            <h2>Establish Connection</h2>
                            <p>Pick a neuron frequency to begin synchronization with the community.</p>
                        </div>
                    ) : filteredMessages.length === 0 && !searchQuery ? (
                        <div className="empty-chat animate-fade-in" style={{marginTop: 'auto', marginBottom: 'auto'}}>
                            <div style={{width: 90, height: 90, borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24}}>
                                <Hash size={40} color="#7c3aed" style={{opacity: 0.6}} />
                            </div>
                            <h2>{channels.find(c => c.id === activeChannel)?.name} Initialized</h2>
                            <p>Neural transmission starts here. Be the first to pulse.</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg, idx) => {
                            if (msg.is_system) {
                                return (
                                    <div key={msg._id || idx} style={{ 
                                        display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0', 
                                        color: 'rgba(167,139,250,0.3)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px'
                                    }}>
                                        <div style={{flex: 1, height: '1px', background: 'rgba(167,139,250,0.1)'}}></div>
                                        <span>{msg.content}</span>
                                        <div style={{flex: 1, height: '1px', background: 'rgba(167,139,250,0.1)'}}></div>
                                    </div>
                                );
                            }

                            if (msg.is_watchdog) {
                                return (
                                    <div key={msg._id || idx} className="animate-fade-in" style={{
                                        margin: '24px 40px',
                                        padding: '20px',
                                        background: 'rgba(52, 211, 153, 0.05)',
                                        border: '1px solid rgba(52, 211, 153, 0.15)',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                                    }}>
                                        <div style={{ padding: 10, background: 'rgba(52, 211, 153, 0.15)', borderRadius: 12, display: 'flex', alignItems: 'center' }}>
                                            <ShieldCheck color="#34d399" size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>Context Check • Verified</span>
                                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>Just now</span>
                                            </div>
                                            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            }

                            const date = new Date(msg.timestamp);
                            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            const prevMsg = filteredMessages[idx - 1];
                            const showHeader = idx === 0 || prevMsg.is_system || prevMsg.sender_id !== msg.sender_id;
                            const isMine = msg.sender_id === currentUser.id;

                            return (
                                <div key={msg._id || idx} className={`community-msg-row ${showHeader ? 'mt-6' : 'mt-1'}`} style={{paddingLeft: showHeader ? 20 : 80}}>
                                    {showHeader && (
                                        <div 
                                            className="message-avatar" 
                                            style={{cursor: 'pointer', position: 'absolute', left: 20}}
                                            onClick={() => setSelectedProfile({id: msg.sender_id, name: msg.sender_name})}
                                        >
                                            {msg.sender_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    
                                    <div className="message-content">
                                        {showHeader && (
                                            <div className="message-header">
                                                <span className="sender" style={{color: isMine ? '#a78bfa' : '#fff'}}>{msg.sender_name}</span>
                                                <span className="time">{timeStr}</span>
                                            </div>
                                        )}
                                        {editingMsgId === msg._id ? (
                                            <form onSubmit={handleEditMessageSubmit} style={{width: '100%', marginTop: 6}}>
                                                <input 
                                                    className="edit-input" 
                                                    value={editContent} 
                                                    onChange={e => setEditContent(e.target.value)} 
                                                    autoFocus 
                                                    style={{width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid #7c3aed', borderRadius: '12px'}}
                                                />
                                                <p style={{fontSize: '0.65rem', color: '#6b7280', marginTop: 6}}>ESC to cancel • ENTER to save</p>
                                            </form>
                                        ) : (
                                            <div className="text" style={{position: 'relative'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                                                    {msg.content}
                                                    {msg.edited && <span style={{fontSize: '0.6rem', color: 'rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.05)', padding: '1px 6px', borderRadius: '6px', fontWeight: 700}}>MODIFIED</span>}
                                                </div>
                                                {msg.attachment_url && (
                                                    <a href={msg.attachment_url} target="_blank" rel="noreferrer">
                                                        <img src={msg.attachment_url} alt="attachment" className="msg-attachment" style={{borderRadius: 16}} />
                                                    </a>
                                                )}
                                                
                                                {/* Tooltip Reactions Bar */}
                                                {reactions[msg._id] && (
                                                    <div style={{display: 'flex', gap: 6, marginTop: 8}}>
                                                        {Object.entries(reactions[msg._id]).map(([emoji, count]) => (
                                                            <div key={emoji} style={{background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4}}>
                                                                {emoji} <span style={{fontWeight: 700, fontSize: '0.75rem'}}>{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!editingMsgId && (
                                        <div className="msg-actions" style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)'}}>
                                            <span onClick={() => handleReact(msg._id, "👍")} style={{padding: '5px', borderRadius: 6, cursor: 'pointer'}}>👍</span>
                                            <span onClick={() => handleReact(msg._id, "❤️")} style={{padding: '5px', borderRadius: 6, cursor: 'pointer'}}>❤️</span>
                                            <span onClick={() => handleReact(msg._id, "🔥")} style={{padding: '5px', borderRadius: 6, cursor: 'pointer'}}>🔥</span>
                                            <div style={{width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px'}}></div>
                                            {isMine && <Edit2 size={13} onClick={() => { setEditingMsgId(msg._id); setEditContent(msg.content); }} />}
                                            {isMine && <Trash2 size={13} className="danger-icon" onClick={() => handleDeleteMessage(msg._id)} />}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator Overlay */}
                <div style={{ height: 20, padding: '0 24px', fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>
                    {typingList.length > 0 && (
                        <div className="animate-fade-in" style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <div className="ds-status-dot" style={{width: 6, height: 6, position: 'static', animation: 'pulse 1s infinite'}}></div>
                            {typingList.join(', ')} {typingList.length > 1 ? 'are' : 'is'} synchronizing...
                        </div>
                    )}
                </div>

                <div className="chat-input-container">
                    {selectedFile && (
                        <div className="file-preview" style={{border: '1px solid #7c3aed', background: 'rgba(124,58,237,0.1)', top: -50}}>
                            <Paperclip size={14} style={{marginRight: 8, color: '#a78bfa'}} />
                            <span style={{color: '#fff', fontSize: '0.8rem', fontWeight: 600, flex: 1}}>{selectedFile.name}</span>
                            <X size={14} onClick={() => setSelectedFile(null)} style={{cursor: 'pointer', color: '#6b7280'}} />
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="chat-form" style={{padding: '12px 24px'}}>
                        <div className="file-upload-btn" onClick={() => fileInputRef.current?.click()}>
                            <Plus size={20} />
                        </div>
                        <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} accept="image/*" />
                        
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                            placeholder={activeChannel ? `Frequency: #${channels.find(c => c.id === activeChannel)?.name}` : "Establish link..."}
                            disabled={!activeChannel}
                            autoFocus
                        />
                    </form>
                </div>
            </div>

            {/* User Profile Overlay */}
            {selectedProfile && (
                <div className="modal-backdrop" onClick={() => setSelectedProfile(null)}>
                    <div className="glass-card" style={{ width: 340, padding: 0, overflow: 'hidden'}} onClick={e => e.stopPropagation()}>
                        <div style={{height: 100, background: 'linear-gradient(135deg, #7c3aed, #6366f1)'}}></div>
                        <div style={{padding: 24, textAlign: 'center', position: 'relative'}}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 24, background: '#0f111a', border: '4px solid #0f111a',
                                position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#7c3aed'
                            }}>
                                {selectedProfile.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{marginTop: 44}}>
                                <h3 style={{fontSize: '1.4rem', fontWeight: 800, color: '#fff'}}>{selectedProfile.name}</h3>
                                <p style={{color: '#a78bfa', fontSize: '0.9rem', marginBottom: 20}}>@{selectedProfile.name.toLowerCase().replace(/\s+/g,'_')}</p>
                                <div style={{height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0'}}></div>
                                <div style={{textAlign: 'left'}}>
                                    <label style={{fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5}}>Orbit Member Since</label>
                                    <p style={{fontSize: 13, color: '#949ba4', marginTop: 4}}>April 2026</p>
                                </div>
                                <div style={{marginTop: 24, display: 'flex', gap: 10}}>
                                    <button className="ds-btn-primary" style={{flex: 1, padding: 10, fontSize: 13}} onClick={() => setSelectedProfile(null)}>Close Link</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings System */}
            {showSettingsModal && (
                <DiscordSettings 
                    currentUser={currentUser} 
                    onClose={() => setShowSettingsModal(false)}
                    onUpdate={handleUpdateProfile}
                    onLogout={handleLogout}
                />
            )}

            {/* Create Server Modal (Orbit) */}
            {showServerModal && (
                <div className="modal-backdrop">
                    <div className="glass-card modal-content">
                        <div className="modal-header">
                            <h3>Initialize New Orbit</h3>
                            <X size={20} onClick={() => setShowServerModal(false)} style={{cursor: 'pointer'}} />
                        </div>
                        <div style={{padding: '32px'}}>
                            <p style={{color: '#949ba4', fontSize: '15px', marginBottom: '28px', lineHeight: 1.6}}>Create a new planetary hub for your team. You will be the primary controller.</p>
                            <form onSubmit={handleCreateServer}>
                                <div style={{textAlign: 'left', marginBottom: '10px'}}>
                                    <label style={{color: '#a78bfa', fontSize: '11px', fontWeight: 800, letterSpacing: '2px'}}>ORBIT DESIGNATION</label>
                                </div>
                                <input 
                                    className="modal-input" 
                                    placeholder="e.g. Project Nebula" 
                                    value={newServerName} 
                                    onChange={e => setNewServerName(e.target.value)} 
                                    autoFocus
                                    style={{borderRadius: 16}}
                                />
                            </form>
                        </div>
                        <div style={{padding: '20px 32px', background: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'flex-end', gap: 14}}>
                            <button className="ds-btn-text" onClick={() => setShowServerModal(false)}>Abort</button>
                            <button className="ds-btn-primary" onClick={handleCreateServer} disabled={!newServerName.trim()} style={{borderRadius: 12}}>Forge Orbit</button>
                        </div>
                    </div>
                </div>
            )}

            {showChannelModal && (
                <div className="modal-backdrop">
                    <div className="glass-card modal-content" style={{maxWidth: 400}}>
                        <div className="modal-header">
                            <h3>Add Neuron frequency</h3>
                            <X size={20} onClick={() => setShowChannelModal(false)} style={{cursor: 'pointer'}} />
                        </div>
                        <div style={{padding: '32px'}}>
                            <form onSubmit={handleCreateChannel}>
                                <div style={{textAlign: 'left', marginBottom: '10px'}}>
                                    <label style={{color: '#a78bfa', fontSize: '11px', fontWeight: 800, letterSpacing: '2px'}}>FREQUENCY CODE</label>
                                </div>
                                <input 
                                    className="modal-input" 
                                    placeholder="e.g. dev-internal" 
                                    value={newChannelName} 
                                    onChange={e => setNewChannelName(e.target.value)} 
                                    autoFocus
                                />
                                <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '32px'}}>
                                    <button type="button" className="ds-btn-text" onClick={() => setShowChannelModal(false)}>Cancel</button>
                                    <button type="submit" className="ds-btn-primary" disabled={!newChannelName.trim()} style={{borderRadius: 12}}>Create Link</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
