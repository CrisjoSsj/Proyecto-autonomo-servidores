import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { AuthPayload, UserRole } from './types';
import { Logger } from '@nestjs/common';

@WSGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('WebSocketGateway');
  private authenticatedSockets = new Set<string>();

  constructor(private webSocketService: WebSocketService) {}

  afterInit(server: Server) {
    this.webSocketService.setServer(server);
    this.logger.log('WebSocket Gateway inicializado');
  }

  handleConnection(socket: Socket) {
    this.logger.log(`Cliente conectado: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Cliente desconectado: ${socket.id}`);
    this.webSocketService.unregisterClient(socket.id);
    this.authenticatedSockets.delete(socket.id);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: AuthPayload,
  ) {
    try {
      // Aquí se podría validar el token JWT
      // Por ahora, simplemente registramos el cliente
      const role = data.role as UserRole;
      this.webSocketService.registerClient(socket.id, data.userId, role);
      this.authenticatedSockets.add(socket.id);

      // El cliente se une a una sala según su rol
      socket.join(role);
      socket.join(`user:${data.userId}`);

      socket.emit('auth_success', {
        message: 'Autenticación exitosa',
        socketId: socket.id,
        role,
      });

      this.logger.log(
        `Usuario autenticado: ${data.userId} (${role}) - Socket: ${socket.id}`,
      );

      // Emitir actualización de métricas
      this.webSocketService.broadcastMetricsUpdate();
    } catch (error) {
      this.logger.error('Error en autenticación:', error);
      socket.emit('auth_error', {
        message: 'Error de autenticación',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { room: string },
  ) {
    if (!this.authenticatedSockets.has(socket.id)) {
      socket.emit('error', { message: 'No autenticado' });
      return;
    }

    socket.join(data.room);
    this.logger.log(`Socket ${socket.id} se unió a la sala: ${data.room}`);
    socket.emit('room_joined', { room: data.room });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { room: string },
  ) {
    socket.leave(data.room);
    this.logger.log(`Socket ${socket.id} salió de la sala: ${data.room}`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    if (this.authenticatedSockets.has(socket.id)) {
      this.webSocketService.updateClientActivity(socket.id);
      socket.emit('pong', { data, timestamp: new Date() });
    }
  }

  @SubscribeMessage('get_dashboard_summary')
  handleGetDashboardSummary(
    @ConnectedSocket() socket: Socket,
  ) {
    if (!this.authenticatedSockets.has(socket.id)) {
      socket.emit('error', { message: 'No autenticado' });
      return;
    }

    const summary = this.webSocketService.getDashboardSummary();
    socket.emit('dashboard_summary', summary);
  }

  @SubscribeMessage('get_recent_events')
  handleGetRecentEvents(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { limit?: number },
  ) {
    if (!this.authenticatedSockets.has(socket.id)) {
      socket.emit('error', { message: 'No autenticado' });
      return;
    }

    const limit = data?.limit || 50;
    const events = this.webSocketService.getRecentEvents(limit);
    socket.emit('recent_events', { events });
  }
}
