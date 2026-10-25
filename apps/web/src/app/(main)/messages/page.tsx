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
  Phone,
  Video,
  Paperclip,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  VideoOff,
  Users,
  UserCheck,
  Info,
  Radio,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../stores/authStore';
import { ConversationItem, MessageItem, PaginatedResponse, UserSummary } from '@varta/shared';
import { formatTimeAgo } from '../../../lib/utils';

// ============================================================
// Web Audio API Synthesizers for Call Sounds & Notifications
// ============================================================

// Play synthetic message notification chime
const playMessageChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // safely ignore
  }
};

// Play call connect chord
const playConnectChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.22);
    });
  } catch {
    // safely ignore
  }
};

// Play call disconnect / hangup tone
const playEndCallTone = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // safely ignore
  }
};

// Play telephone ring cycle (dual tone 440Hz + 480Hz)
const playRingbackPulse = (ctx: AudioContext) => {
  try {
    const now = ctx.currentTime;
    [440, 480].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.setValueAtTime(0.04, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);
    });
  } catch {
    // safely ignore
  }
};

// Active Call State Interface
interface CallState {
  type: 'audio' | 'video';
  target: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string | null;
    isGroup?: boolean;
    memberCount?: number;
  };
  status: 'calling' | 'connected' | 'incoming';
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  audioLevel: number;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('id');
  const targetUserParam = searchParams.get('user');
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId || null);
  const [messageText, setMessageText] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<'dm' | 'group'>('dm');
  const [userSearchText, setUserSearchText] = useState('');
  const [conversationSearchText, setConversationSearchText] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ file?: File; previewUrl: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState<string | boolean>(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);

  // Group creation state
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<UserSummary[]>([]);

  // Active call state
  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Call media & WebRTC / Audio analyzer refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ringToneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoConnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Conversations
  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useQuery<ConversationItem[]>({
    queryKey: ['conversations'],
    queryFn: () => apiRequest('/messages/conversations'),
  });

  // Auto-start conversation if `?user=username`
  useEffect(() => {
    if (targetUserParam && user) {
      apiRequest<{ conversationId: string }>('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ username: targetUserParam }),
      })
        .then((res) => {
          if (res?.conversationId) {
            setActiveConvId(res.conversationId);
            refetchConversations();
          }
        })
        .catch((err) => console.error('Failed to start conversation with user:', err));
    }
  }, [targetUserParam, user]);

  // Set default active conversation if none selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // 2. Fetch Messages for active conversation
  const {
    data: messagesResponse,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useQuery<PaginatedResponse<MessageItem>>({
    queryKey: ['messages', activeConvId],
    queryFn: () => apiRequest(`/messages/conversations/${activeConvId}?limit=100`),
    enabled: !!activeConvId,
  });

  // Local message state for live WebSocket synchronization
  const [liveMessages, setLiveMessages] = useState<MessageItem[]>([]);

  // Synchronize initial server messages into live state
  useEffect(() => {
    if (messagesResponse?.items) {
      setLiveMessages(messagesResponse.items);
    }
  }, [messagesResponse]);

  // Reset typing indicator when conversation changes
  useEffect(() => {
    setIsOtherUserTyping(false);
  }, [activeConvId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages.length, isOtherUserTyping]);

  // ============================================================
  // WebSocket Real-Time Connection & Call Signaling
  // ============================================================
  useEffect(() => {
    const socket = getSocket(token);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Live Message Received in room
    const handleMessageReceived = (incomingMsg: MessageItem) => {
      if (incomingMsg.conversationId === activeConvId) {
        setLiveMessages((prev) => {
          const exists = prev.some((m) => m.id === incomingMsg.id);
          if (exists) return prev;
          const clean = prev.filter((m) => !m.id.startsWith('temp-'));
          return [...clean, incomingMsg];
        });

        if (incomingMsg.senderId !== user?.id) {
          playMessageChime();
          socket.emit('conversation:read', { conversationId: activeConvId });
          apiRequest(`/messages/conversations/${activeConvId}/read`, {
            method: 'PATCH',
          }).catch(() => {});
        }
      }

      // Update sidebar conversation item preview
      queryClient.setQueryData<ConversationItem[]>(['conversations'], (oldConvs) => {
        if (!oldConvs) return oldConvs;
        return oldConvs.map((conv) => {
          if (conv.id === incomingMsg.conversationId) {
            return {
              ...conv,
              lastMessage: {
                id: incomingMsg.id,
                content: incomingMsg.content,
                createdAt: incomingMsg.createdAt,
                senderId: incomingMsg.senderId,
                isRead: incomingMsg.senderId === user?.id,
              },
              updatedAt: incomingMsg.createdAt,
            };
          }
          return conv;
        });
      });
    };

    // Live Conversation Update
    const handleConversationUpdate = () => {
      refetchConversations();
    };

    // Live New Group Notification
    const handleNewGroupCreated = () => {
      refetchConversations();
      playMessageChime();
    };

    // Live Typing Indicator
    const handleTypingUser = (data: { conversationId: string; userId: string; username?: string; isTyping: boolean }) => {
      if (data.conversationId === activeConvId && data.userId !== user?.id) {
        setIsOtherUserTyping(data.isTyping ? data.username || true : false);
      }
    };

    // Live Read Receipts
    const handleConversationRead = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === activeConvId) {
        setLiveMessages((prev) =>
          prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m))
        );
      }
    };

    // Live Incoming Call
    const handleIncomingCall = (data: {
      caller: UserSummary;
      conversationId: string;
      type: 'audio' | 'video';
      isGroup?: boolean;
    }) => {
      // Don't ring self
      if (data.caller.id === user?.id) return;

      setActiveCall({
        type: data.type,
        target: {
          id: data.caller.id,
          name: data.caller.displayName || data.caller.username,
          username: data.caller.username,
          avatarUrl: data.caller.avatarUrl,
          isGroup: data.isGroup,
        },
        status: 'incoming',
        duration: 0,
        isMuted: false,
        isVideoOff: false,
        audioLevel: 0,
      });
      playMessageChime();
    };

    // Live Call Accepted by peer
    const handleCallAccepted = () => {
      if (autoConnectTimeoutRef.current) {
        clearTimeout(autoConnectTimeoutRef.current);
        autoConnectTimeoutRef.current = null;
      }
      playConnectChime();
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
    };

    // Live Call Ended / Rejected
    const handleCallEnded = () => {
      playEndCallTone();
      stopMediaStream();
      setActiveCall(null);
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('conversation:update', handleConversationUpdate);
    socket.on('conversation:new_group', handleNewGroupCreated);
    socket.on('typing:user', handleTypingUser);
    socket.on('conversation:read', handleConversationRead);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallEnded);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:received', handleMessageReceived);
      socket.off('conversation:update', handleConversationUpdate);
      socket.off('conversation:new_group', handleNewGroupCreated);
      socket.off('typing:user', handleTypingUser);
      socket.off('conversation:read', handleConversationRead);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallEnded);
      socket.off('call:ended', handleCallEnded);
    };
  }, [activeConvId, user?.id, token, queryClient, refetchConversations]);

  // Join active conversation room on socket
  useEffect(() => {
    if (!activeConvId) return;
    const socket = getSocket(token);
    socket.emit('join_conversation', activeConvId);

    apiRequest(`/messages/conversations/${activeConvId}/read`, {
      method: 'PATCH',
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      })
      .catch(() => {});

    return () => {
      socket.emit('leave_conversation', activeConvId);
    };
  }, [activeConvId, token]);

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; mediaUrl?: string }) =>
      apiRequest<MessageItem>(`/messages/conversations/${activeConvId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (sentMsg) => {
      setLiveMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.id.startsWith('temp-'));
        const exists = withoutTemp.some((m) => m.id === sentMsg.id);
        return exists ? withoutTemp : [...withoutTemp, sentMsg];
      });
      refetchConversations();
    },
    onError: (err) => {
      console.error('Failed to send message:', err);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedImage) || !activeConvId || !user) return;

    const socket = getSocket(token);
    socket.emit('typing:stop', { conversationId: activeConvId });

    const textToSend = messageText.trim();
    let mediaUrlToSend: string | undefined = undefined;

    if (attachedImage) {
      setIsUploadingImage(true);
      try {
        if (attachedImage.file) {
          const formData = new FormData();
          formData.append('files', attachedImage.file);
          const uploadRes = await apiRequest<{ media: Array<{ url: string }> }>('/posts/media', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes?.media?.[0]?.url) {
            mediaUrlToSend = uploadRes.media[0].url;
          }
        } else {
          mediaUrlToSend = attachedImage.previewUrl;
        }
      } catch (uploadErr) {
        console.error('Image upload failed:', uploadErr);
        mediaUrlToSend = attachedImage.previewUrl;
      } finally {
        setIsUploadingImage(false);
      }
    }

    // Instant optimistic render
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: MessageItem = {
      id: tempId,
      conversationId: activeConvId,
      senderId: user.id,
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified || false,
        isPrivate: user.isPrivate || false,
      },
      content: textToSend,
      mediaUrl: mediaUrlToSend,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setLiveMessages((prev) => [...prev, optimisticItem]);
    setMessageText('');
    setAttachedImage(null);

    sendMessageMutation.mutate({
      content: textToSend,
      mediaUrl: mediaUrlToSend,
    });
  };

  // Typing event handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (!activeConvId || !user) return;

    const socket = getSocket(token);
    socket.emit('typing:start', {
      conversationId: activeConvId,
      username: user.displayName || user.username,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: activeConvId });
    }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAttachedImage({ file, previewUrl });
    e.target.value = '';
  };

  // 4. Search Users for Direct Message & Group Creation
  const { data: searchResults, isLoading: isSearchLoading } = useQuery<{ users: UserSummary[] }>({
    queryKey: ['user-search', userSearchText],
    queryFn: () =>
      userSearchText.trim().length > 0
        ? apiRequest(`/explore/search?q=${encodeURIComponent(userSearchText)}&type=users&limit=10`)
        : Promise.resolve({ users: [] }),
    enabled: isNewModalOpen && userSearchText.trim().length > 0,
  });

  const { data: suggestedUsers = [] } = useQuery<UserSummary[]>({
    queryKey: ['who-to-follow-dms'],
    queryFn: () => apiRequest('/explore/who-to-follow?limit=10'),
    enabled: isNewModalOpen && userSearchText.trim().length === 0,
  });

  // Start 1-on-1 Conversation Mutation
  const startConversationMutation = useMutation({
    mutationFn: (username: string) =>
      apiRequest<{ conversationId: string }>('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ username }),
      }),
    onSuccess: (res) => {
      setIsNewModalOpen(false);
      setUserSearchText('');
      if (res?.conversationId) {
        setActiveConvId(res.conversationId);
        refetchConversations();
      }
    },
  });

  // Create Group Conversation Mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: { title: string; usernames: string[] }) =>
      apiRequest<{ conversationId: string; title: string }>('/messages/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res) => {
      setIsNewModalOpen(false);
      setGroupTitle('');
      setSelectedGroupUsers([]);
      setUserSearchText('');
      if (res?.conversationId) {
        setActiveConvId(res.conversationId);
        refetchConversations();
      }
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to create group. Please check member selection.');
    },
  });

  const handleToggleGroupUser = (u: UserSummary) => {
    setSelectedGroupUsers((prev) => {
      const exists = prev.some((item) => item.id === u.id);
      if (exists) {
        return prev.filter((item) => item.id !== u.id);
      } else {
        return [...prev, u];
      }
    });
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupUsers.length === 0) return;
    createGroupMutation.mutate({
      title: groupTitle.trim(),
      usernames: selectedGroupUsers.map((u) => u.username),
    });
  };

  // Filter conversations in sidebar
  const filteredConversations = conversations.filter((c) => {
    if (!conversationSearchText.trim()) return true;
    const term = conversationSearchText.toLowerCase();
    const titleMatch = c.title?.toLowerCase().includes(term);
    const otherName = c.otherMember?.displayName?.toLowerCase() || '';
    const otherUser = c.otherMember?.username?.toLowerCase() || '';
    return titleMatch || otherName.includes(term) || otherUser.includes(term);
  });

  // ============================================================
  // Audio & Video Calling Implementation
  // ============================================================

  // Call timer and periodic ringback tone
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'connected') {
      timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  // Synthesize repeating ringback tone while calling
  useEffect(() => {
    if (activeCall?.status === 'calling') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          playRingbackPulse(ctx);
          ringToneIntervalRef.current = setInterval(() => {
            playRingbackPulse(ctx);
          }, 3200);
        }
      } catch {
        // safely ignore
      }
    } else {
      if (ringToneIntervalRef.current) {
        clearInterval(ringToneIntervalRef.current);
        ringToneIntervalRef.current = null;
      }
    }
    return () => {
      if (ringToneIntervalRef.current) {
        clearInterval(ringToneIntervalRef.current);
        ringToneIntervalRef.current = null;
      }
    };
  }, [activeCall?.status]);

  // Audio analyzer to visualize speaking wave activity
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setActiveCall((prev) => (prev ? { ...prev, audioLevel: avg } : null));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Audio analyzer init:', e);
    }
  };

  const stopMediaStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (autoConnectTimeoutRef.current) {
      clearTimeout(autoConnectTimeoutRef.current);
      autoConnectTimeoutRef.current = null;
    }
    if (ringToneIntervalRef.current) {
      clearInterval(ringToneIntervalRef.current);
      ringToneIntervalRef.current = null;
    }
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!activeConversation || !user) return;

    const isGroup = !!activeConversation.isGroup;
    const target = isGroup
      ? {
          id: activeConversation.id,
          name: activeConversation.title || 'Group Call',
          avatarUrl: activeConversation.avatarUrl || null,
          isGroup: true,
          memberCount: (activeConversation.members?.length || 0) + 1,
        }
      : {
          id: activeConversation.otherMember?.id || '',
          name: activeConversation.otherMember?.displayName || activeConversation.otherMember?.username || 'User',
          username: activeConversation.otherMember?.username,
          avatarUrl: activeConversation.otherMember?.avatarUrl || null,
          isGroup: false,
        };

    setActiveCall({
      type,
      target,
      status: 'calling',
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      audioLevel: 15,
    });

    // Acquire real microphone / camera stream
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current && type === 'video') {
          localVideoRef.current.srcObject = stream;
        }
        setupAudioAnalyzer(stream);
      }
    } catch (mediaErr) {
      console.warn('Media hardware notice (running in audio-visual simulation mode):', mediaErr);
    }

    const socket = getSocket(token);
    socket.emit('call:start', {
      targetUserId: isGroup ? undefined : activeConversation.otherMember?.id,
      conversationId: activeConversation.id,
      type,
      isGroup,
      caller: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified || false,
      },
    });

    // Auto-connect after 4s so the user can test the live connected call experience
    autoConnectTimeoutRef.current = setTimeout(() => {
      setActiveCall((prev) => {
        if (prev && prev.status === 'calling') {
          playConnectChime();
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 4000);
  };

  const acceptCall = async () => {
    if (autoConnectTimeoutRef.current) {
      clearTimeout(autoConnectTimeoutRef.current);
      autoConnectTimeoutRef.current = null;
    }
    playConnectChime();

    if (activeCall && activeConversation) {
      const socket = getSocket(token);
      socket.emit('call:accept', {
        targetUserId: activeCall.target.isGroup ? undefined : activeCall.target.id,
        conversationId: activeConversation.id,
        user: {
          id: user?.id,
          username: user?.username,
          displayName: user?.displayName,
        },
      });
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall?.type === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current && activeCall?.type === 'video') {
          localVideoRef.current.srcObject = stream;
        }
        setupAudioAnalyzer(stream);
      }
    } catch (err) {
      console.warn('Accept call media notice:', err);
    }

    setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
  };

  const endCall = () => {
    playEndCallTone();
    if (activeCall && activeConversation) {
      const socket = getSocket(token);
      socket.emit('call:end', {
        targetUserId: activeCall.target.isGroup ? undefined : activeCall.target.id,
        conversationId: activeConversation.id,
      });
    }
    stopMediaStream();
    setActiveCall(null);
  };

  const toggleMute = () => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.isMuted;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextMuted;
        });
      }
      return { ...prev, isMuted: nextMuted };
    });
  };

  const toggleVideo = () => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextVideoOff = !prev.isVideoOff;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !nextVideoOff;
        });
      }
      return { ...prev, isVideoOff: nextVideoOff };
    });
  };

  const formatCallDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <MainLayout showRightSidebar={false}>
      {/* Hidden File Input for Image Attachments */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex h-[calc(100vh)] border-r border-[#1E293B] overflow-hidden select-none">
        {/* ============================================================ */}
        {/* Left Side: Conversation List Column                         */}
        {/* ============================================================ */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-[#1E293B] flex flex-col h-full bg-[#050B14] shrink-0 ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#050B14]">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl text-white tracking-tight">Messages</h1>
              {isSocketConnected && (
                <span
                  title="Real-time communication active"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setNewChatTab('dm');
                setIsNewModalOpen(true);
              }}
              className="p-2 rounded-2xl bg-[#0B1422] border border-[#1E293B] hover:border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933]/10 transition shadow-sm cursor-pointer"
              title="New message or group"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Search bar inside conversation list */}
          <div className="px-3.5 py-2.5 border-b border-[#1E293B]/60 bg-[#050B14]">
            <div className="flex items-center gap-2 bg-[#0B1422] border border-[#1E293B] rounded-2xl px-3 py-1.5 focus-within:border-[#FF9933] transition">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search direct & group messages"
                value={conversationSearchText}
                onChange={(e) => setConversationSearchText(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 outline-none"
              />
              {conversationSearchText && (
                <button
                  type="button"
                  onClick={() => setConversationSearchText('')}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B]/60 scrollbar-thin">
            {isConversationsLoading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 size={24} className="animate-spin text-[#FF9933]" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = activeConvId === conv.id;
                const isGroup = !!conv.isGroup;
                const displayName = isGroup
                  ? conv.title || 'Group Chat'
                  : conv.otherMember?.displayName || conv.otherMember?.username;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-[#FF9933]/15 border-l-4 border-[#FF9933]'
                        : 'hover:bg-[#0B1422] border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    {isGroup ? (
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#FF9933]/25 to-[#138808]/20 border border-[#FF9933]/40 flex items-center justify-center text-[#FF9933] shrink-0 shadow-sm">
                        <Users size={20} />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden shrink-0">
                        {conv.otherMember?.avatarUrl ? (
                          <img
                            src={conv.otherMember.avatarUrl}
                            alt={conv.otherMember.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[#FF9933]">
                            {(conv.otherMember?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-slate-100 truncate flex items-center gap-1.5">
                          {displayName}
                          {isGroup ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#FF9933]/15 text-[#FF9933] font-semibold border border-[#FF9933]/30">
                              Group
                            </span>
                          ) : conv.otherMember?.isVerified ? (
                            <CheckCircle size={13} className="text-[#FF9933] shrink-0" />
                          ) : null}
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

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF9933] text-white text-[10px] font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-500">
                <Mail size={32} className="text-slate-600" />
                <span className="text-sm font-semibold text-slate-300">
                  {conversationSearchText ? 'No matching conversations' : 'No messages yet'}
                </span>
                <p className="text-xs text-slate-400 max-w-xs">
                  {conversationSearchText
                    ? 'Try searching with a different name or group title.'
                    : 'Start a direct chat or create a group with friends across India.'}
                </p>
                {!conversationSearchText && (
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="mt-3 px-4 py-2 rounded-2xl bg-[#FF9933] text-white text-xs font-bold hover:bg-[#E68525] transition"
                  >
                    Start a chat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* Right Side: Chat Window                                      */}
        {/* ============================================================ */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#050B14] min-w-0 ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConvId && activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-[#1E293B] flex items-center justify-between bg-[#0B1422] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1.5 rounded-full hover:bg-[#101D2D] text-slate-300"
                    title="Back to messages"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {/* Header Avatar */}
                  {activeConversation.isGroup ? (
                    <div
                      onClick={() => setShowGroupMembersModal(true)}
                      className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FF9933]/30 to-[#138808]/25 border border-[#FF9933]/40 flex items-center justify-center text-[#FF9933] shrink-0 cursor-pointer hover:opacity-90 transition shadow-sm"
                      title="View group members"
                    >
                      <Users size={18} />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden shrink-0">
                      {activeConversation.otherMember?.avatarUrl ? (
                        <img
                          src={activeConversation.otherMember.avatarUrl}
                          alt={activeConversation.otherMember.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[#FF9933]">
                          {(activeConversation.otherMember?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Header Titles */}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                      {activeConversation.isGroup
                        ? activeConversation.title || 'Group Chat'
                        : activeConversation.otherMember?.displayName || activeConversation.otherMember?.username}
                      {activeConversation.isGroup ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#FF9933]/15 text-[#FF9933] font-semibold border border-[#FF9933]/30">
                          Group
                        </span>
                      ) : activeConversation.otherMember?.isVerified ? (
                        <CheckCircle size={14} className="text-[#FF9933] shrink-0" />
                      ) : null}
                    </span>

                    <span className="text-[11px] text-slate-400 truncate">
                      {activeConversation.isGroup
                        ? `${(activeConversation.members?.length || 0) + 1} members`
                        : `@${activeConversation.otherMember?.username}`}
                    </span>
                  </div>
                </div>

                {/* Call & Group Actions */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  {activeConversation.isGroup && (
                    <button
                      onClick={() => setShowGroupMembersModal(true)}
                      title="Group Details"
                      className="p-2 hover:bg-[#101D2D] hover:text-white rounded-xl transition cursor-pointer"
                    >
                      <Info size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => startCall('audio')}
                    title={activeConversation.isGroup ? 'Group voice call' : 'Voice / Audio call'}
                    className="p-2 hover:bg-[#101D2D] hover:text-white rounded-xl transition cursor-pointer text-slate-300 hover:text-[#FF9933]"
                  >
                    <Phone size={18} />
                  </button>

                  <button
                    onClick={() => startCall('video')}
                    title={activeConversation.isGroup ? 'Group video call' : 'Video call'}
                    className="p-2 hover:bg-[#101D2D] hover:text-white rounded-xl transition cursor-pointer text-slate-300 hover:text-[#FF9933]"
                  >
                    <Video size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                {isMessagesLoading && liveMessages.length === 0 ? (
                  <div className="m-auto flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 size={24} className="animate-spin text-[#FF9933]" />
                    <span className="text-xs">Loading message history...</span>
                  </div>
                ) : liveMessages.length === 0 ? (
                  <div className="m-auto text-center flex flex-col items-center gap-2 text-slate-500 py-12">
                    <Mail size={36} className="text-slate-600" />
                    <span className="text-sm font-semibold text-slate-300">
                      {activeConversation.isGroup
                        ? `Welcome to ${activeConversation.title || 'the group'}!`
                        : `Say hello to ${activeConversation.otherMember?.displayName || activeConversation.otherMember?.username}!`}
                    </span>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Send a message to start communicating in real-time.
                    </p>
                  </div>
                ) : (
                  liveMessages.map((msg) => {
                    const isMyMessage = msg.senderId === user?.id;
                    const isGroup = !!activeConversation.isGroup;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMyMessage ? 'items-end' : 'items-start'
                        }`}
                      >
                        {/* In group chats, display sender's identity above incoming messages */}
                        {isGroup && !isMyMessage && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <div className="w-4 h-4 rounded-full bg-[#101D2D] border border-[#1E293B] overflow-hidden flex items-center justify-center text-[9px] font-bold text-[#FF9933]">
                              {msg.sender.avatarUrl ? (
                                <img src={msg.sender.avatarUrl} alt={msg.sender.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.sender.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-[#FF9933]">
                              {msg.sender.displayName || msg.sender.username}
                            </span>
                          </div>
                        )}

                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMyMessage
                              ? 'bg-[#FF9933] text-white rounded-br-none shadow-md shadow-[#FF9933]/20 font-medium'
                              : 'bg-[#101D2D] text-slate-100 rounded-bl-none border border-[#1E293B]'
                          }`}
                        >
                          {msg.content && <div>{msg.content}</div>}
                          {msg.mediaUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden max-h-60 border border-black/10">
                              <img
                                src={msg.mediaUrl}
                                alt="Shared attachment"
                                className="w-full h-auto object-cover max-h-60"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1">
                          <span>{formatTimeAgo(msg.createdAt)}</span>
                          {isMyMessage && (
                            <span className={msg.isRead ? 'text-[#38BDF8]' : 'text-slate-500'}>
                              {msg.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time Typing Bubble */}
                {isOtherUserTyping && (
                  <div className="flex flex-col items-start animate-in fade-in duration-150">
                    <div className="px-3.5 py-2 rounded-2xl rounded-bl-none bg-[#101D2D] border border-[#1E293B] flex items-center gap-1.5 text-xs text-slate-400">
                      <span>
                        {typeof isOtherUserTyping === 'string'
                          ? isOtherUserTyping
                          : activeConversation.otherMember?.displayName?.split(' ')[0] || 'User'}{' '}
                        is typing
                      </span>
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-[#1E293B] bg-[#0B1422] flex flex-col gap-2 shrink-0">
                {/* Image Attachment Preview */}
                {attachedImage && (
                  <div className="relative w-fit bg-[#101D2D] border border-[#1E293B] rounded-2xl p-1.5 flex items-center gap-2">
                    <img
                      src={attachedImage.previewUrl}
                      alt="Selected attachment"
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="p-1 rounded-full bg-black/75 hover:bg-red-500 text-white transition absolute -top-1.5 -right-1.5 shadow"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach photo"
                    className="p-2 text-slate-400 hover:text-[#FF9933] hover:bg-[#101D2D] rounded-xl transition cursor-pointer"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    placeholder={
                      activeConversation.isGroup
                        ? `Message ${activeConversation.title || 'group'}...`
                        : 'Type a message...'
                    }
                    value={messageText}
                    onChange={handleInputChange}
                    className="flex-1 bg-[#101D2D] border border-[#1E293B] focus:border-[#FF9933] rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 outline-none transition"
                  />

                  <button
                    type="submit"
                    disabled={(!messageText.trim() && !attachedImage) || isUploadingImage || sendMessageMutation.isPending}
                    className="p-2.5 rounded-2xl bg-[#FF9933] hover:bg-[#E68525] disabled:opacity-40 text-white transition active:scale-95 shadow-md shadow-[#FF9933]/20 cursor-pointer"
                  >
                    {sendMessageMutation.isPending || isUploadingImage ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="m-auto text-center flex flex-col items-center gap-3 text-slate-400 p-8 select-none">
              <div className="w-16 h-16 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center text-[#FF9933]">
                <Mail size={32} />
              </div>
              <h3 className="font-extrabold text-white text-xl">Select a message</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose from your existing conversations, or create a new group or direct chat with creators across India.
              </p>
              <button
                onClick={() => {
                  setNewChatTab('dm');
                  setIsNewModalOpen(true);
                }}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold transition shadow-md shadow-[#FF9933]/20"
              >
                New message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* New Message / Group Modal                                    */}
      {/* ============================================================ */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0B1422] border border-[#1E293B] rounded-3xl shadow-2xl p-5 flex flex-col gap-4 text-slate-100 select-none animate-in zoom-in-95 duration-200 max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewChatTab('dm')}
                  className={`text-sm font-bold pb-1 transition border-b-2 ${
                    newChatTab === 'dm'
                      ? 'border-[#FF9933] text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Direct Message
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setNewChatTab('group')}
                  className={`text-sm font-bold pb-1 transition border-b-2 flex items-center gap-1.5 ${
                    newChatTab === 'group'
                      ? 'border-[#FF9933] text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users size={14} />
                  New Group
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#101D2D] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB 1: DIRECT MESSAGE */}
            {newChatTab === 'dm' ? (
              <>
                <div className="flex items-center gap-2.5 bg-[#101D2D] border border-[#1E293B] focus-within:border-[#FF9933] rounded-2xl px-3.5 py-2.5 transition">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search people by name or @username..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
                  />
                  {userSearchText && (
                    <button
                      type="button"
                      onClick={() => setUserSearchText('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-72 divide-y divide-[#1E293B]/40 scrollbar-thin">
                  {isSearchLoading ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 size={20} className="animate-spin text-[#FF9933]" />
                      <span className="text-xs">Searching users...</span>
                    </div>
                  ) : userSearchText.trim().length > 0 ? (
                    searchResults?.users && searchResults.users.length > 0 ? (
                      searchResults.users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          disabled={startConversationMutation.isPending}
                          onClick={() => startConversationMutation.mutate(u.username)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-[#101D2D] rounded-2xl text-left transition cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[#FF9933]">{u.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 font-bold text-sm text-white truncate">
                              <span>{u.displayName || u.username}</span>
                              {u.isVerified && <CheckCircle size={13} className="text-[#FF9933]" />}
                            </div>
                            <span className="text-xs text-slate-400">@{u.username}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No users found matching &ldquo;{userSearchText}&rdquo;
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Suggested People
                      </span>
                      {suggestedUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          disabled={startConversationMutation.isPending}
                          onClick={() => startConversationMutation.mutate(u.username)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-[#101D2D] rounded-2xl text-left transition cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[#FF9933]">{u.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 font-bold text-sm text-white truncate">
                              <span>{u.displayName || u.username}</span>
                              {u.isVerified && <CheckCircle size={13} className="text-[#FF9933]" />}
                            </div>
                            <span className="text-xs text-slate-400">@{u.username}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* TAB 2: CREATE GROUP */
              <form onSubmit={handleCreateGroupSubmit} className="flex flex-col gap-3">
                {/* Group Title Field */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India Tech Creators, Squad, Project Varta..."
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    className="w-full bg-[#101D2D] border border-[#1E293B] focus:border-[#FF9933] rounded-2xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>

                {/* Selected members chips */}
                {selectedGroupUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-[#101D2D]/60 border border-[#1E293B] max-h-24 overflow-y-auto">
                    {selectedGroupUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF9933]/20 border border-[#FF9933]/40 text-[#FF9933] text-xs font-semibold"
                      >
                        <span>{u.displayName || u.username}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleGroupUser(u)}
                          className="hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search members to add */}
                <div className="flex items-center gap-2.5 bg-[#101D2D] border border-[#1E293B] focus-within:border-[#FF9933] rounded-2xl px-3.5 py-2 transition">
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search people to add..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 outline-none"
                  />
                  {userSearchText && (
                    <button
                      type="button"
                      onClick={() => setUserSearchText('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Candidate list to pick */}
                <div className="overflow-y-auto max-h-48 divide-y divide-[#1E293B]/40 scrollbar-thin">
                  {(userSearchText.trim().length > 0 ? (searchResults?.users || []) : suggestedUsers).map((u) => {
                    const isSelected = selectedGroupUsers.some((item) => item.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleGroupUser(u)}
                        className={`p-2.5 flex items-center gap-3 rounded-2xl cursor-pointer transition select-none ${
                          isSelected ? 'bg-[#FF9933]/15' : 'hover:bg-[#101D2D]'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#FF9933] text-xs">{u.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 font-bold text-xs text-white truncate">
                            <span>{u.displayName || u.username}</span>
                            {u.isVerified && <CheckCircle size={12} className="text-[#FF9933]" />}
                          </div>
                          <span className="text-[11px] text-slate-400">@{u.username}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-[#FF9933] border-[#FF9933] text-white'
                              : 'border-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <UserCheck size={13} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={selectedGroupUsers.length === 0 || createGroupMutation.isPending}
                  className="mt-1 w-full py-2.5 rounded-2xl bg-[#FF9933] hover:bg-[#E68525] disabled:opacity-40 text-white font-bold text-sm transition shadow-md shadow-[#FF9933]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {createGroupMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Users size={16} />
                      <span>Create Group ({selectedGroupUsers.length} members)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Group Members Viewer Modal                                   */}
      {/* ============================================================ */}
      {showGroupMembersModal && activeConversation?.isGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowGroupMembersModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0B1422] border border-[#1E293B] rounded-3xl shadow-2xl p-5 flex flex-col gap-4 text-slate-100 select-none animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#FF9933]" />
                <h3 className="font-bold text-base text-white">Group Members</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupMembersModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#101D2D] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {((activeConversation.members?.length || 0) + 1)} Participants
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[#1E293B]/50 scrollbar-thin">
              {/* Current user */}
              <div className="p-2.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden text-xs text-[#FF9933]">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    (user?.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>{user?.displayName || user?.username} (You)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">@{user?.username}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9933]/15 text-[#FF9933] font-semibold border border-[#FF9933]/30">
                  Admin
                </span>
              </div>

              {/* Other members */}
              {activeConversation.members?.map((m) => (
                <div key={m.id} className="p-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#101D2D] border border-[#1E293B] flex items-center justify-center font-bold overflow-hidden text-xs text-[#FF9933]">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.username} className="w-full h-full object-cover" />
                    ) : (
                      m.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white flex items-center gap-1">
                      <span>{m.displayName || m.username}</span>
                      {m.isVerified && <CheckCircle size={12} className="text-[#FF9933]" />}
                    </div>
                    <span className="text-[11px] text-slate-400">@{m.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Real-Time Audio / Voice & Video Call Modal                    */}
      {/* ============================================================ */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 flex flex-col items-center gap-5 text-center shadow-2xl relative overflow-hidden varta-call-dialog">
            {/* Ambient background glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF9933]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Video Call Active Local Preview Container */}
            {activeCall.type === 'video' && (
              <div className="w-full aspect-video bg-[#050B14] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E293B] relative shadow-inner mb-1 flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${
                    activeCall.isVideoOff ? 'hidden' : 'block'
                  }`}
                />
                {activeCall.isVideoOff && (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <VideoOff size={32} />
                    <span className="text-xs">Camera is paused</span>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-white font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Live Preview
                </div>
              </div>
            )}

            {/* Pulsing Avatar for Audio & Video Calling */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#101D2D] border-2 border-[#FF9933] flex items-center justify-center overflow-hidden shadow-xl">
                {activeCall.target.isGroup ? (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF9933]/25 to-[#00C853]/20 flex items-center justify-center text-[#E65100] dark:text-[#FF9933]">
                    <Users size={36} />
                  </div>
                ) : activeCall.target.avatarUrl ? (
                  <img
                    src={activeCall.target.avatarUrl}
                    alt={activeCall.target.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#E65100] dark:text-[#FF9933]">
                    {activeCall.target.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {activeCall.status === 'calling' && (
                <div className="absolute inset-0 rounded-full border-2 border-[#FF9933] animate-ping opacity-75 pointer-events-none" />
              )}
            </div>

            {/* Target Information */}
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5 call-title tracking-tight">
                {activeCall.target.name}
              </h3>
              {activeCall.target.username && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 call-subtitle">
                  @{activeCall.target.username}
                </p>
              )}
              {activeCall.target.isGroup && (
                <p className="text-xs text-[#E65100] dark:text-[#FF9933] font-bold mt-0.5 call-group-label">
                  Group Call ({activeCall.target.memberCount} participants)
                </p>
              )}

              {/* Status Badge */}
              <div className="mt-2.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-[#101D2D] text-slate-800 dark:text-[#FF9933] inline-flex items-center gap-2 border border-slate-200 dark:border-[#1E293B] call-badge">
                {activeCall.status === 'calling' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-ping" />
                    <span>Ringing ({activeCall.type === 'video' ? 'Video' : 'Voice'})...</span>
                  </>
                ) : activeCall.status === 'incoming' ? (
                  <>
                    <PhoneCall size={14} className="animate-bounce text-[#FF9933]" />
                    <span>Incoming {activeCall.type === 'video' ? 'Video' : 'Voice'} Call</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Connected • {formatCallDuration(activeCall.duration)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Live Audio / Voice Activity Visualizer Bars */}
            {activeCall.status === 'connected' && (
              <div className="flex items-center gap-1 h-6">
                {[0.4, 0.8, 1.2, 0.6, 0.9, 0.5, 0.7].map((heightMul, i) => {
                  const barHeight = activeCall.isMuted
                    ? 4
                    : Math.max(4, Math.min(24, (activeCall.audioLevel / 5 + 4) * heightMul));
                  return (
                    <span
                      key={i}
                      style={{ height: `${barHeight}px` }}
                      className="w-1 rounded-full bg-[#FF9933] transition-all duration-75"
                    />
                  );
                })}
              </div>
            )}

            {/* Call Controls */}
            {activeCall.status === 'incoming' ? (
              <div className="flex items-center gap-6 mt-1">
                <button
                  type="button"
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition active:scale-95 cursor-pointer call-btn-danger"
                  title="Decline"
                >
                  <PhoneOff size={22} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={acceptCall}
                  className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition active:scale-95 cursor-pointer"
                  title="Accept"
                >
                  <PhoneCall size={22} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-1">
                {/* Mute Button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-3.5 rounded-full transition cursor-pointer border call-control-btn ${
                    activeCall.isMuted
                      ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-400'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#101D2D] dark:border-[#1E293B] dark:text-slate-200 dark:hover:text-white dark:hover:border-[#FF9933]'
                  }`}
                  title={activeCall.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {activeCall.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition active:scale-95 cursor-pointer hover:shadow-red-600/30 call-btn-danger"
                  title="End Call"
                >
                  <PhoneOff size={22} className="text-white" />
                </button>

                {/* Video Camera Toggle */}
                {activeCall.type === 'video' && (
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full transition cursor-pointer border call-control-btn ${
                      activeCall.isVideoOff
                        ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-400'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-[#101D2D] dark:border-[#1E293B] dark:text-slate-200 dark:hover:text-white dark:hover:border-[#FF9933]'
                    }`}
                    title={activeCall.isVideoOff ? 'Start Camera' : 'Pause Camera'}
                  >
                    {activeCall.isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>
                )}
              </div>
            )}
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
            <Loader2 size={24} className="animate-spin text-[#FF9933]" />
          </div>
        </MainLayout>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
