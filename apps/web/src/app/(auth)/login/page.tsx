'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Compass,
  ShieldCheck,
  Smartphone,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { useAuthStore } from '../../../stores/authStore';
import { apiRequest } from '../../../lib/api';

// Google 4-Color Vector Icon
const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

// Apple White Vector Icon
const AppleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 170 170" fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.7-7.85-12.04-14.36-6.19-9.35-11.1-20.08-14.73-32.18-3.63-12.1-5.45-23.51-5.45-34.24 0-14.93 3.83-27.13 11.48-36.6 7.66-9.47 17.2-14.28 28.63-14.43 4.58 0 9.87 1.17 15.86 3.53 5.99 2.35 10.02 3.65 12.09 3.89 2.07.24 6.09-.99 12.08-3.7 5.99-2.71 11.04-3.95 15.15-3.72 10.23.47 18.96 4.12 26.18 10.96 7.22 6.83 11.85 15.14 13.9 24.91-9.24 5.54-13.79 13.35-13.65 23.44.15 8.97 3.56 16.52 10.23 22.65 6.67 6.13 14.54 9.68 23.6 10.66-1.52 5.08-3.32 10.08-5.41 15.01zM119.22 33.09c0-6.14 2.22-12.03 6.67-17.67 4.45-5.64 10.03-9.67 16.74-12.09-.34 6.02-2.6 11.8-6.79 17.34-4.19 5.54-9.73 9.67-16.62 12.42z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleResend = async () => {
    if (!identifier.trim()) return;
    setIsResending(true);
    setResendSuccess(null);
    try {
      const res = await apiRequest<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: identifier.trim() }),
      });
      setResendSuccess(res.message || 'Fresh activation link sent to your email!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResendSuccess(null);
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier and password');
      return;
    }

    try {
      await login({ identifier: identifier.trim(), password });
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password');
    }
  };

  const handleDemoLogin = async (username: string) => {
    setErrorMessage(null);
    setIdentifier(username);
    setPassword('Varta@2026Secure!');
    try {
      await login({ identifier: username, password: 'Varta@2026Secure!' });
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
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
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-white/90 to-orange-50/95 dark:from-[#030712]/90 dark:via-[#070E18]/70 dark:to-[#030712]/92 backdrop-blur-[2px]" />

      {/* Main Dual-Column Content */}
      <div className="relative z-10 w-full max-w-[1340px] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Top Header Logo */}
        <header className="w-full flex items-center justify-between">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <VartaLogo size={42} showText={true} showTagline={true} />
          </Link>
        </header>

        {/* Center Grid: Left Hero & Right Login Card */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center my-auto py-8">
          {/* LEFT COLUMN: 3D VARTA Logo, Hero Title & Badges */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center pr-0 lg:pr-8">
            {/* Prominent 3D VARTA Logo Emblem in the middle */}
            <div className="mb-6 sm:mb-8 flex flex-col items-start">
              <div className="relative group">
                {/* Soft ambient saffron-cyan-green glow behind the 3D emblem */}
                <div className="absolute -inset-6 bg-gradient-to-r from-[#FF7A00]/25 via-[#0284C7]/20 to-[#00C853]/25 dark:from-[#FF7A00]/35 dark:via-[#0284C7]/25 dark:to-[#00C853]/35 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-500" />
                <img
                  src="/varta-logo-mark.png"
                  alt="VARTA 3D Emblem"
                  className="relative h-20 sm:h-28 lg:h-32 w-auto object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_16px_35px_rgba(0,0,0,0.9)] hover:scale-105 transition-transform duration-300 select-none"
                />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              India&apos;s
              <br />
              <span className="text-[#FF7A00]">Voice</span>,{' '}
              <span className="text-[#00C853]">Together</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal tracking-wide">
              Share. Discuss. Explore. Belong.
            </p>

            {/* Feature Value Badges (exact match from screenshot 1) */}
            <div className="mt-12 sm:mt-16 flex flex-col gap-5 sm:gap-6">
              {/* Badge 1: Real People Real Conversations */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0E2838]/80 border border-sky-200 dark:border-[#0284C7]/40 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shadow-md shadow-sky-500/10 dark:shadow-[#0284C7]/20 group-hover:scale-105 transition-transform shrink-0">
                  <Users size={22} className="stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-tight">
                    Real People
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                    Real Conversations
                  </span>
                </div>
              </div>

              {/* Badge 2: From Your City to the Whole India */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0E2838]/80 border border-sky-200 dark:border-[#0284C7]/40 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shadow-md shadow-sky-500/10 dark:shadow-[#0284C7]/20 group-hover:scale-105 transition-transform shrink-0">
                  <Compass size={22} className="stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-tight">
                    From Your City
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                    to the Whole India
                  </span>
                </div>
              </div>

              {/* Badge 3: A Safer, More Open Community */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0E2838]/80 border border-sky-200 dark:border-[#0284C7]/40 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shadow-md shadow-sky-500/10 dark:shadow-[#0284C7]/20 group-hover:scale-105 transition-transform shrink-0">
                  <ShieldCheck size={22} className="stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-tight">
                    A Safer, More
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
                    Open Community
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Floating Glassmorphic Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[430px] rounded-[28px] bg-white/95 dark:bg-[#0A1220]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-col gap-5">
              {/* Card Title */}
              <div className="flex flex-col">
                <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sign in to your VARTA account
                </p>
              </div>

              {/* Error Feedback Alert */}
              {errorMessage && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl flex flex-col gap-1.5 text-xs text-red-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                  {(errorMessage.toLowerCase().includes('not active') ||
                    errorMessage.toLowerCase().includes('activation link')) && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="self-start text-[#38BDF8] hover:underline font-bold text-xs mt-1"
                    >
                      {isResending ? 'Dispatching activation email...' : 'Resend Activation Email'}
                    </button>
                  )}
                  {resendSuccess && (
                    <span className="text-[#00C853] font-semibold text-xs mt-0.5">
                      {resendSuccess}
                    </span>
                  )}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Identifier Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-3.5 transition shadow-xs">
                    <Mail size={18} className="text-slate-400 shrink-0 mr-3" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Username or Email"
                      autoComplete="username"
                      suppressHydrationWarning
                      className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-3.5 transition shadow-xs">
                    <Lock size={18} className="text-slate-400 shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      autoComplete="current-password"
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

                  {/* Forgot Password Link */}
                  <div className="flex justify-end mt-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#0284C7] dark:text-[#0EA5E9] hover:underline font-semibold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Main Submit Saffron Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* OR CONTINUE WITH Divider */}
              <div className="flex items-center my-1">
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
                <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  OR CONTINUE WITH
                </span>
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Social Login 3-Icon Row */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage(
                      'Google SSO simulated for layout demo. Use email/password or demo login below.'
                    )
                  }
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#070D18]/90 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center transition active:scale-95 shadow-xs"
                >
                  <GoogleIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage(
                      'Apple SSO simulated for layout demo. Use email/password or demo login below.'
                    )
                  }
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#070D18]/90 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-900 dark:text-white transition active:scale-95 shadow-xs"
                >
                  <AppleIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage(
                      'Phone OTP simulated for layout demo. Use email/password or demo login below.'
                    )
                  }
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#070D18]/90 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 shadow-xs"
                >
                  <Smartphone size={20} />
                </button>
              </div>

              {/* One-Click Quick Demo Login */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles size={11} className="text-[#FF9933]" />
                  Quick Demo Login (One Click)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('aarav_sharma')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700/60 bg-slate-100 hover:bg-slate-200 dark:bg-[#070D18]/80 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-300 text-left truncate transition shadow-xs"
                  >
                    🧑‍💻 @aarav_sharma
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('varta_official')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-orange-200 dark:border-slate-700/60 bg-orange-50 hover:bg-orange-100 dark:bg-[#070D18]/80 dark:hover:bg-slate-800/60 text-orange-950 dark:text-[#FF9933] text-left truncate transition shadow-xs"
                  >
                    🛡️ @varta_official
                  </button>
                </div>
              </div>

              {/* Bottom Switch to Register */}
              <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-[#0284C7] dark:text-[#0EA5E9] hover:underline font-bold"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Subtle Footer */}
        <footer className="w-full flex items-center justify-between text-xs text-slate-500 py-2">
          <span>© 2026 VARTA — Baat Sabki</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-800 dark:hover:text-slate-300 transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-800 dark:hover:text-slate-300 transition">
              Privacy
            </Link>
            <Link href="/grievance" className="hover:text-slate-800 dark:hover:text-slate-300 transition">
              Grievance
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
