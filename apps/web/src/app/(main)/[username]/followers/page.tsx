'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '../../../../components/layout/MainLayout';
import { apiRequest } from '../../../../lib/api';
import { UserSummary, PaginatedResponse } from '@varta/shared';

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const { data, isLoading } = useQuery<PaginatedResponse<UserSummary>>({
    queryKey: ['followers', username],
    queryFn: () => apiRequest(`/users/${username}/followers?limit=50`),
  });

  return (
    <MainLayout>
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A] px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-[#191F2B] text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-slate-100">Followers</h2>
          <span className="text-xs text-slate-400">@{username}</span>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[#252D3A]">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            <span>Loading followers...</span>
          </div>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((u) => (
            <Link
              key={u.id}
              href={`/${u.username}`}
              className="p-4 flex items-center justify-between hover:bg-[#11151D] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.username} className="h-full w-full object-cover" />
                  ) : (
                    u.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-100 flex items-center gap-1">
                    {u.displayName || u.username}
                    {u.isVerified && <CheckCircle size={14} className="text-blue-400 fill-blue-500/20" />}
                  </span>
                  <span className="text-xs text-slate-400">@{u.username}</span>
                  {u.bio && <p className="text-xs text-slate-300 truncate mt-0.5">{u.bio}</p>}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No followers yet.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
