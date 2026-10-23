'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Loader2,
  AlertCircle,
  MailCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { useAuthStore } from '../../../stores/authStore';

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

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, isLoading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !username.trim() || !emailOrPhone.trim() || !password) {
      setErrorMessage('Please fill in all registration fields');
      return;
    }

    const emailToUse = emailOrPhone.includes('@')
      ? emailOrPhone.trim()
      : `${emailOrPhone.replace(/\D/g, '')}@phone.varta.in`;

    try {
      const res = await registerAuth({
        displayName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: emailToUse,
        password,
      });

      if (res?.requiresVerification) {
        setIsRegisteredSuccess(true);
        setRegisteredEmail(emailToUse);
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-x-hidden selection:bg-[#FF7A00] selection:text-white"
      style={{
        backgroundImage: "url('/assets/signup-bg.jpg')",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Light / Dark Adaptive Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-white/90 to-orange-50/95 dark:from-[#030712]/90 dark:via-[#070E18]/65 dark:to-[#030712]/92 backdrop-blur-[2px]" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1340px] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Top Header Logo */}
        <header className="w-full flex items-center justify-between">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <VartaLogo size={42} showText={true} showTagline={true} />
          </Link>
        </header>

        {/* Center Grid: Left Hero & Right Register Card */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center my-auto py-8">
          {/* LEFT COLUMN: 3D VARTA Logo & Hero Title */}
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
              Join <span className="text-[#FF7A00]">VARTA</span>
            </h1>

            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal tracking-wide max-w-lg">
              Be a part of India&apos;s growing community.
            </p>
          </div>

          {/* RIGHT COLUMN: Floating Glassmorphic Register Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[430px] rounded-[28px] bg-white/95 dark:bg-[#0A1220]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-7 sm:p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-col gap-4">
              {isRegisteredSuccess ? (
                /* Email Confirmation Success State */
                <div className="flex flex-col items-center text-center gap-4 py-2 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center text-[#FF9933] shadow-lg shadow-[#FF9933]/25">
                    <MailCheck size={34} />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Check Your Email
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Account activation required
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    We have dispatched an activation link to <strong className="text-slate-900 dark:text-white">{registeredEmail}</strong> via Mailjet.
                  </p>

                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 text-left w-full">
                    <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1">Quick Steps:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Open your email inbox (or spam/junk if not visible).</li>
                      <li>Click the <strong>Activate My Account</strong> link.</li>
                      <li>Your account will be activated instantly!</li>
                    </ul>
                  </div>

                  <Link
                    href="/login"
                    className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight size={18} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsRegisteredSuccess(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mt-1 transition"
                  >
                    Register with a different email
                  </button>
                </div>
              ) : (
                /* Registration Form */
                <>
                  {/* Card Title */}
                  <div className="flex flex-col">
                    <h2 className="text-2xl sm:text-[25px] font-black text-slate-900 dark:text-white tracking-tight">
                      Create Your Account
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Let&apos;s get started with a few details.
                    </p>
                  </div>

                  {/* Error Feedback Alert */}
                  {errorMessage && (
                    <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                      <AlertCircle size={16} className="shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Form Fields matching Screenshot 2 */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {/* 1. Full Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Full Name
                      </label>
                      <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-2.5 sm:py-3 transition shadow-xs">
                        <User size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          suppressHydrationWarning
                          className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
                        />
                      </div>
                    </div>

                    {/* 2. Username */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Username
                      </label>
                      <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-2.5 sm:py-3 transition shadow-xs">
                        <AtSign size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Choose a unique username"
                          autoComplete="username"
                          suppressHydrationWarning
                          className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium lowercase"
                        />
                      </div>
                    </div>

                    {/* 3. Email or Phone */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email or Phone
                      </label>
                      <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-2.5 sm:py-3 transition shadow-xs">
                        <Mail size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type="text"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          placeholder="Enter your email or phone"
                          autoComplete="email"
                          suppressHydrationWarning
                          className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
                        />
                      </div>
                    </div>

                    {/* 4. Password */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <div className="relative flex items-center bg-slate-50 dark:bg-[#070D18]/90 border border-slate-200 dark:border-slate-700/60 focus-within:border-[#FF9933] dark:focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#FF9933]/20 dark:focus-within:ring-[#0284C7]/30 rounded-xl px-4 py-2.5 sm:py-3 transition shadow-xs">
                        <Lock size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
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
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    {/* Main Submit Saffron Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF9933] hover:from-[#E66E00] hover:to-[#E68525] text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>

                  {/* OR CONTINUE WITH Divider */}
                  <div className="flex items-center my-0.5">
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
                          'Google signup simulated for layout demo. Use the registration form above.'
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
                          'Apple signup simulated for layout demo. Use the registration form above.'
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
                          'Phone signup simulated for layout demo. Use the registration form above.'
                        )
                      }
                      className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#070D18]/90 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 shadow-xs"
                    >
                      <Smartphone size={20} />
                    </button>
                  </div>

                  {/* Bottom Switch to Login */}
                  <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-[#0284C7] dark:text-[#0EA5E9] hover:underline font-bold"
                    >
                      Sign In
                    </Link>
                  </p>
                </>
              )}
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
