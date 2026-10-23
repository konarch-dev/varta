'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { apiRequest } from '../../../lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new link.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest<{ success: boolean; message: string }>(
        '/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({
            token,
            newPassword,
          }),
        },
      );
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to reset password. Link may be expired.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-x-hidden selection:bg-[#FF7A00] selection:text-white"
      style={{
        backgroundImage: "url('/assets/login-bg.jpg')",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Light / Dark Adaptive Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-white/90 to-orange-50/95 dark:from-[#030712]/92 dark:via-[#070E18]/82 dark:to-[#030712]/95 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[480px] p-6 flex flex-col items-center">
        {/* VARTA Header Brand */}
        <Link href="/" className="mb-8 hover:scale-105 transition-transform">
          <VartaLogo size={46} showText={true} showTagline={true} />
        </Link>

        {/* Floating Glassmorphic Card */}
        <div className="w-full rounded-[28px] bg-white/95 dark:bg-[#0A1220]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-col gap-6">
          {!token ? (
            /* Missing Token Error State */
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
                <AlertCircle size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Invalid Reset Link
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
                This password reset link is missing its authentication token or is malformed.
              </p>
              <Link
                href="/forgot-password"
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>Request New Reset Link</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center text-center gap-4 py-2 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00C853] shadow-lg shadow-[#00C853]/25">
                <CheckCircle2 size={36} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Password Reset Complete!
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Your account password has been updated securely. You can now log into VARTA with your new credentials.
              </p>

              <Link
                href="/login"
                className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            /* Password Reset Input Form */
            <>
              <div className="flex flex-col">
                <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                  Set New Password
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Enter your new password below. Make sure it&apos;s at least 8 characters long.
                </p>
              </div>

              {/* Error Feedback */}
              {errorMessage && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-300">
                  <AlertCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-3.5 transition shadow-xs">
                    <Lock size={18} className="text-slate-400 shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      suppressHydrationWarning
                      className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium pr-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition shrink-0"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-3.5 transition shadow-xs">
                    <ShieldCheck size={18} className="text-slate-400 shrink-0 mr-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      suppressHydrationWarning
                      className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium pr-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition shrink-0"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="flex justify-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#FF9933]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
