'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Sparkles, Users, RefreshCw } from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { PostComposer } from '../../../components/feed/PostComposer';
import { PostCard } from '../../../components/feed/PostCard';
import { apiRequest } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { PostItem, PaginatedResponse } from '@varta/shared';

export default function HomePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<PaginatedResponse<PostItem>>({
    queryKey: ['feed', activeTab],
    queryFn: () =>
      apiRequest(
        activeTab === 'for-you' ? '/feed/for-you?limit=30' : '/feed/following?limit=30',
      ),
  });

  return (
    <MainLayout>
      {/* Sticky Header with Feed Tabs */}
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold text-slate-100">Home</h2>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1.5 rounded-full hover:bg-[#191F2B] text-slate-400 hover:text-white transition"
            title="Refresh feed"
          >
            <RefreshCw
              size={18}
              className={isRefetching ? 'animate-spin text-blue-400' : ''}
            />
          </button>
        </div>

        <div className="flex border-t border-[#252D3A]/60">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`flex-1 py-3 text-sm font-semibold transition relative flex items-center justify-center gap-2 ${
              activeTab === 'for-you'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#11151D]/50'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'for-you' ? 'text-blue-400' : ''} />
            <span>For You</span>
            {activeTab === 'for-you' && (
              <div className="absolute bottom-0 h-1 w-16 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-sm font-semibold transition relative flex items-center justify-center gap-2 ${
              activeTab === 'following'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#11151D]/50'
            }`}
          >
            <Users size={16} className={activeTab === 'following' ? 'text-blue-400' : ''} />
            <span>Following</span>
            {activeTab === 'following' && (
              <div className="absolute bottom-0 h-1 w-16 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Top Composer for Authenticated Users */}
      {user && (
        <div className="p-4 border-b border-[#252D3A]">
          <PostComposer />
        </div>
      )}

      {/* Feed Content */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <span className="text-sm">Curating your timeline...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">
            Failed to load timeline. Please verify your connection or try again.
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
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#11151D] border border-[#252D3A] flex items-center justify-center text-slate-400">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-slate-200 text-base">Timeline is quiet</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {activeTab === 'following'
                ? 'Accounts you follow will appear here. Find creators and friends in Explore.'
                : 'Be the first to share your voice and spark discourse on VARTA!'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
