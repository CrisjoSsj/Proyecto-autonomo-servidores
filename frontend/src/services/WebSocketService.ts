/**
 * WebSocketService.ts
 * Servicio para comunicación en tiempo real con el servidor WebSocket Ruby
 * Conecta a ws://localhost:8080
 */

type MessageCallback = (message: any) => void;

interface WebSocketMessage {
  channel: 'fila_virtual' | 'mesas' | 'reservas';
  action: string;
  data: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000; // 5 segundos
  private reconnectTimer: number | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  /**
   * Conectar al servidor WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket: Ya está conectado o conectando');
      return;
    }

    this.isConnecting = true;
    console.log('WebSocket: Conectando a ws://localhost:8080...');

    try {
      this.ws = new WebSocket('ws://localhost:8080');

      this.ws.onopen = () => {
        console.log('✅ WebSocket: Conectado exitosamente');
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket: Mensaje recibido:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ WebSocket: Error al parsear mensaje:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket: Error de conexión:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
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
  private handleMessage(message: any): void {
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
   * RESERVAS - Nueva reserva
   */
  newReserva(reservaData: any): void {
    this.send({
      channel: 'reservas',
      action: 'new_reservation',
      data: {
        ...reservaData,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * RESERVAS - Actualizar reserva
   */
  updateReserva(reservaId: number, updates: any): void {
    this.send({
      channel: 'reservas',
      action: 'update_reservation',
      data: {
        reserva_id: reservaId,
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
      action: 'cancel_reservation',
      data: {
        reserva_id: reservaId,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Exportar instancia singleton
export const wsService = new WebSocketService();

// Hook para usar WebSocket en componentes
import { useEffect, useRef, useCallback } from 'react';

export function useWebSocketService(channelName: string) {
  const wsRef = useRef(wsService);

  useEffect(() => {
    wsRef.current.connect();
    return () => {
      wsRef.current.disconnect();
    };
  }, []);

  const on = useCallback((event: string, callback: MessageCallback) => {
    return wsRef.current.subscribe(event, callback);
  }, []);

  const emit = useCallback((action: string, data: any) => {
    wsRef.current.send({
      channel: channelName as 'fila_virtual' | 'mesas' | 'reservas',
      action,
      data,
    });
  }, [channelName]);

  return {
    on,
    emit,
    isConnected: () => wsRef.current.isConnected(),
  };
}

// Exportar tipos
export type { WebSocketMessage, MessageCallback };
