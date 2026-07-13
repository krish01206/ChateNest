import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";

function Home() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);
  const [conversation, setConversation] = useState(null);

  useEffect(() => {
    if (socket && user) {
      socket.emit("join", user._id);
    }
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    socket.on("onlineUsers", (users) => {
      console.log("Online Users:", users);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, [socket]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: "var(--bg-app)", overflow: "hidden" }}>
      <div className="row g-0 flex-grow-1">
        
        {/* Sidebar Left Column */}
        <div className="col-12 col-md-4 col-lg-3 border-end d-flex flex-column" style={{ borderColor: "var(--border-glass) !important", height: "100vh" }}>
          
          {/* Header Panel */}
          <div className="p-3 border-bottom d-flex flex-column gap-3" style={{ borderColor: "var(--border-glass) !important", background: "rgba(15, 23, 42, 0.4)" }}>
            
            {/* Top Brand & Socket Status */}
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="fw-bold mb-0" style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px"
              }}>
                ChatNest
              </h4>

              {/* Status Pill */}
              <div className={`status-indicator-pill ${isConnected ? 'connected' : 'disconnected'}`}>
                <span className="indicator-dot" />
                <span>{isConnected ? "Live" : "Offline"}</span>
              </div>
            </div>

            {/* Profile Summary Panel */}
            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-glass)" }}>
              <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
                <div className="avatar-wrapper">
                  <img
                    src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={user?.name}
                    width="36"
                    height="36"
                    className="rounded-circle"
                    style={{ objectFit: "cover" }}
                  />
                  <span className="avatar-status-badge online" />
                </div>
                
                <div style={{ maxWidth: "120px" }}>
                  <h6 className="mb-0 text-truncate text-light small fw-bold">{user?.name}</h6>
                  <span className="text-secondary" style={{ fontSize: "0.7rem" }}>Settings & Account</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center gap-1">
                <button
                  className="btn btn-link p-1 text-secondary hover-text-light"
                  onClick={() => navigate("/profile")}
                  title="Profile Settings"
                  style={{ textDecoration: "none" }}
                >
                  <FiSettings size={18} />
                </button>
                <button
                  className="btn btn-link p-1 text-danger hover-text-danger"
                  onClick={logout}
                  title="Log out"
                  style={{ textDecoration: "none" }}
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            </div>

          </div>

          {/* User List Sidebar */}
          <div className="flex-grow-1" style={{ overflowY: "auto" }}>
            <Sidebar setConversation={setConversation} activeConversationId={conversation?._id} />
          </div>

        </div>

        {/* Chat Panel Right Column */}
        <div className="col-12 col-md-8 col-lg-9 d-flex flex-column" style={{ height: "100vh" }}>
          <ChatBox conversation={conversation} />
        </div>

      </div>
    </div>
  );
}

export default Home;