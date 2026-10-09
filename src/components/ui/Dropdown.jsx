// src/components/ui/Dropdown.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Dropdown({ trigger, items, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: align === "right" ? rect.right + window.scrollX : rect.left + window.scrollX,
        bottom: rect.top + window.scrollY,
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
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top - window.scrollY + 6}px`,
              ...(align === "right"
                ? { right: `${window.innerWidth - (coords.left - window.scrollX)}px` }
                : { left: `${coords.left - window.scrollX}px` }),
            }}
            className="z-[9999] w-52 rounded-xl bg-card-panel border border-border-divider shadow-2xl py-1.5 focus:outline-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          >
            {items.map((item, index) => {
              if (item.type === "divider") {
                return <div key={index} className="h-[1px] bg-border-divider my-1" />;
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
                  className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    item.danger
                      ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      : "text-sub hover:text-main hover:bg-app-bg"
                  }`}
                >
                  {item.icon && <span className="text-sm shrink-0">{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}