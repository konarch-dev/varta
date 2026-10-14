'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Send,
  Loader2,
  Plus,
  ArrowLeft,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { ConversationItem, MessageItem, PaginatedResponse, UserSummary } from '@varta/shared';
import { formatTimeAgo } from '../../../lib/utils';

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('id');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messageText, setMessageText] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  const {
    data: conversations,
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useQuery<ConversationItem[]>({
    queryKey: ['conversations'],
    queryFn: () => apiRequest('/messages/conversations'),
  });

  // Set default active conversation if none selected
  useEffect(() => {
    if (!activeConvId && conversations && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // 2. Fetch Messages for active conversation
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useQuery<PaginatedResponse<MessageItem>>({
    queryKey: ['messages', activeConvId],
    queryFn: () => apiRequest(`/messages/conversations/${activeConvId}?limit=50`),
    enabled: !!activeConvId,
    refetchInterval: 4000, // Light polling fallback for real-time DMs
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest(`/messages/conversations/${activeConvId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 4. Search Users for New Conversation
  const { data: userSearchResults } = useQuery<{ users: UserSummary[] }>({
    queryKey: ['search-users-dm', userSearchText],
    queryFn: () => apiRequest(`/explore/search?q=${encodeURIComponent(userSearchText)}&type=users&limit=10`),
    enabled: userSearchText.trim().length > 0,
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleStartConversationWith = async (targetUsername: string) => {
    try {
      const res = await apiRequest('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ username: targetUsername }),
      });
      setIsNewModalOpen(false);
      setUserSearchText('');
      setActiveConvId(res.conversationId);
      refetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const activeConversation = conversations?.find((c) => c.id === activeConvId);

  return (
    <MainLayout showRightSidebar={false}>
      <div className="flex h-screen border-r border-[#252D3A]">
        {/* Left Side: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-[#252D3A] flex flex-col h-full bg-[#090B10] ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#252D3A] flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Mail size={20} className="text-blue-400" />
              Direct Messages
            </h2>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="p-2 rounded-full bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition"
              title="New Message"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#252D3A]/60">
            {isConversationsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span>Loading chats...</span>
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/10 border-l-4 border-blue-500'
                        : 'hover:bg-[#11151D]'
                    }`}
                  >
                    <div className="h-11 w-11 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0">
                      {conv.otherMember?.avatarUrl ? (
                        <img
                          src={conv.otherMember.avatarUrl}
                          alt={conv.otherMember.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (conv.otherMember?.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-100 truncate">
                          {conv.otherMember?.displayName || conv.otherMember?.username}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {formatTimeAgo(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 truncate mt-0.5">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Mail size={28} className="text-slate-600" />
                <span>No active conversations.</span>
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-blue-400 hover:underline"
                >
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#090B10] ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConvId && activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-[#252D3A] flex items-center gap-3 bg-[#090B10]/80 backdrop-blur-md">
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden p-1.5 rounded-full hover:bg-[#191F2B] text-slate-300"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0">
                  {activeConversation.otherMember?.avatarUrl ? (
                    <img
                      src={activeConversation.otherMember.avatarUrl}
                      alt={activeConversation.otherMember.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (activeConversation.otherMember?.username || 'U')
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-100 truncate">
                    {activeConversation.otherMember?.displayName ||
                      activeConversation.otherMember?.username}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    @{activeConversation.otherMember?.username}
                  </span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {isMessagesLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading messages...
                  </div>
                ) : messagesData?.items && messagesData.items.length > 0 ? (
                  messagesData.items.map((msg) => {
                    const isMyMessage = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMyMessage ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMyMessage
                              ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/10'
                              : 'bg-[#191F2B] text-slate-100 rounded-bl-none border border-[#252D3A]'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 px-1">
                          {formatTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="m-auto text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                    <span>This is the beginning of your conversation with</span>
                    <strong className="text-slate-200">
                      @{activeConversation.otherMember?.username}
                    </strong>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-[#252D3A] bg-[#11151D] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Send a direct message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-[#191F2B] border border-[#252D3A] focus:border-blue-500 rounded-full px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition active:scale-95 shadow-md shadow-blue-500/20"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center flex flex-col items-center gap-2 text-slate-400 p-8">
              <Mail size={40} className="text-slate-600" />
              <h3 className="font-bold text-slate-200 text-lg">Select a message</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Choose from your existing conversations, or start a new one to chat privately.
              </p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20"
              >
                New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11151D] border border-[#252D3A] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-100">Start a Conversation</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search username to message..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                className="w-full bg-[#191F2B] border border-[#252D3A] rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {userSearchResults?.users && userSearchResults.users.length > 0 ? (
                userSearchResults.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartConversationWith(u.username)}
                    className="p-2.5 rounded-xl hover:bg-[#191F2B] flex items-center gap-3 text-left transition"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/20 shrink-0">
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
                    </div>
                  </button>
                ))
              ) : userSearchText ? (
                <div className="p-4 text-center text-xs text-slate-400">No users found</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="p-16 flex items-center justify-center text-xs text-slate-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        </MainLayout>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
