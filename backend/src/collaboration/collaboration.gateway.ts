import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Collaboration Gateway
 * Handles real-time WebSocket connections for collaboration
 *
 * Events:
 * - join-workspace: Join a workspace room
 * - leave-workspace: Leave a workspace room
 * - card-updated: Broadcast card update
 * - comment-added: Broadcast new comment
 * - user-typing: Broadcast typing indicator
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);
  private connectedUsers: Map<
    string,
    { userId: string; workspaceId: string | null }
  > = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    try {
      // Authenticate via token
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      const userId = payload.userId;
      this.connectedUsers.set(client.id, { userId, workspaceId: null });

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.warn(`Client connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-workspace')
  handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Leave previous workspace if any
    if (user.workspaceId) {
      client.leave(`workspace:${user.workspaceId}`);
    }

    // Join new workspace
    client.join(`workspace:${data.workspaceId}`);
    user.workspaceId = data.workspaceId;

    // Notify others in workspace
    client.to(`workspace:${data.workspaceId}`).emit('user-joined', {
      userId: user.userId,
      timestamp: new Date(),
    });

    return { success: true, workspaceId: data.workspaceId };
  }

  @SubscribeMessage('leave-workspace')
  handleLeaveWorkspace(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (!user || !user.workspaceId) {
      return { error: 'Not in a workspace' };
    }

    client.to(`workspace:${user.workspaceId}`).emit('user-left', {
      userId: user.userId,
      timestamp: new Date(),
    });

    client.leave(`workspace:${user.workspaceId}`);
    user.workspaceId = null;

    return { success: true };
  }

  @SubscribeMessage('card-updated')
  handleCardUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string; cardId: string; updates: any },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Broadcast to all users in workspace except sender
    client.to(`workspace:${data.workspaceId}`).emit('card-updated', {
      cardId: data.cardId,
      updates: data.updates,
      updatedBy: user.userId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('comment-added')
  handleCommentAdded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string; cardId: string; comment: any },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Broadcast to all users in workspace
    this.server.to(`workspace:${data.workspaceId}`).emit('comment-added', {
      cardId: data.cardId,
      comment: data.comment,
      addedBy: user.userId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('user-typing')
  handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { workspaceId: string; cardId: string; isTyping: boolean },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Broadcast typing indicator
    client.to(`workspace:${data.workspaceId}`).emit('user-typing', {
      cardId: data.cardId,
      userId: user.userId,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  /**
   * Broadcast card update to workspace
   */
  broadcastCardUpdate(
    workspaceId: string,
    cardId: string,
    updates: any,
    userId: string,
  ) {
    this.server.to(`workspace:${workspaceId}`).emit('card-updated', {
      cardId,
      updates,
      updatedBy: userId,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast comment to workspace
   */
  broadcastComment(
    workspaceId: string,
    cardId: string,
    comment: any,
    userId: string,
  ) {
    this.server.to(`workspace:${workspaceId}`).emit('comment-added', {
      cardId,
      comment,
      addedBy: userId,
      timestamp: new Date(),
    });
  }
}
