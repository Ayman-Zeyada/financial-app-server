import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',

  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',
  TRANSACTION_DELETED = 'transaction:deleted',

  BUDGET_UPDATED = 'budget:updated',
  BUDGET_ALERT = 'budget:alert',

  GOAL_PROGRESS = 'goal:progress',
  GOAL_ACHIEVED = 'goal:achieved',

  NOTIFICATION = 'notification',
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<number, string[]> = new Map(); // userId -> socketIds[]

  initialize(server: HttpServer | HttpsServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      try {
        const decoded = jwt.verify(
          token as string,
          process.env.JWT_SECRET || 'fallback_secret',
        ) as { userId: number };
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on(SocketEvent.CONNECT, (socket) => {
      const userId = socket.data.userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      logger.info(`User ${userId} connected with socket ${socket.id}`);

      socket.join(`user:${userId}`);

      socket.on(SocketEvent.AUTHENTICATE, (data) => {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'fallback_secret') as {
            userId: number;
          };
          socket.data.userId = decoded.userId;
          socket.join(`user:${decoded.userId}`);
          socket.emit(SocketEvent.AUTHENTICATE, { success: true });
        } catch (error) {
          socket.emit(SocketEvent.AUTHENTICATE, { success: false, message: 'Invalid token' });
        }
      });

      socket.on(SocketEvent.DISCONNECT, () => {
        logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        const userSocketIds = this.userSockets.get(userId) || [];
        const updatedSocketIds = userSocketIds.filter((id) => id !== socket.id);

        if (updatedSocketIds.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, updatedSocketIds);
        }
      });
    });

    logger.info('Socket.IO server initialized');
  }

  emitToUser(userId: number, event: string, data: any): void {
    if (!this.io) {
      logger.error('Socket.IO server not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug(`Emitted ${event} to user ${userId}`);
  }

  emitToAll(event: string, data: any): void {
    if (!this.io) {
      logger.error('Socket.IO server not initialized');
      return;
    }

    this.io.emit(event, data);
    logger.debug(`Emitted ${event} to all users`);
  }

  isUserConnected(userId: number): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.length || 0) > 0;
  }

  getConnectedClientsCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  emitTransactionCreated(userId: number, transaction: any): void {
    this.emitToUser(userId, SocketEvent.TRANSACTION_CREATED, transaction);
  }

  emitTransactionUpdated(userId: number, transaction: any): void {
    this.emitToUser(userId, SocketEvent.TRANSACTION_UPDATED, transaction);
  }

  emitTransactionDeleted(userId: number, transactionId: number): void {
    this.emitToUser(userId, SocketEvent.TRANSACTION_DELETED, { id: transactionId });
  }

  emitBudgetUpdated(userId: number, budget: any): void {
    this.emitToUser(userId, SocketEvent.BUDGET_UPDATED, budget);
  }

  emitBudgetAlert(userId: number, budgetAlert: any): void {
    this.emitToUser(userId, SocketEvent.BUDGET_ALERT, budgetAlert);
  }

  emitGoalProgress(userId: number, goalProgress: any): void {
    this.emitToUser(userId, SocketEvent.GOAL_PROGRESS, goalProgress);
  }

  emitGoalAchieved(userId: number, goal: any): void {
    this.emitToUser(userId, SocketEvent.GOAL_ACHIEVED, goal);
  }

  emitNotification(userId: number, notification: any): void {
    this.emitToUser(userId, SocketEvent.NOTIFICATION, notification);
  }
}

export const socketService = new SocketService();
export default socketService;
