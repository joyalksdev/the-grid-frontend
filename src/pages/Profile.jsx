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
  At,
  CheckCircle,
  LockKey,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../components/ui/Sheet";
import { notify } from "../utils/toastController";

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
  const usernameId = useId();
  const phoneId = useId();
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name || "");
    setUsername(user?.username || "");
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
      notify.success(`Photo compressed (${result.savingsPct}% space saved)`);
    } catch (err) {
      notify.error(err.message || "Failed to compress image");
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
      formData.append("username", username.toLowerCase().replace(/\s+/g, ''));
      formData.append("phone", phone.trim());
      if (file) {
        formData.append("avatar", file);
      }

      await onSave(formData);
      onClose();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your account display identity, username handle, and avatar."
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
      <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
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
              Compressed automatically to WebP format before upload.
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
            Full Display Name
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
          <label htmlFor={usernameId} className="mb-1 block font-mono text-xs font-medium uppercase tracking-wider text-sub">
            Username Handle (@)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 font-mono text-xs text-sub">@</span>
            <input
              id={usernameId}
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="joyal"
              className={`${INPUT_CLASS} pl-8 font-mono`}
            />
          </div>
          <p className="mt-1 font-mono text-[10px] text-sub">Lower-case only, no spaces.</p>
        </div>

        <div>
          <label htmlFor={phoneId} className="mb-1 block font-mono text-xs font-medium uppercase tracking-wider text-sub">
            Phone Contact
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
          <span>Email address and system access roles are managed by admins.</span>
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
    notify.success("Profile updated successfully");
  };

  const hasPhoto = Boolean(avatarUrl && !bgBroken);
  const userRole = user?.role || "staff";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 font-body text-main">
      {/* Header Banner Section */}
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
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
                    : "border-border-divider bg-app-bg/80 text-sub"
                }`}
              >
                <ShieldCheck size={13} weight="fill" /> {userRole}
              </span>

              {user?.username && (
                <span className="inline-flex items-center gap-1 rounded-md border border-primary-cyan/30 bg-primary-cyan/10 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-primary-cyan">
                  <At size={13} weight="bold" /> {user.username}
                </span>
              )}
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

      {/* Specifications Grid */}
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
            icon={At}
            label="Username Handle"
            value={user?.username ? `@${user.username}` : undefined}
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
          <DetailRow
            icon={CheckCircle}
            label="Account Status"
            value={user?.isActive ? "Active Operator" : "Inactive"}
            badge={
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                Online
              </span>
            }
          />
        </dl>
      </section>

      {/* Security Info Card */}
      <section className="rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-main font-bold text-sm">
            <LockKey size={18} className="text-primary-cyan" />
            <span>Security & Authentication</span>
          </div>
          <p className="text-xs text-sub">
            Your login credentials are protected using salted bcrypt encryption.
          </p>
        </div>
        <button
          type="button"
          onClick={() => notify.info("Contact an administrator to issue a password reset request.")}
          className={`h-9 px-4 rounded-xl border border-border-divider bg-app-bg text-xs font-mono font-bold text-sub hover:text-main hover:border-primary-cyan/40 cursor-pointer transition-colors ${FOCUS}`}
        >
          Reset Password
        </button>
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