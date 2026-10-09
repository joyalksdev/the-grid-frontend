import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  LockKey, 
  Phone, 
  Camera, 
  CircleNotch, 
  CheckCircle, 
  WarningCircle,
  Sparkle,
  User,
  At,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeSlash
} from "@phosphor-icons/react";
import axios from "axios";

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const urlRole = searchParams.get("role") || "staff";
  const urlName = searchParams.get("name") || "";
  const navigate = useNavigate();

  // Onboarding Stepper State
  const [currentStep, setCurrentStep] = useState(1);

  // Invitation Verification State (Checked First)
  const [verifying, setVerifying] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [invitedUser, setInvitedUser] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Helper to construct normalized API endpoints
  const getApiEndpoint = (endpoint) => {
    const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const baseUrl = rawUrl.replace(/\/api\/?$/, "");
    return `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  };

  // Step 1: Initial Token Verification Logic
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setInviteValid(false);
        return;
      }

      try {
        const verifyEndpoint = getApiEndpoint(`/api/auth/verify-invite/${token}`);
        const response = await axios.get(verifyEndpoint);
        
        const resData = response.data?.data || response.data;
        const isValid = resData?.valid === true || response.data?.valid === true || response.data?.success === true;

        if (isValid) {
          setInviteValid(true);
          const userObj = resData?.user || resData?.invite || {};
          setInvitedUser(userObj);
          
          const initialName = userObj?.name || urlName || "";
          setName(initialName);
          if (initialName) {
            setUsername(initialName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
          }
        } else {
          setInviteValid(false);
        }
      } catch (err) {
        console.error("Invite token verification error:", err?.response?.data || err.message);

        // Fallback for local invite codes
        if (token.startsWith("GRID-INV-")) {
          setInviteValid(true);
          setInvitedUser({ name: urlName, role: urlRole });
          setName(urlName || "New Team Member");
          if (urlName) {
            setUsername(urlName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
          }
        } else {
          setInviteValid(false);
        }
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, urlName, urlRole]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const validateStep = (step) => {
    setError("");

    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter your full name");
        return false;
      }
      if (!username.trim()) {
        setError("Please choose a username");
        return false;
      }
      if (username.length < 3) {
        setError("Username must be at least 3 characters long");
        return false;
      }
    }

    if (step === 2) {
      if (!password) {
        setError("Please enter a password");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("name", name.trim());
      formData.append("username", username.trim());
      formData.append("password", password);
      if (phone) formData.append("phone", phone);
      if (avatar) formData.append("avatar", avatar);

      const onboardingEndpoint = getApiEndpoint("/api/auth/complete-onboarding");

      await axios.post(onboardingEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete onboarding profile");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: "Profile" },
    { id: 2, name: "Security" },
    { id: 3, name: "Review" },
  ];

  // -------------------------------------------------------------
  // STATE 1: Initial Token Check Loading Screen (Vercel Style)
  // -------------------------------------------------------------
  if (verifying) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black text-white font-sans p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] pointer-events-none" />
        <div className="relative z-10 bg-[#0a0a0a] border border-[#222] p-8 sm:p-10 rounded-2xl flex flex-col items-center gap-4 max-w-sm w-full shadow-2xl text-center">
          <div className="w-10 h-10 rounded-xl bg-[#111] border border-[#333] flex items-center justify-center text-white">
            <CircleNotch size={20} className="animate-spin text-zinc-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">Verifying Invitation Token</p>
            <p className="text-xs text-zinc-500 font-mono">Authenticating pass details...</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: Invalid or Expired Token Card
  // -------------------------------------------------------------
  if (!inviteValid) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black text-white font-sans p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.15),rgba(255,255,255,0))] pointer-events-none" />
        <div className="max-w-md w-full relative z-10 bg-[#0a0a0a] border border-[#222] p-6 sm:p-8 rounded-2xl text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <WarningCircle size={26} weight="bold" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Invalid or Expired Link</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              This onboarding pass is invalid, expired, or has already been redeemed. Please ask your administrator for a new invite.
            </p>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Return to Login Portal
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: Onboarding Success Screen
  // -------------------------------------------------------------
  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black text-white font-sans p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))] pointer-events-none" />
        <div className="max-w-md w-full relative z-10 bg-[#0a0a0a] border border-[#222] p-8 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle size={28} weight="fill" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-white">Setup Complete</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Your operator credentials are saved. Redirecting you to the portal login...
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-mono">
            <CircleNotch size={14} className="animate-spin text-zinc-400" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: Valid Token - Multi-Step Onboarding Form
  // -------------------------------------------------------------
  return (
    <div className="min-h-dvh flex items-center justify-center bg-black text-white font-sans p-4 sm:p-6 relative overflow-hidden">
      {/* Vercel Dynamic Top Gradient Glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#333] text-zinc-400 text-[10px] font-mono tracking-wide uppercase">
            <Sparkle size={12} className="text-zinc-300" />
            <span>Staff Onboarding</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome to The Grid
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Setup your operator identity & system credentials
          </p>
        </div>

        {/* Vercel Segmented Stepper */}
        <div className="p-1 bg-[#111] rounded-xl border border-[#222] flex items-center justify-between gap-1">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg transition-all duration-200 ${
                    isCurrent 
                      ? "bg-[#1f1f1f] text-white border border-[#333]" 
                      : isCompleted 
                      ? "text-emerald-400" 
                      : "text-zinc-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full text-[10px] font-mono font-semibold flex items-center justify-center ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isCurrent
                        ? "bg-white text-black"
                        : "bg-[#222] text-zinc-500"
                    }`}
                  >
                    {isCompleted ? <Check size={10} weight="bold" /> : step.id}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:inline ${isCurrent ? "text-white" : "text-zinc-500"}`}>
                    {step.name}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div className={`w-2 h-[1px] ${currentStep > step.id ? "bg-emerald-500/50" : "bg-[#222]"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-mono flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <WarningCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* STEP 1: Profile Settings */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Avatar Uploader */}
              <div className="flex flex-col items-center gap-2 py-1">
                <label className="relative cursor-pointer group">
                  <div className="w-20 h-20 rounded-full bg-[#111] border border-[#333] group-hover:border-zinc-400 flex items-center justify-center overflow-hidden transition-all">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={22} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">Profile Photo (Optional)</span>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Username
                </label>
                <div className="relative">
                  <At size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    placeholder="alex_mercer"
                    className="w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Phone Number <span className="text-zinc-600">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Password Credentials */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Create Password
                </label>
                <div className="relative">
                  <LockKey size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockKey size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* System Privilege Badge */}
              <div className="p-3 bg-[#111] rounded-xl border border-[#222] flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Assigned System Role:</span>
                <span className="font-mono text-[10px] text-zinc-300 uppercase bg-[#1d1d1d] px-2.5 py-1 rounded border border-[#333]">
                  {invitedUser?.role || urlRole}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Final Review */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-[#111] border border-[#222] rounded-xl space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-[#222]">
                  <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white truncate">{name}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">@{username}</p>
                  </div>
                </div>

                <div className="text-xs space-y-2 text-zinc-400">
                  <div className="flex justify-between items-center">
                    <span>Phone:</span>
                    <span className="text-zinc-200 font-medium">{phone || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Role:</span>
                    <span className="text-zinc-200 font-mono text-[10px] uppercase bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333]">{invitedUser?.role || urlRole}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Password:</span>
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <Check size={12} weight="bold" /> Ready
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 text-center">
                Click complete to activate your operator profile.
              </p>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1a1a1a]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="py-2.5 px-4 bg-[#111] border border-[#222] hover:bg-[#1f1f1f] active:scale-95 text-xs font-medium text-zinc-300 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : <div />}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-2.5 px-5 bg-white text-black hover:bg-zinc-200 active:scale-95 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-5 bg-white text-black hover:bg-zinc-200 active:scale-95 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ml-auto disabled:opacity-50"
              >
                {submitting ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} weight="bold" />
                )}
                <span>Complete Setup</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}