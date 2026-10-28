// src/components/ui/Dropdown.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Dropdown({ trigger, items, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, ready: false });

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const dropdownWidth = 224; // w-56 width equivalent
      const padding = 12;

      let left = align === "right" ? rect.right - dropdownWidth : rect.left;

      if (left + dropdownWidth > window.innerWidth - padding) {
        left = window.innerWidth - dropdownWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      const estimatedHeight = items.length * 40 + 20;
      let top = rect.bottom + 8;
      if (top + estimatedHeight > window.innerHeight - padding) {
        top = rect.top - estimatedHeight - 8;
      }

      setCoords({
        top,
        left,
        ready: true,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline-block cursor-pointer select-none"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              visibility: coords.ready ? "visible" : "hidden",
            }}
            // Removed 'animate-in' entirely to eliminate hidden translation/scale shifts
            className="z-[9999] w-56 rounded-2xl bg-card-panel/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] py-2 focus:outline-none backdrop-blur-2xl"
          >
            {items.map((item, index) => {
              if (item.type === "divider") {
                return <div key={index} className="h-[1px] bg-white/10 my-1.5 mx-3" />;
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className={`group w-full text-left flex items-center justify-between px-4 py-2.5 font-medium text-xs tracking-wide transition-all duration-150 active:scale-[0.98] ${
                    item.danger
                      ? "text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                      : "text-main/90 hover:text-main hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {item.icon && (
                      <span className="text-base shrink-0 text-sub transition-colors group-hover:text-primary-cyan">
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}