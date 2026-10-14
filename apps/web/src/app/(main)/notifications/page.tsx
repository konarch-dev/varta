'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Repeat2,
  MessageCircle,
  UserPlus,
  Mail,
  ShieldAlert,
  CheckCheck,
  Loader2,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { NotificationItem, PaginatedResponse, NotificationType } from '@varta/shared';
import { formatTimeAgo } from '../../../lib/utils';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<NotificationItem>>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications?limit=40'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('/notifications/mark-all-read', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return <Heart size={18} className="text-red-500 fill-red-500 shrink-0" />;
      case NotificationType.REPOST:
        return <Repeat2 size={18} className="text-green-500 shrink-0" />;
      case NotificationType.REPLY:
        return <MessageCircle size={18} className="text-blue-400 shrink-0" />;
      case NotificationType.FOLLOW:
      case NotificationType.FOLLOW_ACCEPTED:
      case NotificationType.FOLLOW_REQUEST:
        return <UserPlus size={18} className="text-indigo-400 shrink-0" />;
      case NotificationType.DIRECT_MESSAGE:
        return <Mail size={18} className="text-purple-400 shrink-0" />;
      default:
        return <ShieldAlert size={18} className="text-yellow-400 shrink-0" />;
    }
  };

  const filteredItems = data?.items?.filter((n) => {
    if (activeTab === 'mentions') {
      return n.type === NotificationType.MENTION || n.type === NotificationType.REPLY;
    }
    return true;
  });

  return (
    <MainLayout>
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bell size={20} className="text-blue-400" />
            Notifications
          </h2>
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            title="Mark all notifications as read"
          >
            <CheckCheck size={16} />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#252D3A]/60">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-semibold transition relative ${
              activeTab === 'all' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
            {activeTab === 'all' && (
              <div className="absolute bottom-0 inset-x-8 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mentions')}
            className={`flex-1 py-3 text-sm font-semibold transition relative ${
              activeTab === 'mentions' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mentions & Replies
            {activeTab === 'mentions' && (
              <div className="absolute bottom-0 inset-x-8 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col divide-y divide-[#252D3A]">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          filteredItems.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.entityId) {
                  if (n.type === NotificationType.DIRECT_MESSAGE) {
                    router.push(`/messages?id=${n.entityId}`);
                  } else if (n.type === NotificationType.FOLLOW) {
                    router.push(`/${n.actor.username}`);
                  } else {
                    router.push(`/post/${n.entityId}`);
                  }
                }
              }}
              className={`p-4 flex items-start gap-3.5 hover:bg-[#11151D] transition cursor-pointer ${
                !n.isRead ? 'bg-[#11151D]/60' : ''
              }`}
            >
              <div className="mt-0.5">{getNotificationIcon(n.type)}</div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${n.actor.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0"
                  >
                    {n.actor.avatarUrl ? (
                      <img src={n.actor.avatarUrl} alt={n.actor.username} className="h-full w-full object-cover" />
                    ) : (
                      n.actor.username.charAt(0).toUpperCase()
                    )}
                  </Link>

                  <div className="flex items-center gap-1.5 min-w-0 text-xs">
                    <Link
                      href={`/${n.actor.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-slate-100 hover:underline truncate"
                    >
                      {n.actor.displayName || n.actor.username}
                    </Link>
                    <span className="text-slate-400">{n.message}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500 shrink-0">{formatTimeAgo(n.createdAt)}</span>
                  </div>
                </div>

                {n.postSnippet && (
                  <p className="text-xs text-slate-300 mt-1 pl-10 line-clamp-2">
                    &ldquo;{n.postSnippet}&rdquo;
                  </p>
                )}
              </div>

              {!n.isRead && (
                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        ) : (
          <div className="p-16 text-center flex flex-col items-center gap-2 text-slate-400">
            <Bell size={32} className="text-slate-600 mb-1" />
            <h3 className="font-bold text-slate-300 text-base">All caught up!</h3>
            <p className="text-xs text-slate-500">
              New likes, reposts, follows, and mentions will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
