import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { SocketContext } from "./SocketContext";
import { AuthContext } from "./AuthContext";

export const NotificationContext = createContext();

// Generates a soft, premium two-tone ping using the Web Audio API — no file needed
const playNotificationPing = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // First tone: soft attack
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain1.gain.setValueAtTime(0.0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone: harmonic shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.0, ctx.currentTime + 0.05);
    gain2.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.45);

    // Auto-close audio context after sound finishes
    setTimeout(() => ctx.close(), 600);
  } catch (e) {
    // Web Audio API not supported — fail silently
  }
};

export const NotificationProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  // { [conversationId]: count }
  const [unreadCounts, setUnreadCounts] = useState({});

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Listen for unread message events from the socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewUnread = ({ conversationId, sender, text, image }) => {
      // Increment the unread badge count for this conversation
      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1,
      }));

      // --- AUDIO PING ---
      // Play only when tab is not focused or when user is in a different chat
      playNotificationPing();

      // --- BROWSER DESKTOP NOTIFICATION ---
      if (!document.hasFocus() && Notification.permission === "granted") {
        // Resolve sender name — sender may be an ID string or a populated object
        const senderName =
          typeof sender === "object" && sender?.name
            ? sender.name
            : "Someone";
        const body =
          text || (image ? "Sent an attachment 📎" : "Sent you a message");

        const notification = new Notification(`New message from ${senderName}`, {
          body,
          icon: sender?.profilePic || "/favicon.ico",
          tag: conversationId, // deduplicate: same conv replaces previous popup
          renotify: true,
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    };

    socket.on("newUnreadMessage", handleNewUnread);

    return () => {
      socket.off("newUnreadMessage", handleNewUnread);
    };
  }, [socket, user]);

  // Call this when the user opens a conversation to clear its badge
  const resetUnread = useCallback((conversationId) => {
    setUnreadCounts((prev) => {
      if (!prev[conversationId]) return prev;
      const updated = { ...prev };
      delete updated[conversationId];
      return updated;
    });
  }, []);

  // Seed initial unread counts from the conversations API response
  const seedUnreadCounts = useCallback((conversations) => {
    const counts = {};
    conversations.forEach((conv) => {
      if (conv.unreadCount > 0) {
        counts[conv._id] = conv.unreadCount;
      }
    });
    setUnreadCounts(counts);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCounts, resetUnread, seedUnreadCounts }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
