'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, UserPlus, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

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

const PRESET_ACCOUNTS = [
  {
    displayName: 'Priya Patel',
    email: 'priya.patel@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    googleId: 'g_1092837461928301',
  },
  {
    displayName: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    googleId: 'g_1092837461928302',
  },
  {
    displayName: 'Ananya Verma',
    email: 'ananya.verma.tech@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    googleId: 'g_1092837461928303',
  },
];

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function GoogleAuthModal({
  isOpen,
  onClose,
  title = 'Sign in with Google',
}: GoogleAuthModalProps) {
  const router = useRouter();
  const { googleAuth } = useAuthStore();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Google Account state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  if (!isOpen) return null;

  const handleSelectAccount = async (account: {
    displayName: string;
    email: string;
    avatarUrl?: string;
    googleId?: string;
  }) => {
    setSelectedEmail(account.email);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await googleAuth({
        displayName: account.displayName,
        email: account.email,
        avatarUrl: account.avatarUrl,
        googleId: account.googleId,
      });
      onClose();
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed');
      setIsSubmitting(false);
      setSelectedEmail(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      setErrorMessage('Please provide your Google name and email address');
      return;
    }
    if (!customEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address');
      return;
    }

    handleSelectAccount({
      displayName: customName.trim(),
      email: customEmail.trim().toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        customName.trim()
      )}`,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Top close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Google Header */}
        <div className="flex flex-col items-center text-center pt-2 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-xs border border-slate-100 mb-3">
            <GoogleIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            to continue to <strong className="text-slate-800">VARTA</strong>
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Section */}
        {isCustomMode ? (
          /* Custom Google Account Form */
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(false);
                  setErrorMessage(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                title="Back to accounts"
              >
                <ArrowLeft size={16} />
              </button>
              <span>Enter your Google Account details</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">Full Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">Google Email</label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <span>Continue with Google</span>
              )}
            </button>
          </form>
        ) : (
          /* Preset Accounts List */
          <div className="flex flex-col gap-1.5 py-3">
            <span className="text-[11px] font-semibold text-slate-500 px-1 mb-0.5">
              Choose an account
            </span>

            {PRESET_ACCOUNTS.map((acc) => {
              const isSelected = selectedEmail === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelectAccount(acc)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-left cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.displayName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {acc.displayName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium truncate">
                        {acc.email}
                      </span>
                    </div>
                  </div>

                  {isSelected && isSubmitting ? (
                    <Loader2 size={18} className="animate-spin text-[#4285F4] shrink-0 mr-1" />
                  ) : (
                    <span className="text-xs text-[#4285F4] font-semibold shrink-0 opacity-0 group-hover:opacity-100">
                      Sign in
                    </span>
                  )}
                </button>
              );
            })}

            {/* Use Another Account Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsCustomMode(true);
                setErrorMessage(null);
              }}
              className="w-full mt-1 flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer text-slate-700"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <UserPlus size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">
                  Use another Google account
                </span>
                <span className="text-[11px] text-slate-500">
                  Enter your own Gmail / Google Workspace address
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed text-center">
          To continue, Google will share your name, email address, language preference, and profile
          picture with VARTA.
        </div>
      </div>
    </div>
  );
}
