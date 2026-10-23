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

  const { data, isLoading } = useQuery<PaginatedResponse<NotificationItem>>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications?limit=40'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('/notifications/mark-all-read', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return <Heart size={18} className="text-[#FF9933] fill-[#FF9933] shrink-0" />;
      case NotificationType.REPOST:
        return <Repeat2 size={18} className="text-[#00C853] shrink-0" />;
      case NotificationType.REPLY:
        return <MessageCircle size={18} className="text-[#38BDF8] shrink-0" />;
      case NotificationType.FOLLOW:
      case NotificationType.FOLLOW_ACCEPTED:
      case NotificationType.FOLLOW_REQUEST:
        return <UserPlus size={18} className="text-purple-400 shrink-0" />;
      case NotificationType.DIRECT_MESSAGE:
        return <Mail size={18} className="text-[#FF9933] shrink-0" />;
      default:
        return <ShieldAlert size={18} className="text-yellow-400 shrink-0" />;
    }
  };

  // Demo showcase notifications matching mockup
  const fallbackNotifications = [
    {
      id: 'n1',
      type: NotificationType.LIKE,
      message: 'liked your post',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      actor: {
        id: 'u-amit',
        username: 'amitpatel',
        displayName: 'Amit Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      },
      postSnippet: 'Varanasi at sunrise is pure magic! ✨ India’s heritage and culture...',
    },
    {
      id: 'n2',
      type: NotificationType.REPOST,
      message: 'reposted your post',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      actor: {
        id: 'u-neha',
        username: 'nehasingh',
        displayName: 'Neha Singh',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
      },
      postSnippet: 'India is not just a place, it’s a feeling. Mountains, people, food...',
    },
    {
      id: 'n3',
      type: NotificationType.FOLLOW,
      message: 'started following you',
      isRead: true,
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      actor: {
        id: 'u-tech',
        username: 'techindia',
        displayName: 'Tech India',
        avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop',
      },
    },
    {
      id: 'n4',
      type: NotificationType.REPLY,
      message: 'commented: "Great perspective!"',
      isRead: true,
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      actor: {
        id: 'u-vikas',
        username: 'vikaskumar',
        displayName: 'Vikas Kumar',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
      },
    },
  ];

  const items =
    data?.items && data.items.length > 0 ? data.items : fallbackNotifications;

  const filteredItems = items.filter((n: any) => {
    if (activeTab === 'mentions') {
      return n.type === NotificationType.MENTION || n.type === NotificationType.REPLY;
    }
    return true;
  });

  return (
    <MainLayout>
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#050B14]/90 backdrop-blur-md border-b border-[#1E293B]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Bell size={20} className="text-[#FF9933]" />
            Notifications
          </h1>
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#FF9933] hover:text-[#E68525] transition"
            title="Mark all notifications as read"
          >
            <CheckCheck size={16} />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#1E293B]/60">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-semibold transition relative ${
              activeTab === 'all'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
            {activeTab === 'all' && (
              <div className="absolute bottom-0 inset-x-8 h-0.5 bg-[#FF9933] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mentions')}
            className={`flex-1 py-3 text-sm font-semibold transition relative ${
              activeTab === 'mentions'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mentions & Replies
            {activeTab === 'mentions' && (
              <div className="absolute bottom-0 inset-x-8 h-0.5 bg-[#FF9933] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col divide-y divide-[#1E293B]">
        {isLoading && items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-[#FF9933]" />
            <span>Loading notifications...</span>
          </div>
        ) : (
          filteredItems.map((n: any) => (
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
              className={`p-4 flex items-start gap-3.5 hover:bg-[#0B1422] transition cursor-pointer ${
                !n.isRead ? 'bg-[#0B1422]/60' : ''
              }`}
            >
              <div className="mt-0.5">{getNotificationIcon(n.type)}</div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/${n.actor.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 w-9 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden shrink-0"
                  >
                    {n.actor.avatarUrl ? (
                      <img
                        src={n.actor.avatarUrl}
                        alt={n.actor.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      n.actor.username.charAt(0).toUpperCase()
                    )}
                  </Link>

                  <div className="flex items-center gap-1.5 min-w-0 text-xs">
                    <Link
                      href={`/${n.actor.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-slate-100 hover:text-[#FF9933] truncate"
                    >
                      {n.actor.displayName || n.actor.username}
                    </Link>
                    <span className="text-slate-400">{n.message}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500 shrink-0">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {n.postSnippet && (
                  <p className="text-xs text-slate-300 mt-1 pl-11 line-clamp-2">
                    &ldquo;{n.postSnippet}&rdquo;
                  </p>
                )}
              </div>

              {!n.isRead && (
                <div className="h-2 w-2 rounded-full bg-[#FF9933] shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
