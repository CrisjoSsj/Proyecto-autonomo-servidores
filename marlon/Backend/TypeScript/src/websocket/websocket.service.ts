import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  ConnectedClient,
  WebSocketEvent,
  DashboardMetrics,
  DashboardSummary,
  BusinessEvent,
  UserRole,
} from './types';

@Injectable()
export class WebSocketService {
  private server: Server;
  private connectedClients = new Map<string, ConnectedClient>();
  private events: WebSocketEvent[] = [];
  private metrics: DashboardMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    eventsEmitted: 0,
    roomsCreated: 0,
  };
  private readonly MAX_EVENTS_HISTORY = 100;

  setServer(server: Server) {
    this.server = server;
  }

  registerClient(socketId: string, userId: string, role: UserRole) {
    const client: ConnectedClient = {
      userId,
      socketId,
      role,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };
    this.connectedClients.set(socketId, client);
    this.metrics.totalConnections++;
    this.metrics.activeConnections = this.connectedClients.size;
  }

  unregisterClient(socketId: string) {
    this.connectedClients.delete(socketId);
    this.metrics.activeConnections = this.connectedClients.size;
  }

  getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }

  getClientBySocketId(socketId: string): ConnectedClient | undefined {
    return this.connectedClients.get(socketId);
  }

  updateClientActivity(socketId: string) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  recordEvent(event: WebSocketEvent) {
    this.events.unshift(event);
    if (this.events.length > this.MAX_EVENTS_HISTORY) {
      this.events.pop();
    }
    this.metrics.eventsEmitted++;
  }

  getRecentEvents(limit: number = 50): WebSocketEvent[] {
    return this.events.slice(0, limit);
  }

  broadcastEvent(event: BusinessEvent) {
    const wsEvent: WebSocketEvent = {
      type: event.type,
      payload: event.data,
      timestamp: new Date(),
      source: 'REST_API',
    };

    this.recordEvent(wsEvent);

    // Emitir a todos los clientes conectados
    this.server.emit('negocio:evento', wsEvent);

    // Emitir de acuerdo al tipo de evento
    switch (event.type) {
      case 'reserva:creada':
      case 'reservation_created':
        this.server.emit('reserva:nueva', wsEvent.payload);
        this.server.emit('reservation_created', wsEvent.payload);
        this.server.to('admin').emit('reserva:notificacion', wsEvent.payload);
        break;

      case 'reserva:actualizada':
      case 'reservation_updated':
        this.server.emit('reserva:cambio', wsEvent.payload);
        this.server.emit('reservation_updated', wsEvent.payload);
        break;

      case 'reserva:cancelada':
      case 'reservation_deleted':
        this.server.emit('reserva:cancelacion', wsEvent.payload);
        this.server.emit('reservation_deleted', wsEvent.payload);
        break;

      case 'servicio:creado':
        this.server.emit('servicio:disponible', wsEvent.payload);
        this.server.to('cliente').emit('servicio:nuevo', wsEvent.payload);
        break;

      case 'calificacion:creada':
        this.server.emit('calificacion:nueva', wsEvent.payload);
        break;

      case 'cliente:nuevo':
        this.server.to('admin').emit('cliente:registrado', wsEvent.payload);
        break;

      case 'pago:procesado':
      case 'payment_created':
      case 'payment_updated':
        this.server.emit('pago:confirmado', wsEvent.payload);
        this.server.emit('payment_created', wsEvent.payload);
        this.server.emit('payment_updated', wsEvent.payload);
        break;
    }
  }

  broadcastDashboardUpdate(data: any) {
    this.server.emit('dashboard:update', data);
  }

  broadcastMetricsUpdate() {
    this.server.emit('dashboard:metrics', this.getMetrics());
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    const client = Array.from(this.connectedClients.values()).find(
      (c) => c.userId === userId,
    );
    if (client) {
      this.server.to(client.socketId).emit(event, data);
    }
  }

  emitToRole(role: UserRole, event: string, data: any) {
    const clients = Array.from(this.connectedClients.values()).filter(
      (c) => c.role === role,
    );
    clients.forEach((c) => {
      this.server.to(c.socketId).emit(event, data);
    });
  }

  getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  getDashboardSummary(): DashboardSummary {
    const clients = this.getConnectedClients();
    const byRole: Record<UserRole, number> = {
      cliente: 0,
      proveedor: 0,
      admin: 0,
    };

    clients.forEach((c) => {
      byRole[c.role]++;
    });

    let totalClientsInRooms = 0;
    let roomCount = 0;

    if (this.server && this.server.sockets && this.server.sockets.adapter) {
      const rooms = this.server.sockets.adapter.rooms;
      rooms.forEach((sockets, roomName) => {
        if (!this.server.sockets.adapter.sids.get(roomName)) {
          roomCount++;
          totalClientsInRooms += sockets.size;
        }
      });
    }

    return {
      metrics: this.getMetrics(),
      clients: {
        total: clients.length,
        byRole,
      },
      rooms: {
        total: roomCount,
        totalClients: totalClientsInRooms,
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
    };
  }

  getRoomsList() {
    const result: Array<{ name: string; clients: number }> = [];

    if (!this.server || !this.server.sockets || !this.server.sockets.adapter) {
      return result;
    }

    const rooms = this.server.sockets.adapter.rooms;
    rooms.forEach((sockets, roomName) => {
      if (!this.server.sockets.adapter.sids.get(roomName)) {
        result.push({
          name: roomName,
          clients: sockets.size,
        });
        this.metrics.roomsCreated++;
      }
    });

    return result;
  }
}
