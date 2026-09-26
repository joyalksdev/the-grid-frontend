// src/utils/toastController.js
import toast from "react-hot-toast"; // Or replace with your active toast library
import React from "react";
import Toast from "../components/ui/Toast";

export const notify = {
  success: (title, message) =>
    toast.custom((t) => (
      <Toast type="success" title={title} message={message} onClose={() => toast.dismiss(t.id)} />
    )),

  error: (title, message) =>
    toast.custom((t) => (
      <Toast type="error" title={title} message={message} onClose={() => toast.dismiss(t.id)} />
    )),

  warning: (title, message) =>
    toast.custom((t) => (
      <Toast type="warning" title={title} message={message} onClose={() => toast.dismiss(t.id)} />
    )),

  info: (title, message) =>
    toast.custom((t) => (
      <Toast type="info" title={title} message={message} onClose={() => toast.dismiss(t.id)} />
    )),

  timeUp: (screenName, message = "Session time has expired!") =>
    toast.custom(
      (t) => (
        <Toast
          type="timeup"
          title={`⏱️ Time Up: ${screenName}`}
          message={message}
          onClose={() => toast.dismiss(t.id)}
        />
      ),
      { duration: 8000 } // Keep time-up alerts visible longer
    ),

  screen: (title, message) =>
    toast.custom((t) => (
      <Toast type="screen" title={title} message={message} onClose={() => toast.dismiss(t.id)} />
    )),

  checkout: (title, message) =>
    toast.custom((t) => (
      <Toast type="checkout" title={title} message={message} onClose={() => toast.dismiss(t.id)} />
    )),
};