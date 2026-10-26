'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  AtSign,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Loader2,
  AlertCircle,
  MailCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MessageSquare,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Heart,
  Repeat2,
  BarChart2,
  BadgeCheck,
  Flame,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { useAuthStore } from '../../../stores/authStore';
import { GoogleAuthModal } from '../../../components/auth/GoogleAuthModal';
import { CountryCodeSelector, Country } from '../../../components/auth/CountryCodeSelector';

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

// Apple Black Vector Icon
const AppleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 170 170" fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.7-7.85-12.04-14.36-6.19-9.35-11.1-20.08-14.73-32.18-3.63-12.1-5.45-23.51-5.45-34.24 0-14.93 3.83-27.13 11.48-36.6 7.66-9.47 17.2-14.28 28.63-14.43 4.58 0 9.87 1.17 15.86 3.53 5.99 2.35 10.02 3.65 12.09 3.89 2.07.24 6.09-.99 12.08-3.7 5.99-2.71 11.04-3.95 15.15-3.72 10.23.47 18.96 4.12 26.18 10.96 7.22 6.83 11.85 15.14 13.9 24.91-9.24 5.54-13.79 13.35-13.65 23.44.15 8.97 3.56 16.52 10.23 22.65 6.67 6.13 14.54 9.68 23.6 10.66-1.52 5.08-3.32 10.08-5.41 15.01zM119.22 33.09c0-6.14 2.22-12.03 6.67-17.67 4.45-5.64 10.03-9.67 16.74-12.09-.34 6.02-2.6 11.8-6.79 17.34-4.19 5.54-9.73 9.67-16.62 12.42z" />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const {
    sendSignupOtp,
    verifySignupOtp,
    sendPhoneOtp,
    verifyPhoneSignup,
    isLoading,
  } = useAuthStore();

  const [regMethod, setRegMethod] = useState<'phone' | 'email'>('phone');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // OTP Registration Flow State
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [registeredIdentifier, setRegisteredIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Countdown timer for OTP resend
  React.useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Google OAuth redirect notification handling
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_oauth') === 'not_configured') {
      setIsGoogleModalOpen(true);
      setErrorMessage(
        'Google OAuth keys (GOOGLE_CLIENT_ID & SECRET) are not yet configured in .env. You can sign up below using your Google profile or add credentials to .env.'
      );
    }
    const err = params.get('error');
    if (err) {
      setErrorMessage(decodeURIComponent(err));
    }
  }, []);

  const handleGoogleOAuth = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/auth/google/login`;
  };

  // Sample interactive post state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(8942);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(1420);

  const handleToggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const handleToggleRepost = () => {
    if (reposted) {
      setReposted(false);
      setRepostCount((c) => c - 1);
    } else {
      setReposted(true);
      setRepostCount((c) => c + 1);
    }
  };

  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !username.trim() || !password) {
      setErrorMessage('Please fill in all registration fields');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setIsSendingOtp(true);
    try {
      if (regMethod === 'phone') {
        const cleanDigits = phoneNumber.replace(/\D/g, '');
        if (cleanDigits.length < 6) {
          setErrorMessage('Please enter a valid phone number');
          setIsSendingOtp(false);
          return;
        }
        await sendPhoneOtp({
          countryCode: phoneCountryCode,
          phoneNumber: cleanDigits,
          purpose: 'signup',
        });
        setRegisteredIdentifier(`${phoneCountryCode} ${phoneNumber}`);
        setRegStep('otp');
        setOtpTimer(60);
        setOtpCode('');
      } else {
        if (!email.trim() || !email.includes('@')) {
          setErrorMessage('Please provide a valid email address');
          setIsSendingOtp(false);
          return;
        }
        await sendSignupOtp(email.trim().toLowerCase(), fullName.trim());
        setRegisteredIdentifier(email.trim().toLowerCase());
        setRegStep('otp');
        setOtpTimer(60);
        setOtpCode('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch registration OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      if (regMethod === 'phone') {
        await verifyPhoneSignup({
          countryCode: phoneCountryCode,
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          displayName: fullName.trim(),
          username: username.trim().toLowerCase(),
          password,
          otp: otpCode.trim(),
        });
      } else {
        await verifySignupOtp({
          email: registeredIdentifier,
          username: username.trim().toLowerCase(),
          displayName: fullName.trim(),
          password,
          otp: otpCode.trim(),
        });
      }
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (otpTimer > 0 || isSendingOtp) return;
    setErrorMessage(null);
    setIsSendingOtp(true);
    try {
      if (regMethod === 'phone') {
        await sendPhoneOtp({
          countryCode: phoneCountryCode,
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          purpose: 'signup',
        });
      } else {
        await sendSignupOtp(registeredIdentifier, fullName.trim());
      }
      setOtpTimer(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-[position:center_top] lg:bg-center bg-no-repeat overflow-x-hidden selection:bg-[#FF6200] selection:text-white bg-[url('/assets/varanasi-mobile-bg.jpg')] lg:bg-[url('/assets/varanasi-login-bg.jpg')]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Scoped style to prevent browser user-agent blue autofill background */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
              box-shadow: 0 0 0 1000px #FFFFFF inset !important;
              -webkit-text-fill-color: #0B1422 !important;
              caret-color: #0B1422 !important;
              transition: background-color 50000s ease-in-out 0s !important;
            }
          `,
        }}
      />

      {/* Daylight Warm Ambient Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/70 lg:bg-gradient-to-r lg:from-amber-50/90 lg:via-white/75 lg:to-amber-50/70 pointer-events-none" />

      {/* Decorative Flying Birds in Sky (Desktop) */}
      <div className="absolute top-10 left-1/3 opacity-40 pointer-events-none hidden lg:block">
        <svg width="180" height="60" viewBox="0 0 180 60" fill="currentColor" className="text-slate-800">
          <path d="M10,20 Q18,8 26,16 Q34,8 42,20 Q32,15 26,22 Q20,15 10,20 Z" />
          <path d="M70,35 Q76,26 82,32 Q88,26 94,35 Q86,31 82,36 Q78,31 70,35 Z" />
          <path d="M130,15 Q137,4 144,11 Q151,4 158,15 Q149,10 144,16 Q139,10 130,15 Z" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1380px] min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12">
        {/* Top Header: Logo on Left & Script Callout on Right */}
        <header className="w-full flex items-center justify-between pt-1 sm:pt-2">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <VartaLogo size={42} showText={true} showTagline={true} />
          </Link>

          {/* Right Script Style Callout matching reference image */}
          <div className="relative text-right select-none">
            {/* Mobile Script Callout: "Real Stories Real People Real India" */}
            <div className="block lg:hidden">
              <span
                className="italic font-bold text-slate-900 text-xs sm:text-sm leading-tight block drop-shadow-2xs"
                style={{
                  fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
                  letterSpacing: '-0.01em',
                }}
              >
                Real Stories
                <br />
                Real People
                <br />
                Real India
              </span>
              <div className="flex justify-end items-center gap-1 mt-0.5">
                <span className="w-4 h-[2px] bg-[#FF9933] rounded-full inline-block"></span>
                <span className="w-4 h-[2px] bg-[#00A844] rounded-full inline-block"></span>
              </div>
            </div>

            {/* Desktop Script Callout */}
            <div className="hidden lg:block">
              <span
                className="italic font-bold text-slate-800 text-lg lg:text-xl leading-tight block"
                style={{
                  fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
                  letterSpacing: '-0.01em',
                }}
              >
                Real Stories
                <br />
                Real People
                <br />
                Real India
              </span>
              <svg
                className="w-20 h-3 text-[#FF9933] ml-auto mt-1"
                viewBox="0 0 100 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              >
                <path d="M 5,14 Q 50,22 95,6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </header>

        {/* Center Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-center my-auto py-2 sm:py-6 lg:py-8">
          {/* LEFT / TOP HERO SECTION */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center pr-0 lg:pr-4 max-w-[62%] sm:max-w-none">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[62px] font-black text-[#0B1422] tracking-tight leading-[1.05] drop-shadow-2xs">
              India&apos;s
              <br />
              <span className="text-[#FF5722]">Voice</span>,
              <br />
              <span className="text-[#00A844]">Together</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-1.5 sm:mt-4 text-xs sm:text-base lg:text-lg text-slate-800 font-bold sm:font-semibold leading-tight sm:leading-relaxed">
              Different people. One platform. A stronger India.
            </p>

            {/* Desktop-Only Community Stack */}
            <div className="hidden lg:flex mt-5 items-center gap-3.5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/90 shadow-[0_6px_25px_rgba(0,0,0,0.06)] hover:shadow-md transition">
              <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                <img
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                  alt="Citizen Priya"
                />
                <img
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                  alt="Citizen Aarav"
                />
                <img
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces"
                  alt="Citizen Ananya"
                />
                <img
                  className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
                  alt="Citizen Rohan"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-[#0B1422] leading-tight">
                  Join thousands of voices across India
                </span>
                <span className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                  <Flame size={12} className="text-[#FF5722]" />
                  Sharing live thoughts, news & discourse
                </span>
              </div>
            </div>

            {/* Desktop-Only Live Sample Tweet Card */}
            <div className="hidden lg:block mt-5 w-full max-w-[530px] bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-white/90 shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.12)] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces"
                    alt="Aarav Sharma"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0284C7]/20 shrink-0"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-sm text-[#0B1422]">
                        Aarav Sharma
                      </span>
                      <BadgeCheck size={16} className="text-[#0284C7] fill-[#0284C7] text-white shrink-0" />
                      <span className="text-xs text-slate-400 font-medium">@aarav_sharma</span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-xs text-slate-400 font-medium">2h</span>
                    </div>
                    <span className="text-[11px] text-[#FF5722] font-bold flex items-center gap-1">
                      Trending in India · Tech & Innovation 🚀
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition"
                  aria-label="More options"
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                Varanasi sunrise hits differently when you realize how ancient yet forward-thinking this nation is. India isn&apos;t just watching the future unfold, we&apos;re actively building it from local hubs to global stages! 🇮🇳✨
              </p>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs font-bold text-[#0284C7]">
                <span className="hover:underline cursor-pointer">#VartaSabki</span>
                <span className="hover:underline cursor-pointer">#NewIndia</span>
                <span className="hover:underline cursor-pointer">#TechBharat</span>
                <span className="hover:underline cursor-pointer">#VaranasiGhats</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-[#0284C7] transition group"
                  title="Reply"
                >
                  <div className="p-1.5 rounded-full group-hover:bg-sky-50 transition">
                    <MessageCircle size={15} />
                  </div>
                  <span>348</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleRepost}
                  className={`flex items-center gap-1.5 transition group ${
                    reposted ? 'text-[#00A844]' : 'hover:text-[#00A844]'
                  }`}
                  title="Repost"
                >
                  <div className="p-1.5 rounded-full group-hover:bg-emerald-50 transition">
                    <Repeat2 size={16} />
                  </div>
                  <span>{repostCount.toLocaleString()}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 transition group ${
                    liked ? 'text-rose-600' : 'hover:text-rose-600'
                  }`}
                  title="Like"
                >
                  <div className="p-1.5 rounded-full group-hover:bg-rose-50 transition">
                    <Heart
                      size={15}
                      className={liked ? 'fill-rose-600 text-rose-600' : ''}
                    />
                  </div>
                  <span>{likeCount.toLocaleString()}</span>
                </button>

                <div className="flex items-center gap-1.5 text-slate-400" title="Views">
                  <BarChart2 size={15} />
                  <span>54.8K</span>
                </div>

                <button
                  type="button"
                  className="hover:text-[#0284C7] p-1.5 rounded-full hover:bg-sky-50 transition"
                  title="Bookmark"
                >
                  <Bookmark size={15} />
                </button>
              </div>
            </div>

            {/* Desktop-Only 3 Compact Value Feature Badges */}
            <div className="hidden lg:grid mt-4 grid-cols-3 gap-2.5 w-full max-w-[530px]">
              <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl p-2 px-3 border border-white/80 shadow-xs">
                <div className="w-8 h-8 rounded-full border border-sky-400 bg-sky-50 flex items-center justify-center text-[#0284C7] shrink-0">
                  <MessageSquare size={15} />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[#0B1422] font-black text-xs">Real People</span>
                  <span className="text-slate-500 text-[10px]">Real Chats</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl p-2 px-3 border border-white/80 shadow-xs">
                <div className="w-8 h-8 rounded-full border border-rose-400 bg-rose-50 flex items-center justify-center text-[#EF4444] shrink-0">
                  <MapPin size={15} />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[#0B1422] font-black text-xs">Your City</span>
                  <span className="text-slate-500 text-[10px]">All of India</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl p-2 px-3 border border-white/80 shadow-xs">
                <div className="w-8 h-8 rounded-full border border-emerald-400 bg-emerald-50 flex items-center justify-center text-[#10B981] shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[#0B1422] font-black text-xs">Safer Space</span>
                  <span className="text-slate-500 text-[10px]">Civil & Open</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT / CENTER FLOATING REGISTER CARD */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[390px] sm:max-w-[430px] rounded-[28px] sm:rounded-[32px] bg-white p-5 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] border border-slate-100 flex flex-col gap-4">
              {regStep === 'otp' ? (
                /* STEP 2: 6-DIGIT OTP VERIFICATION SCREEN */
                <form onSubmit={handleVerifySignupOtp} className="flex flex-col gap-4 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5722] shadow-md shadow-orange-500/10">
                      <ShieldCheck size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-[#0B1422] tracking-tight">
                      Verify Your Account
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter the 6-digit OTP code sent to{' '}
                      <strong className="text-slate-900 font-bold">{registeredIdentifier}</strong>
                    </p>
                  </div>

                  {/* Error Feedback Alert */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in duration-200">
                      <AlertCircle size={15} className="shrink-0 text-rose-600" />
                      <span className="font-semibold">{errorMessage}</span>
                    </div>
                  )}

                  {/* 6-digit numeric input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      autoFocus
                      autoComplete="one-time-code"
                      className="w-full text-center font-mono text-2xl font-black tracking-[0.4em] py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#FF5722] focus:bg-white focus:ring-2 focus:ring-[#FF5722]/15 rounded-2xl transition outline-none text-[#0B1422] placeholder:tracking-[0.3em] placeholder:text-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    style={{ color: '#FFFFFF' }}
                    className="w-full py-3.5 rounded-2xl bg-[#FF5722] hover:bg-[#E64A19] active:scale-[0.99] text-white text-force-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : (
                      <span style={{ color: '#FFFFFF' }} className="text-white text-force-white font-extrabold">
                        Verify & Complete Registration
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRegStep('form');
                        setOtpCode('');
                        setErrorMessage(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      <span>Edit details</span>
                    </button>

                    {otpTimer > 0 ? (
                      <span className="text-slate-400 font-medium">
                        Resend in {otpTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendSignupOtp}
                        disabled={isSendingOtp}
                        className="text-[#0284C7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                /* STEP 1: INITIAL REGISTRATION FORM */
                <>
                  {/* Card Header Title */}
                  <div className="flex flex-col">
                    <h2 className="text-2xl sm:text-[28px] font-black text-[#0B1422] tracking-tight">
                      Create Account
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 sm:mt-1">
                      Join India&apos;s growing social community
                    </p>
                  </div>

                  {/* Registration Method Toggle: Phone vs Email */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setRegMethod('phone');
                        setErrorMessage(null);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        regMethod === 'phone'
                          ? 'bg-white text-[#0B1422] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Smartphone size={14} className={regMethod === 'phone' ? 'text-[#FF5722]' : ''} />
                      <span>Phone Number</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegMethod('email');
                        setErrorMessage(null);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        regMethod === 'email'
                          ? 'bg-white text-[#0B1422] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Mail size={14} className={regMethod === 'email' ? 'text-[#FF5722]' : ''} />
                      <span>Email Address</span>
                    </button>
                  </div>

                  {/* Error Feedback Alert */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in duration-200">
                      <AlertCircle size={15} className="shrink-0 text-rose-600" />
                      <span className="font-semibold">{errorMessage}</span>
                    </div>
                  )}

                  {/* Register Form */}
                  <form onSubmit={handleSendSignupOtp} className="flex flex-col gap-2.5 sm:gap-3">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1">
                      <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#FF5722] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5722]/15 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition shadow-2xs">
                        <User size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full Name"
                          autoComplete="name"
                          suppressHydrationWarning
                          className="bg-transparent text-sm text-[#0B1422] placeholder-slate-400 outline-none w-full font-medium"
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex flex-col gap-1">
                      <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#FF5722] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5722]/15 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition shadow-2xs">
                        <AtSign size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          autoComplete="username"
                          suppressHydrationWarning
                          className="bg-transparent text-sm text-[#0B1422] placeholder-slate-400 outline-none w-full font-medium lowercase"
                        />
                      </div>
                    </div>

                    {/* Phone or Email Input based on regMethod */}
                    {regMethod === 'phone' ? (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">
                          Country Code & Phone Number
                        </label>
                        <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#FF5722] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5722]/15 rounded-2xl overflow-hidden transition shadow-2xs">
                          <CountryCodeSelector
                            selectedCode={phoneCountryCode}
                            onSelect={(c) => setPhoneCountryCode(c.code)}
                          />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) =>
                              setPhoneNumber(e.target.value.replace(/[^0-9\s-]/g, ''))
                            }
                            placeholder="98765 43210"
                            autoComplete="tel"
                            autoFocus
                            suppressHydrationWarning
                            className="bg-transparent text-sm text-[#0B1422] placeholder-slate-400 outline-none w-full font-medium px-3 py-2.5 sm:py-3"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#FF5722] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5722]/15 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition shadow-2xs">
                          <Mail size={17} className="text-slate-400 shrink-0 mr-3" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            autoComplete="email"
                            autoFocus
                            suppressHydrationWarning
                            className="bg-transparent text-sm text-[#0B1422] placeholder-slate-400 outline-none w-full font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                      <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#FF5722] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF5722]/15 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition shadow-2xs">
                        <Lock size={17} className="text-slate-400 shrink-0 mr-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create Password"
                          autoComplete="new-password"
                          suppressHydrationWarning
                          className="bg-transparent text-sm text-[#0B1422] placeholder-slate-400 outline-none w-full font-medium pr-2"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="text-slate-400 hover:text-slate-600 transition shrink-0"
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      style={{ color: '#FFFFFF' }}
                      className="w-full py-3 sm:py-3.5 rounded-2xl bg-[#FF5722] hover:bg-[#E64A19] active:scale-[0.99] text-white text-force-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingOtp ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : (
                        <span style={{ color: '#FFFFFF' }} className="text-white text-force-white font-extrabold">
                          Send 6-Digit OTP
                        </span>
                      )}
                    </button>
                  </form>

                  {/* OR CONTINUE WITH Divider */}
                  <div className="flex items-center my-0.5">
                    <div className="flex-1 h-[1px] bg-slate-200" />
                    <span className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      OR CONTINUE WITH
                    </span>
                    <div className="flex-1 h-[1px] bg-slate-200" />
                  </div>

                  {/* 3 Alternate Auth Option Buttons */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleOAuth}
                      className="h-11 sm:h-12 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer"
                      title="Sign up with Google"
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
                      className="h-11 sm:h-12 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-black transition active:scale-95 shadow-2xs"
                      title="Sign up with Apple"
                    >
                      <AppleIcon className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const emailInput = document.querySelector<HTMLInputElement>(
                          'input[autoComplete="email"]'
                        );
                        if (emailInput) emailInput.focus();
                      }}
                      className="h-11 sm:h-12 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-black transition active:scale-95 shadow-2xs"
                      title="Sign up with Phone / OTP"
                    >
                      <Smartphone size={20} />
                    </button>
                  </div>

                  {/* Card Footer: Already have an account? Sign In */}
                  <p className="text-center text-xs sm:text-sm text-slate-600 mt-0.5">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-[#0284C7] hover:underline font-bold"
                    >
                      Sign In
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Minimal Footer */}
        <footer className="w-full flex items-center justify-between text-xs text-slate-600 font-medium py-2">
          <span>© 2026 VARTA — Baat Sabki</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-900 transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">
              Privacy
            </Link>
            <Link href="/grievance" className="hover:text-slate-900 transition">
              Grievance
            </Link>
          </div>
        </footer>
      </div>

      {/* Google Sign-Up Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Sign up with Google"
      />
    </div>
  );
}
