'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  AlertTriangle,
  Lock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Plus,
  Search,
  Filter,
  Ban,
  Unlock,
  Trash2,
  ExternalLink,
  BadgeCheck,
  Layers,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
  ShieldAlert,
  Globe,
  Radio,
  Clock,
  Sparkles,
  Eye,
  Video,
  Hash,
  Camera,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { VartaLogo } from '../../components/common/VartaLogo';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { ReportStatus, ModerationActionType, Role } from '@varta/shared';

type AdminTab = 'overview' | 'users' | 'posts' | 'groups' | 'reports' | 'audit';

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // --- Search & Filters State ---
  // Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Posts tab
  const [postSearch, setPostSearch] = useState('');
  const [postBlockedFilter, setPostBlockedFilter] = useState('');
  const [postGroupIdFilter, setPostGroupIdFilter] = useState('');
  const [postPage, setPostPage] = useState(1);

  // Groups tab
  const [groupSearch, setGroupSearch] = useState('');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState('');
  const [groupPage, setGroupPage] = useState(1);

  // Inspecting specific group posts
  const [inspectingGroup, setInspectingGroup] = useState<any | null>(null);
  const [inspectingGroupSearch, setInspectingGroupSearch] = useState('');
  const [inspectingGroupBlockedFilter, setInspectingGroupBlockedFilter] = useState('');
  const [inspectingGroupPage, setInspectingGroupPage] = useState(1);

  // Reports tab
  const [selectedReportStatus, setSelectedReportStatus] = useState<ReportStatus>(ReportStatus.PENDING);

  // Modals state
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [selectedGroupForPost, setSelectedGroupForPost] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [newPostVideoUrl, setNewPostVideoUrl] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  // News Feed Integration State
  const [postSourceType, setPostSourceType] = useState<'manual' | 'newsapi' | 'newsdata'>('manual');
  const [feedUrl, setFeedUrl] = useState('');
  const [isFetchingFeed, setIsFetchingFeed] = useState(false);
  const [fetchedArticles, setFetchedArticles] = useState<any[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isBatchImporting, setIsBatchImporting] = useState(false);

  // Group Avatar Update Modal State
  const [editAvatarGroup, setEditAvatarGroup] = useState<any | null>(null);
  const [groupAvatarUrlInput, setGroupAvatarUrlInput] = useState('');
  const [groupAvatarTab, setGroupAvatarTab] = useState<'url' | 'upload'>('url');
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarFilePreview, setGroupAvatarFilePreview] = useState<string | null>(null);
  const [groupAvatarSubmitting, setGroupAvatarSubmitting] = useState(false);

  // Admin Create Community Group Modal State
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('India Trends');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAvatarUrl, setNewGroupAvatarUrl] = useState('');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [createGroupSubmitting, setCreateGroupSubmitting] = useState(false);

  // Admin Profile Picture State
  const [adminAvatarModalOpen, setAdminAvatarModalOpen] = useState(false);
  const [adminAvatarTab, setAdminAvatarTab] = useState<'upload' | 'url'>('upload');
  const [adminAvatarUrlInput, setAdminAvatarUrlInput] = useState('');
  const [adminAvatarFile, setAdminAvatarFile] = useState<File | null>(null);
  const [adminAvatarFilePreview, setAdminAvatarFilePreview] = useState<string | null>(null);
  const [adminAvatarSubmitting, setAdminAvatarSubmitting] = useState(false);

  // User Action Reason Modal
  const [actionUserModalOpen, setActionUserModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');

  // 1. Fetch Platform Metrics
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => apiRequest('/admin/metrics'),
    enabled: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
  });

  // 2. Fetch Users List
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch, userStatusFilter, userRoleFilter, userPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append('search', userSearch.trim());
      if (userStatusFilter) params.append('status', userStatusFilter);
      if (userRoleFilter) params.append('role', userRoleFilter);
      params.append('page', String(userPage));
      params.append('limit', '15');
      return apiRequest(`/admin/users?${params.toString()}`);
    },
    enabled: (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && activeTab === 'users',
  });

  // 3. Fetch Posts List
  const { data: postsData, isLoading: isPostsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['admin-posts', postSearch, postBlockedFilter, postGroupIdFilter, postPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (postSearch.trim()) params.append('search', postSearch.trim());
      if (postBlockedFilter) params.append('isBlocked', postBlockedFilter);
      if (postGroupIdFilter) params.append('groupId', postGroupIdFilter);
      params.append('page', String(postPage));
      params.append('limit', '15');
      return apiRequest(`/admin/posts?${params.toString()}`);
    },
    enabled: (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && activeTab === 'posts',
  });

  // 4. Fetch Groups List
  const { data: groupsData, isLoading: isGroupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['admin-groups', groupSearch, groupCategoryFilter, groupPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (groupSearch.trim()) params.append('search', groupSearch.trim());
      if (groupCategoryFilter) params.append('category', groupCategoryFilter);
      params.append('page', String(groupPage));
      params.append('limit', '15');
      return apiRequest(`/admin/groups?${params.toString()}`);
    },
    enabled:
      (user?.role === 'ADMIN' || user?.role === 'MODERATOR') &&
      (activeTab === 'groups' || activeTab === 'posts' || createPostModalOpen),
  });

  // 5. Fetch Posts for Inspected Group
  const {
    data: groupPostsData,
    isLoading: isGroupPostsLoading,
    refetch: refetchGroupPosts,
  } = useQuery({
    queryKey: [
      'admin-group-posts',
      inspectingGroup?.id,
      inspectingGroupSearch,
      inspectingGroupBlockedFilter,
      inspectingGroupPage,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (inspectingGroupSearch.trim()) params.append('search', inspectingGroupSearch.trim());
      if (inspectingGroupBlockedFilter) params.append('isBlocked', inspectingGroupBlockedFilter);
      params.append('page', String(inspectingGroupPage));
      params.append('limit', '10');
      return apiRequest(`/admin/groups/${inspectingGroup.id}/posts?${params.toString()}`);
    },
    enabled: (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && !!inspectingGroup?.id,
  });

  // 6. Fetch Reports Queue
  const { data: reports, isLoading: isReportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports', selectedReportStatus],
    queryFn: () => apiRequest(`/admin/reports?status=${selectedReportStatus}&limit=30`),
    enabled: (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && activeTab === 'reports',
  });

  // 7. Fetch Audit Logs
  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiRequest('/admin/audit-logs?limit=40'),
    enabled: (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && activeTab === 'audit',
  });

  // --- MUTATIONS ---

  // Toggle Block User Mutation
  const toggleBlockUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      apiRequest(`/admin/users/${userId}/toggle-block`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setActionUserModalOpen(false);
      setSelectedUserForAction(null);
      setActionReason('');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update user status');
    },
  });

  // Update User Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      refetchUsers();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update user role');
    },
  });

  // Toggle Verify User Mutation
  const toggleVerifyMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/admin/users/${userId}/verify`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      refetchUsers();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to toggle verification');
    },
  });

  // Toggle Block Post Mutation
  const toggleBlockPostMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
      apiRequest(`/admin/posts/${postId}/toggle-block`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ['admin-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to toggle post status');
    },
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) =>
      apiRequest(`/admin/posts/${postId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ['admin-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete post');
    },
  });

  // Toggle Block Group Mutation
  const toggleBlockGroupMutation = useMutation({
    mutationFn: ({ groupId, reason }: { groupId: string; reason?: string }) =>
      apiRequest(`/admin/groups/${groupId}/toggle-block`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (updatedGroup: any) => {
      refetchGroups();
      if (inspectingGroup && inspectingGroup.id === updatedGroup.id) {
        setInspectingGroup((prev: any) => ({ ...prev, isPrivate: updatedGroup.isPrivate }));
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to toggle group status');
    },
  });

  // Delete Group Mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) =>
      apiRequest(`/admin/groups/${groupId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      refetchGroups();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      if (inspectingGroup) {
        setInspectingGroup(null);
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete group');
    },
  });

  // Create Post in Group Handler
  const handleCreateGroupPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForPost) {
      alert('Please select a group');
      return;
    }
    if (!newPostContent.trim()) {
      alert('Post content cannot be empty');
      return;
    }

    setPostSubmitting(true);
    try {
      await apiRequest(`/admin/groups/${selectedGroupForPost}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          content: newPostContent.trim(),
          imageUrl: newPostMediaUrl.trim() || undefined,
          videoUrl: newPostVideoUrl.trim() || undefined,
          mediaUrl: newPostMediaUrl.trim() || newPostVideoUrl.trim() || undefined,
        }),
      });

      setCreatePostModalOpen(false);
      setNewPostContent('');
      setNewPostMediaUrl('');
      setNewPostVideoUrl('');
      setSelectedGroupForPost('');
      setFeedUrl('');
      setFetchedArticles([]);
      setFeedError(null);
      setPostSourceType('manual');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert('Post created and published in group successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish post in group');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleAdminCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreateGroupSubmitting(true);
    try {
      const res: any = await apiRequest('/admin/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: newGroupName.trim(),
          category: newGroupCategory,
          description: newGroupDesc.trim() || undefined,
          avatarUrl: newGroupAvatarUrl.trim() || undefined,
          isPrivate: newGroupIsPrivate,
        }),
      });

      alert(`Community group "${res.name}" created successfully!`);
      setCreateGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupAvatarUrl('');
      setNewGroupIsPrivate(false);
      refetchGroups();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    } catch (err: any) {
      alert(err.message || 'Failed to create community group');
    } finally {
      setCreateGroupSubmitting(false);
    }
  };

  // Fetch News Feed Handler
  const handleFetchFeed = async () => {
    if (!feedUrl.trim()) {
      setFeedError('Please enter a valid news feed URL');
      return;
    }
    setFeedError(null);
    setIsFetchingFeed(true);
    try {
      const res: any = await apiRequest('/admin/feed/fetch', {
        method: 'POST',
        body: JSON.stringify({
          provider: postSourceType,
          url: feedUrl.trim(),
        }),
      });

      if (!res.articles || res.articles.length === 0) {
        setFetchedArticles([]);
        setFeedError('No articles were returned by the news feed API.');
        return;
      }

      setFetchedArticles(res.articles);

      // Automatically feed the first article into post composer
      const first = res.articles[0];
      setNewPostContent(first.formattedContent || first.title);
      setNewPostMediaUrl(first.imageUrl || '');
      setNewPostVideoUrl(first.videoUrl || '');
    } catch (err: any) {
      setFeedError(err.message || 'Failed to fetch news feed. Please verify your API URL and key.');
    } finally {
      setIsFetchingFeed(false);
    }
  };

  const handleSelectArticleForComposer = (art: any) => {
    setNewPostContent(art.formattedContent || art.title);
    setNewPostMediaUrl(art.imageUrl || '');
    setNewPostVideoUrl(art.videoUrl || '');
  };

  const handleBatchImportFeed = async () => {
    if (!selectedGroupForPost) {
      alert('Please select a target group first');
      return;
    }
    if (fetchedArticles.length === 0) {
      alert('No fetched articles to import');
      return;
    }

    if (!confirm(`Import all ${fetchedArticles.length} articles as posts into this group?`)) {
      return;
    }

    setIsBatchImporting(true);
    try {
      const payload = fetchedArticles.map((a) => ({
        content: a.formattedContent || a.title,
        imageUrl: a.imageUrl || undefined,
        videoUrl: a.videoUrl || undefined,
        mediaUrl: a.imageUrl || a.videoUrl || undefined,
      }));

      await apiRequest(`/admin/groups/${selectedGroupForPost}/feed-batch-posts`, {
        method: 'POST',
        body: JSON.stringify({ posts: payload }),
      });

      alert(`Successfully imported ${fetchedArticles.length} news articles into the group!`);
      setCreatePostModalOpen(false);
      setNewPostContent('');
      setNewPostMediaUrl('');
      setNewPostVideoUrl('');
      setFeedUrl('');
      setFetchedArticles([]);
      setPostSourceType('manual');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    } catch (err: any) {
      alert(err.message || 'Failed to import articles into group');
    } finally {
      setIsBatchImporting(false);
    }
  };

  // Group Avatar Handlers
  const handleOpenEditAvatar = (group: any) => {
    setEditAvatarGroup(group);
    setGroupAvatarUrlInput(group.avatarUrl || '');
    setGroupAvatarFile(null);
    setGroupAvatarFilePreview(null);
    setGroupAvatarTab('url');
  };

  const handleSaveGroupAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAvatarGroup) return;

    setGroupAvatarSubmitting(true);
    try {
      let updatedAvatarUrl = '';
      if (groupAvatarTab === 'upload') {
        if (!groupAvatarFile) {
          alert('Please select an image file to upload');
          setGroupAvatarSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', groupAvatarFile);

        const updated: any = await apiRequest(`/admin/groups/${editAvatarGroup.id}/avatar/upload`, {
          method: 'POST',
          body: formData,
        });
        updatedAvatarUrl = updated.avatarUrl;
      } else {
        const cleanUrl = groupAvatarUrlInput.trim();
        if (!cleanUrl) {
          alert('Please enter a valid image URL');
          setGroupAvatarSubmitting(false);
          return;
        }

        const updated: any = await apiRequest(`/admin/groups/${editAvatarGroup.id}/avatar`, {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: cleanUrl }),
        });
        updatedAvatarUrl = updated.avatarUrl;
      }

      if (inspectingGroup && inspectingGroup.id === editAvatarGroup.id) {
        setInspectingGroup((prev: any) => ({ ...prev, avatarUrl: updatedAvatarUrl }));
      }

      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      alert(`Profile picture updated for "${editAvatarGroup.name}"!`);
      setEditAvatarGroup(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update community profile picture');
    } finally {
      setGroupAvatarSubmitting(false);
    }
  };

  // Admin Profile Picture Handlers
  const handleOpenAdminAvatarModal = () => {
    setAdminAvatarModalOpen(true);
    setAdminAvatarUrlInput(user?.profile?.avatarUrl || '');
    setAdminAvatarFile(null);
    setAdminAvatarFilePreview(null);
    setAdminAvatarTab(user?.profile?.avatarUrl ? 'url' : 'upload');
  };

  const handleSaveAdminAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAvatarSubmitting(true);
    try {
      if (adminAvatarTab === 'upload') {
        if (!adminAvatarFile) {
          alert('Please select an image file to upload');
          setAdminAvatarSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', adminAvatarFile);
        await apiRequest<{ avatarUrl: string }>('/users/avatar', {
          method: 'POST',
          body: formData,
        });
      } else {
        const cleanUrl = adminAvatarUrlInput.trim();
        if (!cleanUrl) {
          alert('Please enter a valid image URL');
          setAdminAvatarSubmitting(false);
          return;
        }
        await apiRequest('/users/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            displayName: user?.profile?.displayName || user?.username,
            avatarUrl: cleanUrl,
          }),
        });
      }

      await useAuthStore.getState().initAuth();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Admin profile picture updated successfully!');
      setAdminAvatarModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update admin profile picture');
    } finally {
      setAdminAvatarSubmitting(false);
    }
  };

  // Update Report Status Mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      apiRequest(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  // Sanction Action Mutation
  const applyActionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/admin/actions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert('Moderation action applied and logged in audit.');
    },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 text-center">
        <Lock size={48} className="text-red-400 mb-2" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          This administration and management console requires active administrator or moderator credentials.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-[#FF9933] hover:bg-[#E68525] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-[#FF9933]/25"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0B1422]/90 backdrop-blur-md border-b border-[#1E293B] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/home"
            className="p-2 rounded-xl hover:bg-[#101D2D] text-slate-400 hover:text-white transition"
            title="Return to App"
          >
            <ArrowLeft size={18} />
          </Link>
          <VartaLogo size={32} showText={true} showTagline={false} />
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF9933]/15 border border-[#FF9933]/30 text-[#FF9933] text-[11px] font-extrabold uppercase tracking-wider">
              Control Center
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold rounded-xl transition shadow-sm shadow-[#FF9933]/20"
          >
            <Plus size={15} />
            <span className="hidden xs:inline">Post in Group</span>
          </button>

          {/* Admin Profile with Avatar & Change Picture Button */}
          <button
            type="button"
            onClick={handleOpenAdminAvatarModal}
            className="group relative flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-[#101D2D] border border-transparent hover:border-[#1E293B] transition text-left"
            title="Click to change your admin profile picture"
          >
            <div className="relative w-9 h-9 rounded-full bg-[#162538] border border-[#1E293B] overflow-hidden flex items-center justify-center font-bold text-[#FF9933] flex-shrink-0 group-hover:border-[#FF9933] transition shadow-sm">
              {user?.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username?.[0]?.toUpperCase() || 'A'
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Camera size={13} className="text-white" />
              </div>
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                @{user.username}
                <Camera size={11} className="text-slate-400 group-hover:text-[#FF9933] transition" />
              </span>
              <span className="text-[10px] text-[#FF9933] font-bold uppercase">{user.role}</span>
            </div>
          </button>

          <Link
            href="/home"
            className="px-3 py-1.5 rounded-xl border border-[#1E293B] text-xs font-semibold hover:bg-[#101D2D] text-slate-300 hover:text-white transition"
          >
            Exit Admin
          </Link>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6 flex-1">
        {/* Aggregate Platform Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => setActiveTab('users')}
            className={`p-4 bg-[#0B1422] border rounded-2xl flex flex-col gap-1 cursor-pointer transition hover:border-[#FF9933]/40 ${
              activeTab === 'users' ? 'border-[#FF9933]' : 'border-[#1E293B]'
            }`}
          >
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Users size={14} className="text-[#FF9933]" /> Total Users
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {metrics?.totalUsers?.toLocaleString('en-IN') ?? (isMetricsLoading ? '...' : 0)}
            </span>
          </div>

          <div
            onClick={() => {
              setActiveTab('posts');
              setPostGroupIdFilter('');
            }}
            className={`p-4 bg-[#0B1422] border rounded-2xl flex flex-col gap-1 cursor-pointer transition hover:border-[#38BDF8]/40 ${
              activeTab === 'posts' && !postGroupIdFilter ? 'border-[#38BDF8]' : 'border-[#1E293B]'
            }`}
          >
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-[#38BDF8]" /> Active Posts
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {metrics?.totalPosts?.toLocaleString('en-IN') ?? (isMetricsLoading ? '...' : 0)}
            </span>
          </div>

          <div
            onClick={() => setActiveTab('groups')}
            className={`p-4 bg-[#0B1422] border rounded-2xl flex flex-col gap-1 cursor-pointer transition hover:border-[#A855F7]/40 ${
              activeTab === 'groups' ? 'border-[#A855F7]' : 'border-[#1E293B]'
            }`}
          >
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-[#A855F7]" /> Total Groups
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {metrics?.totalGroups?.toLocaleString('en-IN') ?? (isMetricsLoading ? '...' : 0)}
            </span>
          </div>

          <div
            onClick={() => setActiveTab('reports')}
            className={`p-4 bg-[#0B1422] border rounded-2xl flex flex-col gap-1 cursor-pointer transition hover:border-yellow-400/40 ${
              activeTab === 'reports' ? 'border-yellow-400' : 'border-[#1E293B]'
            }`}
          >
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-yellow-400" /> Grievances
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-yellow-400">
              {metrics?.pendingReports ?? (isMetricsLoading ? '...' : 0)}
            </span>
          </div>

          <div
            onClick={() => {
              setActiveTab('users');
              setUserStatusFilter('SUSPENDED');
            }}
            className="p-4 bg-[#0B1422] border border-[#1E293B] rounded-2xl flex flex-col gap-1 cursor-pointer transition hover:border-red-400/40 col-span-2 lg:col-span-1"
          >
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Ban size={14} className="text-red-400" /> Suspensions
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-red-400">
              {metrics?.activeSuspensions ?? (isMetricsLoading ? '...' : 0)}
            </span>
          </div>
        </section>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-[#1E293B] gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#FF9933] text-[#FF9933]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio size={15} />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-b-2 ${
              activeTab === 'users'
                ? 'border-[#FF9933] text-[#FF9933]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            Manage Users
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-b-2 ${
              activeTab === 'posts'
                ? 'border-[#FF9933] text-[#FF9933]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={15} />
            Manage Posts
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-b-2 ${
              activeTab === 'groups'
                ? 'border-[#FF9933] text-[#FF9933]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={15} />
            Manage Groups
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-b-2 ${
              activeTab === 'reports'
                ? 'border-[#FF9933] text-[#FF9933]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle size={15} />
            Grievances
            {metrics?.pendingReports > 0 && (
              <span className="px-1.5 py-0.2 bg-yellow-400/20 text-yellow-300 text-[10px] font-extrabold rounded-full">
                {metrics.pendingReports}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-b-2 ${
              activeTab === 'audit'
                ? 'border-[#FF9933] text-[#FF9933]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={15} />
            Audit Logs
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#0B1422] border border-[#1E293B] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-[#FF9933]" />
                  Varta Administration & Governance Suite
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Centralized portal for managing users, monitoring and moderating posts, governing community groups,
                  inspecting community posts, taking down violations, and reviewing grievance reports under Indian IT Rules.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => setCreatePostModalOpen(true)}
                  className="px-4 py-2 bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-[#FF9933]/25"
                >
                  <Plus size={15} />
                  Post in Group
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="px-4 py-2 bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Layers size={15} />
                  Explore Groups
                </button>
              </div>
            </div>

            {/* Quick Actions & Platform Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('groups')}
                className="p-5 bg-[#0B1422] border border-[#1E293B] hover:border-[#A855F7]/40 rounded-2xl transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 text-[#A855F7] flex items-center justify-center mb-3">
                    <Layers size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm">Community Groups & Posts</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any community group to inspect all its posts. Restrict or block offending posts, delete them permanently, or post official messages.
                  </p>
                </div>
                <span className="text-xs text-[#A855F7] font-bold mt-4 flex items-center gap-1">
                  Manage Groups & Posts <ChevronRight size={14} />
                </span>
              </div>

              <div
                onClick={() => setActiveTab('posts')}
                className="p-5 bg-[#0B1422] border border-[#1E293B] hover:border-[#38BDF8]/40 rounded-2xl transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center mb-3">
                    <MessageSquare size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm">Global Post Moderation</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Filter posts by group or author, inspect media attachments, enforce community guidelines, and takedown policy violations.
                  </p>
                </div>
                <span className="text-xs text-[#38BDF8] font-bold mt-4 flex items-center gap-1">
                  Go to Posts <ChevronRight size={14} />
                </span>
              </div>

              <div
                onClick={() => setActiveTab('users')}
                className="p-5 bg-[#0B1422] border border-[#1E293B] hover:border-[#FF9933]/40 rounded-2xl transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF9933]/15 text-[#FF9933] flex items-center justify-center mb-3">
                    <Users size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm">User Governance</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Search user profiles, manage blue verification badges, assign admin/moderator roles, or suspend offending accounts.
                  </p>
                </div>
                <span className="text-xs text-[#FF9933] font-bold mt-4 flex items-center gap-1">
                  Go to Users <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            {/* Filter & Search Bar */}
            <div className="bg-[#0B1422] border border-[#1E293B] p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by username, email, name..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended / Blocked</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                </select>

                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="">All Roles</option>
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <button
                  onClick={() => refetchUsers()}
                  className="p-2 bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] rounded-xl text-slate-300 transition"
                  title="Refresh"
                >
                  <Clock size={16} />
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#0B1422] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
              {isUsersLoading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="animate-spin text-[#FF9933]" size={28} />
                  <span className="text-xs">Loading users registry...</span>
                </div>
              ) : !usersData?.users || usersData.users.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No users found matching current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E293B] bg-[#101D2D]/60 text-slate-400 font-semibold">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Verified</th>
                        <th className="py-3 px-4">Activity</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {usersData.users.map((u: any) => {
                        const isSuspended = u.status === 'SUSPENDED';
                        const isSelf = u.id === user.id;

                        return (
                          <tr key={u.id} className="hover:bg-[#101D2D]/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={isSelf ? handleOpenAdminAvatarModal : undefined}
                                  className={`w-8 h-8 rounded-full bg-[#162538] border border-[#1E293B] flex items-center justify-center font-bold text-[#FF9933] overflow-hidden flex-shrink-0 relative ${
                                    isSelf ? 'cursor-pointer hover:border-[#FF9933] group/selfavatar' : ''
                                  }`}
                                  title={isSelf ? 'Click to change your admin profile picture' : undefined}
                                >
                                  {u.profile?.avatarUrl ? (
                                    <img
                                      src={u.profile.avatarUrl}
                                      alt={u.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    u.username[0]?.toUpperCase()
                                  )}
                                  {isSelf && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/selfavatar:opacity-100 flex items-center justify-center transition">
                                      <Camera size={11} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    {u.profile?.displayName || u.username}
                                    {u.isVerified && (
                                      <BadgeCheck size={14} className="text-[#38BDF8]" />
                                    )}
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 bg-[#FF9933]/15 text-[#FF9933] text-[9px] font-bold rounded-md">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    @{u.username} • <span className="text-slate-500">{u.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isSuspended
                                    ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {user.role === 'ADMIN' && !isSelf ? (
                                <select
                                  value={u.role}
                                  onChange={(e) =>
                                    updateRoleMutation.mutate({
                                      userId: u.id,
                                      role: e.target.value as Role,
                                    })
                                  }
                                  className="bg-[#101D2D] border border-[#1E293B] rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-[#FF9933]"
                                >
                                  <option value="USER">USER</option>
                                  <option value="MODERATOR">MODERATOR</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              ) : (
                                <span className="font-bold text-xs text-slate-300">
                                  {u.role}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => toggleVerifyMutation.mutate(u.id)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition ${
                                  u.isVerified
                                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/25'
                                    : 'bg-[#101D2D] border-[#1E293B] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <BadgeCheck size={12} />
                                {u.isVerified ? 'Verified' : 'Verify'}
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-[11px] text-slate-400">
                              <div>{u._count?.posts || 0} posts</div>
                              <div className="text-slate-500">{u._count?.followers || 0} followers</div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <button
                                  type="button"
                                  onClick={handleOpenAdminAvatarModal}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto bg-[#FF9933]/15 border border-[#FF9933]/30 text-[#FF9933] hover:bg-[#FF9933]/25"
                                  title="Change your profile picture"
                                >
                                  <Camera size={13} />
                                  Change Picture
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedUserForAction(u);
                                    setActionUserModalOpen(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                                    isSuspended
                                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                      : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                                  }`}
                                >
                                  {isSuspended ? (
                                    <>
                                      <Unlock size={13} />
                                      Unblock User
                                    </>
                                  ) : (
                                    <>
                                      <Ban size={13} />
                                      Block User
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Pagination */}
              {usersData?.totalPages > 1 && (
                <div className="p-4 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page {usersData.page} of {usersData.totalPages} ({usersData.total} users)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      disabled={userPage >= usersData.totalPages}
                      onClick={() => setUserPage((p) => p + 1)}
                      className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: POSTS MANAGEMENT */}
        {activeTab === 'posts' && (
          <div className="flex flex-col gap-4">
            {/* Search & Filter Bar */}
            <div className="bg-[#0B1422] border border-[#1E293B] p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search post text content..."
                  value={postSearch}
                  onChange={(e) => {
                    setPostSearch(e.target.value);
                    setPostPage(1);
                  }}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]"
                />
                {postSearch && (
                  <button
                    onClick={() => setPostSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Group Filter */}
                <select
                  value={postGroupIdFilter}
                  onChange={(e) => {
                    setPostGroupIdFilter(e.target.value);
                    setPostPage(1);
                  }}
                  className="bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF9933] max-w-[180px] sm:max-w-[220px] truncate"
                >
                  <option value="">All Community Groups</option>
                  {groupsData?.groups?.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                {/* Blocked / Active Filter */}
                <select
                  value={postBlockedFilter}
                  onChange={(e) => {
                    setPostBlockedFilter(e.target.value);
                    setPostPage(1);
                  }}
                  className="bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="">All Statuses</option>
                  <option value="false">Active Posts</option>
                  <option value="true">Blocked / Restricted</option>
                </select>

                <button
                  onClick={() => refetchPosts()}
                  className="p-2 bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] rounded-xl text-slate-300 transition"
                  title="Refresh"
                >
                  <Clock size={16} />
                </button>
              </div>
            </div>

            {/* Active Group Filter Banner */}
            {postGroupIdFilter && (
              <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <Layers size={14} className="text-[#A855F7]" />
                  <span>
                    Viewing posts in group:{' '}
                    <strong className="text-white">
                      {groupsData?.groups?.find((g: any) => g.id === postGroupIdFilter)?.name || 'Selected Group'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setPostGroupIdFilter('')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <X size={13} />
                  Clear Filter
                </button>
              </div>
            )}

            {/* Posts Cards Grid / List */}
            {isPostsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="animate-spin text-[#FF9933]" size={28} />
                <span className="text-xs">Loading posts...</span>
              </div>
            ) : !postsData?.posts || postsData.posts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-[#0B1422] border border-[#1E293B] rounded-2xl">
                No posts found matching current filters.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {postsData.posts.map((post: any) => {
                  const isBlocked = !!post.deletedAt;

                  return (
                    <div
                      key={post.id}
                      className={`p-4 bg-[#0B1422] border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                        isBlocked ? 'border-red-500/40 bg-red-950/10' : 'border-[#1E293B] hover:border-[#1E293B]/80'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#162538] border border-[#1E293B] flex items-center justify-center font-bold text-[#FF9933] overflow-hidden flex-shrink-0">
                          {post.author?.profile?.avatarUrl ? (
                            <img
                              src={post.author.profile.avatarUrl}
                              alt={post.author.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            post.author?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {post.author?.profile?.displayName || post.author?.username}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              @{post.author?.username}
                            </span>

                            {post.group && (
                              <button
                                onClick={() => {
                                  const grp = groupsData?.groups?.find((g: any) => g.id === post.group.id) || post.group;
                                  setInspectingGroup(grp);
                                }}
                                className="px-2 py-0.5 rounded-md bg-[#A855F7]/15 hover:bg-[#A855F7]/25 border border-[#A855F7]/30 text-[#A855F7] text-[10px] font-bold flex items-center gap-1 transition"
                                title="Inspect this group"
                              >
                                <Layers size={10} /> {post.group.name}
                              </button>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isBlocked
                                  ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              }`}
                            >
                              {isBlocked ? 'Blocked / Restricted' : 'Active'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 line-clamp-2 mt-0.5 whitespace-pre-line">
                            {post.content}
                          </p>

                          {post.media && post.media.length > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-[#101D2D] px-2 py-0.5 rounded-md border border-[#1E293B]">
                                <ImageIcon size={11} className="text-[#38BDF8]" />
                                {post.media.length} media item(s)
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                            <span>❤️ {post._count?.likes || 0}</span>
                            <span>💬 {post._count?.replies || 0}</span>
                            <span>🔄 {post._count?.repostItems || 0}</span>
                            <span className="text-slate-500">
                              {new Date(post.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                        <button
                          onClick={() =>
                            toggleBlockPostMutation.mutate({
                              postId: post.id,
                              reason: isBlocked ? 'Unblocked by admin' : 'Blocked / restricted by admin for moderation review',
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isBlocked
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock size={13} />
                              Unblock Post
                            </>
                          ) : (
                            <>
                              <Ban size={13} />
                              Block / Restrict
                            </>
                          )}
                        </button>

                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently delete this post?')) {
                                deletePostMutation.mutate(post.id);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition"
                            title="Delete Permanently"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Posts Pagination */}
                {postsData?.totalPages > 1 && (
                  <div className="p-4 bg-[#0B1422] border border-[#1E293B] rounded-2xl flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Page {postsData.page} of {postsData.totalPages} ({postsData.total} posts)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={postPage <= 1}
                        onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        disabled={postPage >= postsData.totalPages}
                        onClick={() => setPostPage((p) => p + 1)}
                        className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GROUPS MANAGEMENT */}
        {activeTab === 'groups' && (
          <div className="flex flex-col gap-4">
            {/* Search & Actions Bar */}
            <div className="bg-[#0B1422] border border-[#1E293B] p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search group by name, slug, description..."
                  value={groupSearch}
                  onChange={(e) => {
                    setGroupSearch(e.target.value);
                    setGroupPage(1);
                  }}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]"
                />
                {groupSearch && (
                  <button
                    onClick={() => setGroupSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setCreateGroupModalOpen(true)}
                  className="px-3.5 py-2 bg-[#00C853] hover:bg-[#00B248] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-[#00C853]/25"
                >
                  <Plus size={15} />
                  Create New Group
                </button>

                <button
                  onClick={() => setCreatePostModalOpen(true)}
                  className="px-3.5 py-2 bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-[#FF9933]/25"
                >
                  <Plus size={15} />
                  New Post in Group
                </button>

                <button
                  onClick={() => refetchGroups()}
                  className="p-2 bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] rounded-xl text-slate-300 transition"
                  title="Refresh"
                >
                  <Clock size={16} />
                </button>
              </div>
            </div>

            {/* Groups Grid */}
            {isGroupsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="animate-spin text-[#FF9933]" size={28} />
                <span className="text-xs">Loading groups registry...</span>
              </div>
            ) : !groupsData?.groups || groupsData.groups.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-[#0B1422] border border-[#1E293B] rounded-2xl">
                No groups found matching current search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupsData.groups.map((group: any) => {
                  const isBlocked = group.isPrivate; // private/restricted status

                  return (
                    <div
                      key={group.id}
                      className={`p-5 bg-[#0B1422] border rounded-2xl flex flex-col justify-between gap-4 transition ${
                        isBlocked ? 'border-amber-500/40 bg-amber-950/10' : 'border-[#1E293B] hover:border-[#1E293B]/80'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => handleOpenEditAvatar(group)}
                              className="relative group/avatar cursor-pointer"
                              title="Click to change profile picture"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#162538] border border-[#1E293B] flex items-center justify-center font-bold text-[#A855F7] overflow-hidden flex-shrink-0 group-hover/avatar:border-[#FF9933] transition">
                                {group.avatarUrl ? (
                                  <img
                                    src={group.avatarUrl}
                                    alt={group.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Layers size={20} />
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FF9933] text-black flex items-center justify-center shadow-md opacity-85 group-hover/avatar:opacity-100 group-hover/avatar:scale-110 transition">
                                <ImageIcon size={9} />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm line-clamp-1">{group.name}</h4>
                              <span className="text-[11px] text-slate-400">/g/{group.slug}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isBlocked
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {isBlocked ? 'Restricted / Blocked' : 'Public'}
                          </span>
                        </div>

                        {group.description && (
                          <p className="text-xs text-slate-300 line-clamp-2">{group.description}</p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1E293B]">
                          <span className="px-2 py-0.5 rounded-md bg-[#101D2D] border border-[#1E293B] text-slate-300 font-semibold">
                            🏷️ {group.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>👥 {group._count?.members || group.memberCount || 0} members</span>
                            <span className="text-white font-semibold">
                              📝 {group._count?.posts || group.postCount || 0} posts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Group Action Buttons */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#1E293B]">
                        {/* Primary View & Moderate Posts Button */}
                        <button
                          onClick={() => {
                            setInspectingGroup(group);
                            setInspectingGroupSearch('');
                            setInspectingGroupBlockedFilter('');
                            setInspectingGroupPage(1);
                          }}
                          className="w-full px-3 py-2 bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Eye size={14} />
                          <span>View & Moderate Posts ({group._count?.posts || group.postCount || 0})</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedGroupForPost(group.id);
                              setCreatePostModalOpen(true);
                            }}
                            className="flex-1 px-3 py-1.5 bg-[#FF9933]/15 hover:bg-[#FF9933]/25 border border-[#FF9933]/30 text-[#FF9933] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <Plus size={13} />
                            Post in Group
                          </button>

                          <button
                            onClick={() => handleOpenEditAvatar(group)}
                            className="p-2 rounded-xl bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] text-slate-300 hover:text-white transition"
                            title="Change Profile Picture"
                          >
                            <ImageIcon size={14} className="text-[#FF9933]" />
                          </button>

                          <button
                            onClick={() =>
                              toggleBlockGroupMutation.mutate({
                                groupId: group.id,
                                reason: isBlocked ? 'Restored public access' : 'Restricted by admin',
                              })
                            }
                            className={`p-2 rounded-xl border text-xs transition ${
                              isBlocked
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                            }`}
                            title={isBlocked ? 'Unblock / Set Public' : 'Block / Restrict Group'}
                          >
                            {isBlocked ? <Unlock size={14} /> : <Ban size={14} />}
                          </button>

                          {user.role === 'ADMIN' && (
                            <button
                              onClick={() => {
                                if (confirm(`Permanently delete group "${group.name}"?`)) {
                                  deleteGroupMutation.mutate(group.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition"
                              title="Delete Group"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Groups Pagination */}
            {groupsData?.totalPages > 1 && (
              <div className="p-4 bg-[#0B1422] border border-[#1E293B] rounded-2xl flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {groupsData.page} of {groupsData.totalPages} ({groupsData.total} groups)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={groupPage <= 1}
                    onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={groupPage >= groupsData.totalPages}
                    onClick={() => setGroupPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GRIEVANCES QUEUE */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-[#0B1422] border border-[#1E293B] p-2 rounded-2xl">
              {[
                ReportStatus.PENDING,
                ReportStatus.UNDER_REVIEW,
                ReportStatus.RESOLVED,
                ReportStatus.DISMISSED,
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedReportStatus(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                    selectedReportStatus === status
                      ? 'bg-[#FF9933] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#101D2D]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {isReportsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="animate-spin text-[#FF9933]" size={28} />
                <span className="text-xs">Loading incident reports...</span>
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-[#0B1422] border border-[#1E293B] rounded-2xl">
                No grievance reports in queue for status: {selectedReportStatus}.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="p-5 bg-[#0B1422] border border-[#1E293B] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold">
                          {report.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Filed by @{report.reporter?.username || 'Unknown'}
                        </span>
                      </div>

                      <p className="text-xs text-white font-medium">"{report.reason}"</p>

                      {report.post && (
                        <div className="p-2.5 rounded-xl bg-[#101D2D] border border-[#1E293B] text-xs text-slate-300">
                          <strong className="text-slate-400 text-[10px] uppercase block mb-1">
                            Flagged Post:
                          </strong>
                          {report.post.content}
                        </div>
                      )}

                      {report.reportedUser && (
                        <span className="text-[11px] text-slate-400">
                          Reported User: <strong className="text-white">@{report.reportedUser.username}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {report.postId && (
                        <button
                          onClick={() =>
                            applyActionMutation.mutate({
                              targetUserId: report.reportedId,
                              actionType: ModerationActionType.TAKEDOWN_CONTENT,
                              reason: `Grievance action: ${report.category}`,
                              postId: report.postId,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition"
                        >
                          Takedown Post
                        </button>
                      )}

                      {report.reportedId && (
                        <button
                          onClick={() =>
                            applyActionMutation.mutate({
                              targetUserId: report.reportedId,
                              actionType: ModerationActionType.PERMANENT_BAN,
                              reason: `Ban issued due to grievance report: ${report.category}`,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 transition"
                        >
                          Suspend User
                        </button>
                      )}

                      <button
                        onClick={() =>
                          updateReportMutation.mutate({
                            id: report.id,
                            status: ReportStatus.RESOLVED,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition"
                      >
                        Resolve
                      </button>

                      <button
                        onClick={() =>
                          updateReportMutation.mutate({
                            id: report.id,
                            status: ReportStatus.DISMISSED,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-[#0B1422] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
            {isAuditLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="animate-spin text-[#FF9933]" size={28} />
                <span className="text-xs">Loading immutable audit trail...</span>
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No administrative audit records logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1E293B] bg-[#101D2D]/60 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[#101D2D]/40 transition">
                        <td className="py-3 px-4 font-bold text-white">
                          @{log.actor?.username || 'System'}
                          <span className="ml-1 text-[10px] text-slate-500 font-normal">
                            ({log.actor?.role || 'AUTO'})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-[#FF9933]/15 border border-[#FF9933]/30 text-[#FF9933] text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {log.entity} <span className="text-[10px] text-slate-500">#{log.entityId?.slice(0, 8)}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {log.details || '—'}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: GROUP POSTS INSPECTOR & MODERATION */}
      {inspectingGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header / Group Identity */}
            <div className="p-5 border-b border-[#1E293B] bg-[#101D2D]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => handleOpenEditAvatar(inspectingGroup)}
                  className="relative group/avatar cursor-pointer"
                  title="Click to change profile picture"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#162538] border border-[#1E293B] flex items-center justify-center font-bold text-[#A855F7] overflow-hidden flex-shrink-0 group-hover/avatar:border-[#FF9933] transition">
                    {inspectingGroup.avatarUrl ? (
                      <img
                        src={inspectingGroup.avatarUrl}
                        alt={inspectingGroup.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers size={24} />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF9933] text-black flex items-center justify-center shadow-md">
                    <ImageIcon size={11} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base sm:text-lg">
                      {inspectingGroup.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inspectingGroup.isPrivate
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {inspectingGroup.isPrivate ? 'Restricted / Blocked' : 'Public'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>/g/{inspectingGroup.slug}</span>
                    <span>•</span>
                    <span className="text-slate-300">🏷️ {inspectingGroup.category}</span>
                    <span>•</span>
                    <span>👥 {inspectingGroup._count?.members || inspectingGroup.memberCount || 0} members</span>
                    <span>•</span>
                    <span className="text-[#38BDF8] font-bold">
                      📝 {inspectingGroup._count?.posts || inspectingGroup.postCount || 0} total posts
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions in Header */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    setSelectedGroupForPost(inspectingGroup.id);
                    setCreatePostModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-[#FF9933]/20"
                >
                  <Plus size={14} />
                  Post in this Group
                </button>

                <button
                  onClick={() =>
                    toggleBlockGroupMutation.mutate({
                      groupId: inspectingGroup.id,
                      reason: inspectingGroup.isPrivate ? 'Restored public access' : 'Restricted by admin',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    inspectingGroup.isPrivate
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                  }`}
                  title={inspectingGroup.isPrivate ? 'Unblock / Set Public' : 'Block / Restrict Group'}
                >
                  {inspectingGroup.isPrivate ? (
                    <>
                      <Unlock size={13} />
                      Unblock Group
                    </>
                  ) : (
                    <>
                      <Ban size={13} />
                      Restrict Group
                    </>
                  )}
                </button>

                <button
                  onClick={() => setInspectingGroup(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#162538] transition"
                  title="Close Inspector"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub-Header: Search & Filters for this Group's Posts */}
            <div className="px-5 py-3 border-b border-[#1E293B] bg-[#0B1422] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search inside this group's posts..."
                  value={inspectingGroupSearch}
                  onChange={(e) => {
                    setInspectingGroupSearch(e.target.value);
                    setInspectingGroupPage(1);
                  }}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]"
                />
                {inspectingGroupSearch && (
                  <button
                    onClick={() => setInspectingGroupSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={inspectingGroupBlockedFilter}
                  onChange={(e) => {
                    setInspectingGroupBlockedFilter(e.target.value);
                    setInspectingGroupPage(1);
                  }}
                  className="bg-[#101D2D] border border-[#1E293B] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="">All Statuses</option>
                  <option value="false">Active Posts</option>
                  <option value="true">Blocked / Restricted</option>
                </select>

                <button
                  onClick={() => refetchGroupPosts()}
                  className="p-1.5 bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] rounded-xl text-slate-300 transition"
                  title="Refresh Posts"
                >
                  <Clock size={15} />
                </button>
              </div>
            </div>

            {/* Posts List inside Group */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
              {isGroupPostsLoading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="animate-spin text-[#FF9933]" size={28} />
                  <span className="text-xs">Loading group posts...</span>
                </div>
              ) : !groupPostsData?.posts || groupPostsData.posts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs bg-[#101D2D]/30 border border-[#1E293B] rounded-2xl flex flex-col items-center gap-2">
                  <MessageSquare size={28} className="text-slate-600" />
                  <span>No posts found in this community group matching your criteria.</span>
                  <button
                    onClick={() => {
                      setSelectedGroupForPost(inspectingGroup.id);
                      setCreatePostModalOpen(true);
                    }}
                    className="mt-2 px-3.5 py-1.5 bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold rounded-xl transition"
                  >
                    Create the first post now
                  </button>
                </div>
              ) : (
                groupPostsData.posts.map((post: any) => {
                  const isBlocked = !!post.deletedAt;

                  return (
                    <div
                      key={post.id}
                      className={`p-4 bg-[#101D2D]/40 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                        isBlocked ? 'border-red-500/40 bg-red-950/15' : 'border-[#1E293B] hover:border-[#1E293B]/80'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#162538] border border-[#1E293B] flex items-center justify-center font-bold text-[#FF9933] overflow-hidden flex-shrink-0">
                          {post.author?.profile?.avatarUrl ? (
                            <img
                              src={post.author.profile.avatarUrl}
                              alt={post.author.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            post.author?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {post.author?.profile?.displayName || post.author?.username}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              @{post.author?.username}
                            </span>
                            {post.author?.isVerified && (
                              <BadgeCheck size={13} className="text-[#38BDF8]" />
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isBlocked
                                  ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              }`}
                            >
                              {isBlocked ? 'Blocked / Restricted' : 'Active'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 line-clamp-3 whitespace-pre-line mt-0.5">
                            {post.content}
                          </p>

                          {post.media && post.media.length > 0 && (
                            <div className="mt-1 flex items-center gap-2">
                              {post.media.map((m: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={m.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-14 h-14 rounded-lg border border-[#1E293B] overflow-hidden relative group/img flex-shrink-0"
                                >
                                  <img
                                    src={m.thumbnailUrl || m.url}
                                    alt="Post media"
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                            <span>❤️ {post._count?.likes || 0}</span>
                            <span>💬 {post._count?.replies || 0}</span>
                            <span>🔄 {post._count?.repostItems || 0}</span>
                            <span className="text-slate-500">
                              {new Date(post.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Post Moderation Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <button
                          onClick={() =>
                            toggleBlockPostMutation.mutate({
                              postId: post.id,
                              reason: isBlocked
                                ? `Unblocked by admin in group ${inspectingGroup.name}`
                                : `Blocked / restricted by admin in group ${inspectingGroup.name}`,
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isBlocked
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock size={13} />
                              Unblock Post
                            </>
                          ) : (
                            <>
                              <Ban size={13} />
                              Block / Restrict
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Permanently delete this post from "${inspectingGroup.name}"?`)) {
                              deletePostMutation.mutate(post.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition"
                          title="Delete Post"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination & Footer */}
            {groupPostsData?.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-[#1E293B] bg-[#101D2D]/40 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {groupPostsData.page} of {groupPostsData.totalPages} ({groupPostsData.total} group posts)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={inspectingGroupPage <= 1}
                    onClick={() => setInspectingGroupPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={inspectingGroupPage >= groupPostsData.totalPages}
                    onClick={() => setInspectingGroupPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-[#101D2D] border border-[#1E293B] rounded-lg disabled:opacity-40 hover:bg-[#162538] text-slate-200"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE POST IN GROUP */}
      {createPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF9933]/15 text-[#FF9933] flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create Post in Group</h3>
                  <p className="text-[11px] text-slate-400">Publish manual announcements or feed live news into a community</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCreatePostModalOpen(false);
                  setFeedError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroupPost} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Target Group *
                </label>
                <select
                  value={selectedGroupForPost}
                  onChange={(e) => setSelectedGroupForPost(e.target.value)}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF9933]"
                  required
                >
                  <option value="">-- Choose a community group --</option>
                  {groupsData?.groups?.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.category}) - {g._count?.members || g.memberCount || 0} members
                    </option>
                  ))}
                </select>
              </div>

              {/* FEED SOURCE SELECTOR DROPDOWN */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Feed / Content Source</span>
                  <span className="text-[10px] text-slate-400 font-normal">Choose manual entry or auto-feed from news API</span>
                </label>
                <select
                  value={postSourceType}
                  onChange={(e) => {
                    const val = e.target.value as 'manual' | 'newsapi' | 'newsdata';
                    setPostSourceType(val);
                    setFeedError(null);
                    if (val === 'newsapi') {
                      setFeedUrl('https://api.thenewsapi.com/v1/news/all?api_token=hLlipyd5tpavRmWZoK0P85iqn4LVkzxpiILpvsS0&search=forex%20%2B%20%28usd%20%7C%20gbp%29%20-cad&language=en&categories=business,tech&exclude_categories=travel&published_after=2026-10-19');
                    } else if (val === 'newsdata') {
                      setFeedUrl('https://newsdata.io/api/1/latest?apikey=pub_c072b1df5ced44fab6cfca876f39b4d0&qInTitle=cricket&country=in&language=en,hi&category=sports');
                    } else {
                      setFeedUrl('');
                      setFetchedArticles([]);
                    }
                  }}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF9933] font-medium"
                >
                  <option value="manual">✍️ Manual Post Composer</option>
                  <option value="newsapi">📰 NewsAPI (TheNewsAPI)</option>
                  <option value="newsdata">🌐 NewsData (NewsData.io)</option>
                </select>
              </div>

              {/* NEWS API / NEWSDATA URL INPUT & PREVIEW SECTION */}
              {(postSourceType === 'newsapi' || postSourceType === 'newsdata') && (
                <div className="bg-[#101D2D]/80 border border-[#1E293B] rounded-2xl p-4 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Globe size={13} className="text-[#FF9933]" />
                        <span>{postSourceType === 'newsapi' ? 'TheNewsAPI Feed URL' : 'NewsData.io Feed URL'} *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (postSourceType === 'newsapi') {
                            setFeedUrl('https://api.thenewsapi.com/v1/news/all?api_token=hLlipyd5tpavRmWZoK0P85iqn4LVkzxpiILpvsS0&search=forex%20%2B%20%28usd%20%7C%20gbp%29%20-cad&language=en&categories=business,tech&exclude_categories=travel&published_after=2026-10-19');
                          } else {
                            setFeedUrl('https://newsdata.io/api/1/latest?apikey=pub_c072b1df5ced44fab6cfca876f39b4d0&qInTitle=cricket&country=in&language=en,hi&category=sports');
                          }
                        }}
                        className="text-[10px] text-[#FF9933] hover:underline"
                      >
                        Reset sample URL
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={feedUrl}
                        onChange={(e) => setFeedUrl(e.target.value)}
                        placeholder={
                          postSourceType === 'newsapi'
                            ? 'https://api.thenewsapi.com/v1/news/all?api_token=...&search=...'
                            : 'https://newsdata.io/api/1/latest?apikey=...&qInTitle=...'
                        }
                        className="w-full bg-[#0B1422] border border-[#1E293B] rounded-xl px-3 py-2 text-[11px] text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-400">
                      CORS & parameters are sanitized and securely fetched server-side.
                    </p>
                    <button
                      type="button"
                      onClick={handleFetchFeed}
                      disabled={isFetchingFeed || !feedUrl.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FF9933]/20 hover:bg-[#FF9933]/30 text-[#FF9933] border border-[#FF9933]/40 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {isFetchingFeed ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Fetching Feed...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          Fetch & Feed Post
                        </>
                      )}
                    </button>
                  </div>

                  {feedError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{feedError}</span>
                    </div>
                  )}

                  {/* FETCHED ARTICLES CAROUSEL / LIST */}
                  {fetchedArticles.length > 0 && (
                    <div className="mt-1 pt-3 border-t border-[#1E293B] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Layers size={13} className="text-[#00C853]" />
                          Feed Articles ({fetchedArticles.length} parsed)
                        </span>
                        <button
                          type="button"
                          onClick={handleBatchImportFeed}
                          disabled={isBatchImporting || !selectedGroupForPost}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#00C853]/20 text-[#00C853] hover:bg-[#00C853]/30 border border-[#00C853]/40 transition flex items-center gap-1 disabled:opacity-50"
                          title={!selectedGroupForPost ? 'Select a group first' : 'Publish all articles to group'}
                        >
                          {isBatchImporting ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Publishing All...
                            </>
                          ) : (
                            <>
                              <Send size={12} />
                              Publish All ({fetchedArticles.length}) to Group
                            </>
                          )}
                        </button>
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                        {fetchedArticles.map((art, idx) => {
                          const isLoaded = newPostContent === art.formattedContent;
                          return (
                            <div
                              key={art.id || idx}
                              onClick={() => handleSelectArticleForComposer(art)}
                              className={`p-2 rounded-xl border transition cursor-pointer text-left flex gap-2.5 items-start ${
                                isLoaded
                                  ? 'bg-[#FF9933]/15 border-[#FF9933]/60'
                                  : 'bg-[#0B1422] border-[#1E293B] hover:border-slate-600'
                              }`}
                            >
                              {art.imageUrl ? (
                                <img
                                  src={art.imageUrl}
                                  alt=""
                                  className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[#1E293B]"
                                  onError={(e) => ((e.target as any).style.display = 'none')}
                                />
                              ) : art.videoUrl ? (
                                <div className="w-11 h-11 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                                  <Video size={16} />
                                </div>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                  {art.source && (
                                    <span className="text-[9px] font-bold text-[#FF9933] uppercase">
                                      {art.source}
                                    </span>
                                  )}
                                  {art.imageUrl && (
                                    <span className="text-[8px] font-bold bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded flex items-center gap-0.5">
                                      <ImageIcon size={8} /> Image
                                    </span>
                                  )}
                                  {art.videoUrl && (
                                    <span className="text-[8px] font-bold bg-purple-500/20 text-purple-400 px-1 py-0.2 rounded flex items-center gap-0.5">
                                      <Video size={8} /> Video
                                    </span>
                                  )}
                                  {art.hashtags && art.hashtags.length > 0 && (
                                    <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded flex items-center gap-0.5">
                                      <Hash size={8} /> {art.hashtags.length} tags
                                    </span>
                                  )}
                                  {isLoaded && (
                                    <span className="text-[9px] bg-[#FF9933] text-black font-extrabold px-1.5 rounded-full ml-auto">
                                      Fed in Post
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-[11px] font-semibold text-white line-clamp-1">
                                  {art.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  {art.description}
                                </p>
                                {art.hashtags && art.hashtags.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    {art.hashtags.slice(0, 4).map((tag: string, tidx: number) => (
                                      <span key={tidx} className="text-[9px] text-[#38BDF8] font-mono">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* POST ANNOUNCEMENT / MESSAGE TEXTAREA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Post Content / Announcement *</span>
                  {postSourceType !== 'manual' && fetchedArticles.length > 0 && (
                    <span className="text-[10px] text-[#00C853] font-semibold">
                      {postSourceType === 'newsdata'
                        ? '✓ Auto-fed: title, description, link | #hashtags (keywords, category) | source (source_url)'
                        : '✓ Auto-fed from news API (editable)'}
                    </span>
                  )}
                </label>
                <textarea
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What would you like to announce to this community?"
                  maxLength={500}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933] resize-none"
                  required
                />
                <span className="text-[10px] text-slate-400 self-end">
                  {newPostContent.length}/500 characters
                </span>
              </div>

              {/* ATTACHED IMAGE URL (image_url) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Attached Image URL (image_url)</span>
                  {newPostMediaUrl && postSourceType !== 'manual' && (
                    <span className="text-[10px] text-[#38BDF8] font-semibold">✓ Fed from {postSourceType}: image_url</span>
                  )}
                </label>
                <div className="relative">
                  <ImageIcon size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or image link"
                    value={newPostMediaUrl}
                    onChange={(e) => setNewPostMediaUrl(e.target.value)}
                    className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]"
                  />
                </div>
                {newPostMediaUrl && (
                  <div className="mt-2 w-full h-32 rounded-xl border border-[#1E293B] overflow-hidden bg-[#101D2D]">
                    <img
                      src={newPostMediaUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                  </div>
                )}
              </div>

              {/* ATTACHED VIDEO URL (video_url) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Attached Video URL (video_url)</span>
                  {newPostVideoUrl && postSourceType !== 'manual' && (
                    <span className="text-[10px] text-purple-400 font-semibold">✓ Fed from {postSourceType}: video_url</span>
                  )}
                </label>
                <div className="relative">
                  <Video size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://...mp4 or video stream URL"
                    value={newPostVideoUrl}
                    onChange={(e) => setNewPostVideoUrl(e.target.value)}
                    className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]"
                  />
                </div>
                {newPostVideoUrl && (
                  <div className="mt-2 w-full rounded-xl border border-[#1E293B] overflow-hidden bg-black/60 p-2">
                    <video
                      src={newPostVideoUrl}
                      controls
                      className="w-full max-h-40 rounded-lg object-contain bg-black"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => {
                    setCreatePostModalOpen(false);
                    setFeedError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#FF9933]/25 disabled:opacity-50"
                >
                  {postSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Publish to Group
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CREATE NEW COMMUNITY GROUP */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#101D2D]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00C853]">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Community Group</h3>
                  <p className="text-[11px] text-slate-400">Add an official or topic-based community group</p>
                </div>
              </div>
              <button
                onClick={() => setCreateGroupModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminCreateGroup} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Group / Community Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vantara Wildlife Hub, India Tech Community"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="India Trends">🇮🇳 India Trends</option>
                  <option value="Technology">💻 Technology</option>
                  <option value="Sports">🏏 Sports</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Travel">✈️ Travel</option>
                  <option value="Food">🍛 Food</option>
                  <option value="Lifestyle">✨ Lifestyle</option>
                  <option value="Fitness & Health">💪 Fitness & Health</option>
                  <option value="General">🌐 General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                  <span>Description</span>
                  <span className="text-[10px] text-slate-500">{newGroupDesc.length}/500</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Group focus, announcement rules, or discussion guidelines"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  maxLength={500}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                  <span>Group Profile Picture / Avatar URL</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <div className="relative">
                  <ImageIcon size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or image link"
                    value={newGroupAvatarUrl}
                    onChange={(e) => setNewGroupAvatarUrl(e.target.value)}
                    className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                  />
                </div>
                {newGroupAvatarUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-[#101D2D] border border-[#1E293B] rounded-xl">
                    <img
                      src={newGroupAvatarUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => ((e.target as any).style.display = 'none')}
                    />
                    <span className="text-[11px] text-slate-300">Avatar preview loaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Privacy Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGroupIsPrivate(false)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      !newGroupIsPrivate
                        ? 'bg-[#00C853]/15 border-[#00C853] text-white'
                        : 'bg-[#101D2D] border-[#1E293B] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Globe size={13} className={!newGroupIsPrivate ? 'text-[#00C853]' : ''} />
                      Public
                    </span>
                    <span className="text-[10px] text-slate-400">Open to all platform users</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGroupIsPrivate(true)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      newGroupIsPrivate
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-[#101D2D] border-[#1E293B] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Lock size={13} className={newGroupIsPrivate ? 'text-amber-400' : ''} />
                      Restricted
                    </span>
                    <span className="text-[10px] text-slate-400">Admin-moderated access</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setCreateGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroupSubmitting || !newGroupName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#00C853] hover:bg-[#00B248] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-[#00C853]/25"
                >
                  {createGroupSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Creating Group...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Create Community Group
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER BLOCK / SUSPEND ACTION */}
      {actionUserModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedUserForAction.status === 'SUSPENDED'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {selectedUserForAction.status === 'SUSPENDED' ? <Unlock size={18} /> : <Ban size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedUserForAction.status === 'SUSPENDED' ? 'Unblock User' : 'Block / Suspend User'}
                  </h3>
                  <p className="text-[11px] text-slate-400">@{selectedUserForAction.username}</p>
                </div>
              </div>
              <button
                onClick={() => setActionUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {selectedUserForAction.status === 'SUSPENDED'
                ? `Are you sure you want to restore @${selectedUserForAction.username}'s account to active standing?`
                : `Suspending @${selectedUserForAction.username} will immediately revoke all active login sessions and prevent access to Varta.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrative Reason / Audit Note
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Repeated violation of community guidelines, spamming..."
                className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setActionUserModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  toggleBlockUserMutation.mutate({
                    userId: selectedUserForAction.id,
                    reason: actionReason.trim() || undefined,
                  })
                }
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedUserForAction.status === 'SUSPENDED'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {selectedUserForAction.status === 'SUSPENDED' ? (
                  <>
                    <Unlock size={14} />
                    Confirm Unblock
                  </>
                ) : (
                  <>
                    <Ban size={14} />
                    Confirm Suspension
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: UPDATE COMMUNITY PROFILE PICTURE */}
      {editAvatarGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A855F7]/15 text-[#A855F7] flex items-center justify-center">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Community Profile Picture</h3>
                  <p className="text-[11px] text-slate-400">Update branding for {editAvatarGroup.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditAvatarGroup(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Avatar Comparison Preview */}
            <div className="bg-[#101D2D]/60 border border-[#1E293B] rounded-2xl p-4 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-2xl bg-[#162538] border border-[#1E293B] overflow-hidden flex items-center justify-center">
                  {editAvatarGroup.avatarUrl ? (
                    <img src={editAvatarGroup.avatarUrl} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <Layers size={28} className="text-slate-500" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Current Picture</span>
              </div>

              <ChevronRight size={18} className="text-slate-500" />

              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-2xl bg-[#162538] border-2 border-[#FF9933] overflow-hidden flex items-center justify-center shadow-lg shadow-[#FF9933]/20">
                  {groupAvatarTab === 'upload' && groupAvatarFilePreview ? (
                    <img src={groupAvatarFilePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : groupAvatarUrlInput ? (
                    <img
                      src={groupAvatarUrlInput}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as any).src = '')}
                    />
                  ) : (
                    <Sparkles size={24} className="text-[#FF9933] animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] text-[#FF9933] font-bold">New Preview</span>
              </div>
            </div>

            {/* Tabs for Mode: URL or Upload */}
            <div className="flex bg-[#101D2D] p-1 rounded-xl border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setGroupAvatarTab('url')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  groupAvatarTab === 'url' ? 'bg-[#FF9933] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔗 Image URL
              </button>
              <button
                type="button"
                onClick={() => setGroupAvatarTab('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  groupAvatarTab === 'upload' ? 'bg-[#FF9933] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                📁 Upload File
              </button>
            </div>

            <form onSubmit={handleSaveGroupAvatar} className="flex flex-col gap-4">
              {groupAvatarTab === 'url' ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Direct Image URL *
                    </label>
                    <input
                      type="url"
                      value={groupAvatarUrlInput}
                      onChange={(e) => setGroupAvatarUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/... or /assets/..."
                      className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1.5 font-medium">Quick Suggestions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🏏 Cricket', url: '/assets/trend-cricket.jpg' },
                        { label: '🚀 Tech', url: '/assets/trend-isro.jpg' },
                        { label: '🏛️ Heritage', url: '/assets/trend-taj.jpg' },
                        { label: '⚡ EV', url: '/assets/trend-ev.jpg' },
                        { label: '🇮🇳 Varta Mark', url: '/varta-logo-mark.png' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setGroupAvatarUrlInput(preset.url)}
                          className="px-2 py-1 rounded-lg bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] text-[10px] text-slate-300 hover:text-white transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Image File (JPG, PNG, WEBP, GIF up to 5MB)
                  </label>
                  <label className="border-2 border-dashed border-[#1E293B] hover:border-[#FF9933] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-[#101D2D]/40 hover:bg-[#101D2D]/70">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setGroupAvatarFile(file);
                          setGroupAvatarFilePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-[#FF9933]/15 text-[#FF9933] flex items-center justify-center">
                      <ImageIcon size={20} />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-white">
                        {groupAvatarFile ? groupAvatarFile.name : 'Click to browse image'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {groupAvatarFile
                          ? `${(groupAvatarFile.size / 1024).toFixed(1)} KB selected`
                          : 'PNG, JPG, or WEBP up to 5MB'}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setEditAvatarGroup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={groupAvatarSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#FF9933]/25 disabled:opacity-50"
                >
                  {groupAvatarSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Save Profile Picture
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW COMMUNITY GROUP */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00C853]/15 text-[#00C853] flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create New Community Group</h3>
                  <p className="text-[11px] text-slate-400">Establish a new community channel on Varta</p>
                </div>
              </div>
              <button
                onClick={() => setCreateGroupModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminCreateGroup} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Cricket Fans Bharat, Startup Founders Hub..."
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C853]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00C853]"
                >
                  {[
                    'India Trends',
                    'Cricket & Sports',
                    'Cinema & Bollywood',
                    'Tech & AI',
                    'Politics & Governance',
                    'Finance & Markets',
                    'Food & Culture',
                    'Local Bharat',
                    'General Discussion',
                  ].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Brief summary of what this community discusses..."
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C853] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Group Profile Picture URL (Optional)
                </label>
                <input
                  type="url"
                  value={newGroupAvatarUrl}
                  onChange={(e) => setNewGroupAvatarUrl(e.target.value)}
                  placeholder="https://... or choose a preset below"
                  className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C853]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: '🏏 Cricket', url: '/assets/trend-cricket.jpg' },
                    { label: '🚀 ISRO/Tech', url: '/assets/trend-isro.jpg' },
                    { label: '🏛️ Heritage', url: '/assets/trend-taj.jpg' },
                    { label: '⚡ EV Bharat', url: '/assets/trend-ev.jpg' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewGroupAvatarUrl(preset.url)}
                      className="px-2 py-0.5 rounded-lg bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] text-[10px] text-slate-300 hover:text-white transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="adminGroupPrivate"
                  checked={newGroupIsPrivate}
                  onChange={(e) => setNewGroupIsPrivate(e.target.checked)}
                  className="rounded border-[#1E293B] text-[#00C853] focus:ring-0 w-4 h-4"
                />
                <label htmlFor="adminGroupPrivate" className="text-xs text-slate-300 cursor-pointer">
                  Make group private (requires moderation approval to join)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setCreateGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroupSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#00C853] hover:bg-[#00B248] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#00C853]/25 disabled:opacity-50"
                >
                  {createGroupSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE ADMIN PROFILE PICTURE */}
      {adminAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1422] border border-[#1E293B] w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF9933]/15 text-[#FF9933] flex items-center justify-center">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Change Admin Profile Picture</h3>
                  <p className="text-[11px] text-slate-400">Update your personal administrator avatar</p>
                </div>
              </div>
              <button
                onClick={() => setAdminAvatarModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current vs New Preview */}
            <div className="bg-[#101D2D]/60 border border-[#1E293B] rounded-2xl p-4 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full bg-[#162538] border border-[#1E293B] overflow-hidden flex items-center justify-center">
                  {user?.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#FF9933]">
                      {user.username?.[0]?.toUpperCase() || 'A'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Current Picture</span>
              </div>

              <ChevronRight size={18} className="text-slate-500" />

              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full bg-[#162538] border-2 border-[#FF9933] overflow-hidden flex items-center justify-center shadow-lg shadow-[#FF9933]/20">
                  {adminAvatarTab === 'upload' && adminAvatarFilePreview ? (
                    <img src={adminAvatarFilePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : adminAvatarUrlInput ? (
                    <img
                      src={adminAvatarUrlInput}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as any).src = '')}
                    />
                  ) : (
                    <Camera size={24} className="text-[#FF9933] animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] text-[#FF9933] font-bold">New Preview</span>
              </div>
            </div>

            {/* Tabs for Mode: Upload or URL */}
            <div className="flex bg-[#101D2D] p-1 rounded-xl border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setAdminAvatarTab('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  adminAvatarTab === 'upload' ? 'bg-[#FF9933] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                📁 Upload File
              </button>
              <button
                type="button"
                onClick={() => setAdminAvatarTab('url')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  adminAvatarTab === 'url' ? 'bg-[#FF9933] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔗 Image URL
              </button>
            </div>

            <form onSubmit={handleSaveAdminAvatar} className="flex flex-col gap-4">
              {adminAvatarTab === 'upload' ? (
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Image File (JPG, PNG, WEBP, GIF up to 5MB)
                  </label>
                  <label className="border-2 border-dashed border-[#1E293B] hover:border-[#FF9933] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-[#101D2D]/40 hover:bg-[#101D2D]/70">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAdminAvatarFile(file);
                          setAdminAvatarFilePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-[#FF9933]/15 text-[#FF9933] flex items-center justify-center">
                      <Upload size={20} />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-white">
                        {adminAvatarFile ? adminAvatarFile.name : 'Click to browse image'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {adminAvatarFile
                          ? `${(adminAvatarFile.size / 1024).toFixed(1)} KB selected`
                          : 'PNG, JPG, or WEBP up to 5MB'}
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Direct Image URL *
                    </label>
                    <input
                      type="url"
                      value={adminAvatarUrlInput}
                      onChange={(e) => setAdminAvatarUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/... or /assets/..."
                      className="w-full bg-[#101D2D] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9933]"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1.5 font-medium">Quick Suggestions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🇮🇳 Varta Mark', url: '/varta-logo-mark.png' },
                        { label: '🚀 ISRO', url: '/assets/trend-isro.jpg' },
                        { label: '🏏 Cricket', url: '/assets/trend-cricket.jpg' },
                        { label: '🏛️ Heritage', url: '/assets/trend-taj.jpg' },
                        { label: '⚡ Tech', url: '/assets/trend-ev.jpg' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setAdminAvatarUrlInput(preset.url)}
                          className="px-2 py-1 rounded-lg bg-[#101D2D] hover:bg-[#162538] border border-[#1E293B] text-[10px] text-slate-300 hover:text-white transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setAdminAvatarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#101D2D] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminAvatarSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#FF9933] hover:bg-[#E68525] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#FF9933]/25 disabled:opacity-50"
                >
                  {adminAvatarSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Save Profile Picture
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
