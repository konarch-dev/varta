'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Sparkles, Hash, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { TrendingHashtagItem, UserSummary } from '@varta/shared';

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trending, isLoading: isTrendingLoading } = useQuery<TrendingHashtagItem[]>({
    queryKey: ['trending-all'],
    queryFn: () => apiRequest('/explore/trending?limit=15'),
  });

  const { data: whoToFollow } = useQuery<UserSummary[]>({
    queryKey: ['who-to-follow-explore'],
    queryFn: () => apiRequest('/explore/who-to-follow?limit=5'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <MainLayout>
      {/* Sticky Top Search Header */}
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A] p-3.5">
        <form onSubmit={handleSearch} className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search keywords, #hashtags, @users on VARTA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#11151D] border border-[#252D3A] focus:border-blue-500 rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-400 outline-none transition"
          />
        </form>
      </div>

      {/* Featured Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border-b border-[#252D3A] flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
          <Sparkles size={14} /> Spotlight
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100">
          Discourse Shaping Bharat 🇮🇳
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
          Dive into trending debates, tech innovation in Bengaluru, cricket analysis, and cultural conversations.
        </p>
      </div>

      {/* Trending Topics List */}
      <div className="p-4 border-b border-[#252D3A]">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-blue-400" />
          Popular Conversations
        </h3>

        {isTrendingLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading trending topics...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trending?.map((item, idx) => (
              <Link
                key={item.id}
                href={`/search?q=%23${item.tag}&type=tags`}
                className="p-3 bg-[#11151D] hover:bg-[#191F2B] border border-[#252D3A] rounded-xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition shrink-0">
                    <Hash size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition truncate">
                      #{item.tag}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.usageCount.toLocaleString('en-IN')} Baatein
                    </span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-slate-300 transition shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Voices */}
      <div className="p-4">
        <h3 className="font-bold text-base text-slate-100 mb-3">
          Creators & Leaders to Follow
        </h3>
        <div className="flex flex-col divide-y divide-[#252D3A]">
          {whoToFollow?.map((acc) => (
            <div key={acc.id} className="py-3 flex items-center justify-between gap-3">
              <Link href={`/${acc.username}`} className="flex items-center gap-3 min-w-0 group">
                <div className="h-11 w-11 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0">
                  {acc.avatarUrl ? (
                    <img src={acc.avatarUrl} alt={acc.username} className="h-full w-full object-cover" />
                  ) : (
                    acc.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition flex items-center gap-1 truncate">
                    {acc.displayName || acc.username}
                    {acc.isVerified && <CheckCircle size={14} className="text-blue-400 fill-blue-500/20" />}
                  </span>
                  <span className="text-xs text-slate-400 truncate">@{acc.username}</span>
                  {acc.bio && <p className="text-xs text-slate-300 truncate mt-0.5">{acc.bio}</p>}
                </div>
              </Link>

              <Link
                href={`/${acc.username}`}
                className="py-1.5 px-4 bg-slate-100 hover:bg-white text-slate-900 rounded-full text-xs font-bold transition shrink-0"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
