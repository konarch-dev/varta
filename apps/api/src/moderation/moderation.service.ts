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
    dto: { content: string; mediaUrl?: string },
  ) {
    const group = await (this.prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Target group not found');

    const content = (dto.content || '').trim();
    if (!content) {
      throw new BadRequestException('Content cannot be empty');
    }

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId: adminId,
          groupId: groupId,
          content,
          ...(dto.mediaUrl && {
            media: {
              create: {
                url: dto.mediaUrl,
                type: 'IMAGE',
                mimeType: 'image/jpeg',
                sizeBytes: 1024,
              },
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
}
