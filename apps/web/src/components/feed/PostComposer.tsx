'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  BarChart2,
  Smile,
  X,
  Send,
  Loader2,
  Plus,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { POST_MAX_LENGTH } from '@varta/shared';

interface PostComposerProps {
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
  className?: string;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  parentId,
  placeholder = "Kya chal raha hai? Share your thoughts... #BaatSabki",
  onSuccess,
  className = '',
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const createPostMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setContent('');
      setShowMediaInput(false);
      setMediaUrl('');
      setShowPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      if (onSuccess) onSuccess();
    },
  });

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim() && !showPoll) return;

    const payload: any = {
      content: content.trim(),
      parentId: parentId || null,
    };

    if (mediaUrl.trim()) {
      payload.mediaUrls = [
        {
          url: mediaUrl.trim(),
          type: 'IMAGE',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 1024,
        },
      ];
    }

    if (showPoll && pollQuestion.trim()) {
      const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
      if (validOptions.length >= 2) {
        payload.poll = {
          question: pollQuestion.trim(),
          options: validOptions,
          durationHours: 24,
        };
      }
    }

    createPostMutation.mutate(payload);
  };

  const remainingChars = POST_MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  if (!user) {
    return (
      <div className="p-4 bg-[#11151D] border border-[#252D3A] rounded-2xl text-center">
        <p className="text-sm text-slate-300">
          Sign in to join the conversation and share your voice on VARTA.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-[#11151D] border border-[#252D3A] rounded-2xl p-4 flex flex-col gap-3 shadow-md ${className}`}
    >
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold shrink-0 overflow-hidden ring-1 ring-blue-500/30">
          {user.profile?.avatarUrl ? (
            <img
              src={user.profile.avatarUrl}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-transparent resize-none text-slate-100 placeholder-slate-400 outline-none text-base border-none focus:ring-0 leading-relaxed"
          />

          {/* Media Input Drawer */}
          {showMediaInput && (
            <div className="mt-2 p-2.5 bg-[#191F2B] rounded-xl border border-[#252D3A] flex items-center gap-2">
              <input
                type="url"
                placeholder="Paste image or media URL (https://...)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setShowMediaInput(false);
                  setMediaUrl('');
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Media Preview */}
          {mediaUrl && (
            <div className="relative mt-2 rounded-xl overflow-hidden max-h-60 border border-[#252D3A]">
              <img
                src={mediaUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setMediaUrl('')}
              />
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Native Poll Builder */}
          {showPoll && (
            <div className="mt-3 p-3.5 bg-[#191F2B] rounded-xl border border-[#252D3A] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Create a Poll
                </span>
                <button
                  type="button"
                  onClick={() => setShowPoll(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="bg-[#11151D] border border-[#252D3A] rounded-lg p-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500"
              />

              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                  className="bg-[#11151D] border border-[#252D3A] rounded-lg p-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500"
                />
              ))}

              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 w-fit py-1"
                >
                  <Plus size={14} /> Add another option
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#252D3A]/60">
        <div className="flex items-center gap-1 text-blue-400">
          <button
            type="button"
            onClick={() => setShowMediaInput(!showMediaInput)}
            className="p-2 hover:bg-blue-500/10 rounded-full transition"
            title="Attach Media"
          >
            <ImageIcon size={19} />
          </button>
          <button
            type="button"
            onClick={() => setShowPoll(!showPoll)}
            className="p-2 hover:bg-blue-500/10 rounded-full transition"
            title="Create Poll"
          >
            <BarChart2 size={19} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono ${
              isOverLimit
                ? 'text-red-400 font-bold'
                : remainingChars < 50
                ? 'text-yellow-400'
                : 'text-slate-400'
            }`}
          >
            {remainingChars}
          </span>

          <button
            type="submit"
            disabled={
              createPostMutation.isPending ||
              isOverLimit ||
              (!content.trim() && !mediaUrl.trim() && !showPoll)
            }
            className="py-2 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl font-semibold text-sm transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
          >
            {createPostMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={15} />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
