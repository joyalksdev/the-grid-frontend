// src/utils/toastController.jsx
import toast from "react-hot-toast";
import React from "react";
import Toast from "../components/ui/Toast";

const createToastHandler = (type, defaultDuration = 4000) => (titleOrMessage, messageArg, options = {}) => {
  const title = messageArg ? titleOrMessage : titleOrMessage;
  const message = messageArg ? messageArg : undefined;

  return toast.custom(
    (t) => (
      <Toast 
        type={type} 
        title={title} 
        message={message} 
        duration={defaultDuration}
        onClose={() => toast.dismiss(t.id)} 
        onMouseEnter={t.startPause}
        onMouseLeave={t.endPause}
      />
    ),
    { duration: defaultDuration, ...options }
  );
};

export const notify = {
  success: createToastHandler("success"),
  error: createToastHandler("error"),
  warning: createToastHandler("warning"),
  info: createToastHandler("info"),
  screen: createToastHandler("screen"),
  checkout: createToastHandler("checkout"),

  timeUp: (screenName, message = "Session time has expired!", options = {}) =>
    toast.custom(
      (t) => (
        <Toast
          type="timeup"
          title={`⏱️ Time Up: ${screenName}`}
          message={message}
          duration={8000}
          onClose={() => toast.dismiss(t.id)}
          onMouseEnter={t.startPause}
          onMouseLeave={t.endPause}
        />
      ),
      { duration: 8000, ...options }
    ),

  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss(),
};