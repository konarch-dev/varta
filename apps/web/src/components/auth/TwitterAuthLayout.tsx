'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

// Official Mathematical Double-Struck X Logo
export const TwitterXLogo = ({ className = 'w-full h-full text-black' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Google 4-Color Vector Icon
export const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
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

// Apple Vector Icon
export const AppleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 170 170" fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.7-7.85-12.04-14.36-6.19-9.35-11.1-20.08-14.73-32.18-3.63-12.1-5.45-23.51-5.45-34.24 0-14.93 3.83-27.13 11.48-36.6 7.66-9.47 17.2-14.28 28.63-14.43 4.58 0 9.87 1.17 15.86 3.53 5.99 2.35 10.02 3.65 12.09 3.89 2.07.24 6.09-.99 12.08-3.7 5.99-2.71 11.04-3.95 15.15-3.72 10.23.47 18.96 4.12 26.18 10.96 7.22 6.83 11.85 15.14 13.9 24.91-9.24 5.54-13.79 13.35-13.65 23.44.15 8.97 3.56 16.52 10.23 22.65 6.67 6.13 14.54 9.68 23.6 10.66-1.52 5.08-3.32 10.08-5.41 15.01zM119.22 33.09c0-6.14 2.22-12.03 6.67-17.67 4.45-5.64 10.03-9.67 16.74-12.09-.34 6.02-2.6 11.8-6.79 17.34-4.19 5.54-9.73 9.67-16.62 12.42z" />
  </svg>
);

// High-Fidelity Vector QR Code with Centered X Badge
export const QRCodeCard = ({ isDark = false }: { isDark?: boolean }) => {
  return (
    <div
      suppressHydrationWarning
      className={`rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 select-none shadow-xl ${
        isDark
          ? 'bg-[#16181c] border-[#2f3336] text-white shadow-black/40'
          : 'bg-white border-[#cfd9de]/80 text-[#0f1419] shadow-black/5'
      }`}
    >
      <div className="text-[11px] font-medium text-center mb-2 tracking-tight text-neutral-500">
        Scan to get the app
      </div>
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-xl p-1.5 flex items-center justify-center">
        {/* Authentic SVG QR Code Matrix */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-black"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Left Finder */}
          <rect x="6" y="6" width="28" height="28" rx="4" fill="black" />
          <rect x="10" y="10" width="20" height="20" rx="2" fill="white" />
          <rect x="14" y="14" width="12" height="12" rx="1.5" fill="black" />

          {/* Top-Right Finder */}
          <rect x="66" y="6" width="28" height="28" rx="4" fill="black" />
          <rect x="70" y="10" width="20" height="20" rx="2" fill="white" />
          <rect x="74" y="14" width="12" height="12" rx="1.5" fill="black" />

          {/* Bottom-Left Finder */}
          <rect x="6" y="66" width="28" height="28" rx="4" fill="black" />
          <rect x="10" y="70" width="20" height="20" rx="2" fill="white" />
          <rect x="14" y="74" width="12" height="12" rx="1.5" fill="black" />

          {/* Data Modules (Patterned) */}
          <rect x="38" y="8" width="4" height="4" />
          <rect x="46" y="8" width="4" height="4" />
          <rect x="54" y="8" width="4" height="4" />
          <rect x="42" y="14" width="4" height="4" />
          <rect x="50" y="14" width="4" height="4" />
          <rect x="58" y="14" width="4" height="4" />
          <rect x="38" y="20" width="4" height="4" />
          <rect x="46" y="20" width="4" height="4" />
          <rect x="54" y="20" width="4" height="4" />
          <rect x="42" y="26" width="4" height="4" />
          <rect x="50" y="26" width="4" height="4" />
          <rect x="58" y="26" width="4" height="4" />

          <rect x="8" y="38" width="4" height="4" />
          <rect x="14" y="44" width="4" height="4" />
          <rect x="20" y="38" width="4" height="4" />
          <rect x="26" y="44" width="4" height="4" />
          <rect x="8" y="50" width="4" height="4" />
          <rect x="14" y="56" width="4" height="4" />
          <rect x="26" y="52" width="4" height="4" />

          <rect x="66" y="42" width="4" height="4" />
          <rect x="74" y="40" width="4" height="4" />
          <rect x="82" y="44" width="4" height="4" />
          <rect x="90" y="42" width="4" height="4" />
          <rect x="70" y="50" width="4" height="4" />
          <rect x="78" y="54" width="4" height="4" />
          <rect x="86" y="50" width="4" height="4" />

          <rect x="38" y="66" width="4" height="4" />
          <rect x="46" y="70" width="4" height="4" />
          <rect x="54" y="66" width="4" height="4" />
          <rect x="42" y="76" width="4" height="4" />
          <rect x="50" y="82" width="4" height="4" />
          <rect x="58" y="78" width="4" height="4" />
          <rect x="38" y="86" width="4" height="4" />
          <rect x="46" y="90" width="4" height="4" />
          <rect x="54" y="86" width="4" height="4" />

          <rect x="66" y="66" width="4" height="4" />
          <rect x="72" y="72" width="4" height="4" />
          <rect x="80" y="68" width="4" height="4" />
          <rect x="88" y="72" width="4" height="4" />
          <rect x="68" y="80" width="4" height="4" />
          <rect x="76" y="84" width="4" height="4" />
          <rect x="84" y="80" width="4" height="4" />
          <rect x="92" y="86" width="4" height="4" />
        </svg>

        {/* Center X Logo Badge */}
        <div className="absolute inset-0 m-auto w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-md border border-neutral-200 shadow-sm flex items-center justify-center p-1">
          <TwitterXLogo className="w-full h-full text-black" />
        </div>
      </div>
    </div>
  );
};

interface TwitterAuthLayoutProps {
  initialMode?: 'login' | 'register';
}

export const TwitterAuthLayout: React.FC<TwitterAuthLayoutProps> = ({
  initialMode = 'login',
}) => {
  const router = useRouter();
  const { login, register: registerAuth, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasContinued, setHasContinued] = useState(false);

  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Status message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login handler
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    if (!hasContinued) {
      setHasContinued(true);
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setErrorMessage(null);
    try {
      await login({ identifier: identifier.trim(), password });
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password');
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      setErrorMessage('You must agree to the Terms of Service & Privacy Policy');
      return;
    }
    setErrorMessage(null);
    try {
      await registerAuth({
        displayName: regDisplayName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim(),
        password: regPassword,
      });
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    }
  };

  // Quick Demo Auto-Fill
  const handleDemoFill = async (userKey: string) => {
    setErrorMessage(null);
    setIdentifier(userKey);
    setPassword('Varta@2026Secure!');
    setHasContinued(true);
    try {
      await login({ identifier: userKey, password: 'Varta@2026Secure!' });
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    }
  };

  // Footer navigation items
  const footerLinks = [
    'About',
    'Download the X app',
    'Help Center',
    'Terms of Service',
    'Privacy Policy',
    'Cookie Policy',
    'Accessibility',
    'Ads info',
    'Blog',
    'Careers',
    'Brand Resources',
    'Advertising',
    'Marketing',
    'X for Business',
    'Developers',
    'Directory',
    'Settings',
  ];

  const isDark = mounted ? isDarkMode : false;

  return (
    <div
      suppressHydrationWarning
      className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-200 select-text ${
        isDark ? 'bg-black text-[#e7e9ea]' : 'bg-white text-[#0f1419]'
      }`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Top Floating Controls */}
      <header className="w-full flex items-center justify-between px-6 py-4 sm:px-12 z-20" suppressHydrationWarning>
        <div className="lg:hidden">
          <TwitterXLogo className={`w-8 h-8 ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-3">
          {/* Mode Pill Switcher */}
          <div
            className={`p-1 rounded-full border flex items-center text-xs font-semibold ${
              isDark
                ? 'bg-[#16181c] border-[#2f3336] text-neutral-400'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`px-3.5 py-1.5 rounded-full transition ${
                mode === 'login'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'hover:text-black dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`px-3.5 py-1.5 rounded-full transition ${
                mode === 'register'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'hover:text-black dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Theme"
            className={`p-2 rounded-full border transition hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#16181c] border-[#2f3336] text-yellow-400 hover:bg-[#202327]'
                : 'bg-white border-[#cfd9de] text-neutral-700 hover:bg-neutral-100'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Dual-Column Hero Layout */}
      <main className="w-full flex-1 flex flex-col-reverse lg:flex-row items-center justify-center max-w-[1500px] mx-auto px-6 sm:px-12 lg:px-16 py-6 sm:py-8 gap-8 lg:gap-12 relative" suppressHydrationWarning>
        {/* LEFT COLUMN: Auth Container (Happening now. + Controls) */}
        <section className="w-full lg:w-[50%] flex flex-col justify-center items-start lg:pl-4 xl:pl-10">
          <div className="w-full max-w-[340px] sm:max-w-[360px] flex flex-col">
            {/* Headline matching screenshot */}
            <h1
              className={`font-black tracking-tight leading-[1.05] mb-8 text-[44px] sm:text-[56px] md:text-[62px] ${
                isDark ? 'text-[#e7e9ea]' : 'text-[#0f1419]'
              }`}
            >
              Happening
              <br />
              now.
            </h1>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                className={`mb-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
                  isDark
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                <AlertCircle size={16} className="shrink-0" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* LOGIN MODE VIEW */}
            {mode === 'login' && (
              <div className="flex flex-col w-full">
                {/* Social Login Buttons Stack */}
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Phone auth is simulated for layout demo. Use email/username below or demo accounts.');
                    }}
                    className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${
                      isDark
                        ? 'bg-white text-black hover:bg-[#e6e6e6]'
                        : 'bg-black text-white hover:bg-[#272c30]'
                    }`}
                  >
                    <Phone size={16} className="fill-current" />
                    <span>Continue with phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Google SSO is simulated for layout demo. Use email/username below or demo accounts.');
                    }}
                    className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 border transition active:scale-[0.98] ${
                      isDark
                        ? 'bg-transparent text-white border-[#536471] hover:bg-[#181818]'
                        : 'bg-white text-[#0f1419] border-[#cfd9de] hover:bg-[#e7e7e8]/40'
                    }`}
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Apple SSO is simulated for layout demo. Use email/username below or demo accounts.');
                    }}
                    className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 border transition active:scale-[0.98] ${
                      isDark
                        ? 'bg-transparent text-white border-[#536471] hover:bg-[#181818]'
                        : 'bg-white text-[#0f1419] border-[#cfd9de] hover:bg-[#e7e7e8]/40'
                    }`}
                  >
                    <AppleIcon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                    <span>Continue with Apple</span>
                  </button>
                </div>

                {/* Divider Line with 'or' */}
                <div className="flex items-center my-3 w-full">
                  <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#2f3336]' : 'bg-[#eff3f4]'}`} />
                  <span className={`px-3 text-xs font-normal ${isDark ? 'text-[#71767b]' : 'text-[#536471]'}`}>
                    or
                  </span>
                  <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#2f3336]' : 'bg-[#eff3f4]'}`} />
                </div>

                {/* Identifier or Password Form */}
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3 w-full">
                  {!hasContinued ? (
                    <div className="relative w-full">
                      <div
                        className={`w-full h-14 rounded-md border px-3 pt-2 pb-1.5 flex flex-col justify-center transition-all duration-150 ${
                          identifier
                            ? 'border-[#1d9bf0] ring-1 ring-[#1d9bf0]'
                            : isDark
                            ? 'border-[#333639] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0]'
                            : 'border-[#cfd9de] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0]'
                        } ${isDark ? 'bg-black' : 'bg-white'}`}
                      >
                        <label
                          htmlFor="login-identifier"
                          className={`text-[11px] leading-tight transition-all select-none font-medium ${
                            identifier ? 'text-[#1d9bf0]' : isDark ? 'text-[#71767b]' : 'text-[#536471]'
                          }`}
                        >
                          Email or username
                        </label>
                        <input
                          id="login-identifier"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          autoComplete="username"
                          suppressHydrationWarning
                          className={`w-full bg-transparent text-sm font-normal outline-none pt-0.5 ${
                            isDark ? 'text-white' : 'text-[#0f1419]'
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs px-1 text-neutral-500">
                        <span className="font-medium truncate max-w-[200px]">
                          Signing in as <b className={isDark ? 'text-white' : 'text-black'}>{identifier}</b>
                        </span>
                        <button
                          type="button"
                          onClick={() => setHasContinued(false)}
                          className="text-[#1d9bf0] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ArrowLeft size={13} /> Edit
                        </button>
                      </div>

                      <div
                        className={`relative w-full h-14 rounded-md border px-3 pt-2 pb-1.5 flex flex-col justify-center transition-all duration-150 border-[#1d9bf0] ring-1 ring-[#1d9bf0] ${
                          isDark ? 'bg-black' : 'bg-white'
                        }`}
                      >
                        <label
                          htmlFor="login-password"
                          className="text-[11px] leading-tight text-[#1d9bf0] select-none font-medium"
                        >
                          Password
                        </label>
                        <div className="flex items-center justify-between">
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            suppressHydrationWarning
                            className={`w-full bg-transparent text-sm font-normal outline-none pt-0.5 ${
                              isDark ? 'text-white' : 'text-[#0f1419]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Continue Button matching screenshot */}
                  <button
                    type="submit"
                    disabled={isLoading || (!identifier.trim() && !hasContinued)}
                    className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      identifier.trim() || hasContinued
                        ? isDark
                          ? 'bg-white text-black hover:bg-[#e6e6e6] active:scale-[0.98] cursor-pointer'
                          : 'bg-black text-white hover:bg-[#272c30] active:scale-[0.98] cursor-pointer'
                        : isDark
                        ? 'bg-[#333639] text-[#71767b] cursor-not-allowed'
                        : 'bg-[#cfd9de] text-[#536471] cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : hasContinued ? (
                      'Sign In'
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>

                {/* Terms of Service / Privacy disclaimer matching screenshot */}
                <p
                  className={`text-[11px] leading-relaxed mt-4 ${
                    isDark ? 'text-[#71767b]' : 'text-[#536471]'
                  }`}
                >
                  By continuing, you agree to our{' '}
                  <Link
                    href="/terms"
                    className={`font-semibold hover:underline ${
                      isDark ? 'text-white' : 'text-[#0f1419]'
                    }`}
                  >
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link
                    href="/privacy"
                    className={`font-semibold hover:underline ${
                      isDark ? 'text-white' : 'text-[#0f1419]'
                    }`}
                  >
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <span
                    className={`font-semibold cursor-pointer hover:underline ${
                      isDark ? 'text-white' : 'text-[#0f1419]'
                    }`}
                  >
                    Cookie Use
                  </span>
                  .
                </p>

                {/* Quick 1-Click Demo Accounts for Developer Convenience */}
                <div
                  className={`mt-6 pt-4 border-t flex flex-col gap-2 ${
                    isDark ? 'border-[#2f3336]' : 'border-[#eff3f4]'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    <Sparkles size={11} className="text-[#1d9bf0]" />
                    One-Click Quick Login
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoFill('aarav_sharma')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left truncate transition ${
                        isDark
                          ? 'bg-[#16181c] border-[#2f3336] text-[#e7e9ea] hover:bg-[#202327]'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      🧑‍💻 @aarav_sharma
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoFill('varta_official')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left truncate transition ${
                        isDark
                          ? 'bg-[#16181c] border-[#2f3336] text-[#1d9bf0] hover:bg-[#202327]'
                          : 'bg-neutral-50 border-neutral-200 text-[#1d9bf0] hover:bg-neutral-100'
                      }`}
                    >
                      🛡️ @varta_official
                    </button>
                  </div>
                </div>

                {/* Toggle to Signup */}
                <div className="mt-5 text-xs text-neutral-500">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-[#1d9bf0] font-bold hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER MODE VIEW */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3 w-full animate-in fade-in">
                {/* Social Login Buttons */}
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Google sign up is simulated. Fill the fields below to create an account.');
                    }}
                    className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 border transition active:scale-[0.98] ${
                      isDark
                        ? 'bg-transparent text-white border-[#536471] hover:bg-[#181818]'
                        : 'bg-white text-[#0f1419] border-[#cfd9de] hover:bg-[#e7e7e8]/40'
                    }`}
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>Sign up with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Apple sign up is simulated. Fill the fields below to create an account.');
                    }}
                    className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 border transition active:scale-[0.98] ${
                      isDark
                        ? 'bg-transparent text-white border-[#536471] hover:bg-[#181818]'
                        : 'bg-white text-[#0f1419] border-[#cfd9de] hover:bg-[#e7e7e8]/40'
                    }`}
                  >
                    <AppleIcon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                    <span>Sign up with Apple</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-2 w-full">
                  <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#2f3336]' : 'bg-[#eff3f4]'}`} />
                  <span className={`px-3 text-xs font-normal ${isDark ? 'text-[#71767b]' : 'text-[#536471]'}`}>
                    or
                  </span>
                  <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#2f3336]' : 'bg-[#eff3f4]'}`} />
                </div>

                {/* Display Name */}
                <div
                  className={`w-full h-12 rounded-lg border px-3 pt-1.5 pb-1 flex flex-col justify-center transition-all ${
                    regDisplayName
                      ? 'border-[#1d9bf0] ring-1 ring-[#1d9bf0]'
                      : isDark
                      ? 'border-[#333639] focus-within:border-[#1d9bf0]'
                      : 'border-[#cfd9de] focus-within:border-[#1d9bf0]'
                  } ${isDark ? 'bg-black' : 'bg-white'}`}
                >
                  <span className="text-[10px] text-neutral-500 leading-none select-none">
                    Name
                  </span>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="e.g. Vikramaditya"
                    required
                    suppressHydrationWarning
                    className={`w-full bg-transparent text-xs font-normal outline-none ${
                      isDark ? 'text-white' : 'text-[#0f1419]'
                    }`}
                  />
                </div>

                {/* Username */}
                <div
                  className={`w-full h-12 rounded-lg border px-3 pt-1.5 pb-1 flex flex-col justify-center transition-all ${
                    regUsername
                      ? 'border-[#1d9bf0] ring-1 ring-[#1d9bf0]'
                      : isDark
                      ? 'border-[#333639] focus-within:border-[#1d9bf0]'
                      : 'border-[#cfd9de] focus-within:border-[#1d9bf0]'
                  } ${isDark ? 'bg-black' : 'bg-white'}`}
                >
                  <span className="text-[10px] text-neutral-500 leading-none select-none">
                    Username
                  </span>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="vikram_99"
                    required
                    suppressHydrationWarning
                    className={`w-full bg-transparent text-xs font-normal outline-none lowercase ${
                      isDark ? 'text-white' : 'text-[#0f1419]'
                    }`}
                  />
                </div>

                {/* Email */}
                <div
                  className={`w-full h-12 rounded-lg border px-3 pt-1.5 pb-1 flex flex-col justify-center transition-all ${
                    regEmail
                      ? 'border-[#1d9bf0] ring-1 ring-[#1d9bf0]'
                      : isDark
                      ? 'border-[#333639] focus-within:border-[#1d9bf0]'
                      : 'border-[#cfd9de] focus-within:border-[#1d9bf0]'
                  } ${isDark ? 'bg-black' : 'bg-white'}`}
                >
                  <span className="text-[10px] text-neutral-500 leading-none select-none">
                    Email
                  </span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="vikram@example.com"
                    required
                    suppressHydrationWarning
                    className={`w-full bg-transparent text-xs font-normal outline-none ${
                      isDark ? 'text-white' : 'text-[#0f1419]'
                    }`}
                  />
                </div>

                {/* Password */}
                <div
                  className={`w-full h-12 rounded-lg border px-3 pt-1.5 pb-1 flex flex-col justify-center transition-all ${
                    regPassword
                      ? 'border-[#1d9bf0] ring-1 ring-[#1d9bf0]'
                      : isDark
                      ? 'border-[#333639] focus-within:border-[#1d9bf0]'
                      : 'border-[#cfd9de] focus-within:border-[#1d9bf0]'
                  } ${isDark ? 'bg-black' : 'bg-white'}`}
                >
                  <span className="text-[10px] text-neutral-500 leading-none select-none">
                    Password (8+ chars)
                  </span>
                  <div className="flex items-center justify-between">
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      suppressHydrationWarning
                      className={`w-full bg-transparent text-xs font-normal outline-none ${
                        isDark ? 'text-white' : 'text-[#0f1419]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {regShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Terms agreement checkbox */}
                <label className="flex items-start gap-2 cursor-pointer mt-1 select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-black focus:ring-0"
                  />
                  <span className="text-[11px] text-neutral-500 leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#1d9bf0] hover:underline font-semibold">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-[#1d9bf0] hover:underline font-semibold">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                {/* Create Account Pill Button */}
                <button
                  type="submit"
                  disabled={isLoading || !agreedTerms}
                  className={`w-full h-10 sm:h-11 rounded-full font-bold text-sm mt-2 transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-white text-black hover:bg-[#e6e6e6] active:scale-[0.98]'
                      : 'bg-black text-white hover:bg-[#272c30] active:scale-[0.98]'
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* Link to Sign In */}
                <div className="mt-2 text-xs text-neutral-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-[#1d9bf0] font-bold hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Massive Stylized X Logo & Floating QR Card */}
        <section className="w-full lg:w-[50%] flex items-center justify-center relative min-h-[280px] sm:min-h-[380px] lg:min-h-[520px]">
          {/* Centered Massive X Logo matching screenshot */}
          <div className="w-[240px] h-[240px] sm:w-[360px] sm:h-[360px] md:w-[440px] md:h-[440px] lg:w-[480px] lg:h-[480px] xl:w-[560px] xl:h-[560px] flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
            <TwitterXLogo className={`w-full h-full ${isDark ? 'text-white' : 'text-black'}`} />
          </div>

          {/* Floating Bottom-Right QR Code Widget matching screenshot */}
          <aside className="absolute bottom-2 right-0 sm:bottom-4 sm:right-2 lg:bottom-6 lg:right-6 z-10 hidden sm:block">
            <QRCodeCard isDark={isDark} />
          </aside>
        </section>
      </main>

      {/* FOOTER: Minimalist Twitter/X Horizontal Links */}
      <footer
        className={`w-full py-4 px-6 border-t text-[11px] transition-colors ${
          isDark
            ? 'border-[#2f3336] text-[#71767b]'
            : 'border-[#eff3f4] text-[#536471]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 leading-normal text-center">
          {footerLinks.map((link) => (
            <Link
              key={link}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="hover:underline transition-colors"
            >
              {link}
            </Link>
          ))}
          <span className="cursor-default select-none">
            © 2026 X Corp.
          </span>
        </div>
      </footer>
    </div>
  );
};
