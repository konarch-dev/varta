'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { apiRequest } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest<{ success: boolean; message: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail }),
        },
      );
      setSubmittedEmail(cleanEmail);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to send password reset email. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
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
        {/* VARTA Brand Header */}
        <Link href="/" className="mb-8 hover:scale-105 transition-transform">
          <VartaLogo size={46} showText={true} showTagline={true} />
        </Link>

        {/* Floating Glassmorphic Card */}
        <div className="w-full rounded-[28px] bg-white/95 dark:bg-[#0A1220]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-col gap-6">
          {!isSubmitted ? (
            <>
              {/* Header Title */}
              <div className="flex flex-col">
                <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Enter the email address registered with your VARTA account and we&apos;ll send you a password reset link.
                </p>
              </div>

              {/* Error Feedback */}
              {errorMessage && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-300">
                  <AlertCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Reset Request Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-3.5 transition shadow-xs">
                    <Mail size={18} className="text-slate-400 shrink-0 mr-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      suppressHydrationWarning
                      className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="flex justify-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="flex flex-col items-center text-center gap-4 py-2 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00C853] shadow-lg shadow-[#00C853]/25">
                <CheckCircle2 size={36} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Check Your Email
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                If an account exists for{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">{submittedEmail}</strong>,
                we have dispatched a password reset link to your inbox.
              </p>

              <div className="w-full bg-amber-50 dark:bg-[#101D2D] border border-amber-200 dark:border-[#1E293B] rounded-xl p-3.5 text-left text-xs text-amber-900 dark:text-slate-400 flex flex-col gap-1.5 mt-1">
                <p className="text-amber-950 dark:text-slate-300 font-medium">
                  ⏱️ <strong>Note:</strong> The reset link is valid for <strong>1 hour</strong>.
                </p>
                <p className="text-amber-700 dark:text-slate-500 text-[11px]">
                  Don&apos;t see the email? Check your spam/junk folder or wait a moment.
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  Try another email
                </button>

                <Link
                  href="/login"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
