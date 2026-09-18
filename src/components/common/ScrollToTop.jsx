// src/components/common/ScrollToTop.jsx
import React, { useState, useEffect } from "react";
import { CaretUp } from "@phosphor-icons/react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-[#0E131F] text-[#00F6FF] border border-[#1C2436] shadow-lg shadow-black/50 hover:bg-[#161920] hover:border-[#00F6FF]/40 active:scale-95 transition-all duration-200 cursor-pointer group"
    >
      <CaretUp
        size={20}
        weight="bold"
        className="group-hover:-translate-y-0.5 transition-transform duration-200"
      />
    </button>
  );
}