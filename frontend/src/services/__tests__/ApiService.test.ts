/**
 * Tests para ApiService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../ApiService';

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('getMesas', () => {
    it('debe obtener mesas correctamente', async () => {
      const mockMesas = [
        { id_mesa: 1, numero: 1, capacidad: 4, estado: 'disponible' },
        { id_mesa: 2, numero: 2, capacidad: 2, estado: 'ocupada' }
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockMesas)
      });

      const result = await apiService.getMesas();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].numero).toBe(1);
      expect(result[0].capacidad).toBe(4);
    });

    it('debe manejar error de red', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      await expect(apiService.getMesas()).rejects.toThrow('Failed to fetch');
    });
  });

  describe('getReservas', () => {
    it('debe obtener reservas correctamente', async () => {
      const mockReservas = [
        { 
          id_reserva: 1, 
          id_mesa: 1, 
          fecha: '2026-01-09', 
          hora_inicio: '12:00',
          estado: 'pendiente'
        }
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockReservas)
      });

      const result = await apiService.getReservas();

      expect(result).toHaveLength(1);
      expect(result[0].id_reserva).toBe(1);
      expect(result[0].estado).toBe('pendiente');
    });
  });

  describe('crearReserva', () => {
    it('debe crear una reserva correctamente', async () => {
      const nuevaReserva = {
        id_mesa: 1,
        fecha: '2026-01-15',
        hora_inicio: '19:00',
        nombre: 'Test Usuario',
        telefono: '0991234567',
        email: 'test@test.com',
        numero_personas: 4
      };

      const mockResponse = {
        id_reserva: 123,
        ...nuevaReserva,
        hora_fin: '21:00',
        estado: 'pendiente'
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiService.crearReserva(nuevaReserva);

      expect(result.id_reserva).toBe(123);
      expect(result.nombre).toBe('Test Usuario');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reserva/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('debe manejar error 409 de conflicto', async () => {
      const nuevaReserva = {
        id_mesa: 1,
        fecha: '2026-01-15',
        hora_inicio: '19:00',
        nombre: 'Test',
        telefono: '099',
        email: 'test@test.com',
        numero_personas: 2
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ detail: 'Conflicto de horario' })
      });

      await expect(apiService.crearReserva(nuevaReserva))
        .rejects.toThrow();
    });
  });

  describe('getFilaVirtual', () => {
    it('debe obtener fila virtual correctamente', async () => {
      const mockFila = [
        { id: 1, nombre: 'Cliente 1', telefono: '099', numeroPersonas: 2, posicion: 1, tiempoEstimado: 15 }
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockFila)
      });

      const result = await apiService.getFilaVirtual();

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Cliente 1');
    });
  });

  describe('login', () => {
    it('debe realizar login y guardar token', async () => {
      const mockResponse = {
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
        user: { id: 1, email: 'admin@test.com', name: 'Admin', is_admin: true }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiService.login('admin@test.com', 'password123');

      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.user.is_admin).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'fake-jwt-token');
    });
  });

  describe('logout', () => {
    it('debe remover token de localStorage', () => {
      apiService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('getEstadisticasMesas', () => {
    it('debe obtener estadísticas de mesas', async () => {
      const mockStats = {
        total: 10,
        disponibles: 5,
        ocupadas: 3,
        reservadas: 2
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockStats)
      });

      const result = await apiService.getEstadisticasMesas();

      expect(result.total).toBe(10);
      expect(result.disponibles).toBe(5);
    });
  });

  describe('getDisponibilidad', () => {
    it('debe obtener disponibilidad para fecha', async () => {
      const mockDisponibilidad = {
        fecha: '2026-01-15',
        personas: 4,
        mesas_disponibles: [
          { mesa_id: 1, numero: 1, capacidad: 4, horarios_disponibles: ['12:00', '14:00'] }
        ],
        total_opciones: 2
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockDisponibilidad)
      });

      const result = await apiService.getDisponibilidad('2026-01-15', 4);

      expect(result.mesas_disponibles).toHaveLength(1);
      expect(result.mesas_disponibles[0].horarios_disponibles).toContain('12:00');
    });
  });
});
