'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Repeat2,
  MessageCircle,
  Bookmark,
  Share,
  MoreHorizontal,
  CheckCircle,
  Flag,
  Trash2,
  Loader2,
  BarChart2,
  Maximize2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PostItem } from '@varta/shared';
import { formatTimeAgo, formatNumber } from '../../lib/utils';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { ImageLightboxModal } from './ImageLightboxModal';

interface PostCardProps {
  post: PostItem;
  onPostDeleted?: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isDeleted, setIsDeleted] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [poll, setPoll] = useState(post.poll);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Separate media into images and videos to prevent empty grid cells / blank space
  const videos = (post.media || []).filter(
    (m) =>
      m.type === 'VIDEO' ||
      m.mimeType?.startsWith('video/') ||
      /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(m.url)
  );

  const images = (post.media || []).filter(
    (m) =>
      !(
        m.type === 'VIDEO' ||
        m.mimeType?.startsWith('video/') ||
        /\.(mp4|webm|mov|mkv|ogg|3gp)$/i.test(m.url)
      )
  );

  // Approximate realistic view metric based on engagement
  const viewCount = Math.max(
    likeCount * 18 + (post.replyCount || 0) * 24 + 142,
    (post.likeCount || 0) * 12 + 85
  );

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return router.push('/login');

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await apiRequest(`/posts/${post.id}/like`, { method: 'POST' });
      setIsLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return router.push('/login');

    const prevReposted = isReposted;
    const prevCount = repostCount;

    setIsReposted(!prevReposted);
    setRepostCount(prevReposted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await apiRequest(`/posts/${post.id}/repost`, { method: 'POST' });
      setIsReposted(res.reposted);
      setRepostCount(res.repostCount);
    } catch {
      setIsReposted(prevReposted);
      setRepostCount(prevCount);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return router.push('/login');

    const prev = isBookmarked;
    setIsBookmarked(!prev);

    try {
      const res = await apiRequest(`/posts/${post.id}/bookmark`, { method: 'POST' });
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked(prev);
    }
  };

  const handleVote = async (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    if (!user) return router.push('/login');
    if (!poll || poll.isExpired || poll.userVoteOptionId) return;

    try {
      const updatedPoll = await apiRequest(`/posts/poll/${poll.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      });
      setPoll(updatedPoll);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    // Optimistically unmount from DOM immediately with zero pop-up or delay
    setIsDeleted(true);
    setIsDeleting(true);

    try {
      await apiRequest(`/posts/${post.id}`, { method: 'DELETE' });

      // Optimistically remove from all React Query caches across all feeds
      queryClient.setQueriesData<any>(
        { queryKey: ['feed'] },
        (old: any) => {
          if (!old) return old;
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                items: (page.items || []).filter((p: any) => p.id !== post.id),
              })),
            };
          }
          if (old.items) {
            return {
              ...old,
              items: old.items.filter((p: any) => p.id !== post.id),
            };
          }
          return old;
        }
      );
      queryClient.setQueriesData<any>(
        { queryKey: ['timeline'] },
        (old: any) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.filter((p: any) => p.id !== post.id),
          };
        }
      );
      queryClient.setQueriesData<any>(
        { queryKey: ['community-posts'] },
        (old: any) => {
          if (Array.isArray(old)) {
            return old.filter((p: any) => p.id !== post.id);
          }
          if (old && Array.isArray(old.items)) {
            return {
              ...old,
              items: old.items.filter((p: any) => p.id !== post.id),
            };
          }
          return old;
        }
      );
      queryClient.setQueriesData<any>(
        { queryKey: ['bookmarks'] },
        (old: any) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.filter((p: any) => p.id !== post.id),
          };
        }
      );
      queryClient.setQueriesData<any>(
        { queryKey: ['user-posts'] },
        (old: any) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.filter((p: any) => p.id !== post.id),
          };
        }
      );

      // Trigger parent callback if provided
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      console.error(err);
      // Revert if request failed
      setIsDeleted(false);
      setIsDeleting(false);
    }
  };

  // Format hashtags and mentions
  const renderFormattedText = (text: string) => {
    const parts = text.split(/([#@][a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <Link
            key={idx}
            href={`/search?q=${encodeURIComponent(part)}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[#38BDF8] hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      if (part.startsWith('@')) {
        return (
          <Link
            key={idx}
            href={`/${part.slice(1)}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[#38BDF8] hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const isOwner = user?.id === post.authorId || user?.role === 'ADMIN';

  if (isDeleted) {
    return null;
  }

  return (
    <article
      onClick={() => router.push(`/post/${post.id}`)}
      className="p-4 border-b border-slate-200 dark:border-[#1E293B] hover:bg-slate-100/70 dark:hover:bg-[#0B1422]/70 transition-colors duration-150 cursor-pointer flex gap-3.5 relative group select-none"
    >
      {/* Author Avatar */}
      <Link
        href={`/${post.author.username}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-[#101D2D] flex items-center justify-center text-[#FF9933] font-bold overflow-hidden ring-1 ring-slate-200 dark:ring-[#1E293B] hover:ring-[#FF9933]/50 transition">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            post.author.username.charAt(0).toUpperCase()
          )}
        </div>
      </Link>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Community / Group Badge */}
        {post.group && (
          <div className="flex items-center gap-1.5 mb-1 relative z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const target =
                  post.group?.id ||
                  post.groupId ||
                  post.group?.slug ||
                  post.group?.name;
                if (target) {
                  router.push(`/communities?id=${encodeURIComponent(target)}`);
                } else {
                  router.push('/communities');
                }
              }}
              title={`View ${post.group.name} Community`}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 dark:bg-[#FF9933]/15 dark:hover:bg-[#FF9933]/25 dark:text-[#FF9933] dark:border-[#FF9933]/30 px-2.5 py-0.5 rounded-full transition cursor-pointer group/badge active:scale-95 text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] dark:bg-[#FF9933] group-hover/badge:scale-125 transition-transform shrink-0 pointer-events-none" />
              <span className="truncate max-w-[220px] text-orange-950 dark:text-[#FF9933] font-bold group-hover/badge:underline pointer-events-none">
                {post.group.name}
              </span>
              <span className="text-[10px] text-orange-900 dark:text-slate-400 font-medium shrink-0 pointer-events-none">
                in {post.group.category}
              </span>
            </button>
          </div>
        )}

        {/* Header: Author & Date & Options */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-slate-900 dark:text-slate-100 hover:underline truncate text-sm flex items-center gap-1"
            >
              {post.author.displayName || post.author.username}
              {post.author.isVerified && (
                <CheckCircle
                  size={14}
                  className="text-[#FF9933] fill-[#FF9933]/20 shrink-0"
                />
              )}
            </Link>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              @{post.author.username}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-500 shrink-0">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#101D2D] transition"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-[#0C1726] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-xl py-1 flex flex-col"
              >
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full text-left transition"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete post
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push(`/post/${post.id}?report=true`);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#101D2D] w-full text-left transition"
                >
                  <Flag size={14} className="text-[#FF9933]" />
                  Report post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply Context */}
        {post.parentId && post.replyToAuthor && (
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 mb-0.5">
            <span>Replying to</span>
            <Link
              href={`/${post.replyToAuthor.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[#38BDF8] hover:underline font-medium"
            >
              @{post.replyToAuthor.username}
            </Link>
          </div>
        )}

        {/* Text Content */}
        {post.content && (
          <p className="mt-1.5 text-[15px] text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed break-words font-normal">
            {renderFormattedText(post.content)}
          </p>
        )}

        {/* Media Attachments */}
        {post.media && post.media.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex flex-col gap-2.5"
          >
            {/* 1. Images Section */}
            {images.length > 0 && (
              <div
                className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E293B] bg-slate-100 dark:bg-black/40 ${
                  images.length === 1
                    ? ''
                    : images.length === 2
                    ? 'grid grid-cols-2 gap-1'
                    : images.length === 3
                    ? 'grid grid-cols-2 gap-1'
                    : 'grid grid-cols-2 gap-1'
                }`}
              >
                {images.map((m, index) => (
                  <div
                    key={m.id || index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                      setIsLightboxOpen(true);
                    }}
                    className={`relative group/media overflow-hidden cursor-zoom-in ${
                      images.length === 1
                        ? 'w-full max-h-[500px]'
                        : images.length === 3 && index === 0
                        ? 'col-span-2 h-52 sm:h-64'
                        : images.length >= 2
                        ? 'h-48 sm:h-56'
                        : 'max-h-[460px]'
                    }`}
                  >
                    <img
                      src={m.url}
                      alt="Post attachment"
                      className="w-full h-full object-cover transition duration-200 group-hover/media:scale-[1.015] group-hover/media:brightness-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/15 transition-colors pointer-events-none" />
                    <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover/media:opacity-100 transition-opacity bg-black/80 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-semibold !text-white shadow-lg pointer-events-none border border-white/20">
                      <Maximize2 size={12} className="text-[#FF9933]" />
                      <span className="!text-white">Click to zoom</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Videos Section */}
            {videos.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {videos.map((m, index) => (
                  <div
                    key={m.id || index}
                    className="relative w-full rounded-2xl overflow-hidden bg-black max-h-[500px] border border-[#1E293B] flex items-center justify-center shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <video
                      src={m.url}
                      controls
                      playsInline
                      preload="metadata"
                      {...({ referrerPolicy: 'no-referrer' } as any)}
                      className="w-full max-h-[500px] object-contain rounded-2xl bg-black"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive Poll */}
        {poll && (
          <div className="mt-3 p-3.5 bg-[#0B1422] border border-[#1E293B] rounded-2xl flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-slate-200">
              {poll.question}
            </span>
            <div className="flex flex-col gap-1.5">
              {poll.options.map((option) => {
                const isSelected = poll.userVoteOptionId === option.id;
                const canVote = !poll.isExpired && !poll.userVoteOptionId;

                return (
                  <button
                    key={option.id}
                    disabled={!canVote}
                    onClick={(e) => handleVote(e, option.id)}
                    className={`relative overflow-hidden w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition ${
                      isSelected
                        ? 'border-[#FF9933] bg-[#FF9933]/15 text-[#FF9933]'
                        : 'border-[#1E293B] hover:border-slate-500 text-slate-200 bg-[#101D2D]/50'
                    }`}
                  >
                    {(poll.userVoteOptionId || poll.isExpired) && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[#FF9933]/20 transition-all duration-500"
                        style={{ width: `${option.percentage || 0}%` }}
                      />
                    )}

                    <div className="relative flex items-center justify-between z-10">
                      <span>{option.text}</span>
                      {(poll.userVoteOptionId || poll.isExpired) && (
                        <span className="font-bold">{option.percentage || 0}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">
              {poll.totalVotes} votes • {poll.isExpired ? 'Final results' : 'Active poll'}
            </span>
          </div>
        )}

        {/* Quoted Post */}
        {post.quotePost && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/post/${post.quotePost!.id}`);
            }}
            className="mt-2.5 p-3 rounded-2xl border border-[#1E293B] bg-[#0B1422] hover:bg-[#101D2D]/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="font-bold">{post.quotePost.author.displayName}</span>
              <span className="text-slate-400">@{post.quotePost.author.username}</span>
            </div>
            <p className="text-xs text-slate-200 mt-1 line-clamp-2">
              {post.quotePost.content}
            </p>
          </div>
        )}

        {/* Interaction Toolbar */}
        <div className="mt-3.5 flex items-center justify-between text-slate-400 text-xs max-w-lg">
          {/* Reply */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/post/${post.id}`);
            }}
            className="flex items-center gap-1.5 hover:text-[#38BDF8] group transition"
          >
            <div className="p-1.5 rounded-full group-hover:bg-[#38BDF8]/10 transition">
              <MessageCircle size={17} />
            </div>
            <span>{post.replyCount > 0 ? formatNumber(post.replyCount) : ''}</span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 group transition ${
              isReposted ? 'text-[#00C853]' : 'hover:text-[#00C853]'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover:bg-[#00C853]/10 transition">
              <Repeat2 size={17} />
            </div>
            <span>{repostCount > 0 ? formatNumber(repostCount) : ''}</span>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 group transition ${
              isLiked ? 'text-pink-500' : 'hover:text-pink-500'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition">
              <Heart
                size={17}
                className={isLiked ? 'fill-pink-500 stroke-pink-500 scale-110' : ''}
              />
            </div>
            <span className={isLiked ? 'text-pink-500 font-semibold' : ''}>
              {likeCount > 0 ? formatNumber(likeCount) : ''}
            </span>
          </button>

          {/* Views */}
          <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition">
            <div className="p-1.5 rounded-full">
              <BarChart2 size={16} />
            </div>
            <span>{formatNumber(viewCount)}</span>
          </div>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 group transition ${
              isBookmarked ? 'text-[#FF9933]' : 'hover:text-[#FF9933]'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover:bg-[#FF9933]/10 transition">
              <Bookmark
                size={17}
                className={isBookmarked ? 'fill-[#FF9933] stroke-[#FF9933]' : ''}
              />
            </div>
          </button>

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.clipboard) {
                navigator.clipboard.writeText(
                  `${window.location.origin}/post/${post.id}`,
                );
                alert('Post link copied to clipboard!');
              }
            }}
            className="p-1.5 rounded-full hover:bg-slate-700/30 hover:text-white transition"
            title="Share"
          >
            <Share size={16} />
          </button>
        </div>
      </div>

      {/* Focused Image Zoom Lightbox Modal */}
      {images.length > 0 && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={images.map((m) => ({ id: m.id, url: m.url }))}
          initialIndex={selectedImageIndex}
          author={{
            displayName: post.author.displayName,
            username: post.author.username,
            avatarUrl: post.author.avatarUrl,
          }}
          postContent={post.content}
        />
      )}
    </article>
  );
};
