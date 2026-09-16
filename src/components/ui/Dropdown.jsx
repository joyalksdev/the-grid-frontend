// src/components/ui/Dropdown.jsx
import { useState, useEffect, useRef } from "react";

export default function Dropdown({ trigger, items, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignClass} mt-2 w-48 rounded-md bg-card-panel border border-border-divider shadow-xl z-50 py-1 focus:outline-none`}
        >
          {items.map((item, index) => {
            if (item.type === "divider") {
              return <div key={index} className="h-[1px] bg-border-divider my-1" />;
            }

            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  item.danger
                    ? "text-occupied hover:bg-occupied/10"
                    : "text-sub hover:text-main hover:bg-app-bg"
                }`}
              >
                {item.icon && <span className="text-sm shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}