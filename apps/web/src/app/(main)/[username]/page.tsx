'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  Lock,
  Mail,
  MoreHorizontal,
  Loader2,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '../../../components/layout/MainLayout';
import { PostCard } from '../../../components/feed/PostCard';
import { apiRequest } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';
import { UserProfileDetails, PostItem, PaginatedResponse } from '@varta/shared';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  // 1. Fetch Profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<UserProfileDetails>({
    queryKey: ['profile', username],
    queryFn: () => apiRequest(`/users/${username}`),
  });

  // 2. Fetch User Timeline Posts
  const { data: timelineData, isLoading: isTimelineLoading } = useQuery<
    PaginatedResponse<PostItem>
  >({
    queryKey: ['user-posts', username],
    queryFn: () => apiRequest(`/feed/user/${username}?limit=30`),
    enabled: !!profile && (!profile.isPrivate || profile.isFollowing || currentUser?.username === username),
  });

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/social/follow/${username}`, {
        method: profile?.isFollowing ? 'DELETE' : 'POST',
      }),
    onSuccess: () => {
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Block Mutation
  const blockMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/social/block/${username}`, {
        method: profile?.isBlocked ? 'DELETE' : 'POST',
      }),
    onSuccess: () => {
      refetchProfile();
    },
  });

  // Profile Edit Mutation
  const editProfileMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetchProfile();
    },
  });

  const handleEditOpen = () => {
    if (!profile) return;
    setEditDisplayName(profile.displayName || '');
    setEditBio(profile.bio || '');
    setEditLocation(profile.location || '');
    setEditWebsite(profile.website || '');
    setIsEditModalOpen(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    editProfileMutation.mutate({
      displayName: editDisplayName.trim(),
      bio: editBio.trim(),
      location: editLocation.trim(),
      website: editWebsite.trim(),
    });
  };

  const handleStartDM = async () => {
    try {
      const res = await apiRequest('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      router.push(`/messages?id=${res.conversationId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const isOwnProfile = currentUser?.username?.toLowerCase() === username.toLowerCase();

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A] px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-[#191F2B] text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1">
            {profile?.displayName || username}
            {profile?.isVerified && (
              <CheckCircle size={14} className="text-blue-400 fill-blue-500/20" />
            )}
          </h2>
          <span className="text-xs text-slate-400">
            {profile?.postCount || 0} Baatein
          </span>
        </div>
      </div>

      {isProfileLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-sm">Loading profile...</span>
        </div>
      ) : profileError || !profile ? (
        <div className="p-12 text-center text-red-400 text-sm">
          User @{username} does not exist or has deactivated their account.
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Header Cover Photo */}
          <div className="h-44 sm:h-56 w-full bg-slate-800 relative overflow-hidden">
            {profile.coverUrl ? (
              <img
                src={profile.coverUrl}
                alt="Profile cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900" />
            )}
          </div>

          {/* Profile Meta & Actions Bar */}
          <div className="px-4 pb-4 border-b border-[#252D3A] flex flex-col gap-3">
            <div className="flex items-end justify-between -mt-16 sm:-mt-20">
              {/* Avatar */}
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-slate-900 border-4 border-[#090B10] flex items-center justify-center text-blue-400 font-bold text-3xl overflow-hidden ring-1 ring-blue-500/30">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-1">
                {isOwnProfile ? (
                  <button
                    onClick={handleEditOpen}
                    className="px-4 py-2 rounded-full border border-[#252D3A] hover:bg-[#191F2B] text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    Edit profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleStartDM}
                      className="p-2 rounded-full border border-[#252D3A] hover:bg-[#191F2B] text-slate-200 transition"
                      title="Direct Message"
                    >
                      <Mail size={16} />
                    </button>

                    <button
                      onClick={() => blockMutation.mutate()}
                      className={`px-3 py-1.5 rounded-full border text-xs font-bold transition ${
                        profile.isBlocked
                          ? 'border-red-500/50 bg-red-500/10 text-red-400'
                          : 'border-[#252D3A] hover:border-red-500/40 text-slate-400 hover:text-red-400'
                      }`}
                    >
                      {profile.isBlocked ? 'Blocked' : 'Block'}
                    </button>

                    <button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition active:scale-95 shadow-md ${
                        profile.isFollowing
                          ? 'border border-[#252D3A] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-slate-200'
                          : profile.isPendingFollow
                          ? 'bg-[#191F2B] text-slate-300'
                          : 'bg-white hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      {profile.isFollowing
                        ? 'Following'
                        : profile.isPendingFollow
                        ? 'Requested'
                        : 'Follow'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Names & Handle */}
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-100 flex items-center gap-1.5">
                {profile.displayName || profile.username}
                {profile.isVerified && (
                  <CheckCircle size={18} className="text-blue-400 fill-blue-500/20" />
                )}
                {profile.isPrivate && (
                  <span title="Private Account">
                    <Lock size={14} className="text-slate-400" />
                  </span>
                )}
              </h1>
              <span className="text-xs text-slate-400">@{profile.username}</span>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Details: Location, Website, Joined Date */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon size={14} />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Followers & Following Counts */}
            <div className="flex items-center gap-5 text-xs text-slate-400 mt-1">
              <Link
                href={`/${profile.username}/following`}
                className="hover:underline flex items-center gap-1"
              >
                <strong className="text-slate-100 font-bold">{profile.followingCount}</strong> Following
              </Link>
              <Link
                href={`/${profile.username}/followers`}
                className="hover:underline flex items-center gap-1"
              >
                <strong className="text-slate-100 font-bold">{profile.followersCount}</strong> Followers
              </Link>
            </div>
          </div>

          {/* Private Account Shield */}
          {profile.isPrivate && !profile.isFollowing && !isOwnProfile ? (
            <div className="p-16 text-center flex flex-col items-center gap-3 text-slate-400">
              <div className="p-4 rounded-full bg-[#11151D] border border-[#252D3A] text-slate-300">
                <Lock size={28} />
              </div>
              <h3 className="font-bold text-slate-100 text-lg">These Baatein are protected</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Only approved followers can see @{profile.username}&apos;s posts and media.
              </p>
            </div>
          ) : (
            <>
              {/* Profile Tabs */}
              <div className="flex border-b border-[#252D3A]">
                {(['posts', 'media', 'likes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs sm:text-sm font-semibold capitalize transition relative ${
                      activeTab === tab
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 inset-x-8 h-1 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex flex-col">
                {isTimelineLoading ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    Loading posts...
                  </div>
                ) : timelineData?.items && timelineData.items.length > 0 ? (
                  timelineData.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400">
                    @{profile.username} hasn&apos;t posted any Baatein yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11151D] border border-[#252D3A] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100">Edit Profile</h3>
            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="bg-[#191F2B] border border-[#252D3A] rounded-xl px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="bg-[#191F2B] border border-[#252D3A] rounded-xl px-3 py-2 text-sm text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. New Delhi, India"
                  className="bg-[#191F2B] border border-[#252D3A] rounded-xl px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Website</label>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="bg-[#191F2B] border border-[#252D3A] rounded-xl px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#252D3A]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProfileMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
