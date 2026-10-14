import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SendMessageDto } from '@varta/shared';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

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

    return memberRecords.map((m) => {
      const otherMember = m.conversation.members[0]?.user;
      const lastMessage = m.conversation.messages[0] || null;

      return {
        id: m.conversationId,
        otherMember: otherMember
          ? {
              id: otherMember.id,
              username: otherMember.username,
              displayName: otherMember.profile?.displayName || otherMember.username,
              avatarUrl: otherMember.profile?.avatarUrl,
              isVerified: otherMember.isVerified,
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
        unreadCount: 0,
        updatedAt: m.conversation.updatedAt.toISOString(),
      };
    });
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

    return {
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

    return { success: true };
  }
}
