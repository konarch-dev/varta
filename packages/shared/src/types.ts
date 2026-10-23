import {
  Role,
  AccountStatus,
  FollowRequestStatus,
  MediaType,
  NotificationType,
  ReportCategory,
  ReportStatus,
} from './enums';

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  bio?: string | null;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface CurrentUser extends UserSummary {
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string | null;
    bio?: string | null;
    coverUrl?: string | null;
    location?: string | null;
    website?: string | null;
  } | null;
}

export interface UserProfileDetails extends UserSummary {
  coverUrl: string | null;
  website: string | null;
  location: string | null;
  postCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isPendingFollow?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
}

export interface PostMediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: MediaType;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  order: number;
}

export interface PollOptionItem {
  id: string;
  text: string;
  voteCount: number;
  percentage?: number;
  hasVoted?: boolean;
}

export interface PollItem {
  id: string;
  question: string;
  expiresAt: string;
  isExpired: boolean;
  totalVotes: number;
  options: PollOptionItem[];
  userVoteOptionId?: string | null;
}

export interface PostItem {
  id: string;
  content: string;
  authorId: string;
  author: UserSummary;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  
  // Relations
  media: PostMediaItem[];
  poll?: PollItem | null;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
    slug: string;
    category: string;
    avatarUrl?: string | null;
  } | null;
  
  // Reposts & Quotes
  repostOf?: PostItem | null;
  quotePost?: PostItem | null;
  parentId?: string | null;
  replyToAuthor?: {
    username: string;
    displayName?: string | null;
  } | null;

  // Counters
  likeCount: number;
  replyCount: number;
  repostCount: number;
  quoteCount: number;
  bookmarkCount: number;

  // Viewer state
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: UserSummary;
  entityId: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  postSnippet?: string | null;
}

export interface ConversationItem {
  id: string;
  isGroup?: boolean;
  title?: string | null;
  avatarUrl?: string | null;
  otherMember: UserSummary | null;
  members?: UserSummary[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  sender: UserSummary;
  content: string;
  mediaUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TrendingHashtagItem {
  id: string;
  tag: string;
  usageCount: number;
  category?: string;
}
