/**
 * Tipos e interfaces para el Frontend
 */

export type UserRole = 'cliente' | 'proveedor' | 'admin';

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

export interface CalificacionesStats {
  promedioGeneral: number;
  porServicio?: Array<{
    servicioId: string;
    promedio: string;
    total: number;
  }>;
  totalCalificaciones: number;
}

export interface DashboardStats {
  services?: ServiceStats;
  clients?: ClienteStats;
  reservas?: ReservasByMonth[];
  calificaciones?: CalificacionesStats;
  timestamp?: Date;
}

export interface PlatformStatus {
  serviciosDisponibles: number;
  clientesRegistrados: number;
  proveedoresRegistrados: number;
  reservasActivas: number;
  tasaCompletion: string | number;
}

export interface Reserva {
  id: number;
  clienteId: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  fecha: string;
  hora: string;
  totalEstimado: number;
}

export interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  proveedorId: number;
  categoriaId: number;
  rating?: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  email: string;
}

export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source?: string;
}

export interface BusinessKPI {
  ingresos_totales: number;
  ingresos_promedio_reserva: number;
  reservas_confirmadas: number;
  reservas_pendientes: number;
  reservas_canceladas: number;
  reservas_totales: number;
  tasa_conversion: number;
  tasa_cancelacion: number;
  satisfaccion_promedio: number;
  calificaciones_totales: number;
  servicios_totales: number;
  clientes_totales: number;
  proveedores_totales: number;
}

export interface TopServicio {
  id: number;
  nombre: string;
  reservas: number;
  rating: number;
  precio: number;
}

export interface TopProveedor {
  id: number;
  nombre: string;
  servicios: number;
  rating_promedio: number;
  calificaciones: number;
}

export interface ServiciosAnalisis {
  total_servicios: number;
  top_servicios: TopServicio[];
  servicios_por_categoria: Record<string, number>;
}

export interface ProveedoresAnalisis {
  total_proveedores: number;
  top_proveedores: TopProveedor[];
  proveedor_mejor_calificado: TopProveedor | null;
}
