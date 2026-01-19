import { io, Socket } from 'socket.io-client';

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

export interface DashboardSummary {
  metrics: DashboardMetrics;
  clients: { total: number; byRole: Record<UserRole, number> };
  rooms: { total: number; totalClients: number };
  system: { uptime: number; nodeVersion: string };
}

// Singleton socket instance
let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:4000/ws', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    setupSocketListeners(socket);
  }
  return socket;
}

function setupSocketListeners(s: Socket) {
  s.on('connect', () => {
    console.log('✅ Conectado a WebSocket', s.id);
    reconnectAttempts = 0;
  });

  s.on('disconnect', (reason) => {
    console.log('❌ Desconectado de WebSocket:', reason);
    reconnectAttempts++;
  });

  s.on('connect_error', (error) => {
    console.error('⚠️ Error de conexión WebSocket:', error);
  });

  s.on('error', (error) => {
    console.error('❌ Error WebSocket:', error);
  });

  // Eventos de negocio
  s.on('negocio:evento', (event: WebSocketEvent) => {
    console.log('📡 Evento de negocio recibido:', event);
    // Aquí se pueden disparar eventos custom o actualizar UI
    window.dispatchEvent(
      new CustomEvent('websocket:evento', { detail: event })
    );
  });

  s.on('reserva:nueva', (data) => {
    console.log('🎫 Nueva reserva:', data);
    window.dispatchEvent(
      new CustomEvent('reserva:nueva', { detail: data })
    );
  });

  s.on('reserva:cambio', (data) => {
    console.log('🔄 Reserva actualizada:', data);
    window.dispatchEvent(
      new CustomEvent('reserva:cambio', { detail: data })
    );
  });

  s.on('servicio:disponible', (data) => {
    console.log('✨ Nuevo servicio disponible:', data);
    window.dispatchEvent(
      new CustomEvent('servicio:disponible', { detail: data })
    );
  });

  s.on('dashboard:update', (data) => {
    console.log('📊 Dashboard actualizado:', data);
    window.dispatchEvent(
      new CustomEvent('dashboard:update', { detail: data })
    );
  });

  s.on('dashboard:metrics', (metrics: DashboardMetrics) => {
    console.log('📈 Métricas del dashboard:', metrics);
    window.dispatchEvent(
      new CustomEvent('dashboard:metrics', { detail: metrics })
    );
  });

  s.on('calificacion:nueva', (data) => {
    console.log('⭐ Nueva calificación:', data);
    window.dispatchEvent(
      new CustomEvent('calificacion:nueva', { detail: data })
    );
  });

  s.on('pago:confirmado', (data) => {
    console.log('💳 Pago confirmado:', data);
    window.dispatchEvent(
      new CustomEvent('pago:confirmado', { detail: data })
    );
  });
}

export function authenticateSocket(params: {
  token: string;
  userId: string;
  role: UserRole;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    if (!s.connected) {
      s.connect();
    }

    const onSuccess = () => {
      s.off('auth_success', onSuccess);
      s.off('auth_error', onError);
      console.log('✅ Autenticación exitosa en WebSocket');
      resolve();
    };

    const onError = (payload: any) => {
      s.off('auth_success', onSuccess);
      s.off('auth_error', onError);
      console.error('❌ Error de autenticación:', payload);
      reject(new Error(payload?.message || 'auth_error'));
    };

    s.once('auth_success', onSuccess);
    s.once('auth_error', onError);
    s.emit('authenticate', params);

    // Timeout de 10 segundos
    setTimeout(() => {
      if (s.hasListeners('auth_success')) {
        reject(new Error('Timeout de autenticación'));
      }
    }, 10000);
  });
}

export function joinRoom(room: string): void {
  const s = getSocket();
  s.emit('join_room', { room });
}

export function leaveRoom(room: string): void {
  const s = getSocket();
  s.emit('leave_room', { room });
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    const onSummary = (data: DashboardSummary) => {
      s.off('dashboard_summary', onSummary);
      s.off('error', onError);
      resolve(data);
    };

    const onError = (payload: any) => {
      s.off('dashboard_summary', onSummary);
      s.off('error', onError);
      reject(new Error(payload?.message || 'Error obteniendo resumen'));
    };

    s.once('dashboard_summary', onSummary);
    s.once('error', onError);
    s.emit('get_dashboard_summary');

    setTimeout(() => {
      reject(new Error('Timeout obteniendo resumen del dashboard'));
    }, 10000);
  });
}

export function getRecentEvents(limit = 50): Promise<WebSocketEvent[]> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    const onEvents = (data: { events: WebSocketEvent[] }) => {
      s.off('recent_events', onEvents);
      s.off('error', onError);
      resolve(data.events);
    };

    const onError = (payload: any) => {
      s.off('recent_events', onEvents);
      s.off('error', onError);
      reject(new Error(payload?.message || 'Error obteniendo eventos'));
    };

    s.once('recent_events', onEvents);
    s.once('error', onError);
    s.emit('get_recent_events', { limit });

    setTimeout(() => {
      reject(new Error('Timeout obteniendo eventos recientes'));
    }, 10000);
  });
}

export function onBusinessEvent(callback: (event: WebSocketEvent) => void): () => void {
  const handler = (e: CustomEvent) => {
    callback(e.detail);
  };
  window.addEventListener('websocket:evento', handler as EventListener);
  return () => {
    window.removeEventListener('websocket:evento', handler as EventListener);
  };
}

export function onDashboardUpdate(callback: (data: any) => void): () => void {
  const handler = (e: CustomEvent) => {
    callback(e.detail);
  };
  window.addEventListener('dashboard:update', handler as EventListener);
  return () => {
    window.removeEventListener('dashboard:update', handler as EventListener);
  };
}

export function onReservaNueva(callback: (data: any) => void): () => void {
  const handler = (e: CustomEvent) => {
    callback(e.detail);
  };
  window.addEventListener('reserva:nueva', handler as EventListener);
  return () => {
    window.removeEventListener('reserva:nueva', handler as EventListener);
  };
}

export function onServicioDisponible(callback: (data: any) => void): () => void {
  const handler = (e: CustomEvent) => {
    callback(e.detail);
  };
  window.addEventListener('servicio:disponible', handler as EventListener);
  return () => {
    window.removeEventListener('servicio:disponible', handler as EventListener);
  };
}

export function onMetricsUpdate(callback: (metrics: DashboardMetrics) => void): () => void {
  const handler = (e: CustomEvent) => {
    callback(e.detail);
  };
  window.addEventListener('dashboard:metrics', handler as EventListener);
  return () => {
    window.removeEventListener('dashboard:metrics', handler as EventListener);
  };
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

export function getSocketId(): string | null {
  return socket?.id || null;
}


