import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Only connect when a user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      "http://localhost:5000";

    const newSocket = io(SOCKET_URL, {
      // Force WebSocket transport — skips HTTP long-polling
      // which causes 404 on Render's proxy layer
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket Connected:", newSocket.id);
      setIsConnected(true);
      // Immediately register the user as online
      newSocket.emit("join", user._id);
    });

    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket Disconnected");
      setIsConnected(false);
      setOnlineUsers([]);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
      setIsConnected(false);
      setOnlineUsers([]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]); // Re-run when auth state changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};