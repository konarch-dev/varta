'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Plus, Check, Loader2, ArrowLeft, MessageSquare, Heart, Repeat, Video as VideoIcon, Image as ImageIcon, X, Globe, Lock } from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { useRouter } from 'next/navigation';
import { PostCard } from '../../../components/feed/PostCard';

interface CommunityItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  avatarUrl: string;
  coverUrl: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  createdAt: string;
}

export default function CommunitiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);

  // Create Community Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommCategory, setNewCommCategory] = useState('India Trends');
  const [newCommAvatarUrl, setNewCommAvatarUrl] = useState('');
  const [newCommIsPrivate, setNewCommIsPrivate] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const categories = [
    'All',
    'India Trends',
    'Technology',
    'Travel',
    'Food',
    'Lifestyle',
    'Fitness & Health',
    'Sports',
    'Entertainment',
    'My Communities',
  ];

  // Fetch communities from backend
  const { data: communitiesData, isLoading } = useQuery({
    queryKey: ['communities', activeCategory, searchQuery],
    queryFn: async () => {
      const isJoined = activeCategory === 'My Communities';
      const catParam = !isJoined && activeCategory !== 'All' ? encodeURIComponent(activeCategory) : '';
      const searchParam = searchQuery.trim() ? encodeURIComponent(searchQuery.trim()) : '';
      
      const queryParts = [];
      if (catParam) queryParts.push(`category=${catParam}`);
      if (searchParam) queryParts.push(`search=${searchParam}`);
      if (isJoined) queryParts.push(`joined=true`);
      queryParts.push(`limit=100`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const res = await apiRequest(`/explore/communities${queryString}`);
      return res.items as CommunityItem[];
    },
  });

  // Fetch posts for selected community
  const {
    data: communityPostsData,
    isLoading: isLoadingPosts,
    refetch: refetchCommunityPosts,
  } = useQuery({
    queryKey: ['communityPosts', selectedCommunity?.id],
    queryFn: async () => {
      if (!selectedCommunity) return [];
      const res = await apiRequest(`/explore/communities/${selectedCommunity.id}/posts?limit=50`);
      return res.items || [];
    },
    enabled: !!selectedCommunity,
  });

  // Toggle Join Mutation
  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return await apiRequest(`/explore/communities/${communityId}/join`, {
        method: 'POST',
      });
    },
    onMutate: async (communityId) => {
      // Optimistic update
      queryClient.setQueryData(['communities', activeCategory, searchQuery], (old: CommunityItem[] | undefined) => {
        if (!old) return old;
        return old.map((c) =>
          c.id === communityId
            ? {
                ...c,
                isJoined: !c.isJoined,
                memberCount: c.isJoined ? Math.max(0, c.memberCount - 1) : c.memberCount + 1,
              }
            : c
        );
      });
      if (selectedCommunity && selectedCommunity.id === communityId) {
        setSelectedCommunity((prev) =>
          prev
            ? {
                ...prev,
                isJoined: !prev.isJoined,
                memberCount: prev.isJoined ? Math.max(0, prev.memberCount - 1) : prev.memberCount + 1,
              }
            : null
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const handleToggleJoin = (e: React.MouseEvent, c: CommunityItem) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    joinMutation.mutate(c.id);
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!newCommName.trim()) {
      alert('Please enter a community name');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res: any = await apiRequest('/explore/communities', {
        method: 'POST',
        body: JSON.stringify({
          name: newCommName.trim(),
          description: newCommDesc.trim() || undefined,
          category: newCommCategory,
          avatarUrl: newCommAvatarUrl.trim() || undefined,
          isPrivate: newCommIsPrivate,
        }),
      });

      alert(`Community "${res.name}" created successfully!`);
      setCreateModalOpen(false);
      setNewCommName('');
      setNewCommDesc('');
      setNewCommAvatarUrl('');
      setNewCommIsPrivate(false);
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      if (res.id) {
        setSelectedCommunity(res);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create community');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const communities = communitiesData || [];

  return (
    <MainLayout>
      {selectedCommunity ? (
        // ---------------- COMMUNITY DETAIL & POSTS VIEW ----------------
        <div className="min-h-screen pb-20">
          {/* Header banner */}
          <div className="relative h-44 sm:h-52 w-full bg-[#101D2D] overflow-hidden">
            <img
              src={selectedCommunity.coverUrl || selectedCommunity.avatarUrl}
              alt={selectedCommunity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/40 to-transparent" />
            <button
              onClick={() => setSelectedCommunity(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft size={16} />
              <span>Back to Communities</span>
            </button>
          </div>

          {/* Community Info bar */}
          <div className="px-4 pb-4 -mt-10 relative z-10 flex flex-col gap-3 border-b border-[#1E293B]">
            <div className="flex items-end justify-between gap-4">
              <div className="h-20 w-20 rounded-2xl overflow-hidden bg-[#101D2D] border-2 border-[#050B14] shadow-xl shrink-0">
                <img
                  src={selectedCommunity.avatarUrl}
                  alt={selectedCommunity.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <button
                onClick={(e) => handleToggleJoin(e, selectedCommunity)}
                className={`py-2 px-6 rounded-full text-xs font-bold transition shadow-md active:scale-95 ${
                  selectedCommunity.isJoined
                    ? 'bg-transparent border border-[#1E293B] text-slate-200 hover:border-red-500 hover:text-red-400'
                    : 'bg-[#FF9933] hover:bg-[#E68525] text-white shadow-[#FF9933]/20'
                }`}
              >
                {selectedCommunity.isJoined ? (
                  <span className="flex items-center gap-1.5">
                    <Check size={14} className="text-[#00C853]" /> Joined
                  </span>
                ) : (
                  'Join Community'
                )}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">{selectedCommunity.name}</h1>
                <span className="community-category-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9933]/15 text-[#FF9933] border border-[#FF9933]/30">
                  {selectedCommunity.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedCommunity.memberCount.toLocaleString()} members • {selectedCommunity.postCount || 50} active posts with videos & media
              </p>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {selectedCommunity.description}
              </p>
            </div>
          </div>

          {/* Community Posts Feed */}
          <div className="p-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              Community Posts ({communityPostsData?.length || 0})
            </h2>

            {isLoadingPosts ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={30} className="animate-spin text-[#FF9933]" />
                <span className="text-xs text-slate-400">Loading community discussions & media...</span>
              </div>
            ) : communityPostsData && communityPostsData.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#1E293B]">
                {communityPostsData.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostDeleted={() => refetchCommunityPosts()}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                No posts in this community yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        // ---------------- COMMUNITIES BROWSER LIST ----------------
        <>
          {/* Header & Search */}
          <div className="sticky top-0 z-30 bg-[#050B14]/90 backdrop-blur-md border-b border-[#1E293B] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-white">Communities</h1>
                <p className="text-xs text-slate-400">
                  Explore active communities with posts, discussions & media
                </p>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                    return;
                  }
                  setCreateModalOpen(true);
                }}
                className="px-4 py-2 bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-[#FF9933]/25 shrink-0"
              >
                <Plus size={15} />
                Create Community
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search across 500 communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B1422] border border-[#1E293B] focus:border-[#FF9933] rounded-2xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none transition"
              />
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    activeCategory === cat
                      ? 'bg-[#FF9933] text-white shadow-sm'
                      : 'bg-[#0B1422] text-slate-400 hover:text-white border border-[#1E293B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Community Cards Grid */}
          <div className="p-4 flex flex-col gap-3 min-h-[500px]">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#FF9933]" />
                <span className="text-xs text-slate-400">Loading communities...</span>
              </div>
            ) : communities.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <Users size={40} className="text-slate-600 mb-2" />
                <span className="text-base font-bold text-white">No communities found</span>
                <span className="text-xs text-slate-400 mt-1">Try another search term or category</span>
              </div>
            ) : (
              communities.map((c) => {
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCommunity(c)}
                    className="p-4 bg-[#0B1422] border border-[#1E293B] rounded-3xl hover:border-[#FF9933]/50 transition flex items-center justify-between gap-4 group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#101D2D] border border-[#1E293B] shrink-0">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-white group-hover:text-[#FF9933] transition truncate">
                            {c.name}
                          </span>
                          <span className="community-category-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9933]/15 text-[#FF9933] border border-[#FF9933]/30 shrink-0">
                            {c.category}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 truncate mt-0.5">
                          {c.memberCount.toLocaleString()} members • {c.postCount || 50} posts
                        </span>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                          {c.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleJoin(e, c)}
                      className={`py-2 px-5 rounded-full text-xs font-bold transition shrink-0 shadow-sm active:scale-95 ${
                        c.isJoined
                          ? 'bg-transparent border border-[#1E293B] text-slate-300 hover:border-red-500 hover:text-red-400'
                          : 'bg-white hover:bg-slate-200 text-black'
                      }`}
                    >
                      {c.isJoined ? (
                        <span className="flex items-center gap-1">
                          <Check size={13} className="text-[#00C853]" /> Joined
                        </span>
                      ) : (
                        'Join'
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* MODAL: CREATE NEW COMMUNITY */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#101D2D]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF9933]/20 border border-[#FF9933]/40 flex items-center justify-center text-[#FF9933]">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create New Community</h3>
                  <p className="text-[11px] text-slate-400">Build a community for discussions, news & media</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCommunity} className="p-5 flex flex-col gap-4">
              {/* Community Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Community Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. India Techies, Cricket Buffs, Bollywood Corner"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={newCommCategory}
                  onChange={(e) => setNewCommCategory(e.target.value)}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF9933]"
                >
                  {categories.filter((c) => c !== 'All' && c !== 'My Communities').map((cat) => (
                    <option key={cat} value={cat}>
                      🏷️ {cat}
                    </option>
                  ))}
                  <option value="General">🏷️ General</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                  <span>Description</span>
                  <span className="text-[10px] text-slate-500">{newCommDesc.length}/500</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="What is this community about? Share discussion guidelines and topics."
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  maxLength={500}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933] resize-none"
                />
              </div>

              {/* Avatar / Profile URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                  <span>Community Profile Picture / Avatar URL</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <div className="relative">
                  <ImageIcon size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or image link"
                    value={newCommAvatarUrl}
                    onChange={(e) => setNewCommAvatarUrl(e.target.value)}
                    className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                  />
                </div>
                {newCommAvatarUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-[#101D2D] border border-[#1E293B] rounded-xl">
                    <img
                      src={newCommAvatarUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => ((e.target as any).style.display = 'none')}
                    />
                    <span className="text-[11px] text-slate-300">Avatar preview loaded</span>
                  </div>
                )}
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Privacy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCommIsPrivate(false)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      !newCommIsPrivate
                        ? 'bg-[#FF9933]/15 border-[#FF9933] text-white'
                        : 'bg-[#101D2D] border-[#1E293B] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Globe size={13} className={!newCommIsPrivate ? 'text-[#FF9933]' : ''} />
                      Public
                    </span>
                    <span className="text-[10px] text-slate-400">Anyone can view & join</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCommIsPrivate(true)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      newCommIsPrivate
                        ? 'bg-[#FF9933]/15 border-[#FF9933] text-white'
                        : 'bg-[#101D2D] border-[#1E293B] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Lock size={13} className={newCommIsPrivate ? 'text-[#FF9933]' : ''} />
                      Private
                    </span>
                    <span className="text-[10px] text-slate-400">Restricted membership</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !newCommName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-[#FF9933]/25"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Create Community
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
