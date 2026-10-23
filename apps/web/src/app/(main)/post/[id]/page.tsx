'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Flag, CheckCircle } from 'lucide-react';
import { MainLayout } from '../../../../components/layout/MainLayout';
import { PostCard } from '../../../../components/feed/PostCard';
import { PostComposer } from '../../../../components/feed/PostComposer';
import { apiRequest } from '../../../../lib/api';
import { PostItem, PaginatedResponse, ReportCategory } from '@varta/shared';

function PostDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const postId = params.id as string;

  const [isReportOpen, setIsReportOpen] = useState(
    searchParams.get('report') === 'true',
  );
  const [reportCategory, setReportCategory] = useState<ReportCategory>(
    ReportCategory.HARASSMENT,
  );
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
  } = useQuery<PostItem>({
    queryKey: ['post', postId],
    queryFn: () => apiRequest(`/posts/${postId}`),
  });

  const { data: repliesData, isLoading: isRepliesLoading } = useQuery<
    PaginatedResponse<PostItem>
  >({
    queryKey: ['replies', postId],
    queryFn: () => apiRequest(`/posts/${postId}/replies`),
  });

  const reportMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
      }, 2000);
    },
  });

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    reportMutation.mutate({
      postId,
      reportedUserId: post?.authorId,
      category: reportCategory,
      reason: reportReason.trim(),
    });
  };

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#050B14]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1E293B] px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#101D2D] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Post Conversation</h1>
      </div>

      {isPostLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#FF9933]" />
          <span className="text-sm">Retrieving conversation...</span>
        </div>
      ) : postError || !post ? (
        <div className="p-12 text-center text-red-400 text-sm">
          Post not found or has been deleted by its author.
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Focal Post */}
          <PostCard
            post={post}
            onPostDeleted={() => router.push('/home')}
          />

          {/* Reply Composer */}
          <div className="p-4 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0B1422]/50">
            <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1">
              Replying to <span className="text-[#0284C7] dark:text-[#38BDF8] font-bold">@{post.author.username}</span>
            </h2>
            <PostComposer
              parentId={post.id}
              placeholder="Post your reply..."
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['replies', postId] });
                queryClient.invalidateQueries({ queryKey: ['post', postId] });
              }}
            />
          </div>

          {/* Threaded Replies */}
          <div className="flex flex-col">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0B1422] border-b border-slate-200 dark:border-[#1E293B] text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              Replies ({repliesData?.items?.length || 0})
            </div>

            {isRepliesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading replies...
              </div>
            ) : repliesData?.items && repliesData.items.length > 0 ? (
              repliesData.items.map((reply) => (
                <PostCard key={reply.id} post={reply} />
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No replies yet. Be the first to join the conversation!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grievance Reporting Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-500 font-bold text-base">
              <Flag size={20} />
              Report to Grievance Redressal
            </div>

            {reportSuccess ? (
              <div className="p-6 text-center flex flex-col items-center gap-2 text-[#00C853]">
                <CheckCircle size={36} />
                <span className="font-semibold text-sm">
                  Grievance report received. Ticket assigned per IT Rules.
                </span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="flex flex-col gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Help maintain civil discourse in accordance with Indian Intermediary Guidelines.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as ReportCategory)}
                    className="bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value={ReportCategory.HARASSMENT}>Harassment or Cyberbullying</option>
                    <option value={ReportCategory.HATE_SPEECH}>Hate Speech or Communal Disharmony</option>
                    <option value={ReportCategory.SPAM}>Spam or Fraudulent Scheme</option>
                    <option value={ReportCategory.IMPERSONATION}>Impersonation or False Identity</option>
                    <option value={ReportCategory.MISINFORMATION}>Harmful Misinformation</option>
                    <option value={ReportCategory.VIOLENCE}>Threat of Violence</option>
                    <option value={ReportCategory.ADULT_CONTENT}>Explicit / Inappropriate Content</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reason & Context
                  </label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Provide details about the violation..."
                    rows={3}
                    className="bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#101D2D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportMutation.isPending || !reportReason.trim()}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {reportMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Submit Grievance'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="p-16 flex items-center justify-center text-xs text-slate-400">
            <Loader2 size={24} className="animate-spin text-[#FF9933]" />
          </div>
        </MainLayout>
      }
    >
      <PostDetailContent />
    </Suspense>
  );
}
