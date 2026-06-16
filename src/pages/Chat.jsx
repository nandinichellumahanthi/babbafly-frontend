import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

function Chat() {
  const { conversationId: urlConvoId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);
  const activeConvoRef = useRef(null); // keep ref in sync for socket callbacks

  const token = localStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  // Keep ref in sync
  useEffect(() => { activeConvoRef.current = activeConvo; }, [activeConvo]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !token) navigate("/login");
  }, []);

  // Setup socket ONCE
  useEffect(() => {
    if (!user || !token) return;

    const s = io(SOCKET_URL, {
      transports: ["polling", "websocket"], // polling first — more reliable
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("Socket connected:", s.id);
      setSocketReady(true);
      // Register user on (re)connect
      s.emit("register", user.id || user._id);
    });

    s.on("disconnect", () => {
      setSocketReady(false);
    });

    s.on("receive_message", (msg) => {
      // Only add if it belongs to the active conversation
      setMessages((prev) => {
        if (activeConvoRef.current?._id === msg.conversationId || 
            activeConvoRef.current?._id === msg.conversationId?._id) {
          // Avoid duplicates
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });
      // Update last message in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c._id === (msg.conversationId?._id || msg.conversationId)
            ? { ...c, lastMessage: msg.text }
            : c
        )
      );
    });

    s.on("user_typing", ({ userName }) => {
      setTypingUser(userName);
      setIsTyping(true);
    });

    s.on("user_stopped_typing", () => {
      setIsTyping(false);
      setTypingUser("");
    });

    s.on("error", (err) => {
      console.error("Socket error:", err);
    });

    fetchConversations();

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Auto-open conversation from URL param
  useEffect(() => {
    if (urlConvoId && conversations.length > 0 && !activeConvo) {
      const convo = conversations.find((c) => c._id === urlConvoId);
      if (convo) openConversation(convo);
    }
  }, [urlConvoId, conversations]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (convo) => {
    const s = socketRef.current;

    // Leave old room
    if (activeConvoRef.current && s) {
      s.emit("leave_conversation", activeConvoRef.current._id);
    }

    setActiveConvo(convo);
    setMessages([]);

    // Join new room
    if (s) s.emit("join_conversation", convo._id);

    try {
      const res = await axios.get(
        `${API}/api/chat/conversations/${convo._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err.response?.data || err.message);
    }
  };

  const sendMessage = useCallback(() => {
    const s = socketRef.current;
    const convo = activeConvoRef.current;

    if (!text.trim() || !convo || !s) return;

    const userId = user.id || user._id;

    // Optimistically add message to UI
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      conversationId: convo._id,
      senderId: { _id: userId, name: user.name },
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    // Send via socket
    s.emit("send_message", {
      conversationId: convo._id,
      senderId: userId,
      text: text.trim(),
    });

    s.emit("stop_typing", { conversationId: convo._id });
    setText("");
  }, [text, user]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    const s = socketRef.current;
    const convo = activeConvoRef.current;
    if (!s || !convo) return;

    s.emit("typing", {
      conversationId: convo._id,
      userName: user.name?.split(" ")[0],
    });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      s.emit("stop_typing", { conversationId: convo._id });
    }, 1500);
  };

  const getOtherParticipant = (convo) => {
    const myId = user.id || user._id;
    return convo.participants?.find((p) => (p._id || p) !== myId) || convo.participants?.[0];
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) return null;

  const myId = user.id || user._id;

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>💬 Messages</h2>
          {!socketReady && <span className="socket-status">Connecting...</span>}
        </div>

        {loading ? (
          <p className="chat-loading">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <div className="chat-empty-sidebar">
            <p>📭 No conversations yet.</p>
            <p>Go to a listing and click <strong>"Message Seller"</strong> to start chatting.</p>
          </div>
        ) : (
          <ul className="chat-convo-list">
            {conversations.map((convo) => {
              const other = getOtherParticipant(convo);
              const isActive = activeConvo?._id === convo._id;
              return (
                <li
                  key={convo._id}
                  className={`chat-convo-item ${isActive ? "active" : ""}`}
                  onClick={() => openConversation(convo)}
                >
                  <div className="chat-convo-avatar">
                    {other?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="chat-convo-info">
                    <p className="chat-convo-name">{other?.name || "User"}</p>
                    <p className="chat-convo-listing">
                      {convo.listingId?.title || "Listing"}
                    </p>
                    {convo.lastMessage && (
                      <p className="chat-convo-last">{convo.lastMessage}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Main */}
      <div className="chat-main">
        {!activeConvo ? (
          <div className="chat-no-convo">
            <span className="chat-no-convo-icon">💬</span>
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-avatar">
                {getOtherParticipant(activeConvo)?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="chat-header-info">
                <p className="chat-header-name">
                  {getOtherParticipant(activeConvo)?.name || "User"}
                </p>
                <p className="chat-header-listing">
                  Re: {activeConvo.listingId?.title} — ₹{activeConvo.listingId?.price?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <p className="chat-start-msg">Say hi! This is the start of your conversation. 👋</p>
              )}
              {messages.map((msg) => {
                const senderId = msg.senderId?._id || msg.senderId;
                const isMe = senderId === myId;
                return (
                  <div key={msg._id} className={`chat-msg ${isMe ? "mine" : "theirs"}`}>
                    <div className="chat-bubble">
                      <p>{msg.text}</p>
                      <span className="chat-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="chat-typing">
                  <span>{typingUser} is typing</span>
                  <span className="typing-dots"><span /><span /><span /></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <textarea
                className="chat-input"
                placeholder="Type a message… (Enter to send)"
                value={text}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!text.trim()}
              >
                Send ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;