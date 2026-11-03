// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  LockKey, 
  Eye, 
  EyeSlash, 
  ArrowRight, 
  CircleNotch, 
  CheckCircle, 
  WarningCircle,
  ArrowLeft 
} from '@phosphor-icons/react';
import { authService } from '../services/authService';
import { notify } from '../utils/toastController';
import Aurora from '../components/Aurora';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// 16px on mobile so iOS Safari doesn't zoom on focus
const FIELD =
  'h-11 w-full rounded-lg border bg-app-bg/50 pl-10 pr-11 text-base text-main placeholder:text-sub/70 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan/40 sm:text-sm';
const ICON =
  'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub transition-colors duration-150 group-focus-within:text-primary-cyan';
const GRID_TEXTURE = {
  backgroundImage:
    'linear-gradient(to right, rgba(0,246,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,246,255,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  WebkitMaskImage: 'radial-gradient(ellipse at center, #000 0%, transparent 70%)',
  maskImage: 'radial-gradient(ellipse at center, #000 0%, transparent 70%)'
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    if (!token) {
      notify.error('Missing or invalid reset token');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
      notify.success('Password reset successfully!');
    } catch (err) {
      notify.error(err.response?.data?.error || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-app-bg p-4 font-body sm:p-6">
      {/* Aurora WebGL Background Animation */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        <Aurora
          colorStops={["#8fe3ff", "#376f78", "#6f99ff"]}
          amplitude={1.5}
          blend={0.65}
          height={0.48}
          speed={1.8}
          glow={0.99}
          direction="bottom"
          mouseInteraction={false}
        />
      </div>

      {/* Cyberpunk Grid Texture Overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={GRID_TEXTURE} />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="The Grid"
            width={80}
            height={80}
            fetchPriority="high"
            className="h-16 w-auto object-contain sm:h-20"
          />
        </div>

        <div className="rounded-2xl border border-border-divider/40 bg-card-panel/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {!token ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
                <WarningCircle size={32} weight="fill" />
              </div>
              <h1 className="font-heading text-lg font-bold uppercase tracking-wide text-main">
                Invalid Reset Link
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-sub">
                This password reset link is missing its security token or has expired. Please request a new recovery link.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/auth', { replace: true })}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-divider bg-app-bg text-sm font-semibold text-main transition-colors duration-150 hover:border-primary-cyan/50 hover:text-primary-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
                >
                  <ArrowLeft size={16} weight="bold" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckCircle size={32} weight="fill" />
              </div>
              <h1 className="font-heading text-lg font-bold uppercase tracking-wide text-main">
                Password Reset Complete
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-sub">
                Your password has been successfully updated. You can now sign in using your new credentials.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/auth', { replace: true })}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-main text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-main/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan sm:h-11"
                >
                  <span>Sign In Now</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-main">
                  Create New Password
                </h1>
                <p className="mt-1 text-sm text-sub">
                  Please enter a secure new password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="password" class="mb-1.5 block text-sm font-medium text-main">
                    New Password
                  </label>
                  <div className="group relative">
                    <LockKey size={18} aria-hidden="true" className={ICON} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      {...register('password')}
                      className={`${FIELD} ${
                        errors.password
                          ? 'border-occupied'
                          : 'border-border-divider focus-visible:border-primary-cyan'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
                    >
                      {showPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" role="alert" className="mt-1.5 text-xs font-medium text-occupied">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" class="mb-1.5 block text-sm font-medium text-main">
                    Confirm New Password
                  </label>
                  <div className="group relative">
                    <LockKey size={18} aria-hidden="true" className={ICON} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      {...register('confirmPassword')}
                      className={`${FIELD} ${
                        errors.confirmPassword
                          ? 'border-occupied'
                          : 'border-border-divider focus-visible:border-primary-cyan'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showConfirmPassword}
                      className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
                    >
                      {showConfirmPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" role="alert" className="mt-1.5 text-xs font-medium text-occupied">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-main text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-main/90 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-card-panel sm:h-11"
                >
                  {loading ? (
                    <>
                      <CircleNotch size={18} aria-hidden="true" className="animate-spin" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}