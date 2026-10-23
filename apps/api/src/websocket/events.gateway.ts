import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.debug(`Client ${client.id} connected unauthenticated.`);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
        ),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Join user personal notification room
      client.join(`user:${userId}`);

      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId)!.add(client.id);

      this.logger.debug(`User ${userId} authenticated on socket ${client.id}`);
    } catch (err: any) {
      this.logger.debug(`Socket authentication failed: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSocketMap.has(userId)) {
      const set = this.userSocketMap.get(userId)!;
      set.delete(client.id);
      if (set.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(`conversation:${conversationId}`);
    this.logger.debug(`Client ${client.id} joined conversation:${conversationId}`);
    return { status: 'joined', conversationId };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
    this.logger.debug(`Client ${client.id} left conversation:${conversationId}`);
    return { status: 'left', conversationId };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; username?: string },
  ) {
    const userId = client.data?.userId;
    client.to(`conversation:${data.conversationId}`).emit('typing:user', {
      conversationId: data.conversationId,
      userId,
      username: data.username,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data?.userId;
    client.to(`conversation:${data.conversationId}`).emit('typing:user', {
      conversationId: data.conversationId,
      userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('call:start')
  handleCallStart(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      targetUserId?: string;
      conversationId: string;
      type: 'audio' | 'video';
      caller: any;
      isGroup?: boolean;
    },
  ) {
    const payload = {
      caller: data.caller,
      conversationId: data.conversationId,
      type: data.type,
      isGroup: !!data.isGroup,
    };

    if (data.targetUserId) {
      this.server.to(`user:${data.targetUserId}`).emit('call:incoming', payload);
    }
    if (data.conversationId) {
      client.to(`conversation:${data.conversationId}`).emit('call:incoming', payload);
    }
  }

  @SubscribeMessage('call:accept')
  handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId?: string; conversationId: string; user?: any },
  ) {
    const payload = {
      conversationId: data.conversationId,
      user: data.user,
    };
    if (data.targetUserId) {
      this.server.to(`user:${data.targetUserId}`).emit('call:accepted', payload);
    }
    if (data.conversationId) {
      client.to(`conversation:${data.conversationId}`).emit('call:accepted', payload);
    }
  }

  @SubscribeMessage('call:reject')
  handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId?: string; conversationId: string },
  ) {
    if (data.targetUserId) {
      this.server.to(`user:${data.targetUserId}`).emit('call:rejected', {
        conversationId: data.conversationId,
      });
    }
    if (data.conversationId) {
      client.to(`conversation:${data.conversationId}`).emit('call:rejected', {
        conversationId: data.conversationId,
      });
    }
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId?: string; conversationId: string },
  ) {
    if (data.targetUserId) {
      this.server.to(`user:${data.targetUserId}`).emit('call:ended', {
        conversationId: data.conversationId,
      });
    }
    if (data.conversationId) {
      client.to(`conversation:${data.conversationId}`).emit('call:ended', {
        conversationId: data.conversationId,
      });
    }
  }

  @SubscribeMessage('call:signal')
  handleCallSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { targetUserId?: string; conversationId: string; signal: any },
  ) {
    const payload = {
      signal: data.signal,
      fromUserId: client.data?.userId,
      conversationId: data.conversationId,
    };
    if (data.targetUserId) {
      this.server.to(`user:${data.targetUserId}`).emit('call:signal', payload);
    } else if (data.conversationId) {
      client.to(`conversation:${data.conversationId}`).emit('call:signal', payload);
    }
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server?.to(`user:${userId}`).emit('notification:new', notification);
  }

  sendMessageToConversation(conversationId: string, message: any) {
    this.server?.to(`conversation:${conversationId}`).emit('message:received', message);
  }
}
