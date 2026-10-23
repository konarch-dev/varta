'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '../../../components/layout/MainLayout';
import { PostCard } from '../../../components/feed/PostCard';
import { apiRequest } from '../../../lib/api';
import { PostItem, PaginatedResponse } from '@varta/shared';

export default function BookmarksPage() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<PostItem>>({
    queryKey: ['bookmarks'],
    queryFn: () => apiRequest('/feed/bookmarks?limit=30'),
  });

  return (
    <MainLayout>
      <div className="sticky top-0 z-30 bg-[#050B14]/90 backdrop-blur-md border-b border-[#1E293B] px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-[#101D2D] text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-base font-extrabold text-white flex items-center gap-2">
            <Bookmark size={18} className="text-[#FF9933] fill-[#FF9933]" />
            Bookmarks
          </h1>
          <span className="text-xs text-slate-400">
            {data?.items?.length || 0} saved posts (private to you)
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-[#FF9933]" />
            <span>Loading bookmarks...</span>
          </div>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={() => refetch()}
            />
          ))
        ) : (
          <div className="p-16 text-center flex flex-col items-center gap-2 text-slate-400">
            <Bookmark size={36} className="text-slate-600 mb-1" />
            <h3 className="font-bold text-slate-300 text-base">Save posts for later</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Don&apos;t let the best conversations slip away. Bookmark posts to easily find them again.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
