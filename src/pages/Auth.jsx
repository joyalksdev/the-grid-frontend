// src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  User, 
  LockKey, 
  Eye, 
  EyeSlash, 
  ArrowRight, 
  CircleNotch, 
  EnvelopeSimple, 
  ArrowLeft,
  CheckCircle 
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { notify } from '../utils/toastController';
import Aurora from '../components/Aurora';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Username or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

// 16px on mobile so iOS Safari doesn't zoom on focus
const FIELD =
  'h-11 w-full rounded-lg border bg-app-bg/50 pl-10 pr-3 text-base text-main placeholder:text-sub/70 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan/40 sm:text-sm';
const ICON =
  'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub transition-colors duration-150 group-focus-within:text-primary-cyan';
const GRID_TEXTURE = {
  backgroundImage:
    'linear-gradient(to right, rgba(0,246,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,246,255,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  WebkitMaskImage: 'radial-gradient(ellipse at center, #000 0%, transparent 70%)',
  maskImage: 'radial-gradient(ellipse at center, #000 0%, transparent 70%)'
};

export default function Auth({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'sent'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();
  const reduceMotion = useReducedMotion();

  // Login Form Hook
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  });

  // Forgot Password Form Hook
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors }
  } = useForm({
    resolver: zodResolver(forgotSchema),
    mode: 'onBlur'
  });

  const onLogin = async (data) => {
    setLoading(true);
    try {
      await login(data.identifier, data.password);
      notify.success('Signed in successfully!');
      if (onLoginSuccess) onLoginSuccess();
      navigate('/', { replace: true });
    } catch (err) {
      notify.error(err.response?.data?.error || err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (data) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSentEmail(data.email);
      setView('sent');
      notify.success('Password reset link generated');
    } catch (err) {
      notify.error(err.response?.data?.error || err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView) => {
    setView(newView);
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
        layout
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

        <motion.div 
          layout
          className="rounded-2xl border border-border-divider/40 bg-card-panel/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* VIEW 1: LOGIN */}
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-main">
                    Sign In
                  </h1>
                  <p className="mt-1 text-sm text-sub">
                    Enter your credentials to access the App.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit(onLogin)} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-main">
                      Username or Email
                    </label>
                    <div className="group relative">
                      <User size={18} aria-hidden="true" className={ICON} />
                      <input
                        id="identifier"
                        type="text"
                        placeholder="e.g., admin or name@domain.com"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-invalid={!!loginErrors.identifier}
                        aria-describedby={loginErrors.identifier ? 'identifier-error' : undefined}
                        {...registerLogin('identifier')}
                        className={`${FIELD} ${
                          loginErrors.identifier
                            ? 'border-occupied'
                            : 'border-border-divider focus-visible:border-primary-cyan'
                        }`}
                      />
                    </div>
                    {loginErrors.identifier && (
                      <p id="identifier-error" role="alert" className="mt-1.5 text-xs font-medium text-occupied">
                        {loginErrors.identifier.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" class="text-sm font-medium text-main">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-xs font-semibold text-primary-cyan transition-colors hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="group relative">
                      <LockKey size={18} aria-hidden="true" className={ICON} />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-invalid={!!loginErrors.password}
                        aria-describedby={loginErrors.password ? 'password-error' : undefined}
                        {...registerLogin('password')}
                        className={`${FIELD} pr-11 ${
                          loginErrors.password
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
                    {loginErrors.password && (
                      <p id="password-error" role="alert" className="mt-1.5 text-xs font-medium text-occupied">
                        {loginErrors.password.message}
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
                        <span>Signing In…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={16} weight="bold" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* VIEW 2: FORGOT PASSWORD FORM */}
            {view === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs text-sub transition-colors hover:text-primary-cyan"
                  >
                    <ArrowLeft size={14} weight="bold" />
                    <span>Back to Sign In</span>
                  </button>
                  <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-main">
                    Reset Password
                  </h1>
                  <p className="mt-1 text-sm text-sub">
                    Enter your registered email address and we will send you a secure recovery link.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit(onForgot)} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-main">
                      Email Address
                    </label>
                    <div className="group relative">
                      <EnvelopeSimple size={18} aria-hidden="true" className={ICON} />
                      <input
                        id="email"
                        type="email"
                        placeholder="name@domain.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-invalid={!!forgotErrors.email}
                        aria-describedby={forgotErrors.email ? 'email-error' : undefined}
                        {...registerForgot('email')}
                        className={`${FIELD} ${
                          forgotErrors.email
                            ? 'border-occupied'
                            : 'border-border-divider focus-visible:border-primary-cyan'
                        }`}
                      />
                    </div>
                    {forgotErrors.email && (
                      <p id="email-error" role="alert" className="mt-1.5 text-xs font-medium text-occupied">
                        {forgotErrors.email.message}
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
                        <span>Sending Link…</span>
                      </>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight size={16} weight="bold" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* VIEW 3: SUCCESS CONFIRMATION STATE */}
            {view === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="py-2 text-center"
              >
                <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle size={32} weight="fill" />
                </div>

                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-main">
                  Check Your Inbox
                </h2>
                
                <p className="mt-2 text-sm leading-relaxed text-sub">
                  If an account exists for <strong className="text-main font-mono">{sentEmail}</strong>, we have sent a secure password reset link. Please follow the link in your email to continue.
                </p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-divider bg-app-bg text-sm font-semibold text-main transition-colors duration-150 hover:border-primary-cyan/50 hover:text-primary-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
                  >
                    <ArrowLeft size={16} weight="bold" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}