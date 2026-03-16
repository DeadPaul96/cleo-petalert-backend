import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Send, Phone, User, X } from 'lucide-react';
import { getAuth } from "firebase/auth";
import { BASE_URL } from '../../api';
import './Chats.css';

const Chats = ({ onChatStatusChange }) => {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const ws = useRef(null);
  const auth = getAuth();

  useEffect(() => {
    // Notify parent to hide BottomBar
    if (onChatStatusChange) {
      onChatStatusChange(!!selectedChat);
    }

    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, onChatStatusChange]);

  // Initial Fetch & WebSocket setup
  useEffect(() => {
    const initChats = async () => {
      if (!auth.currentUser) return;
      
      try {
        const token = await auth.currentUser.getIdToken();
        // 1. Get our internal Postgres User ID based on Firebase Token
        const userRes = await fetch(`${BASE_URL}/api/users/login`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        setCurrentUserId(userData.id);

        // 2. Fetch Conversations from REST
        const convRes = await fetch(`${BASE_URL}/api/chats/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (convRes.ok) {
          const list = await convRes.json();
          // Transform DB data to UI format
          const formatted = list.map(c => ({
            id: c.id,
            name: c.user1_id === userData.id ? `Usuario #${c.user2_id}` : `Usuario #${c.user1_id}`,
            lastMsg: 'Toca para ver mensajes...',
            time: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            img: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=200&h=200',
            type: c.pet_id ? 'adoption' : 'alert',
            online: true, // Mock online status for now
            otherParticipantId: c.user1_id === userData.id ? c.user2_id : c.user1_id
          }));
          setChats(formatted);
        }

        // 3. Connect WebSocket (Using ws:// for standard HTTP proxy in development)
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use BASE_URL logic but for WebSocket (transform https -> wss, http -> ws)
        const cleanBase = BASE_URL.replace(/^http/, 'ws');
        const wsUrl = cleanBase ? `${cleanBase}/api/chats/ws/${userData.id}` : `${wsProtocol}//${window.location.host}/api/chats/ws/${userData.id}`;
        
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onmessage = (event) => {
          const incoming = JSON.parse(event.data);
          // If the message is for the currently open chat, append it
          setMessages(prev => {
             const isForCurrentConv = selectedChat && incoming.conversation_id === selectedChat.id;
             return [...prev, {
                id: incoming.id,
                text: incoming.content,
                sender: incoming.sender_id === userData.id ? 'me' : 'other',
                time: new Date(incoming.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
             }];
          });
        };
      } catch (e) {
        console.error("Chat Error:", e);
      }
    };
    initChats();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [auth.currentUser, selectedChat]);

  const fetchMessages = async (convId) => {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${BASE_URL}/api/chats/${convId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const formatted = data.map(m => ({
        id: m.id,
        text: m.content,
        sender: m.sender_id === currentUserId ? 'me' : 'other',
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setMessages(formatted);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesFilter = activeFilter === 'Todos' ||
      (activeFilter === 'Alertas' && chat.type === 'alert') ||
      (activeFilter === 'Adopción' && chat.type === 'adoption');
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSend = () => {
    if (messageText.trim() && ws.current && selectedChat) {
      const payload = {
        receiver_id: selectedChat.otherParticipantId,
        content: messageText,
        conversation_id: selectedChat.id
      };
      
      ws.current.send(JSON.stringify(payload));
      setMessageText('');
    }
  };

  return (
    <div className="chats-container">
      <AnimatePresence mode="wait">
        {!selectedChat ? (
          <motion.div 
            key="list"
            className="chat-list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="chats-header-compact">
              {!isSearching ? (
                <>
                  <h2 className="turq-text">Mensajes</h2>
                  <div className="header-actions">
                    <button className="icon-btn-turq" onClick={() => setIsSearching(true)}>
                      <Search size={24} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="search-bar-animated-turq">
                  <button className="icon-btn-turq" onClick={() => {setIsSearching(false); setSearchQuery('');}}>
                    <ArrowLeft size={22} />
                  </button>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar chat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && <button className="clear-btn" onClick={() => setSearchQuery('')}><X size={18} /></button>}
                </div>
              )}
            </div>

            <div className="chat-tabs">
              {['Todos', 'Alertas', 'Adopción'].map(tab => (
                <button
                  key={tab}
                  className={`tab-pill-turq ${activeFilter === tab ? 'active' : ''}`}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <motion.div className="chat-list" layout>
              <AnimatePresence>
                {filteredChats.map((chat) => (
                  <motion.div
                    layout
                    key={chat.id}
                    className="chat-item-turq"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="chat-img-wrapper">
                      <img src={chat.img} alt={chat.name} className="chat-img" />
                      {chat.online && <div className="online-indicator"></div>}
                    </div>
                    <div className="chat-info">
                      <div className="chat-top">
                        <h4>{chat.name}</h4>
                        <span className="chat-time">{chat.time}</span>
                      </div>
                      <div className="chat-bottom">
                        <p className="last-msg">{chat.lastMsg}</p>
                        {chat.unread > 0 && <div className="unread-badge-turq">{chat.unread}</div>}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredChats.length === 0 && (
                  <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>
                    No tienes mensajes nuevos.
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            className="chat-detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="chat-detail-header">
              <button className="back-btn-chat-turq" onClick={() => setSelectedChat(null)}>
                <ArrowLeft size={24} />
              </button>
              <div className="header-user">
                <img src={selectedChat.img} alt={selectedChat.name} />
                <div className="user-meta">
                  <h4>{selectedChat.name}</h4>
                  <span>{selectedChat.online ? 'En línea' : 'Desconectado'}</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="icon-circle-btn-turq"><Phone size={20} /></button>
                <button className="icon-circle-btn-turq"><User size={20} /></button>
              </div>
            </div>

            <div className="chat-messages">
              <div className="chat-date">Hoy</div>
              {messages.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                  <p>{msg.text}</p>
                  <span className="msg-time">{msg.time}</span>
                </div>
              ))}
            </div>

            <div className="chat-input-wrapper-no-nav">
              <div className="input-container-modern-turq">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className={`send-btn-modern-turq ${messageText ? 'active' : ''}`} onClick={handleSend}>
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .chats-container { height: 100%; width: 100%; display: flex; flex-direction: column; background: var(--bg-white); position: relative; overflow: hidden; }
        .chat-list-view, .chat-detail-view { height: 100%; display: flex; flex-direction: column; }

        .chats-header-compact { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; min-height: 60px; }
        .turq-text { color: var(--primary) !important; font-weight: 900; }
        .icon-btn-turq { background: none; border: none; color: var(--primary) !important; padding: 8px; display: flex; align-items: center; }

        .search-bar-animated-turq { display: flex; align-items: center; gap: 10px; width: 100%; background: var(--input-bg); border-radius: 14px; padding: 4px 8px; border: 1.5px solid var(--border-color); }
        .search-bar-animated-turq input { flex: 1; border: none; background: none; color: var(--text-main); font-size: 16px; outline: none; padding: 8px 0; }
        .clear-btn { background: none; border: none; color: var(--text-muted); }

        .chat-tabs { display: flex; gap: 10px; padding: 0 16px 15px; }
        .tab-pill-turq { padding: 10px 22px; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--card-bg); color: var(--text-muted); font-size: 14px; font-weight: 800; transition: all 0.3s; }
        .tab-pill-turq.active { background: var(--primary); color: #000; border-color: var(--primary); transform: scale(1.05); box-shadow: 0 4px 12px rgba(48, 213, 200, 0.3); }

        .chat-item-turq { display: flex; gap: 15px; padding: 14px 16px; border-radius: 18px; margin-bottom: 6px; transition: all 0.2s; cursor: pointer; border: 1px solid transparent; }
        .chat-item-turq:active { background: rgba(48, 213, 200, 0.1); border-color: rgba(48, 213, 200, 0.2); }
        .unread-badge-turq { background: var(--primary); color: #000; min-width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }

        .chat-detail-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border-color); background: var(--bg-white); }
        .back-btn-chat-turq { background: rgba(48, 213, 200, 0.1); border: none; color: var(--primary); border-radius: 12px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .back-btn-chat-turq:active { transform: scale(0.9); background: rgba(48, 213, 200, 0.2); }

        .header-user { flex: 1; display: flex; align-items: center; gap: 12px; }
        .header-user img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; border: 1px solid var(--border-color); }
        .user-meta h4 { font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0; text-align: left; }
        .user-meta span { font-size: 12px; color: #10b981; font-weight: 700; display: block; text-align: left; }

        .icon-circle-btn-turq { width: 42px; height: 42px; border-radius: 50%; background: rgba(48, 213, 200, 0.1); border: 1px solid rgba(48, 213, 200, 0.2); color: var(--primary); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .icon-circle-btn-turq:active { transform: scale(0.9); background: var(--primary); color: #000; }

        .chat-messages { flex: 1; overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; background: var(--bg-white); }
        .message-bubble { max-width: 80%; padding: 14px 18px; border-radius: 22px; position: relative; font-size: 15px; line-height: 1.5; }
        .message-bubble.me { align-self: flex-end; background: var(--primary); color: #000; border-bottom-right-radius: 4px; font-weight: 600; box-shadow: 0 4px 15px rgba(48, 213, 200, 0.2); }
        .message-bubble.other { align-self: flex-start; background: var(--input-bg); color: var(--text-main); border-bottom-left-radius: 4px; border: 1px solid var(--border-color); }

        .msg-time { font-size: 10px; margin-top: 6px; display: block; text-align: right; opacity: 0.8; font-weight: 700; }

        .chat-input-wrapper-no-nav {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 16px 24px;
          background: var(--bg-white);
          border-top: 1px solid var(--border-color);
          z-index: 1100;
        }
        .input-container-modern-turq { display: flex; align-items: center; gap: 12px; background: var(--input-bg); padding: 8px 8px 8px 18px; border-radius: 30px; border: 1.5px solid var(--border-color); }
        .input-container-modern-turq input { flex: 1; border: none; background: none; color: var(--text-main); font-size: 16px; outline: none; }
        .send-btn-modern-turq { width: 44px; height: 44px; border-radius: 50%; background: var(--border-color); color: white; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .send-btn-modern-turq.active { background: var(--primary); color: #000; transform: scale(1.1); box-shadow: 0 4px 12px rgba(48, 213, 200, 0.4); }
      `}</style>
    </div>
  );
};

export default Chats;
