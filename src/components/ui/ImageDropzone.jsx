// src/components/ui/ImageDropzone.jsx
import React, { useEffect, useRef, useState } from "react";
import { ImageSquare, UploadSimple, X } from "@phosphor-icons/react";

/**
 * Drag & drop / click-to-pick image input with live preview.
 *
 * Props:
 *  - label, hint
 *  - aspect: CSS aspect-ratio string, e.g. "16 / 9" or "3 / 4"
 *  - file: currently selected File (or null)
 *  - existingUrl: already-uploaded image URL (edit mode)
 *  - onChange(file | null)
 *  - onError(message)
 *  - maxSizeMB, accept, required
 */
export default function ImageDropzone({
  label,
  hint,
  aspect = "16 / 9",
  file,
  existingUrl = "",
  onChange,
  onError,
  maxSizeMB = 5,
  accept = "image/jpeg,image/png,image/webp,image/avif",
  required = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [objectUrl, setObjectUrl] = useState("");

  // Build & clean up a local preview URL for the selected file
  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = objectUrl || existingUrl;

  const validateAndSet = (picked) => {
    if (!picked) return;
    const allowed = accept.split(",").map((t) => t.trim());
    if (!allowed.includes(picked.type)) {
      onError?.("Only JPG, PNG, WEBP or AVIF images are allowed");
      return;
    }
    if (picked.size > maxSizeMB * 1024 * 1024) {
      onError?.(`Image must be under ${maxSizeMB}MB`);
      return;
    }
    onChange?.(picked);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-main">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {hint && <span className="text-[10px] text-sub">{hint}</span>}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ aspectRatio: aspect }}
        className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan ${
          dragging
            ? "border-primary-cyan bg-primary-cyan/10"
            : previewUrl
            ? "border-border-divider bg-app-bg"
            : "border-border-divider bg-app-bg hover:border-primary-cyan/50"
        }`}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-black">
                <UploadSimple size={13} weight="bold" /> Replace
              </span>
            </div>
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(null);
                }}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-md transition-colors hover:bg-rose-500"
                title="Remove selected image"
              >
                <X size={13} weight="bold" />
              </button>
            )}
            {file && (
              <span className="absolute bottom-2 left-2 rounded-md bg-primary-cyan px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-app-bg">
                New
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center">
            <ImageSquare size={26} className="text-sub/60 group-hover:text-primary-cyan" />
            <p className="text-[11px] font-semibold text-main">
              Drop image or <span className="text-primary-cyan">browse</span>
            </p>
            <p className="text-[10px] text-sub">JPG, PNG, WEBP · Max {maxSizeMB}MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          validateAndSet(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
