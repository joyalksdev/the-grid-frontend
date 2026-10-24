// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [deactivationMessage, setDeactivationMessage] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (user?._id) {
        socket.emit('join_user', user._id);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onAccountDeactivated(data) {
      setDeactivationMessage(data?.message || 'Your account is no longer active.');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('account_deactivated', onAccountDeactivated);

    if (socket.connected && user?._id) {
      socket.emit('join_user', user._id);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('account_deactivated', onAccountDeactivated);
    };
  }, [user?._id]);

  const handleDismiss = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network errors on forced logout
    } finally {
      window.location.href = '/auth';
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}

      {/* Real-time Deactivation Modal Popup */}
      {deactivationMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-bg/85 backdrop-blur-md p-4 font-body animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-border-divider bg-card-panel p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-occupied/40 bg-occupied/10 text-occupied">
              <span className="font-heading text-xl font-bold">!</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-main">Session Revoked</h3>
              <p className="text-xs text-sub leading-relaxed">{deactivationMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full h-11 rounded-xl bg-primary-cyan text-app-bg font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-primary-cyan/90 transition-colors touch-manipulation shadow-lg"
            >
              Return to Login
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);