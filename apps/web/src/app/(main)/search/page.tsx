'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, User, Hash, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '../../../components/layout/MainLayout';
import { PostCard } from '../../../components/feed/PostCard';
import { apiRequest } from '../../../lib/api';
import { PostItem, UserSummary, TrendingHashtagItem } from '@varta/shared';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState(initialType);

  useEffect(() => {
    setQuery(initialQuery);
    setActiveType(initialType);
  }, [initialQuery, initialType]);

  const { data, isLoading } = useQuery<{
    users: UserSummary[];
    posts: PostItem[];
    hashtags: TrendingHashtagItem[];
  }>({
    queryKey: ['search', query, activeType],
    queryFn: () =>
      apiRequest(
        `/explore/search?q=${encodeURIComponent(query)}&type=${activeType}&limit=30`,
      ),
    enabled: query.trim().length > 0,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${activeType}`);
    }
  };

  const handleTabChange = (type: string) => {
    setActiveType(type);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
    }
  };

  return (
    <MainLayout>
      {/* Top Search Bar */}
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A]">
        <div className="flex items-center gap-3 p-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#191F2B] text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, posts, hashtags..."
              className="w-full bg-[#11151D] border border-[#252D3A] focus:border-blue-500 rounded-full py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 outline-none"
            />
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-t border-[#252D3A]/60">
          {[
            { id: 'all', label: 'Top' },
            { id: 'posts', label: 'Posts' },
            { id: 'users', label: 'People' },
            { id: 'tags', label: 'Hashtags' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition relative ${
                activeType === tab.id
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {activeType === tab.id && (
                <div className="absolute bottom-0 inset-x-4 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="text-sm">Searching VARTA...</span>
          </div>
        ) : !query.trim() ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Enter a keyword, username, or #hashtag to discover discussions.
          </div>
        ) : (
          <>
            {/* Users Section */}
            {(activeType === 'all' || activeType === 'users') &&
              data?.users &&
              data.users.length > 0 && (
                <div className="border-b border-[#252D3A] p-4 flex flex-col gap-3">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    People
                  </h4>
                  <div className="flex flex-col gap-3">
                    {data.users.map((u) => (
                      <Link
                        key={u.id}
                        href={`/${u.username}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#11151D] transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-slate-100 flex items-center gap-1">
                              {u.displayName || u.username}
                              {u.isVerified && (
                                <CheckCircle size={14} className="text-blue-400 fill-blue-500/20" />
                              )}
                            </span>
                            <span className="text-xs text-slate-400">@{u.username}</span>
                            {u.bio && (
                              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                                {u.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            {/* Hashtags Section */}
            {(activeType === 'all' || activeType === 'tags') &&
              data?.hashtags &&
              data.hashtags.length > 0 && (
                <div className="border-b border-[#252D3A] p-4 flex flex-col gap-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Hashtags
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.hashtags.map((h) => (
                      <Link
                        key={h.id}
                        href={`/search?q=%23${h.tag}&type=posts`}
                        className="p-3 bg-[#11151D] hover:bg-[#191F2B] border border-[#252D3A] rounded-xl flex items-center justify-between transition"
                      >
                        <span className="font-semibold text-sm text-blue-400">
                          #{h.tag}
                        </span>
                        <span className="text-xs text-slate-400">
                          {h.usageCount} posts
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            {/* Posts Section */}
            {(activeType === 'all' || activeType === 'posts') &&
              data?.posts &&
              data.posts.length > 0 && (
                <div className="flex flex-col">
                  {data.posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

            {/* Empty Result */}
            {data?.users?.length === 0 &&
              data?.posts?.length === 0 &&
              data?.hashtags?.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No results found for &quot;{query}&quot;. Try searching with a different term.
                </div>
              )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="p-16 flex items-center justify-center text-xs text-slate-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        </MainLayout>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
