import {
  createContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";

export const SocketContext =
  createContext();

export const SocketProvider = ({
  children,
}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      "http://localhost:5000";

    const newSocket = io(
      SOCKET_URL,
      {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      }
    );

    newSocket.on(
      "connect",
      () => {
        console.log("Socket Connected:", newSocket.id);
        setIsConnected(true);
      }
    );

    newSocket.on(
      "disconnect",
      () => {
        console.log("Socket Disconnected");
        setIsConnected(false);
      }
    );

    newSocket.on(
      "connect_error",
      () => {
        console.log("Socket Connection Error");
        setIsConnected(false);
      }
    );

    setSocket(
      newSocket
    );

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};