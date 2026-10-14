'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { TrendingHashtagItem, UserSummary } from '@varta/shared';

export const RightSidebar: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trending } = useQuery<TrendingHashtagItem[]>({
    queryKey: ['trending'],
    queryFn: () => apiRequest('/explore/trending?limit=5'),
  });

  const { data: whoToFollow, refetch: refetchWhoToFollow } = useQuery<UserSummary[]>({
    queryKey: ['who-to-follow'],
    queryFn: () => apiRequest('/explore/who-to-follow?limit=3'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFollow = async (username: string) => {
    try {
      await apiRequest(`/social/follow/${username}`, { method: 'POST' });
      refetchWhoToFollow();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="sticky top-0 h-screen w-80 xl:w-96 hidden lg:flex flex-col gap-5 py-4 px-4 overflow-y-auto border-l border-[#252D3A] bg-[#090B10]/80 backdrop-blur-md">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search VARTA, #hashtags, people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#11151D] border border-[#252D3A] focus:border-blue-500 rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-400 outline-none transition"
        />
      </form>

      {/* Trending Section */}
      <div className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" />
            Trending in India
          </h3>
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
            Live
          </span>
        </div>

        <div className="flex flex-col divide-y divide-[#252D3A]/50">
          {(trending && trending.length > 0) ? (
            trending.map((tag, idx) => (
              <Link
                key={tag.id || idx}
                href={`/search?q=%23${tag.tag}&type=tags`}
                className="py-2.5 hover:bg-[#191F2B]/50 -mx-2 px-2 rounded-lg transition flex flex-col group"
              >
                <span className="text-xs text-slate-400">
                  Trending #{idx + 1} • Discourse
                </span>
                <span className="font-semibold text-slate-100 group-hover:text-blue-400 transition">
                  #{tag.tag}
                </span>
                <span className="text-xs text-slate-500">
                  {tag.usageCount.toLocaleString('en-IN')} posts
                </span>
              </Link>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Gathering trending conversations...
            </div>
          )}
        </div>
      </div>

      {/* Who To Follow */}
      <div className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="font-bold text-base text-slate-100">Recommended for You</h3>
        <div className="flex flex-col gap-3">
          {(whoToFollow && whoToFollow.length > 0) ? (
            whoToFollow.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between gap-2"
              >
                <Link
                  href={`/${account.username}`}
                  className="flex items-center gap-2.5 overflow-hidden group"
                >
                  <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold shrink-0 overflow-hidden ring-1 ring-blue-500/20">
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt={account.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      account.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition truncate flex items-center gap-1">
                      {account.displayName || account.username}
                      {account.isVerified && (
                        <CheckCircle size={14} className="text-blue-400 shrink-0 fill-blue-500/20" />
                      )}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      @{account.username}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => handleFollow(account.username)}
                  className="py-1.5 px-3.5 bg-slate-100 hover:bg-white text-slate-900 rounded-full text-xs font-bold transition shrink-0 active:scale-95"
                >
                  Follow
                </button>
              </div>
            ))
          ) : (
            <div className="py-3 text-center text-xs text-slate-400">
              No recommendations available
            </div>
          )}
        </div>
      </div>

      {/* Indian Intermediary Compliance & Footer */}
      <footer className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1.5 px-2">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/grievance" className="hover:underline flex items-center gap-1 text-slate-400 hover:text-slate-200">
          <Shield size={12} className="text-blue-400" />
          Grievance Redressal
        </Link>
        <span>© 2026 VARTA — Baat Sabki</span>
      </footer>
    </aside>
  );
};
