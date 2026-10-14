'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { useAuthStore } from '../../../stores/authStore';
import { RegisterSchema, RegisterDto } from '@varta/shared';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, isLoading } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterDto) => {
    if (!agreedTerms) {
      setErrorMessage('You must agree to the Terms of Service & Privacy Policy');
      return;
    }
    setErrorMessage(null);
    try {
      await registerAuth(data);
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#090B10] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11151D] border border-[#252D3A] rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <VartaLogo size={46} showText={true} showTagline={true} />
          <h1 className="text-2xl font-bold text-slate-100 mt-2">Create Your VARTA Account</h1>
          <p className="text-sm text-slate-400">
            Join the conversation with voices across India
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Display Name</label>
            <input
              type="text"
              {...register('displayName')}
              placeholder="e.g. Vikramaditya Rathore"
              className="bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
            {errors.displayName && (
              <span className="text-xs text-red-400">{errors.displayName.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input
                type="text"
                {...register('username')}
                placeholder="vikram_99"
                className="w-full bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition lowercase"
              />
            </div>
            {errors.username && (
              <span className="text-xs text-red-400">{errors.username.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              {...register('email')}
              placeholder="name@example.com"
              className="bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
            {errors.email && (
              <span className="text-xs text-red-400">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="At least 8 characters"
                className="w-full bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-xl pl-4 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-400">{errors.password.message}</span>
            )}
          </div>

          {/* Terms Agreement */}
          <label className="flex items-start gap-2.5 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 rounded bg-[#191F2B] border-[#252D3A] text-blue-600 focus:ring-0"
            />
            <span className="text-xs text-slate-400 leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-blue-400 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading || !agreedTerms}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered on VARTA?{' '}
          <Link href="/login" className="text-blue-400 hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
