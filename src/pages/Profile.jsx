// src/pages/Profile.jsx
import React, { useState, useRef, useEffect, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  EnvelopeSimple,
  PhoneCall,
  IdentificationBadge,
  Camera,
  PencilSimple,
  ArrowsDownUp,
  Key,
  User,
  CheckCircle,
  Clock,
  Timer,
  SignIn,
  CalendarCheck,
  Pulse,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../components/ui/Sheet";
import { toast } from "react-hot-toast";

const GRID_TEXTURE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,246,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,246,255,0.08) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  WebkitMaskImage: "radial-gradient(ellipse at top, #000 30%, transparent 80%)",
  maskImage: "radial-gradient(ellipse at top, #000 30%, transparent 80%)",
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg";

const initialsOf = (name) => (name?.trim()?.[0] || "U").toUpperCase();

/**
 * Client-Side Lossless WebP Canvas Image Compressor
 * Converts large avatar photos to lightweight WebP blobs (<200KB)
 */
const compressAvatarImage = (file, maxDimension = 800, quality = 0.88) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to process image compression"));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp", lastModified: Date.now() }
            );

            resolve({
              compressedFile,
              originalSizeKb: (file.size / 1024).toFixed(1),
              compressedSizeKb: (blob.size / 1024).toFixed(1),
              savingsPct: Math.round((1 - blob.size / file.size) * 100),
            });
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function Avatar({ src, name, size = "32px", onError }) {
  const [broken, setBroken] = useState(false);
  const showImage = src && !broken;

  useEffect(() => setBroken(false), [src]);

  return (
    <div
      className="grid size-full place-items-center overflow-hidden rounded-full bg-app-bg select-none"
      style={{ fontSize: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="size-full object-cover"
          onError={() => {
            setBroken(true);
            onError?.();
          }}
        />
      ) : (
        <span className="font-mono font-bold text-primary-cyan">{initialsOf(name)}</span>
      )}
    </div>
  );
}

/**
 * iPhone Battery / Apple Watch Activity Ring Progression Component
 */
function CircularProgressRing({ percentage = 81, size = 104, strokeWidth = 9 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg className="size-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border-divider/90"
          fill="transparent"
        />
        {/* Glow backdrop ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth + 2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary-cyan/25 blur-[3px] transition-all duration-1000 ease-out"
          fill="transparent"
        />
        {/* Active progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary-cyan transition-all duration-1000 ease-out"
          fill="transparent"
        />
      </svg>
      {/* Center Percentage Display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-mono text-xl font-black text-main leading-none">
          {percentage}%
        </span>
        <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-sub">
          Shift
        </span>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, isMono = false, badge }) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="flex shrink-0 items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-sub">
        <Icon size={16} aria-hidden="true" className="text-primary-cyan" />
        {label}
      </dt>
      <dd className="flex items-center gap-2 min-w-0 sm:justify-end">
        <span className={`truncate text-sm font-semibold text-main ${isMono ? "font-mono" : ""}`}>
          {value || <span className="font-normal text-sub/60">Not configured</span>}
        </span>
        {badge}
      </dd>
    </div>
  );
}

function EditProfileSheet({ isOpen, onClose, user, avatarUrl, onSave }) {
  const nameId = useId();
  const phoneId = useId();
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setPreview(avatarUrl || user?.photoUrl || null);
    setFile(null);
    setCompressionStats(null);
  }, [isOpen, user, avatarUrl]);

  useEffect(
    () => () => objectUrlRef.current && URL.revokeObjectURL(objectUrlRef.current),
    []
  );

  const handlePickFile = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setCompressing(true);
    setCompressionStats(null);

    try {
      const result = await compressAvatarImage(rawFile);

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(result.compressedFile);
      objectUrlRef.current = url;

      setFile(result.compressedFile);
      setPreview(url);
      setCompressionStats(result);
      toast.success(`Photo compressed (${result.savingsPct}% space saved)`);
    } catch (err) {
      toast.error(err.message || "Failed to compress image");
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (compressing) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      if (file) {
        formData.append("avatar", file);
      }

      await onSave(formData);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your display identity and avatar image."
      footer={
        <button
          type="submit"
          form="edit-profile-form"
          disabled={submitting || compressing}
          className={PRIMARY_BTN}
        >
          {submitting ? "Saving..." : compressing ? "Compressing..." : "Save Changes"}
        </button>
      }
    >
      <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl border border-border-divider/80 bg-card-panel/60 p-3.5">
          <div className="relative shrink-0">
            <div className="size-16 rounded-full border border-border-divider bg-app-bg p-0.5 shadow-sm">
              <Avatar src={preview} name={name} size="20px" />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload photo"
              className={`absolute -bottom-1 -right-1 grid size-6 cursor-pointer place-items-center rounded-full border border-card-panel bg-primary-cyan text-app-bg transition-transform hover:scale-105 ${FOCUS}`}
            >
              <Camera size={13} weight="bold" />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`text-xs font-semibold text-primary-cyan hover:underline ${FOCUS}`}
            >
              {preview ? "Change Photo" : "Upload Photo"}
            </button>
            <p className="text-[11px] text-sub">
              Automatically compressed to WebP format before upload.
            </p>

            {compressionStats && (
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-400">
                <ArrowsDownUp size={12} />
                <span>
                  {compressionStats.originalSizeKb} KB → {compressionStats.compressedSizeKb} KB (-{compressionStats.savingsPct}%)
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePickFile}
            className="sr-only"
          />
        </div>

        <div>
          <label htmlFor={nameId} className="mb-1 block font-mono text-xs font-medium uppercase tracking-wider text-sub">
            Full Name
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Joyal K.S."
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor={phoneId} className="mb-1 block font-mono text-xs font-medium uppercase tracking-wider text-sub">
            Phone Number
          </label>
          <input
            id={phoneId}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border-divider/60 bg-app-bg/50 p-3 text-xs text-sub">
          <Key size={15} className="shrink-0 text-primary-cyan" />
          <span>Email and system roles are managed by administrators.</span>
        </div>
      </form>
    </Sheet>
  );
}

export default function Profile() {
  const { user, isAdmin, setUser } = useAuth();
  const reduceMotion = useReducedMotion();

  const [avatarUrl, setAvatarUrl] = useState(user?.photoUrl || null);
  const [bgBroken, setBgBroken] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Dummy Staff Analytics Data
  const dummyAnalytics = {
    checkInTime: "02:30 PM",
    loggedHours: "6.5 hrs",
    targetHours: "8.0 hrs",
    completionPct: 81,
    weeklyTotal: "34.5 / 40 hrs",
    shiftStatus: "Active Shift",
  };

  useEffect(() => {
    setAvatarUrl(user?.photoUrl || null);
    setBgBroken(false);
  }, [user?.photoUrl]);

  const handleSave = async (formData) => {
    const updatedUser = await userService.updateProfile(formData);
    setAvatarUrl(updatedUser.photoUrl);

    if (setUser) {
      setUser((prev) => ({ ...prev, ...updatedUser }));
    }
    toast.success("Profile updated successfully");
  };

  const hasPhoto = Boolean(avatarUrl && !bgBroken);
  const userRole = user?.role || "staff";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 font-body text-main">
      {/* Hero Header with Blurred Background Glow & Grid Overlay */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-border-divider/80 bg-card-panel shadow-lg"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          {hasPhoto ? (
            <>
              <img
                src={avatarUrl}
                alt=""
                onError={() => setBgBroken(true)}
                className="size-full scale-125 object-cover opacity-40 blur-3xl saturate-150"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-app-bg/20 via-app-bg/70 to-card-panel" />
            </>
          ) : (
            <>
              <div className="absolute inset-0" style={GRID_TEXTURE} />
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary-cyan/10 via-primary-cyan/5 to-transparent" />
            </>
          )}
        </div>

        <div className="relative flex flex-col items-center gap-5 px-6 pb-7 pt-10 text-center sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:pb-8 sm:pt-12 sm:text-left">
          {/* Avatar frame */}
          <div className="relative shrink-0">
            <div className="size-28 rounded-full border-4 border-card-panel bg-app-bg shadow-2xl shadow-black/60 sm:size-32">
              <Avatar src={avatarUrl} name={user?.name} size="36px" />
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Change photo"
              className={`absolute bottom-0 right-0 grid size-8 cursor-pointer place-items-center rounded-full border-2 border-card-panel bg-primary-cyan text-app-bg shadow-md transition-transform hover:scale-105 ${FOCUS}`}
            >
              <Camera size={15} weight="bold" />
            </button>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="truncate font-heading text-3xl font-extrabold tracking-tight text-main sm:text-4xl md:text-5xl">
              {user?.name || "Grid Staff Member"}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
                    : "border-border-divider bg-app-bg/80 text-sub"
                }`}
              >
                <ShieldCheck size={13} weight="fill" /> {userRole}
              </span>

              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle size={13} weight="fill" /> Active Operator
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border-divider/80 bg-app-bg px-3.5 font-mono text-xs font-semibold text-main transition-colors hover:border-primary-cyan/50 ${FOCUS}`}
          >
            <PencilSimple size={15} className="text-primary-cyan" />
            <span>Edit Profile</span>
          </button>
        </div>
      </motion.section>

      {/* Staff Activity Analytics Widget (iOS Activity Ring Style) */}
      <section className="overflow-hidden rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-divider/60 pb-3.5">
          <div className="flex items-center gap-2">
            <Pulse size={18} className="text-primary-cyan" weight="bold" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-main">
              Staff Shift Analytics
            </h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {dummyAnalytics.shiftStatus}
          </span>
        </div>

        <div className="mt-5 flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          {/* Circular Progression Ring */}
          <div className="flex items-center gap-5 rounded-xl border border-border-divider/60 bg-app-bg/50 p-4 w-full md:w-auto">
            <CircularProgressRing percentage={dummyAnalytics.completionPct} size={100} strokeWidth={9} />
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sub">
                Daily Shift Target
              </span>
              <p className="font-mono text-lg font-extrabold text-main">
                {dummyAnalytics.loggedHours} <span className="text-xs text-sub font-normal">/ {dummyAnalytics.targetHours}</span>
              </p>
              <p className="text-xs text-sub font-mono">
                {100 - dummyAnalytics.completionPct}% remaining for today
              </p>
            </div>
          </div>

          {/* Quick Shift Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 w-full md:flex-1">
            <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/40 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-sub font-mono">
                <SignIn size={14} className="text-primary-cyan" />
                <span>Time Entered</span>
              </div>
              <p className="font-mono text-base font-bold text-main tabular-nums">
                {dummyAnalytics.checkInTime}
              </p>
              <p className="text-[10px] text-sub">Shift Clock-In</p>
            </div>

            <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/40 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-sub font-mono">
                <Timer size={14} className="text-primary-cyan" />
                <span>Active Hours</span>
              </div>
              <p className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                {dummyAnalytics.loggedHours}
              </p>
              <p className="text-[10px] text-sub">Tracked Session Time</p>
            </div>

            <div className="col-span-2 space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/40 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-sub font-mono">
                <CalendarCheck size={14} className="text-primary-cyan" />
                <span>Weekly Target Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold text-main">
                  {dummyAnalytics.weeklyTotal}
                </p>
                <span className="font-mono text-[10px] font-bold text-primary-cyan">
                  86%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-divider">
                <div className="h-full rounded-full bg-primary-cyan" style={{ width: "86%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account Specifications */}
      <section className="overflow-hidden rounded-2xl border border-border-divider/80 bg-card-panel shadow-xs">
        <header className="border-b border-border-divider/80 px-6 py-3.5 flex items-center justify-between bg-app-bg/40">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-sub">
            Account Specifications
          </h2>
          <IdentificationBadge size={18} className="text-primary-cyan" />
        </header>

        <dl className="divide-y divide-border-divider/60">
          <DetailRow
            icon={IdentificationBadge}
            label="Operator ID"
            value={user?.userId || "GRID-STAFF"}
            isMono
          />
          <DetailRow
            icon={EnvelopeSimple}
            label="Email Address"
            value={user?.email}
          />
          <DetailRow
            icon={PhoneCall}
            label="Contact Phone"
            value={user?.phone}
            isMono
          />
          <DetailRow
            icon={User}
            label="Role Permissions"
            value={userRole.toUpperCase()}
            isMono
            badge={
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                Verified
              </span>
            }
          />
        </dl>
      </section>

      <EditProfileSheet
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        avatarUrl={avatarUrl}
        onSave={handleSave}
      />
    </div>
  );
}