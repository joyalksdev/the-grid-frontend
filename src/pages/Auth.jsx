// src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import { User, LockKey, Eye, EyeSlash, ArrowRight, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Username or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// 16px on mobile so iOS Safari doesn't zoom on focus
const FIELD =
  'h-11 w-full rounded-lg border bg-app-bg pl-10 pr-3 text-base text-main placeholder:text-sub/70 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan/40 sm:text-sm';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const reduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.identifier, data.password);
      toast.success('Signed in successfully!');
      if (onLoginSuccess) onLoginSuccess();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // No select-none on the page: it breaks typing in inputs on iOS Safari
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-app-bg p-4 font-body sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={GRID_TEXTURE} />

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

        <div className="rounded-2xl border border-border-divider bg-card-panel p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-main">
              Sign In
            </h1>
            <p className="mt-1 text-sm text-sub">
              Enter your credentials to access the console.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                  aria-invalid={!!errors.identifier}
                  aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                  {...register('identifier')}
                  className={`${FIELD} ${
                    errors.identifier
                      ? 'border-occupied'
                      : 'border-border-divider focus-visible:border-primary-cyan'
                  }`}
                />
              </div>
              {errors.identifier && (
                <p id="identifier-error" role="alert" className="mt-1.5 text-xs font-medium text-occupied">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-main">
                Password
              </label>
              <div className="group relative">
                <LockKey size={18} aria-hidden="true" className={ICON} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                  className={`${FIELD} pr-11 ${
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
        </div>
      </motion.div>
    </main>
  );
}