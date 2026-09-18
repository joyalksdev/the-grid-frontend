// src/context/TimerContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
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
      toast.error(err.response?.data?.error || err.message || "Failed to fetch station statuses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreens();
  }, [fetchScreens]);

  // Real-time WebSocket event handling
  useEffect(() => {
    if (!socket) return;

    const handleScreenUpdated = (updatedScreen) => {
      setScreens((prevScreens) =>
        prevScreens.map((screen) => {
          const sId = screen.screenId ?? screen.id ?? screen._id;
          const uId = updatedScreen.screenId ?? updatedScreen.id ?? updatedScreen._id;
          return sId === uId ? updatedScreen : screen;
        })
      );
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

  // Local 1s timer loop for completion alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setScreens((prevScreens) =>
        prevScreens.map((screen) => {
          if (screen.status === "occupied" && screen.activeSession?.endTime) {
            const endTime = new Date(screen.activeSession.endTime);
            const sessionKey = `${screen.screenId || screen._id}-${screen.activeSession.startTime}`;

            if (endTime <= now && !alertedSessions.current.has(sessionKey)) {
              alertedSessions.current.add(sessionKey);
              toast.error(`Time's up for ${screen.name}! Ready for checkout.`, {
                duration: 6000,
              });
            }
          }
          return screen;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startSession = async (sessionData) => {
    try {
      await screenService.startSession(sessionData.screenId, sessionData);
      toast.success(
        `Session started for ${
          sessionData.player === "Guest" ? "guest player" : sessionData.player
        }!`
      );
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Could not start session");
      throw err;
    }
  };

  const extendSession = async (screenId, additionalMinutes = 30) => {
    try {
      await screenService.extendSession(screenId, { additionalMinutes });
      toast.success(`+${additionalMinutes} Mins Added!`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Could not extend session");
      throw err;
    }
  };

  const checkoutSession = async ({ screenId, finalCost, paymentType }) => {
    try {
      await screenService.checkoutSession(screenId, { finalCost, paymentType });
      toast.success(`₹${finalCost} payment recorded successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Checkout failed");
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