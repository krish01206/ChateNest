import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { NotificationContext } from "../context/NotificationContext";
import { getMessages, sendMessageApi, deleteMessageApi, updateMessageApi, markSeenApi } from "../services/chatService";
import { FiSend, FiMessageSquare, FiSmile, FiPaperclip, FiMoreVertical, FiClock, FiAlertCircle } from "react-icons/fi";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
  "😋", "😛", "😝", "😜", "🤪", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "😢", "😭", "😡",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏", "🙌", "👐", "🤲", "🙏", "❤️", "🧡", "💛", "💚", "💙", 
  "💜", "🖤", "🤍", "💔", "✨", "🔥", "🎉", "🌟", "💬", "💡", "✈️", "🚗", "🍕", "🍔", "☕", "🍺", "🎈"
];

const isImageFile = (url) => {
  if (!url) return false;
  return /\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff|heic)/i.test(url) || url.includes("/image/") || url.startsWith("blob:");
};

function ChatBox({ conversation }) {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers = [] } = useContext(SocketContext);
  const { resetUnread } = useContext(NotificationContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [activeContextMenu, setActiveContextMenu] = useState(null); // holds messageId
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef();
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const otherUser = conversation?.members?.find(
    (m) => m._id !== user?._id
  );

  // Load messages with cleanup logic for race conditions
  useEffect(() => {
    let active = true;
    if (conversation) {
      setMessages([]);
      setLoadingMessages(true);

      // Tell the socket server which conversation is currently active (for unread suppression)
      if (socket) {
        socket.emit("setActiveConversation", conversation._id);
      }
      // Clear the unread badge for this conversation
      resetUnread(conversation._id);
      // Mark messages as seen on the server
      markSeenApi(conversation._id).catch(() => {});

      const load = async () => {
        try {
          const data = await getMessages(conversation._id);
          if (active) {
            setMessages(data.messages || []);
            setLoadingMessages(false);
            // Force scroll to bottom on initial load
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            }, 50);
          }
        } catch (err) {
          console.log("Error loading messages:", err);
          if (active) {
            setLoadingMessages(false);
          }
        }
      };

      load();
    }

    return () => {
      active = false;
      // Clear active conversation tracking when component unmounts or conv changes
      if (socket) {
        socket.emit("setActiveConversation", null);
      }
    };
  }, [conversation, socket]);

  // Smart Auto-Scroll: only scroll if the user is already near the bottom,
  // or if the updated messages trigger is caused by the user's own sent message.
  const scrollBottom = (force = false) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    
    // Check if the user is close to the bottom (within 150px threshold)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 150;

    if (force || isNearBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 50);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const mine = (lastMessage.sender?._id || lastMessage.sender) === user?._id;
      // Force scroll to bottom if the message is mine, otherwise scroll smartly
      scrollBottom(mine);
    } else {
      scrollBottom(false);
    }
  }, [messages, typing]);

  useEffect(() => {
    const handleCloseMenu = () => setActiveContextMenu(null);
    document.addEventListener("click", handleCloseMenu);
    return () => document.removeEventListener("click", handleCloseMenu);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      // Only append if it belongs to this active conversation
      if (msg.conversationId === conversation?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTypingEvent = (sender) => {
      if (sender === otherUser?._id) {
        setTyping(true);
      }
    };

    const handleStopTypingEvent = (sender) => {
      if (sender === otherUser?._id) {
        setTyping(false);
      }
    };

    const handleMessageDeletedEvent = (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    const handleMessageUpdatedEvent = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTypingEvent);
    socket.on("stopTyping", handleStopTypingEvent);
    socket.on("messageDeleted", handleMessageDeletedEvent);
    socket.on("messageUpdated", handleMessageUpdatedEvent);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTypingEvent);
      socket.off("stopTyping", handleStopTypingEvent);
      socket.off("messageDeleted", handleMessageDeletedEvent);
      socket.off("messageUpdated", handleMessageUpdatedEvent);
    };
  }, [socket, conversation, otherUser]);

  const handleTyping = (e) => {
    setText(e.target.value);

    if (!socket || !otherUser) return;

    // Premium typing throttle: only emit event once when typing starts
    if (!isCurrentlyTyping) {
      setIsCurrentlyTyping(true);
      socket.emit("typing", {
        receiver: otherUser._id,
        sender: user._id,
      });
    }

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiver: otherUser._id,
        sender: user._id,
      });
      setIsCurrentlyTyping(false);
    }, 1500);
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview("");
    }
  };

  const sendMessage = async () => {
    if (!text.trim() && !selectedFile) return;

    const messageText = text;
    const fileToSend = selectedFile;
    const previewUrl = filePreview;

    // Instantly reset form state for responsiveness
    setText("");
    setSelectedFile(null);
    setFilePreview("");
    setShowEmojiPicker(false);

    // Create optimistic mock message
    const tempId = "temp-" + Date.now();
    const tempMsg = {
      _id: tempId,
      conversationId: conversation._id,
      sender: user._id,
      receiver: otherUser._id,
      text: messageText,
      image: previewUrl || (fileToSend ? URL.createObjectURL(fileToSend) : null),
      isTemp: true,
      status: "sending",
      createdAt: new Date().toISOString()
    };

    // Add optimistic message and force scroll viewport to bottom
    setMessages((prev) => [...prev, tempMsg]);

    try {
      let data;
      if (fileToSend) {
        const formData = new FormData();
        formData.append("conversationId", conversation._id);
        formData.append("receiver", otherUser._id);
        formData.append("text", messageText);
        formData.append("file", fileToSend);

        data = await sendMessageApi(formData);
      } else {
        const payload = {
          conversationId: conversation._id,
          receiver: otherUser._id,
          text: messageText,
        };
        data = await sendMessageApi(payload);
      }

      // Replace optimistic entry with backend database payload
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? data.message : m))
      );

      if (socket) {
        socket.emit("sendMessage", data.message);
        socket.emit("stopTyping", {
          receiver: otherUser._id,
          sender: user._id,
        });
        setIsCurrentlyTyping(false);
      }
    } catch (err) {
      console.log("Error sending message:", err);
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: "error" } : m))
      );
    }
  };

  const startEdit = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text);
    setActiveContextMenu(null);
  };

  const handleUpdate = async (messageId) => {
    if (!editText.trim()) return;
    try {
      const data = await updateMessageApi(messageId, editText);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? data.message : m))
      );
      if (socket) {
        socket.emit("updateMessage", { message: data.message, receiver: otherUser._id });
      }
      setEditingMessageId(null);
      setEditText("");
    } catch (err) {
      console.log("Error updating message:", err);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessageApi(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (socket) {
        socket.emit("deleteMessage", { messageId, receiver: otherUser._id });
      }
      setActiveContextMenu(null);
    } catch (err) {
      console.log("Error deleting message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversation) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center flex-grow-1 p-5 text-center"
        style={{
          height: "100vh",
          background: "rgba(10, 15, 30, 0.2)",
        }}
      >
        <div className="glass-panel p-5 animate-fade-in-up" style={{ maxWidth: "450px" }}>
          <div className="mb-4" style={{
            background: "var(--accent-gradient)",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            boxShadow: "var(--shadow-glow)"
          }}>
            <FiMessageSquare size={32} color="#fff" />
          </div>
          <h4 className="fw-bold mb-2">Welcome to ChatNest</h4>
          <p className="text-secondary small mb-0">
            Select a contact or an active chat from the sidebar panel to begin secure, real-time premium messaging.
          </p>
        </div>
      </div>
    );
  }

  if (loadingMessages) {
    return (
      <div className="d-flex flex-column h-100" style={{ background: "rgba(15, 23, 42, 0.1)" }}>
        
        {/* Header (Skeleton) */}
        <div className="border-bottom p-3 d-flex justify-content-between align-items-center" style={{ borderColor: "var(--border-glass) !important", background: "rgba(15, 23, 42, 0.45)" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="skeleton-avatar" />
            <div>
              <div className="skeleton-line" style={{ width: "120px", height: "14px", marginBottom: "6px" }} />
              <div className="skeleton-line" style={{ width: "60px", height: "10px" }} />
            </div>
          </div>
        </div>

        {/* Message Thread (Skeleton) */}
        <div
          className="flex-grow-1 p-3 d-flex flex-column gap-3"
          style={{
            overflowY: "auto",
            background: "rgba(8, 10, 16, 0.6)",
          }}
        >
          <div className="d-flex justify-content-start">
            <div className="skeleton-bubble other animate-fade-in-up" style={{ width: "45%", height: "50px" }} />
          </div>
          <div className="d-flex justify-content-end">
            <div className="skeleton-bubble mine animate-fade-in-up" style={{ width: "35%", height: "45px" }} />
          </div>
          <div className="d-flex justify-content-start">
            <div className="skeleton-bubble other animate-fade-in-up" style={{ width: "60%", height: "70px" }} />
          </div>
          <div className="d-flex justify-content-end">
            <div className="skeleton-bubble mine animate-fade-in-up" style={{ width: "50%", height: "55px" }} />
          </div>
          <div className="d-flex justify-content-start">
            <div className="skeleton-bubble other animate-fade-in-up" style={{ width: "30%", height: "40px" }} />
          </div>
        </div>

        {/* Form Input controls (Skeleton/Disabled state) */}
        <div className="border-top p-3 d-flex align-items-center gap-2" style={{ borderColor: "var(--border-glass) !important", background: "rgba(15, 23, 42, 0.45)", opacity: 0.6 }}>
          <button className="btn btn-link p-1 text-secondary" disabled>
            <FiPaperclip size={18} />
          </button>
          <button className="btn btn-link p-1 text-secondary me-1" disabled>
            <FiSmile size={18} />
          </button>
          <input
            type="text"
            className="form-control premium-input flex-grow-1"
            placeholder="Loading secure message history..."
            disabled
          />
          <button
            className="premium-btn-primary d-flex align-items-center justify-content-center p-3"
            style={{ borderRadius: "50%", width: "42px", height: "42px", opacity: 0.5 }}
            disabled
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100" style={{ background: "rgba(15, 23, 42, 0.1)" }}>
      
      {/* Top Header Bar */}
      <div className="border-bottom p-3 d-flex justify-content-between align-items-center" style={{ borderColor: "var(--border-glass) !important", background: "rgba(15, 23, 42, 0.45)" }}>
        <div className="d-flex align-items-center gap-3">
          <div className="avatar-wrapper">
            <img
              src={otherUser?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={otherUser?.name}
              width="42"
              height="42"
              className="rounded-circle"
              style={{ objectFit: "cover" }}
            />
            <span className={`avatar-status-badge ${onlineUsers.includes(otherUser?._id) ? "online" : "offline"}`} />
          </div>

          <div>
            <h6 className="mb-0 text-light fw-bold">{otherUser?.name}</h6>
            <small className={onlineUsers.includes(otherUser?._id) ? "text-success" : "text-secondary"} style={{ fontSize: "0.75rem", fontWeight: "500" }}>
              {onlineUsers.includes(otherUser?._id) ? "Online" : "Offline"}
            </small>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div
        ref={scrollContainerRef}
        className="flex-grow-1 p-3 d-flex flex-column gap-3"
        style={{
          overflowY: "auto",
          background: "rgba(8, 10, 16, 0.6)",
        }}
      >
        {messages.length === 0 ? (
          <div className="my-auto text-center py-5">
            <p className="text-secondary small">This is the start of your secure chat history with {otherUser?.name}.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = (m.sender?._id || m.sender) === user._id;

            return (
              <div
                key={m._id}
                className={`d-flex ${mine ? "justify-content-end" : "justify-content-start"}`}
              >
                <div className="d-flex flex-column position-relative message-container-wrapper" style={{ maxWidth: "60%", width: "fit-content" }}>
                  
                  {mine && !editingMessageId && !m.isTemp && (
                    <button 
                      className="btn btn-link p-1 text-secondary message-menu-btn" 
                      style={{ position: "absolute", left: "-30px", top: "50%", transform: "translateY(-50%)", border: "none", background: "none" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveContextMenu(activeContextMenu === m._id ? null : m._id);
                      }}
                    >
                      <FiMoreVertical size={16} />
                    </button>
                  )}

                  {activeContextMenu === m._id && (
                    <div 
                      className="glass-panel position-absolute"
                      style={{
                        bottom: "100%",
                        left: "-80px",
                        zIndex: 10,
                        width: "90px",
                        padding: "4px",
                        borderRadius: "8px",
                        boxShadow: "var(--shadow-premium)",
                        background: "rgba(15, 22, 36, 0.95)",
                        border: "1px solid var(--border-glass)"
                      }}
                    >
                      <button 
                        className="btn btn-sm btn-link text-light w-100 text-start py-1 px-2 hover-bg-glass border-0" 
                        style={{ fontSize: "0.75rem", textDecoration: "none" }}
                        onClick={() => startEdit(m)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-link text-danger w-100 text-start py-1 px-2 hover-bg-glass border-0" 
                        style={{ fontSize: "0.75rem", textDecoration: "none" }}
                        onClick={() => handleDelete(m._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <div 
                    className={`message-bubble ${mine ? "mine" : "other"}`}
                    style={{
                      opacity: m.status === "sending" ? 0.65 : 1,
                      border: m.status === "error" ? "1px solid rgba(220, 53, 69, 0.5)" : undefined,
                    }}
                  >
                    {editingMessageId === m._id ? (
                      <div className="d-flex flex-column gap-2 p-1" style={{ minWidth: "200px" }}>
                        <input 
                          type="text" 
                          className="form-control premium-input text-light p-2"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(m._id);
                            else if (e.key === "Escape") setEditingMessageId(null);
                          }}
                          style={{ fontSize: "0.85rem", background: "rgba(0,0,0,0.3)" }}
                          autoFocus
                        />
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            className="btn btn-sm btn-secondary py-1 px-2" 
                            style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditText("");
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            className="btn btn-sm btn-primary py-1 px-2" 
                            style={{ fontSize: "0.7rem", padding: "2px 6px", background: "var(--accent-purple)", border: "none" }}
                            onClick={() => handleUpdate(m._id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {m.image && isImageFile(m.image) && (
                          <div className="mb-2 attachment-container">
                            <a href={m.image} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={m.image} 
                                alt="Sent attachment" 
                                className="img-fluid rounded" 
                                style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "cover" }} 
                              />
                            </a>
                          </div>
                        )}
                        {m.image && !isImageFile(m.image) && (
                          <div className="mb-2 attachment-container p-2 rounded bg-dark-glass d-flex align-items-center gap-2 border" style={{ borderColor: "var(--border-glass)", background: "rgba(0, 0, 0, 0.2)" }}>
                            <span className="text-primary"><FiPaperclip size={18} /></span>
                            <a 
                              href={m.image} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-light small text-decoration-underline" 
                              style={{ wordBreak: "break-all" }}
                            >
                              Download Attachment
                            </a>
                          </div>
                        )}
                        {m.text && <p className="mb-0">{m.text}</p>}
                      </>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-1 px-1" style={{ alignSelf: mine ? "flex-end" : "flex-start" }}>
                    <small className="text-secondary" style={{ fontSize: "0.6rem" }}>
                      {formatMessageTime(m.createdAt || new Date())}
                      {m.isEdited && <span className="ms-1 text-secondary opacity-75">(edited)</span>}
                    </small>
                    {m.status === "sending" && <FiClock size={10} className="text-secondary animate-pulse-offline" />}
                    {m.status === "error" && <FiAlertCircle size={12} className="text-danger" title="Message failed to send" />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator bubble */}
        {typing && (
          <div className="d-flex justify-content-start animate-fade-in-up">
            <div className="message-bubble other d-flex align-items-center gap-2">
              <span className="text-secondary small me-1">Typing</span>
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Preview Bar */}
      {selectedFile && (
        <div className="px-3 py-2 border-top d-flex align-items-center justify-content-between gap-3 animate-fade-in-up" style={{ borderColor: "var(--border-glass)", background: "rgba(15, 23, 42, 0.6)" }}>
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            {filePreview ? (
              <img 
                src={filePreview} 
                alt="File preview" 
                className="rounded" 
                style={{ width: "40px", height: "40px", objectFit: "cover" }} 
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center bg-secondary rounded" style={{ width: "40px", height: "40px" }}>
                <FiPaperclip size={18} className="text-light" />
              </div>
            )}
            <div className="text-truncate" style={{ maxWidth: "200px" }}>
              <small className="d-block text-light text-truncate" style={{ fontSize: "0.8rem" }}>{selectedFile.name}</small>
              <small className="d-block text-secondary" style={{ fontSize: "0.7rem" }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </small>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-link text-danger p-0" 
            onClick={() => {
              setSelectedFile(null);
              setFilePreview("");
            }}
            style={{ textDecoration: "none" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Message Controls */}
      <div className="border-top p-3 d-flex align-items-center gap-2 position-relative" style={{ borderColor: "var(--border-glass) !important", background: "rgba(15, 23, 42, 0.45)" }}>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: "none" }} 
        />

        <button 
          className="btn btn-link p-1 text-secondary hover-text-light" 
          style={{ textDecoration: "none" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FiPaperclip size={18} />
        </button>
        <button 
          className="btn btn-link p-1 text-secondary hover-text-light me-1" 
          style={{ textDecoration: "none" }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FiSmile size={18} />
        </button>
        
        <input
          type="text"
          className="form-control premium-input flex-grow-1"
          placeholder="Type message here..."
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyPress}
          style={{ fontSize: "0.9rem" }}
        />

        <button
          className="premium-btn-primary d-flex align-items-center justify-content-center p-3"
          style={{ borderRadius: "50%", width: "42px", height: "42px" }}
          onClick={sendMessage}
        >
          <FiSend size={16} />
        </button>

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div 
            className="glass-panel emoji-picker-popover p-3 position-absolute"
            style={{
              bottom: "75px",
              right: "20px",
              width: "320px",
              height: "280px",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxShadow: "var(--shadow-premium)",
              backdropFilter: "blur(12px)",
              background: "rgba(13, 17, 28, 0.95)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px"
            }}
          >
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "var(--border-glass)" }}>
              <span className="fw-bold text-light" style={{ fontSize: "0.85rem" }}>Select Emoji</span>
              <button 
                className="btn-close btn-close-white" 
                style={{ fontSize: "0.75rem", boxShadow: "none" }} 
                onClick={() => setShowEmojiPicker(false)}
              ></button>
            </div>
            <div className="emoji-grid overflow-auto flex-grow-1" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", padding: "4px" }}>
              {EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  className="btn p-1 fs-4 hover-bg-glass d-flex align-items-center justify-content-center" 
                  style={{ border: "none", background: "none", transition: "transform 0.1s" }}
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default ChatBox;