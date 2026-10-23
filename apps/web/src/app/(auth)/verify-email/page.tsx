'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { apiRequest } from '../../../lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'already_active' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [emailForResend, setEmailForResend] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing activation token. Please check the link in your email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiRequest<{
          success?: boolean;
          alreadyActive?: boolean;
          message: string;
          email?: string;
        }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (res.alreadyActive) {
          setStatus('already_active');
          setMessage(res.message || 'Your account is already active!');
        } else {
          setStatus('success');
          setMessage(res.message || 'Account activated successfully!');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Activation link is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForResend.trim()) return;

    setIsResending(true);
    setResendMessage(null);
    try {
      const res = await apiRequest<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: emailForResend.trim() }),
      });
      setResendMessage(res.message || 'Verification link has been sent to your email.');
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend confirmation email.');
    } finally {
      setIsResending(false);
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
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-white/90 to-orange-50/95 dark:from-[#030712]/92 dark:via-[#070E18]/80 dark:to-[#030712]/95 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[500px] p-6 flex flex-col items-center">
        {/* VARTA Header Brand */}
        <Link href="/" className="mb-8 hover:scale-105 transition-transform">
          <VartaLogo size={46} showText={true} showTagline={true} />
        </Link>

        {/* Verification Card */}
        <div className="w-full rounded-[28px] bg-white/95 dark:bg-[#0A1220]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-8 sm:p-10 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-col items-center text-center">
          {/* STATE 1: Verifying */}
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 size={48} className="animate-spin text-[#FF9933]" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Activating Your Account...
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                Please wait while we confirm your email and activate your VARTA profile.
              </p>
            </div>
          )}

          {/* STATE 2: Success */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00C853] shadow-lg shadow-[#00C853]/25">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Account Activated!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
                {message || 'Your email address has been verified. Your VARTA account is now fully active.'}
              </p>

              <Link
                href="/login"
                className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* STATE 3: Already Active */}
          {status === 'already_active' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shadow-lg shadow-[#0284C7]/25">
                <Sparkles size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Already Active
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
                {message || 'Your VARTA account is already verified and ready to use.'}
              </p>

              <Link
                href="/login"
                className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* STATE 4: Error / Expired */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300 w-full">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/20">
                <AlertCircle size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Activation Link Expired
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
                {message || 'This confirmation link is invalid or has expired (links are valid for 24 hours).'}
              </p>

              {/* Resend Form */}
              <form onSubmit={handleResend} className="w-full flex flex-col gap-3 mt-4 text-left">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resend confirmation link to your email:
                </span>
                <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#0284C7] rounded-xl px-4 py-3 transition shadow-xs">
                  <Mail size={17} className="text-slate-400 shrink-0 mr-3" />
                  <input
                    type="email"
                    value={emailForResend}
                    onChange={(e) => setEmailForResend(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
                  />
                </div>

                {resendMessage && (
                  <p className="text-xs text-[#0284C7] dark:text-[#38BDF8] mt-1 font-semibold">{resendMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isResending ? <Loader2 size={16} className="animate-spin" /> : 'Send New Activation Email'}
                </button>
              </form>

              <Link
                href="/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mt-4 transition"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#FF9933]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
