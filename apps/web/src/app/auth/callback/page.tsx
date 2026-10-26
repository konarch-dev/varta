'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { setApiToken } from '../../../lib/api';
import { GoogleIcon } from '../../../components/auth/GoogleAuthModal';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initAuth } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token received from Google callback.');
      return;
    }

    // Save token and initialize session
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('varta_token', token);
      }
      setApiToken(token);

      initAuth()
        .then(() => {
          setStatus('success');
          setTimeout(() => {
            router.replace('/home');
          }, 800);
        })
        .catch(() => {
          setStatus('error');
          setErrorMessage('Failed to initialize user session with Google token.');
        });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during authentication.');
    }
  }, [searchParams, initAuth, router]);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 shadow-xs">
        <GoogleIcon className="w-7 h-7" />
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Signing you in with Google
          </h2>
          <p className="text-xs text-slate-500">
            Please wait while we set up your VARTA session...
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#FF5722] font-semibold">
            <Loader2 size={20} className="animate-spin" />
            <span>Authenticating...</span>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome to VARTA!
          </h2>
          <p className="text-xs text-slate-500">
            Google authentication successful. Redirecting you home...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Authentication Failed
          </h2>
          <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-xl p-3 w-full">
            {errorMessage}
          </p>
          <Link
            href="/login"
            className="mt-3 w-full py-3 rounded-2xl bg-[#FF5722] hover:bg-[#E64A19] text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center"
          >
            Return to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Loader2 size={20} className="animate-spin text-[#FF5722]" />
            <span>Loading authentication...</span>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
