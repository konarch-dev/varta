import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReportDto, ReportCategory, ReportStatus, ModerationActionType, Role } from '@varta/shared';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId: dto.reportedUserId,
        postId: dto.postId,
        category: dto.category as any,
        reason: dto.reason.trim(),
        status: ReportStatus.PENDING as any,
      },
    });

    return {
      id: report.id,
      status: report.status,
      message: 'Report submitted successfully and queued for review.',
    };
  }

  async getReportsQueue(status?: ReportStatus, limit = 20) {
    const reports = await this.prisma.report.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, username: true },
        },
        reportedUser: {
          select: { id: true, username: true },
        },
        post: {
          select: { id: true, content: true, authorId: true },
        },
      },
    });

    return reports;
  }

  async updateReportStatus(reportId: string, status: ReportStatus, moderatorId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status: status as any },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: moderatorId,
        action: 'UPDATE_REPORT_STATUS',
        entity: 'Report',
        entityId: reportId,
        details: `Updated report status to ${status}`,
      },
    });

    return updated;
  }

  async applyModerationAction(
    moderatorId: string,
    targetUserId: string,
    actionType: ModerationActionType,
    reason: string,
    postId?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) throw new NotFoundException('Target user not found');

    if (actionType === ModerationActionType.PERMANENT_BAN) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: 'SUSPENDED' },
      });
    }

    if (actionType === ModerationActionType.TAKEDOWN_CONTENT && postId) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { deletedAt: new Date() },
      });
    }

    const action = await this.prisma.moderationAction.create({
      data: {
        moderatorId,
        targetUserId,
        actionType: actionType as any,
        reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: moderatorId,
        action: `MODERATION_${actionType}`,
        entity: 'User',
        entityId: targetUserId,
        details: reason,
      },
    });

    return action;
  }

  async getPlatformMetrics() {
    const [totalUsers, totalPosts, totalGroups, pendingReports, activeSuspensions] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      (this.prisma as any).group.count().catch(() => 0),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalGroups,
      pendingReports,
      activeSuspensions,
      serverTime: new Date().toISOString(),
    };
  }

  async getAuditLogs(limit = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, username: true, role: true },
        },
      },
    });
  }

  // --- USER MANAGEMENT ---
  async getUsersList(query?: {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.role) {
      where.role = query.role;
    }

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { username: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { profile: { displayName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          isVerified: true,
          isPrivate: true,
          createdAt: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleBlockUser(userId: string, adminId: string, reason?: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.id === adminId) {
      throw new ForbiddenException('You cannot block or suspend your own account');
    }

    const willSuspend = targetUser.status !== 'SUSPENDED';
    const nextStatus = willSuspend ? 'SUSPENDED' : 'ACTIVE';

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus },
      select: {
        id: true,
        username: true,
        status: true,
        role: true,
      },
    });

    if (willSuspend) {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: willSuspend ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
        entity: 'User',
        entityId: userId,
        details: reason || (willSuspend ? 'Account suspended by administrator' : 'Account restored to active status by administrator'),
      },
    });

    return updatedUser;
  }

  async updateUserRole(userId: string, role: Role, adminId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_ROLE_CHANGE',
        entity: 'User',
        entityId: userId,
        details: `Role updated from ${targetUser.role} to ${role}`,
      },
    });

    return updated;
  }

  async toggleVerifyUser(userId: string, adminId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: !targetUser.isVerified },
      select: {
        id: true,
        username: true,
        isVerified: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_VERIFY_TOGGLE',
        entity: 'User',
        entityId: userId,
        details: `Verification badge set to ${updated.isVerified}`,
      },
    });

    return updated;
  }

  // --- POST MANAGEMENT ---
  async getPostsList(query?: {
    search?: string;
    groupId?: string;
    authorId?: string;
    isBlocked?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.groupId) {
      where.groupId = query.groupId;
    }

    if (query?.authorId) {
      where.authorId = query.authorId;
    }

    if (query?.isBlocked === 'true') {
      where.deletedAt = { not: null };
    } else if (query?.isBlocked === 'false') {
      where.deletedAt = null;
    }

    if (query?.search && query.search.trim()) {
      where.content = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              role: true,
              isVerified: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          media: true,
          _count: {
            select: {
              likes: true,
              replies: true,
              repostItems: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleBlockPost(postId: string, adminId: string, reason?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const willBlock = !post.deletedAt;
    const nextDeletedAt = willBlock ? new Date() : null;

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: nextDeletedAt },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: willBlock ? 'POST_BLOCK' : 'POST_UNBLOCK',
        entity: 'Post',
        entityId: postId,
        details: reason || (willBlock ? 'Post taken down / blocked by administrator' : 'Post unblocked / restored by administrator'),
      },
    });

    return updated;
  }

  async deletePost(postId: string, adminId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.groupId) {
      try {
        await (this.prisma as any).group.update({
          where: { id: post.groupId },
          data: { postCount: { decrement: 1 } },
        });
      } catch (err) {
        // Group might not exist
      }
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'POST_PERMANENT_DELETE',
        entity: 'Post',
        entityId: postId,
        details: `Permanently removed post by user ${post.authorId}`,
      },
    });

    return { success: true, message: 'Post permanently deleted' };
  }

  // --- GROUP MANAGEMENT ---
  async getGroupsList(query?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      (this.prisma as any).group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      }),
      (this.prisma as any).group.count({ where }),
    ]);

    return {
      groups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleBlockGroup(groupId: string, adminId: string, reason?: string) {
    const group = await (this.prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Group not found');

    const nextIsPrivate = !group.isPrivate;

    const updated = await (this.prisma as any).group.update({
      where: { id: groupId },
      data: { isPrivate: nextIsPrivate },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: nextIsPrivate ? 'GROUP_BLOCK' : 'GROUP_UNBLOCK',
        entity: 'Group',
        entityId: groupId,
        details: reason || (nextIsPrivate ? 'Group marked private / blocked' : 'Group unblocked / restored to public access'),
      },
    });

    return updated;
  }

  async createPostInGroup(
    groupId: string,
    adminId: string,
    dto: {
      content: string;
      mediaUrl?: string;
      imageUrl?: string;
      videoUrl?: string;
      mediaType?: 'IMAGE' | 'VIDEO';
    },
  ) {
    const group = await (this.prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Target group not found');

    const content = (dto.content || '').trim();
    if (!content) {
      throw new BadRequestException('Content cannot be empty');
    }

    const mediaItems: Array<{
      url: string;
      type: 'IMAGE' | 'VIDEO';
      mimeType: string;
      sizeBytes: number;
    }> = [];

    // Support video_url
    if (dto.videoUrl && typeof dto.videoUrl === 'string' && dto.videoUrl.trim().startsWith('http')) {
      mediaItems.push({
        url: dto.videoUrl.trim(),
        type: 'VIDEO',
        mimeType: 'video/mp4',
        sizeBytes: 2048,
      });
    }

    // Support image_url
    const img = dto.imageUrl || (!dto.videoUrl && dto.mediaUrl ? dto.mediaUrl : undefined);
    if (img && typeof img === 'string' && img.trim().startsWith('http')) {
      mediaItems.push({
        url: img.trim(),
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
      });
    } else if (dto.mediaUrl && !dto.videoUrl && !dto.imageUrl && dto.mediaUrl.trim().startsWith('http')) {
      const isVideo = dto.mediaType === 'VIDEO' || /\.(mp4|webm|mov|mkv|ogg)$/i.test(dto.mediaUrl);
      mediaItems.push({
        url: dto.mediaUrl.trim(),
        type: isVideo ? 'VIDEO' : 'IMAGE',
        mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        sizeBytes: isVideo ? 2048 : 1024,
      });
    }

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId: adminId,
          groupId: groupId,
          content,
          ...(mediaItems.length > 0 && {
            media: {
              create: mediaItems,
            },
          }),
        },
        include: {
          author: {
            include: { profile: true },
          },
          group: true,
          media: true,
        },
      });

      // Index hashtags from content into Hashtag and PostHashtag models
      const tags = this.extractHashtags(content);
      for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
          where: { tag },
          update: { usageCount: { increment: 1 } },
          create: { tag, usageCount: 1 },
        });

        await tx.postHashtag.create({
          data: {
            postId: created.id,
            hashtagId: hashtag.id,
          },
        });
      }

      await (tx as any).group.update({
        where: { id: groupId },
        data: { postCount: { increment: 1 } },
      });

      return created;
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_POST_IN_GROUP',
        entity: 'Group',
        entityId: groupId,
        details: `Admin created official post in group "${group.name}"`,
      },
    });

    return post;
  }

  async deleteGroup(groupId: string, adminId: string) {
    const group = await (this.prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Group not found');

    await (this.prisma as any).group.delete({
      where: { id: groupId },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'GROUP_DELETE',
        entity: 'Group',
        entityId: groupId,
        details: `Deleted group "${group.name}" (${group.slug})`,
      },
    });

    return { success: true, message: 'Group deleted successfully' };
  }

  async updateGroupAvatar(groupId: string, adminId: string, avatarUrl: string) {
    const group = await (this.prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Community group not found');

    const cleanUrl = (avatarUrl || '').trim();
    if (!cleanUrl) {
      throw new BadRequestException('Avatar URL cannot be empty');
    }

    const updated = await (this.prisma as any).group.update({
      where: { id: groupId },
      data: { avatarUrl: cleanUrl },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_UPDATE_GROUP_AVATAR',
        entity: 'Group',
        entityId: groupId,
        details: `Admin updated profile picture for group "${group.name}" (${group.slug})`,
      },
    });

    return updated;
  }

  async updateUserAvatar(targetUserId: string, adminId: string, avatarUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const cleanUrl = (avatarUrl || '').trim();
    if (!cleanUrl) {
      throw new BadRequestException('Avatar URL cannot be empty');
    }

    const updatedProfile = await this.prisma.userProfile.upsert({
      where: { userId: targetUserId },
      update: { avatarUrl: cleanUrl },
      create: {
        userId: targetUserId,
        displayName: user.username,
        avatarUrl: cleanUrl,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_UPDATE_USER_AVATAR',
        entity: 'User',
        entityId: targetUserId,
        details: `Admin updated profile picture for @${user.username}`,
      },
    });

    return {
      userId: targetUserId,
      avatarUrl: cleanUrl,
      profile: updatedProfile,
    };
  }

  async createCommunityGroup(
    adminId: string,
    dto: {
      name: string;
      description?: string;
      category?: string;
      avatarUrl?: string;
      coverUrl?: string;
      isPrivate?: boolean;
    },
  ) {
    const cleanName = (dto.name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      throw new BadRequestException('Community name must be at least 2 characters long');
    }

    let slug = cleanName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'community';

    const existing = await (this.prisma as any).group.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const group = await this.prisma.$transaction(async (tx) => {
      const g = await (tx as any).group.create({
        data: {
          name: cleanName,
          slug,
          description: dto.description?.trim() || null,
          category: dto.category?.trim() || 'General',
          avatarUrl: dto.avatarUrl?.trim() || null,
          coverUrl: dto.coverUrl?.trim() || null,
          isPrivate: dto.isPrivate ?? false,
          creatorId: adminId,
          memberCount: 1,
          postCount: 0,
          members: {
            create: {
              userId: adminId,
              role: 'ADMIN',
            },
          },
        },
      });
      return g;
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_CREATE_GROUP',
        entity: 'Group',
        entityId: group.id,
        details: `Admin created community group "${group.name}" (/g/${group.slug})`,
      },
    });

    return group;
  }

  async fetchNewsFeed(provider: string, rawUrl: string) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new BadRequestException('News feed URL is required');
    }

    const cleanUrl = rawUrl
      .replace(/\r?\n|\r/g, '')
      .replace(/\s*&\s*/g, '&')
      .replace(/\?\s*/g, '?')
      .trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new BadRequestException('Invalid URL protocol. Must start with http:// or https://');
    }

    // Replace unencoded spaces in query parameters with %20
    const parts = cleanUrl.split('?');
    let finalUrl = cleanUrl;
    if (parts.length >= 2) {
      const base = parts[0];
      const query = parts.slice(1).join('?').replace(/ /g, '%20');
      finalUrl = `${base}?${query}`;
    }

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new BadRequestException(
          `News provider returned HTTP ${response.status}: ${errText.slice(0, 200) || response.statusText}`
        );
      }

      const json: any = await response.json();
      const articles: any[] = [];
      const normProvider = (provider || '').toLowerCase();

      let rawItems: any[] = [];
      if (normProvider.includes('newsdata')) {
        rawItems = json.results || json.data || [];
      } else {
        rawItems = json.data || json.articles || json.results || [];
      }

      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return {
          provider,
          totalResults: 0,
          articles: [],
          message: 'No articles found in the feed response.',
        };
      }

      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        const isNewsData = normProvider.includes('newsdata');

        if (isNewsData) {
          // Strictly use keys:
          // - title, description, link for main content
          // - image_url for post image
          // - video_url for post video
          // - keywords & category for hashtags
          // - source_url for source
          const title = (item.title || '').trim();
          const description = (item.description || '').trim();
          const link = (item.link || '').trim();
          const sourceUrl = (item.source_url || '').trim();
          const sourceDomain = this.extractDomain(sourceUrl);
          const hashtags = this.extractHashtagsFromFeed(item.keywords, item.category);

          const rawImageUrl = Array.isArray(item.image_url) ? item.image_url[0] : item.image_url;
          const imageUrl =
            rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.trim().startsWith('http')
              ? rawImageUrl.trim()
              : null;
          const rawVideoUrl = Array.isArray(item.video_url) ? item.video_url[0] : item.video_url;
          const videoUrl =
            rawVideoUrl && typeof rawVideoUrl === 'string' && rawVideoUrl.trim().startsWith('http')
              ? rawVideoUrl.trim()
              : null;

          const formattedContent = this.formatNewsDataContent(
            title,
            description,
            link,
            sourceDomain,
            hashtags,
          );

          articles.push({
            id: item.article_id || `newsdata-${i}-${Date.now()}`,
            title,
            description,
            link,
            url: link,
            imageUrl,
            videoUrl,
            hasVideo: !!videoUrl,
            source: sourceDomain || sourceUrl || 'NewsData',
            sourceUrl: sourceUrl || null,
            hashtags,
            category: Array.isArray(item.category) ? item.category : item.category ? [item.category] : [],
            keywords: Array.isArray(item.keywords) ? item.keywords : item.keywords ? [item.keywords] : [],
            formattedContent,
          });
        } else {
          const title = (item.title || item.name || '').trim();
          const desc = (item.description || item.snippet || item.content || item.ai_summary || '').trim();
          const url = (item.url || item.link || '').trim();

          // Strictly use image_url for post image, video_url for post video (same as newsdata)
          const rawImageUrl = Array.isArray(item.image_url) ? item.image_url[0] : item.image_url;
          const imageUrl =
            rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.trim().startsWith('http')
              ? rawImageUrl.trim()
              : (item.urlToImage && typeof item.urlToImage === 'string' && item.urlToImage.trim().startsWith('http')
                  ? item.urlToImage.trim()
                  : null);

          const rawVideoUrl = Array.isArray(item.video_url) ? item.video_url[0] : item.video_url;
          const videoUrl =
            rawVideoUrl && typeof rawVideoUrl === 'string' && rawVideoUrl.trim().startsWith('http')
              ? rawVideoUrl.trim()
              : null;

          const source =
            (typeof item.source === 'string' ? item.source : item.source?.name) ||
            item.source_name ||
            item.source_id ||
            item.source_url ||
            'TheNewsAPI';
          const publishedAt = item.published_at || item.pubDate || item.publishedAt || null;

          const formattedContent = this.formatPostContent(title, desc, url, source);

          articles.push({
            id: item.uuid || item.article_id || `article-${i}-${Date.now()}`,
            title,
            description: desc,
            url,
            link: url,
            imageUrl,
            videoUrl,
            hasVideo: !!videoUrl,
            source,
            publishedAt,
            formattedContent,
          });
        }
      }

      return {
        provider,
        totalResults: articles.length,
        articles,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Failed to fetch news feed: ${err.message || 'Unknown network error'}`);
    }
  }

  // Extract domain name from source_url (e.g. https://www.business-standard.com -> business-standard.com)
  extractDomain(urlStr?: string): string {
    if (!urlStr || typeof urlStr !== 'string') return '';
    try {
      const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return urlStr.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || urlStr;
    }
  }

  // Convert NewsData keywords and category keys into hashtags
  extractHashtagsFromFeed(keywords?: any, category?: any): string[] {
    const items: string[] = [];
    if (Array.isArray(category)) items.push(...category);
    else if (typeof category === 'string') items.push(...category.split(','));

    if (Array.isArray(keywords)) items.push(...keywords);
    else if (typeof keywords === 'string') items.push(...keywords.split(','));

    const seen = new Set<string>();
    const hashtags: string[] = [];

    for (const raw of items) {
      if (!raw || typeof raw !== 'string') continue;

      const rawTokens = raw.includes(' ') && raw.length > 20
        ? raw.split(/[\s,/]+/)
        : [raw];

      for (const token of rawTokens) {
        const cleaned = token
          .replace(/[\s\-_]+/g, '')
          .replace(/[^\p{L}\p{M}\p{N}_]/gu, '');

        if (!cleaned || cleaned.length < 2 || cleaned.length > 30) continue;
        if (/^\d+$/i.test(cleaned)) continue;
        if (/^page\d+$/i.test(cleaned)) continue;

        const lower = cleaned.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          hashtags.push(`#${cleaned}`);
        }
      }
    }

    return hashtags;
  }

  // Extract hashtags from post content string
  private extractHashtags(content: string): string[] {
    const matches = content.match(/#([a-zA-Z0-9_\u0900-\u097F]+)/g);
    if (!matches) return [];
    return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
  }

  // Strictly uses title, description, and link, plus source_url for source tag and keywords/category for hashtags
  formatNewsDataContent(
    title: string,
    description?: string,
    link?: string,
    sourceDomain?: string,
    hashtags?: string[],
  ): string {
    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();
    const cleanLink = (link || '').trim();
    const cleanSource = (sourceDomain || '').trim();

    const sourceTag = cleanSource ? ` [${cleanSource}]` : '';
    const prefix = cleanTitle ? `${cleanTitle}${sourceTag}\n\n` : '';
    const suffix = cleanLink ? `\n\n${cleanLink}` : '';

    let tagList = (hashtags || []).slice(0, 5);
    let hashtagStr = tagList.length > 0 ? tagList.join(' ') : '';
    let hashtagBlock = hashtagStr ? `\n\n${hashtagStr}` : '';

    let fixedLen = prefix.length + hashtagBlock.length + suffix.length;
    let maxDescLen = 500 - fixedLen;

    // If description doesn't have room for at least 60 chars, trim hashtags count
    while (maxDescLen < 60 && tagList.length > 1) {
      tagList.pop();
      hashtagStr = tagList.join(' ');
      hashtagBlock = `\n\n${hashtagStr}`;
      fixedLen = prefix.length + hashtagBlock.length + suffix.length;
      maxDescLen = 500 - fixedLen;
    }

    if (maxDescLen <= 0) {
      const remainingForTitle = 500 - hashtagBlock.length - suffix.length;
      if (cleanTitle.length > remainingForTitle) {
        return (cleanTitle.slice(0, Math.max(0, remainingForTitle - 3)) + '...' + hashtagBlock + suffix).slice(0, 500);
      }
      return (cleanTitle + hashtagBlock + suffix).slice(0, 500);
    }

    let truncatedDesc = cleanDesc;
    if (cleanDesc.length > maxDescLen) {
      truncatedDesc = cleanDesc.slice(0, Math.max(0, maxDescLen - 3)) + '...';
    }

    const mid = cleanDesc ? `${prefix}${truncatedDesc}` : prefix.trim();
    const result = `${mid}${hashtagBlock}${suffix}`.trim();
    return result.slice(0, 500);
  }

  formatPostContent(title: string, desc?: string, url?: string, source?: string): string {
    const cleanTitle = (title || '').trim();
    const cleanDesc = (desc || '').trim();
    const cleanUrl = (url || '').trim();
    const sourceTag = source ? ` [${source.trim()}]` : '';

    const prefix = cleanTitle ? `${cleanTitle}${sourceTag}\n\n` : '';
    const suffix = cleanUrl ? `\n\n${cleanUrl}` : '';

    const maxDescLen = 500 - prefix.length - suffix.length;
    if (maxDescLen <= 0) {
      const remainingForTitle = 500 - suffix.length;
      if (cleanTitle.length > remainingForTitle) {
        return (cleanTitle.slice(0, remainingForTitle - 3) + '...' + suffix).slice(0, 500);
      }
      return (cleanTitle + suffix).slice(0, 500);
    }

    let truncatedDesc = cleanDesc;
    if (cleanDesc.length > maxDescLen) {
      truncatedDesc = cleanDesc.slice(0, Math.max(0, maxDescLen - 3)) + '...';
    }

    const result = cleanDesc ? `${prefix}${truncatedDesc}${suffix}` : `${prefix.trim()}${suffix}`;
    return result.trim().slice(0, 500);
  }

  async createBatchPostsInGroup(
    groupId: string,
    adminId: string,
    posts: Array<{
      content: string;
      mediaUrl?: string;
      imageUrl?: string;
      videoUrl?: string;
      mediaType?: 'IMAGE' | 'VIDEO';
    }>,
  ) {
    const group = await (this.prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Target group not found');

    if (!Array.isArray(posts) || posts.length === 0) {
      throw new BadRequestException('No posts provided to import');
    }

    const createdPosts = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const item of posts) {
        const content = (item.content || '').trim().slice(0, 500);
        if (!content) continue;

        const mediaItems: Array<{
          url: string;
          type: 'IMAGE' | 'VIDEO';
          mimeType: string;
          sizeBytes: number;
        }> = [];

        // Attach video_url if present
        if (item.videoUrl && typeof item.videoUrl === 'string' && item.videoUrl.trim().startsWith('http')) {
          mediaItems.push({
            url: item.videoUrl.trim(),
            type: 'VIDEO',
            mimeType: 'video/mp4',
            sizeBytes: 2048,
          });
        }

        // Attach image_url if present
        const img = item.imageUrl || (!item.videoUrl && item.mediaUrl ? item.mediaUrl : undefined);
        if (img && typeof img === 'string' && img.trim().startsWith('http')) {
          mediaItems.push({
            url: img.trim(),
            type: 'IMAGE',
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
          });
        } else if (item.mediaUrl && !item.videoUrl && !item.imageUrl && item.mediaUrl.trim().startsWith('http')) {
          const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|webm|mov|mkv|ogg)$/i.test(item.mediaUrl);
          mediaItems.push({
            url: item.mediaUrl.trim(),
            type: isVideo ? 'VIDEO' : 'IMAGE',
            mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
            sizeBytes: isVideo ? 2048 : 1024,
          });
        }

        const p = await tx.post.create({
          data: {
            authorId: adminId,
            groupId: groupId,
            content,
            ...(mediaItems.length > 0 && {
              media: {
                create: mediaItems,
              },
            }),
          },
        });

        // Index hashtags for batch posts
        const tags = this.extractHashtags(content);
        for (const tag of tags) {
          const hashtag = await tx.hashtag.upsert({
            where: { tag },
            update: { usageCount: { increment: 1 } },
            create: { tag, usageCount: 1 },
          });

          await tx.postHashtag.create({
            data: {
              postId: p.id,
              hashtagId: hashtag.id,
            },
          });
        }

        results.push(p);
      }

      if (results.length > 0) {
        await (tx as any).group.update({
          where: { id: groupId },
          data: { postCount: { increment: results.length } },
        });
      }

      return results;
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_BATCH_FEED_POSTS',
        entity: 'Group',
        entityId: groupId,
        details: `Admin imported ${createdPosts.length} feed posts into group "${group.name}"`,
      },
    });

    return {
      success: true,
      count: createdPosts.length,
      posts: createdPosts,
    };
  }
}

