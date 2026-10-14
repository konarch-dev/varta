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
    return { status: 'joined', conversationId };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.leave(`conversation:${conversationId}`);
    return { status: 'left', conversationId };
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  sendMessageToConversation(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:received', message);
  }
}
