/**
 * Tests para AuthService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../AuthService';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReset();
    (localStorage.setItem as ReturnType<typeof vi.fn>).mockReset();
    (localStorage.removeItem as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('login', () => {
    it('debe realizar login exitosamente', async () => {
      const mockResponse = {
        access_token: 'test-token-123',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'admin@restaurant.com',
          name: 'Administrador',
          is_admin: true
        }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authService.login('admin@restaurant.com', 'password');

      expect(result.token).toBe('test-token-123');
      expect(result.user.is_admin).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('debe lanzar error con credenciales inválidas', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ detail: 'Credenciales inválidas' })
      });

      await expect(authService.login('wrong@test.com', 'wrong'))
        .rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('debe limpiar localStorage al hacer logout', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    it('debe retornar false si no hay token', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('debe retornar false si hay token pero no usuario', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>)
        .mockImplementation((key: string) => {
          if (key === 'authToken') return 'some-token';
          return null;
        });

      const result = authService.isAuthenticated();

      // Sin usuario cargado, debe ser false
      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('debe retornar token si existe', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>)
        .mockReturnValue('stored-token');

      const result = authService.getToken();

      expect(result).toBe('stored-token');
    });

    it('debe retornar null si no hay token', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('debe retornar null si no hay usuario', () => {
      const result = authService.getUser();

      expect(result).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('debe retornar false si no hay token', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = await authService.verifyToken();

      expect(result).toBe(false);
    });

    it('debe retornar true si el token es válido', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('valid-token');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ id: 1, email: 'test@test.com' })
      });

      const result = await authService.verifyToken();

      expect(result).toBe(true);
    });

    it('debe hacer logout si el token es inválido', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid-token');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ detail: 'Token inválido' })
      });

      const result = await authService.verifyToken();

      expect(result).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalled();
    });
  });
});
