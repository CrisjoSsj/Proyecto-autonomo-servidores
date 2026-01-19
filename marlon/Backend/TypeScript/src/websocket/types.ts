/**
 * Tipos e interfaces para el sistema WebSocket
 */

export type UserRole = 'cliente' | 'proveedor' | 'admin';
export type EventType =
  | 'reserva:creada'
  | 'reserva:actualizada'
  | 'reserva:cancelada'
  | 'servicio:creado'
  | 'servicio:actualizado'
  | 'calificacion:creada'
  | 'cliente:nuevo'
  | 'proveedor:nuevo'
  | 'pago:procesado'
  | 'dashboard:metrics'
  | 'dashboard:refresh';

export interface AuthPayload {
  token: string;
  userId: string;
  role: UserRole;
}

export interface ConnectedClient {
  userId: string;
  socketId: string;
  role: UserRole;
  connectedAt: Date;
  lastActivity: Date;
}

export interface WebSocketEvent {
  type: EventType;
  payload: any;
  timestamp: Date;
  source?: string;
}

export interface DashboardMetrics {
  activeConnections: number;
  totalConnections: number;
  eventsEmitted: number;
  roomsCreated: number;
}

export interface ClientStats {
  total: number;
  byRole: Record<UserRole, number>;
}

export interface RoomInfo {
  name: string;
  clients: number;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  clients: ClientStats;
  rooms: {
    total: number;
    totalClients: number;
  };
  system: {
    uptime: number;
    nodeVersion: string;
  };
}

export interface BusinessEvent {
  type: EventType;
  data: {
    reserva?: {
      id: number;
      clienteId: number;
      estado: string;
      fecha: string;
      hora: string;
      totalEstimado: number;
    };
    servicio?: {
      id: number;
      nombre: string;
      precio: number;
      proveedorId: number;
      categoriaId: number;
    };
    cliente?: {
      id: number;
      nombre: string;
      email: string;
    };
    proveedor?: {
      id: number;
      nombre: string;
      email: string;
    };
    calificacion?: {
      id: number;
      puntuacion: number;
      servicioId: number;
    };
    pago?: {
      id: number;
      monto: number;
      estado: string;
      reservaId: number;
    };
  };
  timestamp: Date;
}

export interface ReservasByMonth {
  mes: string;
  total: number;
  confirmadas: number;
  pendientes: number;
  canceladas: number;
}

export interface ServiceStats {
  total: number;
  activos: number;
  inactivos: number;
  porCategoria: Record<string, number>;
}

export interface ClienteStats {
  total: number;
  activos: number;
  inactivos: number;
  porMes: Array<{ mes: string; cantidad: number }>;
}
