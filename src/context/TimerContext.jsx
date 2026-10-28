// @refresh reload
// src/context/TimerContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { notify } from "../utils/toastController";
import { screenService } from "../services/screenService";
import { useSocket } from "./SocketContext";

const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const alertedSessions = useRef(new Set());
  
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  const fetchScreens = useCallback(async () => {
    try {
      const response = await screenService.getAllScreens();

      const screensData = Array.isArray(response)
        ? response
        : response?.screens || response?.data || [];

      setScreens(screensData);
    } catch (err) {
      console.error("Error fetching screens:", err);
      setScreens([]);
      notify.error(err.response?.data?.error || err.message || "Failed to fetch station statuses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreens();
  }, [fetchScreens]);

  // Real-time WebSocket event handling & notifications using notify controller
  useEffect(() => {
    if (!socket) return;

    const handleScreenUpdated = (updatedScreen) => {
      setScreens((prevScreens) => {
        const oldScreen = prevScreens.find((s) => {
          const sId = s.screenId ?? s.id ?? s._id;
          const uId = updatedScreen.screenId ?? updatedScreen.id ?? updatedScreen._id;
          return sId === uId;
        });

        if (oldScreen) {
          const name = updatedScreen.name || oldScreen.name || "Station";

          // 1. Session Started
          if (oldScreen.status !== "occupied" && updatedScreen.status === "occupied") {
            const player = updatedScreen.activeSession?.player || "Guest";
            notify.success(`Session started for ${player} on ${name}`);
          }
          // 2. Session Checked Out / Ended
          else if (oldScreen.status === "occupied" && updatedScreen.status !== "occupied") {
            notify.checkout(`${name} Checkout`, "Station has been successfully checked out.");
          }
          // 3. Session Extended
          else if (
            oldScreen.status === "occupied" &&
            updatedScreen.status === "occupied" &&
            oldScreen.activeSession?.endTime &&
            updatedScreen.activeSession?.endTime &&
            new Date(updatedScreen.activeSession.endTime) > new Date(oldScreen.activeSession.endTime)
          ) {
            const oldEnd = new Date(oldScreen.activeSession.endTime).getTime();
            const newEnd = new Date(updatedScreen.activeSession.endTime).getTime();
            const addedMins = Math.round((newEnd - oldEnd) / 60000);
            notify.success(`+${addedMins} Mins added to ${name}`);
          }
        }

        return prevScreens.map((screen) => {
          const sId = screen.screenId ?? screen.id ?? screen._id;
          const uId = updatedScreen.screenId ?? updatedScreen.id ?? updatedScreen._id;
          return sId === uId ? updatedScreen : screen;
        });
      });
    };

    const handleScreensUpdated = (updatedScreens) => {
      setScreens(updatedScreens);
    };

    socket.on("screen_updated", handleScreenUpdated);
    socket.on("screens_updated", handleScreensUpdated);

    return () => {
      socket.off("screen_updated", handleScreenUpdated);
      socket.off("screens_updated", handleScreensUpdated);
    };
  }, [socket]);

  // Local 1s timer loop for completion alerts using notify.timeUp
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      screens.forEach((screen) => {
        if (screen.status === "occupied" && screen.activeSession?.endTime) {
          const endTime = new Date(screen.activeSession.endTime);
          const sessionKey = `${screen.screenId || screen._id}-${screen.activeSession.startTime}`;

          if (endTime <= now && !alertedSessions.current.has(sessionKey)) {
            alertedSessions.current.add(sessionKey);
            notify.timeUp(screen.name, "Ready for checkout.");
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screens]);

  const startSession = async (sessionData) => {
    try {
      await screenService.startSession(sessionData.screenId, sessionData);
    } catch (err) {
      notify.error(err.response?.data?.error || err.message || "Could not start session");
      throw err;
    }
  };

  const extendSession = async (screenId, additionalMinutes = 30) => {
    try {
      await screenService.extendSession(screenId, { additionalMinutes });
    } catch (err) {
      notify.error(err.response?.data?.error || err.message || "Could not extend session");
      throw err;
    }
  };

  const checkoutSession = async ({ screenId, finalCost, paymentType, splitDetails }) => {
    try {
      await screenService.checkoutSession(screenId, { finalCost, paymentType, splitDetails });
    } catch (err) {
      notify.error(err.response?.data?.error || err.message || "Checkout failed");
      throw err;
    }
  };

  return (
    <TimerContext.Provider
      value={{
        screens,
        loading,
        fetchScreens,
        startSession,
        extendSession,
        checkoutSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimers() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimers must be used within a TimerProvider");
  }
  return context;
}