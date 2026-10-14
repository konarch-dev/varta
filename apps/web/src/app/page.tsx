'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Shield, Users, MessageSquare } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#090B10] flex flex-col justify-between text-slate-100 selection:bg-blue-600">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <VartaLogo size={42} showText={true} showTagline={true} />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition active:scale-95"
          >
            Join VARTA
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles size={14} />
          The Voice of Modern India
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 max-w-4xl leading-tight">
          Where India Connects, Debates, and Speaks.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          <strong className="text-blue-400 font-semibold">VARTA — Baat Sabki</strong> is the premier microblogging network designed for Indian creators, thinkers, and communities. Zero noise, authentic dialogue.
        </p>

        {/* CTA Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95"
          >
            <span>Create Account</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/explore"
            className="w-full sm:w-auto px-8 py-4 bg-[#11151D] hover:bg-[#191F2B] border border-[#252D3A] text-slate-200 text-base font-semibold rounded-2xl transition"
          >
            Explore Trending Topics
          </Link>
        </div>

        {/* Value Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 bg-[#11151D]/70 border border-[#252D3A] rounded-2xl flex flex-col gap-3">
            <div className="p-3 w-fit bg-blue-500/10 rounded-xl text-blue-400">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Nuanced Microblogging</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Threaded discussions, polls, media previews, and support for India&apos;s linguistic diversity.
            </p>
          </div>

          <div className="p-6 bg-[#11151D]/70 border border-[#252D3A] rounded-2xl flex flex-col gap-3">
            <div className="p-3 w-fit bg-purple-500/10 rounded-xl text-purple-400">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Transparent Feeds</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Chronological Following timelines alongside open, engagement-scored For You discovery feeds.
            </p>
          </div>

          <div className="p-6 bg-[#11151D]/70 border border-[#252D3A] rounded-2xl flex flex-col gap-3">
            <div className="p-3 w-fit bg-emerald-500/10 rounded-xl text-emerald-400">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Grievance & Trust</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Compliant with Indian Intermediary Guidelines with dedicated grievance redressal and audit transparency.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#252D3A] py-6 px-6 text-center text-xs text-slate-400 flex flex-wrap justify-center gap-6">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/grievance" className="hover:underline">Grievance Redressal</Link>
        <span>© 2026 VARTA — Baat Sabki. All rights reserved.</span>
      </footer>
    </div>
  );
}
