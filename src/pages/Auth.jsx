// src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, LockKey, Eye, EyeSlash, ArrowRight, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Username or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export default function Auth({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

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
    <div className="min-h-screen w-full bg-[var(--color-app-bg)] flex items-center justify-center p-4 sm:p-6 font-['Inter'] relative overflow-hidden select-none">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[var(--color-primary-cyan)]/5 rounded-full blur-[130px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px] z-10"
      >
        {/* Logo Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <motion.img 
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            src="/logo.png" 
            alt="The Grid Logo" 
            className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(6,214,160,0.15)]"
          />
        </div>

        {/* Card Panel */}
        <div className="bg-[var(--color-card-panel)] border border-[var(--color-border-divider)] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="font-['Rajdhani'] text-xl font-bold text-white tracking-wide uppercase">
              Sign In
            </h2>
            <p className="text-xs text-[var(--color-sub)] mt-1 font-medium leading-relaxed">
              Enter your credentials to access the console.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-['Rajdhani'] font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative group">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary-cyan)] transition-colors" />
                <input
                  type="text"
                  placeholder="admin or email@domain.com"
                  autoComplete="username"
                  {...register('identifier')}
                  className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border-divider)] focus:border-[var(--color-primary-cyan)] focus:ring-1 focus:ring-[var(--color-primary-cyan)]/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-[var(--color-muted)] outline-none transition-all duration-200"
                />
              </div>
              {errors.identifier && (
                <motion.p 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[var(--color-occupied)] text-xs mt-1.5 font-medium"
                >
                  {errors.identifier.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-xs font-['Rajdhani'] font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative group">
                <LockKey size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary-cyan)] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border-divider)] focus:border-[var(--color-primary-cyan)] focus:ring-1 focus:ring-[var(--color-primary-cyan)]/50 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-[var(--color-muted)] outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[var(--color-occupied)] text-xs mt-1.5 font-medium"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-[var(--color-primary-cyan)] hover:brightness-110 active:scale-[0.98] text-[var(--color-app-bg)] font-['Rajdhani'] font-bold text-sm uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(6,214,160,0.18)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <CircleNotch size={20} className="animate-spin text-[var(--color-app-bg)]" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} weight="bold" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}