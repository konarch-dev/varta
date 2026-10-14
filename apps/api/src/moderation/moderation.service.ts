import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const [totalUsers, totalPosts, pendingReports, activeSuspensions] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      totalUsers,
      totalPosts,
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
}
