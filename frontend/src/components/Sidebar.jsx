import { useEffect, useState, useContext } from "react";
import { getUsers, createConversation, getConversations, markSeenApi } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { NotificationContext } from "../context/NotificationContext";
import { FiMessageSquare, FiUsers, FiSearch } from "react-icons/fi";

function Sidebar({ setConversation, activeConversationId }) {
  const { user: currentUser } = useContext(AuthContext);
  const { socket, onlineUsers = [] } = useContext(SocketContext);
  const { unreadCounts, resetUnread, seedUnreadCounts } = useContext(NotificationContext);

  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "contacts"
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
    loadConversations();
  }, []);

  // Reload conversations when socket receives a new message
  useEffect(() => {
    if (!socket) return;

    const handleRefreshConversations = () => {
      loadConversations();
    };

    socket.on("receiveMessage", handleRefreshConversations);
    socket.on("sendMessage", handleRefreshConversations);

    return () => {
      socket.off("receiveMessage", handleRefreshConversations);
      socket.off("sendMessage", handleRefreshConversations);
    };
  }, [socket]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.log("Error loading users:", err);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      const convs = data.conversations || [];
      setConversations(convs);
      // Seed initial unread counts from server response
      seedUnreadCounts(convs);
    } catch (err) {
      console.log("Error loading conversations:", err);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const data = await createConversation(userId);
      setConversation(data.conversation);
      setActiveTab("chats");
      loadConversations();
    } catch (err) {
      console.log("Error starting conversation:", err);
    }
  };

  const handleConversationClick = async (conv) => {
    setConversation(conv);
    // Clear unread badge immediately in UI
    resetUnread(conv._id);
    // Tell server to mark messages as seen
    try {
      await markSeenApi(conv._id);
    } catch (err) {
      console.log("Error marking seen:", err);
    }
    // Inform socket server which conversation this user is now viewing
    if (socket) {
      socket.emit("setActiveConversation", conv._id);
    }
  };

  // Filtering
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConversations = conversations.filter((c) => {
    const otherUser = c.members?.find((m) => m._id !== currentUser?._id);
    return otherUser?.name.toLowerCase().includes(search.toLowerCase());
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="d-flex flex-column h-100" style={{ background: "rgba(10, 15, 30, 0.2)" }}>
      
      {/* Tabs Menu */}
      <div className="d-flex px-3 pt-3 border-bottom" style={{ borderColor: "var(--border-glass) !important" }}>
        <button
          onClick={() => { setActiveTab("chats"); setSearch(""); }}
          className={`btn pb-2 px-3 fw-bold rounded-0 text-start border-0 flex-grow-1 ${activeTab === "chats" ? "text-light border-bottom border-primary" : "text-secondary"}`}
          style={{
            fontSize: "0.85rem",
            boxShadow: "none",
            borderBottom: activeTab === "chats" ? "2px solid var(--accent-purple) !important" : "none"
          }}
        >
          <FiMessageSquare size={16} className="me-2" />
          Chats ({conversations.length})
        </button>
        <button
          onClick={() => { setActiveTab("contacts"); setSearch(""); }}
          className={`btn pb-2 px-3 fw-bold rounded-0 text-start border-0 flex-grow-1 ${activeTab === "contacts" ? "text-light border-bottom border-primary" : "text-secondary"}`}
          style={{
            fontSize: "0.85rem",
            boxShadow: "none",
            borderBottom: activeTab === "contacts" ? "2px solid var(--accent-purple) !important" : "none"
          }}
        >
          <FiUsers size={16} className="me-2" />
          Contacts ({users.length})
        </button>
      </div>

      {/* Search Input Box */}
      <div className="px-3 py-2">
        <div className="position-relative">
          <FiSearch className="text-secondary position-absolute" style={{ top: "14px", left: "14px" }} />
          <input
            type="text"
            placeholder={activeTab === "chats" ? "Search active chats..." : "Search all users..."}
            className="form-control premium-input w-100 ps-5"
            style={{ fontSize: "0.85rem" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lists Section */}
      <div className="flex-grow-1 px-3 pb-3" style={{ overflowY: "auto" }}>
        
        {/* Chats Tab */}
        {activeTab === "chats" && (
          <div className="d-flex flex-column gap-2">
            {filteredConversations.length === 0 ? (
              <p className="text-secondary text-center my-4 small">
                {search ? "No matches found" : "No active conversations. Start one under Contacts!"}
              </p>
            ) : (
              filteredConversations.map((c) => {
                const otherUser = c.members?.find((m) => m._id !== currentUser?._id);
                const isActive = c._id === activeConversationId;
                const unread = unreadCounts[c._id] || 0;
                if (!otherUser) return null;

                return (
                  <div
                    key={c._id}
                    className="p-3 glass-card cursor-pointer"
                    style={{
                      cursor: "pointer",
                      background: isActive ? "rgba(139, 92, 246, 0.12)" : "var(--bg-card)",
                      borderColor: isActive ? "rgba(139, 92, 246, 0.3)" : unread > 0 ? "rgba(139, 92, 246, 0.2)" : "var(--border-glass)"
                    }}
                    onClick={() => handleConversationClick(c)}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-wrapper">
                          <img
                            src={otherUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt=""
                            width="40"
                            height="40"
                            className="rounded-circle"
                            style={{ objectFit: "cover" }}
                          />
                          <span className={`avatar-status-badge ${onlineUsers.includes(otherUser._id) ? "online" : "offline"}`} />
                        </div>
                        
                        <div style={{ maxWidth: "140px" }}>
                          <h6 className={`mb-0 small text-truncate ${unread > 0 ? "text-light fw-bold" : "text-light fw-bold"}`}>
                            {otherUser.name}
                          </h6>
                          <small
                            className={`text-truncate d-block ${unread > 0 ? "text-light" : "text-secondary"}`}
                            style={{ fontSize: "0.75rem", fontWeight: unread > 0 ? "500" : "400" }}
                          >
                            {c.lastMessage || "No messages yet"}
                          </small>
                        </div>
                      </div>

                      <div className="text-end d-flex flex-column align-items-end gap-1">
                        <small className="text-secondary d-block" style={{ fontSize: "0.65rem" }}>
                          {formatTime(c.lastMessageAt)}
                        </small>
                        {unread > 0 && (
                          <span className="unread-badge">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div className="d-flex flex-column gap-2">
            {filteredUsers.length === 0 ? (
              <p className="text-secondary text-center my-4 small">No users found</p>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="p-3 glass-card cursor-pointer"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleUserClick(u._id)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar-wrapper">
                      <img
                        src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt=""
                        width="40"
                        height="40"
                        className="rounded-circle"
                        style={{ objectFit: "cover" }}
                      />
                       <span className={`avatar-status-badge ${onlineUsers.includes(u._id) ? "online" : "offline"}`} />
                    </div>

                    <div>
                      <h6 className="mb-0 text-light fw-bold small">{u.name}</h6>
                       <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
                        {onlineUsers.includes(u._id) ? "Online" : "Offline"}
                      </small>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Sidebar;