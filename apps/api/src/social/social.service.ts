import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async followUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser || targetUser.status === 'DELETED') {
      throw new NotFoundException('User not found');
    }

    if (targetUser.id === followerId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if blocked
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: targetUser.id },
          { blockerId: targetUser.id, blockedId: followerId },
        ],
      },
    });

    if (block) {
      throw new BadRequestException('Cannot follow this user due to block restrictions');
    }

    // Check existing follow
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (existing) {
      return { following: true, status: 'ACCEPTED' };
    }

    // If private, send follow request
    if (targetUser.isPrivate) {
      const request = await this.prisma.followRequest.upsert({
        where: {
          senderId_receiverId: {
            senderId: followerId,
            receiverId: targetUser.id,
          },
        },
        update: { status: 'PENDING' },
        create: {
          senderId: followerId,
          receiverId: targetUser.id,
          status: 'PENDING',
        },
      });

      // Notification
      await this.prisma.notification.create({
        data: {
          userId: targetUser.id,
          actorId: followerId,
          type: 'FOLLOW_REQUEST',
          entityId: request.id,
          message: 'requested to follow you',
        },
      });

      return { following: false, status: 'PENDING' };
    }

    // Public account: instant follow
    await this.prisma.$transaction([
      this.prisma.follow.create({
        data: {
          followerId,
          followingId: targetUser.id,
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: targetUser.id,
          actorId: followerId,
          type: 'FOLLOW',
          entityId: followerId,
          message: 'started following you',
        },
      }),
    ]);

    return { following: true, status: 'ACCEPTED' };
  }

  async unfollowUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: targetUser.id,
      },
    });

    // Also cancel any pending follow request
    await this.prisma.followRequest.deleteMany({
      where: {
        senderId: followerId,
        receiverId: targetUser.id,
      },
    });

    return { following: false, status: 'NONE' };
  }

  async getPendingFollowRequests(userId: string) {
    const requests = await this.prisma.followRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      sender: {
        id: r.sender.id,
        username: r.sender.username,
        displayName: r.sender.profile?.displayName || r.sender.username,
        avatarUrl: r.sender.profile?.avatarUrl,
        bio: r.sender.profile?.bio,
        isVerified: r.sender.isVerified,
      },
      createdAt: r.createdAt,
    }));
  }

  async acceptFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    await this.prisma.$transaction([
      this.prisma.followRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: request.senderId,
            followingId: userId,
          },
        },
        update: {},
        create: {
          followerId: request.senderId,
          followingId: userId,
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: request.senderId,
          actorId: userId,
          type: 'FOLLOW_ACCEPTED',
          entityId: userId,
          message: 'accepted your follow request',
        },
      }),
    ]);

    return { success: true, status: 'ACCEPTED' };
  }

  async rejectFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    await this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true, status: 'REJECTED' };
  }

  async blockUser(blockerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.id === blockerId) throw new BadRequestException('Cannot block yourself');

    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId: targetUser.id,
          },
        },
        update: {},
        create: {
          blockerId,
          blockedId: targetUser.id,
        },
      }),
      // Sever follows in both directions
      this.prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: targetUser.id },
            { followerId: targetUser.id, followingId: blockerId },
          ],
        },
      }),
      this.prisma.followRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: targetUser.id },
            { senderId: targetUser.id, receiverId: blockerId },
          ],
        },
      }),
    ]);

    return { blocked: true };
  }

  async unblockUser(blockerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    await this.prisma.block.deleteMany({
      where: {
        blockerId,
        blockedId: targetUser.id,
      },
    });

    return { blocked: false };
  }

  async toggleMute(muterId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.id === muterId) throw new BadRequestException('Cannot mute yourself');

    const existing = await this.prisma.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId,
          mutedId: targetUser.id,
        },
      },
    });

    if (existing) {
      await this.prisma.mute.delete({ where: { id: existing.id } });
      return { muted: false };
    } else {
      await this.prisma.mute.create({
        data: {
          muterId,
          mutedId: targetUser.id,
        },
      });
      return { muted: true };
    }
  }
}
