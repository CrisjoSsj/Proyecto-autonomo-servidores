/**
 * Tests para ProtectedRoute
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../admin/ProtectedRoute';

// Mock del authService
vi.mock('../../services/AuthService', () => ({
  authService: {
    verifyToken: vi.fn(),
    isAuthenticated: vi.fn(),
    getToken: vi.fn(),
  }
}));

import { authService } from '../../services/AuthService';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar loading mientras verifica', async () => {
    // Simular verificación lenta
    (authService.verifyToken as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Contenido Protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/verificando autenticación/i)).toBeInTheDocument();
  });

  it('debe mostrar contenido cuando está autenticado', async () => {
    (authService.verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Contenido Protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
    });
  });

  it('debe redirigir a login cuando no está autenticado', async () => {
    (authService.verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Contenido Protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<div>Página de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Página de Login')).toBeInTheDocument();
    });

    expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
  });

  it('debe redirigir cuando hay error de verificación', async () => {
    (authService.verifyToken as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Token inválido')
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Contenido Protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<div>Página de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Página de Login')).toBeInTheDocument();
    });
  });

  it('debe llamar a verifyToken al montar', async () => {
    (authService.verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Contenido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authService.verifyToken).toHaveBeenCalledTimes(1);
    });
  });

  it('debe renderizar children correctamente cuando autenticado', async () => {
    (authService.verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">
                  <h1>Dashboard Admin</h1>
                  <p>Bienvenido</p>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
      expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    });
  });
});
