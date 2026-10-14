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
} from 'lucide-react';
import { PostItem } from '@varta/shared';
import { formatTimeAgo, formatNumber } from '../../lib/utils';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface PostCardProps {
  post: PostItem;
  onPostDeleted?: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const router = useRouter();
  const { user } = useAuthStore();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [poll, setPoll] = useState(post.poll);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/posts/${post.id}`, { method: 'DELETE' });
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  // Highlight hashtags & mentions in post text
  const renderFormattedText = (text: string) => {
    const parts = text.split(/([#@][a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <Link
            key={idx}
            href={`/search?q=${encodeURIComponent(part)}&type=tags`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-400 hover:underline font-medium"
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
            className="text-indigo-400 hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const isOwner = user?.id === post.authorId || user?.role === 'ADMIN';

  return (
    <article
      onClick={() => router.push(`/post/${post.id}`)}
      className="p-4 border-b border-[#252D3A] hover:bg-[#11151D]/60 transition cursor-pointer flex gap-3 relative group"
    >
      {/* Author Avatar */}
      <Link
        href={`/${post.author.username}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 hover:ring-blue-500/50 transition">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="h-full w-full object-cover"
            />
          ) : (
            post.author.username.charAt(0).toUpperCase()
          )}
        </div>
      </Link>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header: Author & Date & Options */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-slate-100 hover:underline truncate text-sm flex items-center gap-1"
            >
              {post.author.displayName || post.author.username}
              {post.author.isVerified && (
                <CheckCircle size={14} className="text-blue-400 shrink-0 fill-blue-500/20" />
              )}
            </Link>
            <span className="text-xs text-slate-400 truncate">
              @{post.author.username}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400 shrink-0">
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
              className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-[#191F2B] transition"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-30 w-44 bg-[#191F2B] border border-[#252D3A] rounded-xl shadow-xl py-1 flex flex-col"
              >
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 w-full text-left transition"
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
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-[#11151D] w-full text-left transition"
                >
                  <Flag size={14} />
                  Report to Grievance
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Text Content */}
        {post.content && (
          <p className="mt-1.5 text-sm text-slate-100 whitespace-pre-line leading-relaxed break-words">
            {renderFormattedText(post.content)}
          </p>
        )}

        {/* Media Attachments */}
        {post.media && post.media.length > 0 && (
          <div className="mt-2.5 rounded-xl overflow-hidden border border-[#252D3A] bg-black/30">
            {post.media.map((m) => (
              <img
                key={m.id}
                src={m.url}
                alt="Post attachment"
                className="w-full max-h-96 object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Interactive Poll */}
        {poll && (
          <div className="mt-3 p-3 bg-[#191F2B]/60 border border-[#252D3A] rounded-xl flex flex-col gap-2">
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
                    className={`relative overflow-hidden w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-[#252D3A] hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    {/* Progress Bar Fill */}
                    {(poll.userVoteOptionId || poll.isExpired) && (
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-600/20 transition-all duration-500"
                        style={{ width: `${option.percentage || 0}%` }}
                      />
                    )}

                    <div className="relative flex items-center justify-between z-10">
                      <span>{option.text}</span>
                      {(poll.userVoteOptionId || poll.isExpired) && (
                        <span className="font-semibold">{option.percentage || 0}%</span>
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

        {/* Quoted Post Card */}
        {post.quotePost && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/post/${post.quotePost!.id}`);
            }}
            className="mt-2.5 p-3 rounded-xl border border-[#252D3A] bg-[#191F2B]/40 hover:bg-[#191F2B]/70 transition cursor-pointer"
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

        {/* Interaction Bar */}
        <div className="mt-3 flex items-center justify-between text-slate-400 text-xs max-w-md">
          {/* Reply */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/post/${post.id}`);
            }}
            className="flex items-center gap-1.5 hover:text-blue-400 group transition"
          >
            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition">
              <MessageCircle size={17} />
            </div>
            <span>{post.replyCount > 0 ? formatNumber(post.replyCount) : ''}</span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 group transition ${
              isReposted ? 'text-green-400' : 'hover:text-green-400'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition">
              <Repeat2 size={17} />
            </div>
            <span>{repostCount > 0 ? formatNumber(repostCount) : ''}</span>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 group transition ${
              isLiked ? 'text-red-500' : 'hover:text-red-400'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition">
              <Heart
                size={17}
                className={isLiked ? 'fill-red-500 stroke-red-500 scale-110' : ''}
              />
            </div>
            <span>{likeCount > 0 ? formatNumber(likeCount) : ''}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 group transition ${
              isBookmarked ? 'text-blue-400' : 'hover:text-blue-400'
            }`}
          >
            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition">
              <Bookmark
                size={17}
                className={isBookmarked ? 'fill-blue-500 stroke-blue-500' : ''}
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
            className="p-1.5 rounded-full hover:bg-blue-500/10 hover:text-blue-400 transition"
            title="Share"
          >
            <Share size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};
