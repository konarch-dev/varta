'use client';

import React, { useState } from 'react';
import { X, Check, ChevronDown, ChevronUp, Quote } from 'lucide-react';

export interface PostInteractionSettings {
  replyMode: 'anyone' | 'nobody' | 'custom';
  allowedReplyRules: {
    followers: boolean;
    following: boolean;
    mentioned: boolean;
    lists: string[];
  };
  allowQuotePosts: boolean;
}

interface PostInteractionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PostInteractionSettings;
  onChange: (settings: PostInteractionSettings) => void;
}

export function getReplySettingLabel(settings: PostInteractionSettings): string {
  if (settings.replyMode === 'nobody') return 'Nobody can reply';
  if (settings.replyMode === 'anyone') return 'Everyone can reply';

  const rules = settings.allowedReplyRules;
  const parts: string[] = [];
  if (rules.following && rules.followers) {
    parts.push('Followers & Following');
  } else if (rules.following) {
    parts.push('People you follow');
  } else if (rules.followers) {
    parts.push('Your followers');
  }

  if (rules.mentioned) {
    parts.push('People you mention');
  }
  if (rules.lists.length > 0) {
    parts.push(`${rules.lists.length} list${rules.lists.length > 1 ? 's' : ''}`);
  }

  if (parts.length > 0) return `${parts.join(', ')} can reply`;
  return 'Everyone can reply';
}

export const PostInteractionSettingsModal: React.FC<PostInteractionSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
}) => {
  const [isListsExpanded, setIsListsExpanded] = useState(false);

  // Available sample lists
  const availableLists = [
    { id: 'close-friends', name: 'Close Circle', count: 12 },
    { id: 'tech-builders', name: 'Tech & Builders Bharat', count: 48 },
    { id: 'favorite-creators', name: 'Favorite Creators', count: 24 },
  ];

  if (!isOpen) return null;

  const handleSelectAnyone = () => {
    onChange({
      ...settings,
      replyMode: 'anyone',
      allowedReplyRules: {
        followers: false,
        following: false,
        mentioned: false,
        lists: [],
      },
    });
  };

  const handleSelectNobody = () => {
    onChange({
      ...settings,
      replyMode: 'nobody',
      allowedReplyRules: {
        followers: false,
        following: false,
        mentioned: false,
        lists: [],
      },
    });
  };

  const handleToggleRule = (rule: 'followers' | 'following' | 'mentioned') => {
    const nextRules = {
      ...settings.allowedReplyRules,
      [rule]: !settings.allowedReplyRules[rule],
    };

    const hasAnyActive =
      nextRules.followers ||
      nextRules.following ||
      nextRules.mentioned ||
      nextRules.lists.length > 0;

    onChange({
      ...settings,
      replyMode: hasAnyActive ? 'custom' : 'anyone',
      allowedReplyRules: nextRules,
    });
  };

  const handleToggleList = (listId: string) => {
    const currentLists = settings.allowedReplyRules.lists;
    const exists = currentLists.includes(listId);
    const nextLists = exists
      ? currentLists.filter((id) => id !== listId)
      : [...currentLists, listId];

    const nextRules = {
      ...settings.allowedReplyRules,
      lists: nextLists,
    };

    const hasAnyActive =
      nextRules.followers ||
      nextRules.following ||
      nextRules.mentioned ||
      nextRules.lists.length > 0;

    onChange({
      ...settings,
      replyMode: hasAnyActive ? 'custom' : 'anyone',
      allowedReplyRules: nextRules,
    });
  };

  const handleToggleQuotes = () => {
    onChange({
      ...settings,
      allowQuotePosts: !settings.allowQuotePosts,
    });
  };

  const isAnyone = settings.replyMode === 'anyone';
  const isNobody = settings.replyMode === 'nobody';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl p-6 flex flex-col gap-4 text-[#0F1419] select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold tracking-tight text-[#0F1419]">
            Post interaction settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#0F1419] transition cursor-pointer"
            aria-label="Close"
          >
            <X size={22} strokeWidth={2.2} />
          </button>
        </div>

        {/* Section Heading: Who can reply */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[16px] font-bold text-[#0F1419]">
            Who can reply
          </span>

          {/* Top Two Pills: Anyone & Nobody */}
          <div className="grid grid-cols-2 gap-3">
            {/* Anyone */}
            <button
              type="button"
              onClick={handleSelectAnyone}
              className={`p-3.5 rounded-2xl flex items-center gap-3 transition font-semibold text-[15px] cursor-pointer ${
                isAnyone
                  ? 'bg-[#E8F5FE] text-[#0F1419]'
                  : 'bg-[#EFF3F4] hover:bg-[#E5E9EB] text-[#0F1419]'
              }`}
            >
              {/* Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                  isAnyone
                    ? 'border-2 border-[#1D9BF0] bg-[#1D9BF0]'
                    : 'border-2 border-[#8B98A5] bg-white'
                }`}
              >
                {isAnyone && (
                  <div className="w-2 h-2 rounded-full bg-white shrink-0" />
                )}
              </div>
              <span>Anyone</span>
            </button>

            {/* Nobody */}
            <button
              type="button"
              onClick={handleSelectNobody}
              className={`p-3.5 rounded-2xl flex items-center gap-3 transition font-semibold text-[15px] cursor-pointer ${
                isNobody
                  ? 'bg-[#E8F5FE] text-[#0F1419]'
                  : 'bg-[#EFF3F4] hover:bg-[#E5E9EB] text-[#0F1419]'
              }`}
            >
              {/* Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                  isNobody
                    ? 'border-2 border-[#1D9BF0] bg-[#1D9BF0]'
                    : 'border-2 border-[#8B98A5] bg-white'
                }`}
              >
                {isNobody && (
                  <div className="w-2 h-2 rounded-full bg-white shrink-0" />
                )}
              </div>
              <span>Nobody</span>
            </button>
          </div>

          {/* Checkboxes & Lists */}
          <div className="flex flex-col gap-2">
            {/* Your followers */}
            <button
              type="button"
              onClick={() => handleToggleRule('followers')}
              className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition text-[15px] cursor-pointer ${
                settings.allowedReplyRules.followers
                  ? 'bg-[#E8F5FE] text-[#0F1419] font-medium'
                  : 'bg-[#EFF3F4] hover:bg-[#E5E9EB] text-[#0F1419]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition ${
                  settings.allowedReplyRules.followers
                    ? 'bg-[#1D9BF0] border border-[#1D9BF0] text-white'
                    : 'border border-[#8B98A5] bg-white'
                }`}
              >
                {settings.allowedReplyRules.followers && (
                  <Check size={14} strokeWidth={3} />
                )}
              </div>
              <span className="text-[#0F1419] font-medium">Your followers</span>
            </button>

            {/* People you follow */}
            <button
              type="button"
              onClick={() => handleToggleRule('following')}
              className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition text-[15px] cursor-pointer ${
                settings.allowedReplyRules.following
                  ? 'bg-[#E8F5FE] text-[#0F1419] font-medium'
                  : 'bg-[#EFF3F4] hover:bg-[#E5E9EB] text-[#0F1419]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition ${
                  settings.allowedReplyRules.following
                    ? 'bg-[#1D9BF0] border border-[#1D9BF0] text-white'
                    : 'border border-[#8B98A5] bg-white'
                }`}
              >
                {settings.allowedReplyRules.following && (
                  <Check size={14} strokeWidth={3} />
                )}
              </div>
              <span className="text-[#0F1419] font-medium">People you follow</span>
            </button>

            {/* People you mention */}
            <button
              type="button"
              onClick={() => handleToggleRule('mentioned')}
              className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition text-[15px] cursor-pointer ${
                settings.allowedReplyRules.mentioned
                  ? 'bg-[#E8F5FE] text-[#0F1419] font-medium'
                  : 'bg-[#EFF3F4] hover:bg-[#E5E9EB] text-[#0F1419]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition ${
                  settings.allowedReplyRules.mentioned
                    ? 'bg-[#1D9BF0] border border-[#1D9BF0] text-white'
                    : 'border border-[#8B98A5] bg-white'
                }`}
              >
                {settings.allowedReplyRules.mentioned && (
                  <Check size={14} strokeWidth={3} />
                )}
              </div>
              <span className="text-[#0F1419] font-medium">People you mention</span>
            </button>

            {/* Select from your lists */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setIsListsExpanded(!isListsExpanded)}
                className="p-3.5 rounded-2xl bg-[#EFF3F4] hover:bg-[#E5E9EB] flex items-center justify-between text-[15px] text-[#0F1419] font-medium transition cursor-pointer"
              >
                <span>
                  Select from your lists
                  {settings.allowedReplyRules.lists.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-[#1D9BF0]/15 text-[#1D9BF0] rounded-full font-bold">
                      {settings.allowedReplyRules.lists.length} selected
                    </span>
                  )}
                </span>
                {isListsExpanded ? (
                  <ChevronUp size={20} className="text-[#0F1419]" />
                ) : (
                  <ChevronDown size={20} className="text-[#0F1419]" />
                )}
              </button>

              {isListsExpanded && (
                <div className="mt-1.5 p-2 bg-[#F7F9F9] border border-[#EFF3F4] rounded-2xl flex flex-col gap-1 animate-in slide-in-from-top-2 duration-150">
                  {availableLists.map((list) => {
                    const isSelected = settings.allowedReplyRules.lists.includes(list.id);
                    return (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => handleToggleList(list.id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F5FE] text-[#0F1419] font-semibold'
                            : 'text-[#536471] hover:bg-[#EFF3F4] hover:text-[#0F1419]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-[4px] flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#1D9BF0] border border-[#1D9BF0] text-white'
                                : 'border border-[#8B98A5] bg-white'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span>{list.name}</span>
                        </div>
                        <span className="text-[11px] text-[#536471]">
                          {list.count} members
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Allow Quote Posts Toggle */}
        <div
          onClick={handleToggleQuotes}
          className={`p-3.5 rounded-2xl flex items-center justify-between transition cursor-pointer select-none ${
            settings.allowQuotePosts ? 'bg-[#E8F5FE]' : 'bg-[#EFF3F4] hover:bg-[#E5E9EB]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Quote size={20} className="text-[#0F1419] rotate-180" />
            <span className="text-[15px] font-bold text-[#0F1419]">
              Allow quote posts
            </span>
          </div>

          {/* Toggle Switch */}
          <div
            className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative ${
              settings.allowQuotePosts ? 'bg-[#1D9BF0]' : 'bg-[#CFD9DE]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                settings.allowQuotePosts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[14px] text-[#536471]">
            These are your default settings
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0F1419] hover:bg-[#272C30] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
