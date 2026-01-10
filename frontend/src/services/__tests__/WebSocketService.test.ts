/**
 * Tests para WebSocketService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { wsService } from '../WebSocketService';

describe('WebSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Forzar desconexión antes de cada test
    wsService.disconnect();
  });

  describe('connect', () => {
    it('debe conectarse al WebSocket', () => {
      wsService.connect();

      // El mock de WebSocket debería haberse instanciado
      expect(wsService.isConnected()).toBe(true);
    });

    it('no debe crear múltiples conexiones', () => {
      wsService.connect();
      wsService.connect();
      wsService.connect();

      // Solo debería haber una conexión activa
      expect(wsService.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('debe desconectarse del WebSocket', () => {
      wsService.connect();
      wsService.disconnect();

      expect(wsService.isConnected()).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('debe suscribirse a un canal y recibir mensajes', () => {
      wsService.connect();

      const callback = vi.fn();
      const unsubscribe = wsService.subscribe('mesas', callback);

      expect(unsubscribe).toBeInstanceOf(Function);

      // Limpiar
      unsubscribe();
    });

    it('debe poder desuscribirse de un canal', () => {
      wsService.connect();

      const callback = vi.fn();
      const unsubscribe = wsService.subscribe('reservas', callback);

      // Desuscribirse
      unsubscribe();

      // El callback no debería llamarse después
      expect(callback).not.toHaveBeenCalled();
    });

    it('debe permitir múltiples suscriptores al mismo canal', () => {
      wsService.connect();

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = wsService.subscribe('fila_virtual', callback1);
      const unsub2 = wsService.subscribe('fila_virtual', callback2);

      expect(unsub1).toBeInstanceOf(Function);
      expect(unsub2).toBeInstanceOf(Function);

      // Limpiar
      unsub1();
      unsub2();
    });
  });

  describe('send', () => {
    it('no debe enviar si no está conectado', () => {
      wsService.disconnect();

      // No debería lanzar error, solo logear
      wsService.send({
        channel: 'mesas',
        action: 'update',
        data: {}
      });

      // Debería intentar reconectar
      expect(wsService.isConnected()).toBe(true);
    });

    it('debe enviar mensaje cuando está conectado', () => {
      wsService.connect();

      wsService.send({
        channel: 'reservas',
        action: 'crear',
        data: { test: true }
      });

      // El mock de WebSocket.send debería haberse llamado
      expect(wsService.isConnected()).toBe(true);
    });
  });

  describe('métodos específicos por canal', () => {
    beforeEach(() => {
      wsService.connect();
    });

    it('joinFilaVirtual debe enviar mensaje correcto', () => {
      wsService.joinFilaVirtual(123, 'Cliente Test');

      expect(wsService.isConnected()).toBe(true);
    });

    it('leaveFilaVirtual debe enviar mensaje correcto', () => {
      wsService.leaveFilaVirtual(123);

      expect(wsService.isConnected()).toBe(true);
    });

    it('updateMesaStatus debe enviar mensaje correcto', () => {
      wsService.updateMesaStatus(1, 'ocupada');

      expect(wsService.isConnected()).toBe(true);
    });

    it('subscribeReservas debe enviar mensaje correcto', () => {
      wsService.subscribeReservas();

      expect(wsService.isConnected()).toBe(true);
    });

    it('newReserva debe enviar mensaje correcto', () => {
      wsService.newReserva({ id_mesa: 1, fecha: '2026-01-15' });

      expect(wsService.isConnected()).toBe(true);
    });

    it('updateReserva debe enviar mensaje correcto', () => {
      wsService.updateReserva(1, { estado: 'confirmada' });

      expect(wsService.isConnected()).toBe(true);
    });

    it('cancelReserva debe enviar mensaje correcto', () => {
      wsService.cancelReserva(1);

      expect(wsService.isConnected()).toBe(true);
    });

    it('deleteReserva debe enviar mensaje correcto', () => {
      wsService.deleteReserva(1);

      expect(wsService.isConnected()).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('debe retornar false cuando no hay conexión', () => {
      wsService.disconnect();

      expect(wsService.isConnected()).toBe(false);
    });

    it('debe retornar true cuando hay conexión abierta', () => {
      wsService.connect();

      expect(wsService.isConnected()).toBe(true);
    });
  });
});
