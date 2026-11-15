// src/context/NotificationContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { notificationService } from "../services/notificationService";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { notify } from "../utils/toastController";
import { playNotificationSound } from "../utils/audioAlert";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [modalQueue, setModalQueue] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const userId = String(user?._id || user?.id || "");

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list);

      if (Array.isArray(data?.unacknowledgedModals)) {
        setModalQueue(data.unacknowledgedModals);
      }
    } catch (_) {
      // Silently ignore if offline
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNotificationCreated = (rawItem) => {
      if (!rawItem || !rawItem._id) return;

      const isReadByMe = Array.isArray(rawItem.readBy)
        ? rawItem.readBy.some((r) => String(r.user) === userId)
        : false;
      const isAckByMe = Array.isArray(rawItem.acknowledgedBy)
        ? rawItem.acknowledgedBy.some((a) => String(a.user) === userId)
        : false;

      const item = {
        ...rawItem,
        isRead: isReadByMe,
        isAcknowledged: isAckByMe,
        readCount: Array.isArray(rawItem.readBy) ? rawItem.readBy.length : 0,
        acknowledgedCount: Array.isArray(rawItem.acknowledgedBy)
          ? rawItem.acknowledgedBy.length
          : 0,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n._id === item._id)) return prev;
        return [item, ...prev];
      });

      // Play chime & show toast if created by someone else / system
      if (!isReadByMe) {
        playNotificationSound();
        notify.success(item.title);
      }

      // If it's an Important Update Modal announcement and not yet acknowledged by this user, queue it immediately!
      if (
        (item.isModalPopup ||
          item.priority === "important" ||
          item.priority === "critical") &&
        item.type === "announcement" &&
        !isAckByMe
      ) {
        setModalQueue((prev) => {
          if (prev.some((m) => m._id === item._id)) return prev;
          return [item, ...prev];
        });
      }
    };

    const handleNotificationUpdated = (rawItem) => {
      if (!rawItem || !rawItem._id) return;
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === rawItem._id
            ? {
                ...n,
                ...rawItem,
                readCount: Array.isArray(rawItem.readBy)
                  ? rawItem.readBy.length
                  : n.readCount,
                acknowledgedCount: Array.isArray(rawItem.acknowledgedBy)
                  ? rawItem.acknowledgedBy.length
                  : n.acknowledgedCount,
              }
            : n
        )
      );
    };

    const handleNotificationDeleted = ({ id }) => {
      if (!id) return;
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setModalQueue((prev) => prev.filter((m) => m._id !== id));
    };

    socket.on("notification_created", handleNotificationCreated);
    socket.on("notification_updated", handleNotificationUpdated);
    socket.on("notification_deleted", handleNotificationDeleted);

    return () => {
      socket.off("notification_created", handleNotificationCreated);
      socket.off("notification_updated", handleNotificationUpdated);
      socket.off("notification_deleted", handleNotificationDeleted);
    };
  }, [socket, isAuthenticated, userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const activeModalNotification = modalQueue[0] || null;

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (_) {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (_) {}
  }, []);

  const acknowledgeModal = useCallback(async (id) => {
    setModalQueue((prev) => prev.filter((m) => m._id !== id));
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true, isAcknowledged: true } : n
      )
    );
    try {
      await notificationService.acknowledgeModal(id);
    } catch (_) {}
  }, []);

  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setModalQueue((prev) => prev.filter((m) => m._id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch (_) {}
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        activeModalNotification,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        acknowledgeModal,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
