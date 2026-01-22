/**
 * WebSocketService.ts
 * Servicio para comunicación en tiempo real con el servidor WebSocket Ruby
 * Conecta a ws://localhost:3001
 */

import type { WebSocketChannel, WebSocketMessage, MessageCallback } from '../types';

// Re-exportar tipos para compatibilidad
export type { WebSocketMessage, MessageCallback };

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000; // 5 segundos
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  /**
   * Conectar al servidor WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      // Ya estamos conectados o en proceso de conexión: no hacer nada (silenciar en dev para evitar ruido por StrictMode)
      console.debug('WebSocket: conexión existente o en progreso');
      return;
    }

    this.isConnecting = true;
    console.log('WebSocket: Conectando a ws://localhost:3001...');

    try {
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onopen = (): void => {
        console.log('✅ WebSocket: Conectado exitosamente');
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event: MessageEvent): void => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('📨 WebSocket: Mensaje recibido:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ WebSocket: Error al parsear mensaje:', error);
        }
      };

      this.ws.onerror = (error: Event): void => {
        console.error('❌ WebSocket: Error de conexión:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (): void => {
        console.log('🔌 WebSocket: Conexión cerrada');
        this.isConnecting = false;
        this.ws = null;

        // Reconexión automática
        if (this.shouldReconnect) {
          console.log(`🔄 WebSocket: Reconectando en ${this.reconnectInterval / 1000}s...`);
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket: Error al crear conexión:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Desconectar del servidor WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('🔌 WebSocket: Desconectado');
  }

  /**
   * Enviar mensaje al servidor WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 WebSocket: Mensaje enviado:', message);
    } else {
      console.error('❌ WebSocket: No se puede enviar, no está conectado');
      // Intentar reconectar
      this.connect();
    }
  }

  /**
   * Manejar mensajes recibidos y notificar a los listeners
   */
  private handleMessage(message: WebSocketMessage): void {
    const channel = message.channel?.toLowerCase();
    if (!channel) return;

    // Notificar a todos los listeners del canal
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach(callback => callback(message));
    }

    // Notificar a listeners globales
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(message));
    }
  }

  /**
   * Suscribirse a mensajes de un canal específico
   */
  subscribe(channel: string, callback: MessageCallback): () => void {
    const channelKey = channel.toLowerCase();
    
    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }

    this.listeners.get(channelKey)!.add(callback);
    console.log(`🔔 WebSocket: Suscrito al canal "${channelKey}"`);

    // Retornar función para desuscribirse
    return () => {
      const listeners = this.listeners.get(channelKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(channelKey);
        }
      }
      console.log(`🔕 WebSocket: Desuscrito del canal "${channelKey}"`);
    };
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ========== MÉTODOS ESPECÍFICOS POR CANAL ==========

  /**
   * FILA VIRTUAL - Unirse a la fila
   */
  joinFilaVirtual(clienteId: number, nombre: string): void {
    this.send({
      channel: 'fila_virtual',
      action: 'join',
      data: {
        cliente_id: clienteId,
        nombre: nombre,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * FILA VIRTUAL - Salir de la fila
   */
  leaveFilaVirtual(clienteId: number): void {
    this.send({
      channel: 'fila_virtual',
      action: 'leave',
      data: {
        cliente_id: clienteId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * MESAS - Actualizar estado de mesa
   */
  updateMesaStatus(mesaId: number, estado: 'libre' | 'ocupada' | 'reservada' | 'limpieza'): void {
    this.send({
      channel: 'mesas',
      action: 'update_status',
      data: {
        mesa_id: mesaId,
        estado: estado,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * RESERVAS - Suscribirse al canal de reservas
   */
  subscribeReservas(): void {
    this.send({
      channel: 'reservas',
      action: 'subscribed',
      data: {}
    });
  }

  /**
   * RESERVAS - Nueva reserva
   */
  newReserva(reservaData: Record<string, unknown>): void {
    this.send({
      channel: 'reservas',
      action: 'crear',
      data: {
        ...reservaData,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * RESERVAS - Listar reservas
   */
  listReservas(): void {
    this.send({
      channel: 'reservas',
      action: 'listar',
      data: {}
    });
  }

  /**
   * RESERVAS - Actualizar reserva
   */
  updateReserva(reservaId: number, updates: Record<string, unknown>): void {
    this.send({
      channel: 'reservas',
      action: 'actualizar',
      data: {
        id_reserva: reservaId,
        ...updates,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * RESERVAS - Cancelar reserva
   */
  cancelReserva(reservaId: number): void {
    this.send({
      channel: 'reservas',
      action: 'cancelar',
      data: {
        id_reserva: reservaId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * RESERVAS - Eliminar reserva
   */
  deleteReserva(reservaId: number): void {
    this.send({
      channel: 'reservas',
      action: 'eliminar',
      data: {
        id_reserva: reservaId,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Exportar instancia singleton
export const wsService = new WebSocketService();

// Re-exportar tipo de canal para uso externo
export type { WebSocketChannel };
