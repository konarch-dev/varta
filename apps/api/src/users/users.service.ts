import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from '@varta/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUsername(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!user || user.status === 'DELETED') {
      throw new NotFoundException(`User @${username} not found`);
    }

    let isFollowing = false;
    let isFollowedBy = false;
    let isPendingFollow = false;
    let isBlocked = false;
    let isMuted = false;

    if (viewerId && viewerId !== user.id) {
      // Check block status (bidirectional)
      const blockRecord = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: user.id },
            { blockerId: user.id, blockedId: viewerId },
          ],
        },
      });

      if (blockRecord) {
        if (blockRecord.blockerId === user.id) {
          // Profile blocked viewer
          throw new ForbiddenException('You are blocked by this user');
        }
        isBlocked = true;
      }

      // Check follow relationship
      const followRecord = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!followRecord;

      const reverseFollow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: viewerId,
          },
        },
      });
      isFollowedBy = !!reverseFollow;

      // Check pending follow request if private
      if (user.isPrivate && !isFollowing) {
        const pendingRequest = await this.prisma.followRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId: viewerId,
              receiverId: user.id,
            },
          },
        });
        isPendingFollow = pendingRequest?.status === 'PENDING';
      }

      // Check mute status
      const muteRecord = await this.prisma.mute.findUnique({
        where: {
          muterId_mutedId: {
            muterId: viewerId,
            mutedId: user.id,
          },
        },
      });
      isMuted = !!muteRecord;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.profile?.displayName || user.username,
      bio: user.profile?.bio,
      avatarUrl: user.profile?.avatarUrl,
      coverUrl: user.profile?.coverUrl,
      website: user.profile?.website,
      location: user.profile?.location,
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isFollowedBy,
      isPendingFollow,
      isBlocked,
      isMuted,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName.trim() }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
      },
    });

    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });
    return updated;
  }

  async updateCover(userId: string, coverUrl: string) {
    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: { coverUrl },
    });
    return updated;
  }

  async updatePrivacy(userId: string, isPrivate: boolean) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isPrivate },
      select: { id: true, username: true, isPrivate: true },
    });
    return updated;
  }

  async getFollowers(username: string, cursor?: string, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');

    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          include: { profile: true },
        },
      },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.profile?.displayName || f.follower.username,
        avatarUrl: f.follower.profile?.avatarUrl,
        bio: f.follower.profile?.bio,
        isVerified: f.follower.isVerified,
      })),
      nextCursor,
      hasMore,
    };
  }

  async getFollowing(username: string, cursor?: string, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');

    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          include: { profile: true },
        },
      },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.profile?.displayName || f.following.username,
        avatarUrl: f.following.profile?.avatarUrl,
        bio: f.following.profile?.bio,
        isVerified: f.following.isVerified,
      })),
      nextCursor,
      hasMore,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new password are required');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  async toggleVerified(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: !user.isVerified },
      select: { id: true, username: true, isVerified: true },
    });
    return {
      success: true,
      isVerified: updated.isVerified,
      message: updated.isVerified ? 'VARTA+ Premium activated with Verified Checkmark!' : 'VARTA+ Subscription cancelled.',
    };
  }

  async updateAccount(userId: string, data: { username?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (data.username && data.username.toLowerCase() !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
      });
      if (existing) throw new ConflictException('Username is already taken');
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) throw new ConflictException('Email address is already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username && { username: data.username.toLowerCase().trim() }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
      },
    });

    return updated;
  }
}
