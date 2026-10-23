'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  MessageSquare,
  Globe2,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { VartaLogo } from '../components/common/VartaLogo';
import { useAuthStore } from '../stores/authStore';

export default function SplashPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && user) {
      router.push('/home');
    }
  }, [user, isInitialized, router]);

  const valueProps = [
    {
      icon: MessageSquare,
      title: 'Real Conversations',
      desc: 'Authentic discussions with verified Indian thinkers and fellow citizens.',
    },
    {
      icon: Globe2,
      title: 'Multiple Languages',
      desc: 'Seamlessly express in English, Hindi, Gujarati, Tamil, Telugu, and more.',
    },
    {
      icon: TrendingUp,
      title: 'Trending Topics',
      desc: 'Real-time pulses on Indian tech, sports, business, space, and culture.',
    },
    {
      icon: Users,
      title: 'Communities',
      desc: 'Join circles dedicated to cricket, startups, cinema, travel, and food.',
    },
    {
      icon: Sparkles,
      title: 'Creators & Content',
      desc: 'High-quality photography, polls, video narratives, and thought threads.',
    },
    {
      icon: Shield,
      title: 'Safe & Positive Space',
      desc: 'Transparent algorithms with strict grievance redressal and civil discourse.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] flex flex-col justify-between text-slate-100 selection:bg-[#FF9933]">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <VartaLogo size={42} showText={true} showTagline={true} />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-[#FF9933] hover:bg-[#E68525] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#FF9933]/25 transition active:scale-95"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        {/* Large 3D Emblem Showcase */}
        <div className="mb-6 flex flex-col items-center">
          <img
            src="/varta-logo.png"
            alt="VARTA — Baat Sabki"
            className="h-32 sm:h-44 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/15 border border-[#FF9933]/30 text-[#FF9933] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles size={14} />
          India&apos;s Space for Conversations & Ideas
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Real People. <br className="hidden sm:inline" />
          <span className="text-[#FF9933]">Real Conversations.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          <strong className="text-white font-semibold">VARTA — Baat Sabki</strong> is
          India&apos;s premier social networking platform designed for authentic
          discourse, multilingual discussions, and local community trends.
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#FF9933] hover:bg-[#E68525] text-white text-base font-bold rounded-2xl shadow-xl shadow-[#FF9933]/30 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95"
          >
            <span>Create Account</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0B1422] hover:bg-[#101D2D] border border-[#1E293B] text-slate-200 hover:text-white text-base font-semibold rounded-2xl transition duration-200"
          >
            Sign In with Demo Account
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full text-left">
          {valueProps.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-3xl bg-[#0B1422] border border-[#1E293B] hover:border-[#FF9933]/40 transition group"
              >
                <div className="h-10 w-10 rounded-2xl bg-[#101D2D] flex items-center justify-center text-[#FF9933] mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-100 text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>© 2026 VARTA — Baat Sabki. Made for India.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-slate-200 transition">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-200 transition">Privacy Policy</Link>
          <Link href="/grievance" className="hover:text-slate-200 transition">Grievance Officer</Link>
        </div>
      </footer>
    </div>
  );
}
