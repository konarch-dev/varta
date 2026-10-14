'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { VartaLogo } from '../../../components/common/VartaLogo';
import { useAuthStore } from '../../../stores/authStore';
import { LoginSchema, LoginDto } from '@varta/shared';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginDto) => {
    setErrorMessage(null);
    try {
      await login(data);
      router.push('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password');
    }
  };

  const fillDemoAccount = (username: string) => {
    setValue('identifier', username);
    setValue('password', 'Varta@2026Secure!');
  };

  return (
    <div className="min-h-screen bg-[#090B10] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11151D] border border-[#252D3A] rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <VartaLogo size={46} showText={true} showTagline={true} />
          <h1 className="text-2xl font-bold text-slate-100 mt-3">Welcome Back</h1>
          <p className="text-sm text-slate-400">
            Sign in to your VARTA account to continue
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Username or Email
            </label>
            <input
              type="text"
              {...register('identifier')}
              placeholder="e.g. aarav_sharma or admin@varta.in"
              className="bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
            {errors.identifier && (
              <span className="text-xs text-red-400">{errors.identifier.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter your password"
                className="w-full bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Fast Fill Section */}
        <div className="pt-2 border-t border-[#252D3A]/60 flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles size={12} className="text-blue-400" />
            Quick Demo Login (One Click)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('aarav_sharma')}
              className="px-3 py-2 bg-[#191F2B] hover:bg-[#252D3A] border border-[#252D3A] rounded-xl text-xs text-slate-300 text-left transition truncate"
            >
              🧑‍💻 @aarav_sharma
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('varta_official')}
              className="px-3 py-2 bg-[#191F2B] hover:bg-[#252D3A] border border-[#252D3A] rounded-xl text-xs text-blue-300 text-left transition truncate font-medium"
            >
              🛡️ @varta_official (Admin)
            </button>
          </div>
        </div>

        {/* Sign up prompt */}
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:underline font-bold">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
