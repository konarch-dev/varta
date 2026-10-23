'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  MoreHorizontal,
  Shield,
  Loader2,
  EyeOff,
  Flag,
  Share2,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { UserSummary } from '@varta/shared';

interface TrendingItem {
  id: string | number;
  rank: number;
  tag: string;
  category: string;
  posts: string;
  thumb: string;
}

export const RightSidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [pendingFollow, setPendingFollow] = useState<Record<string, boolean>>({});
  const [activeMenuTrendId, setActiveMenuTrendId] = useState<string | number | null>(null);
  const [hiddenTrendIds, setHiddenTrendIds] = useState<Set<string | number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuTrendId(null);
      }
    };
    if (activeMenuTrendId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuTrendId]);

  // Query live recommended users
  const { data: recommendedUsers } = useQuery<UserSummary[]>({
    queryKey: ['who-to-follow-sidebar'],
    queryFn: () => apiRequest('/explore/who-to-follow?limit=5'),
  });

  const toggleFollow = async (e: React.MouseEvent, username: string, initialFollowing: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    const currentFollowing = followingStates[username] ?? initialFollowing;
    const isNowFollowing = !currentFollowing;

    setPendingFollow((prev) => ({ ...prev, [username]: true }));
    setFollowingStates((prev) => ({
      ...prev,
      [username]: isNowFollowing,
    }));

    try {
      await apiRequest(`/social/follow/${username}`, {
        method: currentFollowing ? 'DELETE' : 'POST',
      });
      queryClient.invalidateQueries({ queryKey: ['who-to-follow-sidebar'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['who-to-follow-explore'] });
    } catch (err) {
      // Revert on error
      setFollowingStates((prev) => ({
        ...prev,
        [username]: currentFollowing,
      }));
    } finally {
      setPendingFollow((prev) => ({ ...prev, [username]: false }));
    }
  };

  const defaultTrendingItems: TrendingItem[] = [
    {
      id: 1,
      rank: 1,
      tag: '#WorldCup2026',
      category: 'Sports · Trending',
      posts: '45.2K posts',
      thumb: '/assets/trend-cricket.jpg',
    },
    {
      id: 2,
      rank: 2,
      tag: '#ISRO',
      category: 'Technology · Trending',
      posts: '32.1K posts',
      thumb: '/assets/trend-isro.jpg',
    },
    {
      id: 3,
      rank: 3,
      tag: '#NewIndia',
      category: 'Politics · Trending',
      posts: '28.4K posts',
      thumb: '/assets/trend-flag.jpg',
    },
    {
      id: 4,
      rank: 4,
      tag: '#ElectricVehicles',
      category: 'Business · Trending',
      posts: '18.9K posts',
      thumb: '/assets/trend-ev.jpg',
    },
    {
      id: 5,
      rank: 5,
      tag: '#IncredibleIndia',
      category: 'Travel · Trending',
      posts: '25.3K posts',
      thumb: '/assets/trend-taj.jpg',
    },
  ];

  const visibleTrendingItems = defaultTrendingItems.filter((t) => !hiddenTrendIds.has(t.id));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleHideTrend = (id: string | number) => {
    setHiddenTrendIds((prev) => new Set([...prev, id]));
    setActiveMenuTrendId(null);
    showToast('Trend hidden from your feed');
  };

  const handleCopyTrend = (tag: string) => {
    setActiveMenuTrendId(null);
    if (typeof window !== 'undefined') {
      const searchUrl = `${window.location.origin}/search?q=${encodeURIComponent(tag)}`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(searchUrl)
          .then(() => showToast(`Copied link to ${tag}`))
          .catch(() => showToast(`Search link: ${tag}`));
      } else {
        showToast(`Search: ${tag}`);
      }
    }
  };

  const defaultMockFollow: UserSummary[] = [
    {
      id: 'varta_official',
      displayName: 'VARTA Official IN',
      username: 'varta_official',
      bio: 'Official handle of VARTA. Baat Sabki 🇮🇳',
      avatarUrl: '/assets/varta-logo.png',
      isVerified: true,
      isPrivate: false,
      isFollowing: false,
    },
    {
      id: 'aarav_sharma',
      displayName: 'Aarav Sharma',
      username: 'aarav_sharma',
      bio: 'Fullstack Dev & Open Source enthusiast',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      isVerified: true,
      isPrivate: false,
      isFollowing: false,
    },
    {
      id: 'aditya_chopra',
      displayName: 'Aditya Chopra 🎬',
      username: 'aditya_chopra',
      bio: 'Filmmaker, storyteller, chronicling Indian cinema.',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      isVerified: true,
      isPrivate: false,
      isFollowing: false,
    },
  ];

  const whoToFollow =
    recommendedUsers && recommendedUsers.length > 0
      ? recommendedUsers.slice(0, 4)
      : defaultMockFollow;

  return (
    <aside className="sticky top-0 h-screen w-80 xl:w-[350px] hidden lg:flex flex-col gap-4 py-4 px-4 overflow-y-auto border-l border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#050B14] select-none scrollbar-thin">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FF9933] text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check size={14} strokeWidth={3} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Promotional / Welcome Hero Card for logged-out visitors */}
      {!user && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 dark:border-[#1E293B] bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white dark:from-[#0B1422] dark:via-[#0E1A2B] dark:to-[#101D2D] p-5 shadow-xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF9933]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#138808]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Real People <br />
              <span className="text-[#FF9933]">Real Conversations</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">Join millions on VARTA</p>
            <Link
              href="/register"
              className="mt-2 w-fit px-5 py-2 rounded-xl bg-[#FF9933] hover:bg-[#E68525] text-white font-bold text-sm shadow-md shadow-[#FF9933]/25 transition cursor-pointer"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* 2. What's Happening in India */}
      <div className="rounded-3xl border border-slate-200 dark:border-[#1E293B] bg-slate-50/80 dark:bg-[#0B1422] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">What&apos;s happening in India</h3>
          <Link
            href="/explore"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#FF9933] transition"
          >
            See more
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-slate-200 dark:divide-[#1E293B]/60 relative">
          {visibleTrendingItems.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-200/50 dark:hover:bg-[#101D2D]/60 -mx-2 px-2 rounded-xl transition relative"
              onClick={() => router.push(`/search?q=${encodeURIComponent(item.tag)}`)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
                  {item.rank}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#FF9933] transition truncate">
                    {item.tag}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {item.posts}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="h-10 w-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B]/80 shrink-0">
                  <img
                    src={item.thumb}
                    alt={item.tag}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* More options button with interactive popup */}
                <div className="relative">
                  <button
                    type="button"
                    title="More options"
                    aria-label="More options"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveMenuTrendId(activeMenuTrendId === item.id ? null : item.id);
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#101D2D] rounded-full p-1.5 transition cursor-pointer"
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {/* Contextual Options Dropdown */}
                  {activeMenuTrendId === item.id && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-50 w-52 bg-white dark:bg-[#0E1A2B] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <button
                        type="button"
                        onClick={() => handleHideTrend(item.id)}
                        className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-[#101D2D] text-left transition cursor-pointer text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                      >
                        <EyeOff size={14} className="text-slate-400" />
                        <span>Not interested in this</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHideTrend(item.id)}
                        className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-[#101D2D] text-left transition cursor-pointer text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Flag size={14} className="text-slate-400" />
                        <span>This trend is spam</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyTrend(item.tag)}
                        className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-[#101D2D] text-left transition cursor-pointer text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Share2 size={14} className="text-slate-400" />
                        <span>Copy link to trend</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {visibleTrendingItems.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              <span>All trends hidden. </span>
              <button
                type="button"
                onClick={() => setHiddenTrendIds(new Set())}
                className="text-[#FF9933] underline hover:text-white ml-1 font-semibold"
              >
                Reset trends
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Who to Follow */}
      <div className="rounded-3xl border border-slate-200 dark:border-[#1E293B] bg-slate-50/80 dark:bg-[#0B1422] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Who to follow</h3>
          <Link
            href="/search?type=users"
            className="text-xs font-semibold text-[#FF9933] hover:underline transition"
          >
            See more
          </Link>
        </div>

        <div className="flex flex-col gap-3.5">
          {whoToFollow.map((account) => {
            const isFollowing =
              followingStates[account.username] ?? account.isFollowing ?? false;
            const isPending = pendingFollow[account.username] ?? false;

            return (
              <div
                key={account.id}
                className="flex items-center justify-between gap-2 group/card"
              >
                <Link
                  href={`/${account.username}`}
                  className="flex items-center gap-2.5 overflow-hidden group min-w-0"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-[#101D2D] flex items-center justify-center font-bold shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-[#1E293B]">
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt={account.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[#FF9933] text-sm">
                        {account.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden leading-snug">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#FF9933] transition truncate flex items-center gap-1">
                      {account.displayName}
                      {account.isVerified && (
                        <CheckCircle
                          size={14}
                          className="text-[#FF9933] fill-[#FF9933]/20 shrink-0"
                        />
                      )}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      @{account.username}
                    </span>
                    {account.bio && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {account.bio}
                      </span>
                    )}
                  </div>
                </Link>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={(e) => toggleFollow(e, account.username, isFollowing)}
                  className={`group/btn py-1.5 px-4 rounded-full text-xs font-bold transition shrink-0 active:scale-95 cursor-pointer flex items-center justify-center min-w-[84px] ${
                    isFollowing
                      ? 'bg-transparent border border-slate-300 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-red-500/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                      : 'bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black shadow-sm'
                  }`}
                >
                  {isPending ? (
                    <Loader2 size={13} className="animate-spin text-[#FF9933]" />
                  ) : isFollowing ? (
                    <>
                      <span className="group-hover/btn:hidden">Following</span>
                      <span className="hidden group-hover/btn:inline text-red-500 dark:text-red-400">Unfollow</span>
                    </>
                  ) : (
                    'Follow'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>


      {/* Compliance & Footer */}
      <footer className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 px-2 pt-2">
        <Link href="/settings#terms" className="hover:underline hover:text-slate-300">Terms</Link>
        <Link href="/settings#privacy" className="hover:underline hover:text-slate-300">Privacy</Link>
        <Link href="/settings#cookies" className="hover:underline hover:text-slate-300">Cookies</Link>
        <Link href="/settings#grievance" className="hover:underline flex items-center gap-1 text-slate-500 hover:text-slate-300">
          <Shield size={11} className="text-[#FF9933]" />
          Grievance
        </Link>
        <span>© 2026 VARTA — Baat Sabki</span>
      </footer>
    </aside>
  );
};
