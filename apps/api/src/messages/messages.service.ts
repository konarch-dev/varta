import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SendMessageDto } from '@varta/shared';
import { EventsGateway } from '../websocket/events.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getConversations(userId: string) {
    const memberRecords = await this.prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: {
                user: { include: { profile: true } },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const convIds = memberRecords.map((m) => m.conversationId);
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: convIds },
        senderId: { not: userId },
        isRead: false,
      },
      _count: { _all: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count._all]));

    return memberRecords.map((m) => {
      const conv = m.conversation;
      const otherMembers = conv.members.map((mem) => mem.user);
      const isGroup = conv.isGroup || otherMembers.length > 1;
      const singleOther = otherMembers[0] || null;
      const lastMessage = conv.messages[0] || null;

      const groupTitle =
        conv.title ||
        (isGroup
          ? otherMembers.map((u) => u.profile?.displayName || u.username).join(', ')
          : singleOther?.profile?.displayName || singleOther?.username || 'Chat');

      return {
        id: m.conversationId,
        isGroup,
        title: groupTitle,
        avatarUrl: conv.avatarUrl || null,
        members: otherMembers.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.profile?.displayName || u.username,
          avatarUrl: u.profile?.avatarUrl || null,
          isVerified: u.isVerified,
          isPrivate: u.isPrivate,
        })),
        otherMember: !isGroup && singleOther
          ? {
              id: singleOther.id,
              username: singleOther.username,
              displayName: singleOther.profile?.displayName || singleOther.username,
              avatarUrl: singleOther.profile?.avatarUrl,
              isVerified: singleOther.isVerified,
            }
          : isGroup
          ? {
              id: conv.id,
              username: 'group',
              displayName: groupTitle,
              avatarUrl: conv.avatarUrl || null,
              isVerified: false,
              isPrivate: false,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              senderId: lastMessage.senderId,
              isRead: lastMessage.isRead,
            }
          : null,
        unreadCount: unreadMap.get(m.conversationId) || 0,
        updatedAt: conv.updatedAt.toISOString(),
      };
    });
  }

  async createGroupConversation(creatorId: string, title: string, usernames: string[]) {
    if (!usernames || usernames.length === 0) {
      throw new BadRequestException('At least one other member is required to create a group');
    }

    const cleanUsernames = Array.from(new Set(usernames.map((u) => u.trim().toLowerCase())));
    const targetUsers = await this.prisma.user.findMany({
      where: { username: { in: cleanUsernames } },
      select: { id: true, username: true, profile: { select: { displayName: true } } },
    });

    if (targetUsers.length === 0) {
      throw new BadRequestException('No valid users found to add to group');
    }

    const otherMemberIds = targetUsers.filter((u) => u.id !== creatorId).map((u) => u.id);
    if (otherMemberIds.length === 0) {
      throw new BadRequestException('Cannot create a group with only yourself');
    }

    const allMemberIds = [creatorId, ...otherMemberIds];
    const groupTitle =
      title?.trim() ||
      targetUsers.map((u) => u.profile?.displayName || u.username).slice(0, 3).join(', ') + ' Group';

    const conversation = await this.prisma.conversation.create({
      data: {
        title: groupTitle,
        isGroup: true,
        members: {
          create: allMemberIds.map((userId) => ({ userId })),
        },
      },
    });

    // Create system / welcome message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: creatorId,
        content: `🎉 Welcome to ${groupTitle}! The group chat has been created.`,
      },
    });

    // Notify all members via WebSocket
    for (const memberId of otherMemberIds) {
      this.eventsGateway.server?.to(`user:${memberId}`).emit('conversation:new_group', {
        conversationId: conversation.id,
        title: groupTitle,
      });
      this.eventsGateway.sendNotificationToUser(memberId, {
        type: 'DIRECT_MESSAGE',
        actorId: creatorId,
        entityId: conversation.id,
        message: `added you to group "${groupTitle}"`,
      });
    }

    return { conversationId: conversation.id, title: groupTitle };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.message.count({
      where: {
        conversation: {
          members: {
            some: { userId },
          },
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { count };
  }

  async getOrCreateConversation(userId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.id === userId) throw new BadRequestException('Cannot message yourself');

    // Check if conversation already exists between the two
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUser.id } } },
        ],
      },
      include: {
        members: {
          include: { user: { include: { profile: true } } },
        },
      },
    });

    if (existingConversation) {
      return { conversationId: existingConversation.id };
    }

    // Create new conversation with 2 members
    const conversation = await this.prisma.conversation.create({
      data: {
        members: {
          create: [{ userId }, { userId: targetUser.id }],
        },
      },
    });

    return { conversationId: conversation.id };
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    // Verify membership
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          include: { profile: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.reverse().map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        sender: {
          id: m.sender.id,
          username: m.sender.username,
          displayName: m.sender.profile?.displayName || m.sender.username,
          avatarUrl: m.sender.profile?.avatarUrl,
          isVerified: m.sender.isVerified,
        },
        content: m.content,
        mediaUrl: m.mediaUrl,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: dto.content.trim(),
          mediaUrl: dto.mediaUrl,
        },
        include: {
          sender: { include: { profile: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Notify other member
    const otherMembers = await this.prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
    });

    for (const om of otherMembers) {
      await this.prisma.notification.create({
        data: {
          userId: om.userId,
          actorId: senderId,
          type: 'DIRECT_MESSAGE',
          entityId: conversationId,
          message: 'sent you a message',
        },
      });
    }

    const result = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        displayName: message.sender.profile?.displayName || message.sender.username,
        avatarUrl: message.sender.profile?.avatarUrl,
        isVerified: message.sender.isVerified,
      },
      content: message.content,
      mediaUrl: message.mediaUrl,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    };

    // Emit live real-time message to conversation room
    this.eventsGateway.sendMessageToConversation(conversationId, result);

    // Emit live conversation update and updated unread count to other members
    for (const om of otherMembers) {
      const unreadCount = await this.prisma.message.count({
        where: {
          conversation: { members: { some: { userId: om.userId } } },
          senderId: { not: om.userId },
          isRead: false,
        },
      });

      this.eventsGateway.server?.to(`user:${om.userId}`).emit('messages:unread_count', {
        count: unreadCount,
      });

      this.eventsGateway.server?.to(`user:${om.userId}`).emit('conversation:update', {
        conversationId,
        lastMessage: result,
      });
    }

    return result;
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    await this.prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });

    this.eventsGateway.server?.to(`conversation:${conversationId}`).emit('conversation:read', {
      conversationId,
      userId,
    });

    const remainingUnread = await this.prisma.message.count({
      where: {
        conversation: { members: { some: { userId } } },
        senderId: { not: userId },
        isRead: false,
      },
    });

    this.eventsGateway.server?.to(`user:${userId}`).emit('messages:unread_count', {
      count: remainingUnread,
    });

    return { success: true };
  }
}
