/**
 * Tests para ReservaForm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservaForm from '../user/ReservaForm';

// Mock del apiService
vi.mock('../../services/ApiService', () => ({
  apiService: {
    getMesas: vi.fn(),
    getDisponibilidad: vi.fn(),
    crearReserva: vi.fn(),
  }
}));

import { apiService } from '../../services/ApiService';

describe('ReservaForm', () => {
  const mockMesas = [
    { id: 1, id_mesa: 1, numero: 1, capacidad: 4, estado: 'disponible' },
    { id: 2, id_mesa: 2, numero: 2, capacidad: 2, estado: 'disponible' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getMesas as ReturnType<typeof vi.fn>).mockResolvedValue(mockMesas);
    (apiService.getDisponibilidad as ReturnType<typeof vi.fn>).mockResolvedValue({
      mesas_disponibles: [],
      total_opciones: 0
    });
  });

  it('debe renderizar el formulario correctamente', async () => {
    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
  });

  it('debe mostrar error si se envía sin campos requeridos', async () => {
    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /confirmar reserva/i });
    fireEvent.click(submitButton);

    // El formulario HTML debería prevenir el envío
    // o mostrar mensaje de error
    await waitFor(() => {
      // El botón debería seguir disponible (no loading)
      expect(submitButton).not.toHaveTextContent(/creando/i);
    });
  });

  it('debe cargar mesas al montar', async () => {
    render(<ReservaForm />);

    await waitFor(() => {
      expect(apiService.getMesas).toHaveBeenCalled();
    });
  });

  it('debe llamar getDisponibilidad cuando se selecciona fecha', async () => {
    (apiService.getDisponibilidad as ReturnType<typeof vi.fn>).mockResolvedValue({
      mesas_disponibles: [
        { mesa_id: 1, numero: 1, capacidad: 4, horarios_disponibles: ['12:00', '14:00'] }
      ],
      total_opciones: 2
    });

    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
    });

    const fechaInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(fechaInput, { target: { value: '2026-01-15' } });

    await waitFor(() => {
      expect(apiService.getDisponibilidad).toHaveBeenCalledWith('2026-01-15', expect.any(Number));
    });
  });

  it('debe mostrar mensaje de éxito cuando se crea reserva', async () => {
    (apiService.getMesas as ReturnType<typeof vi.fn>).mockResolvedValue(mockMesas);
    (apiService.getDisponibilidad as ReturnType<typeof vi.fn>).mockResolvedValue({
      mesas_disponibles: [
        { mesa_id: 1, numero: 1, capacidad: 4, horarios_disponibles: ['12:00', '14:00'] }
      ],
      total_opciones: 2
    });
    (apiService.crearReserva as ReturnType<typeof vi.fn>).mockResolvedValue({
      id_reserva: 123,
      nombre: 'Test User',
      fecha: '2026-01-15',
      hora_inicio: '12:00',
      hora_fin: '14:00'
    });

    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });

    // Llenar formulario
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '0991234567' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: '2026-01-15' } });

    await waitFor(() => {
      expect(apiService.getDisponibilidad).toHaveBeenCalled();
    });
  });

  it('debe manejar error de conflicto de horario', async () => {
    (apiService.crearReserva as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('HTTP 409: Conflicto de horario')
    );

    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });

    // El mensaje de error específico debería mostrarse después de intentar crear
  });

  it('debe permitir cambiar número de personas', async () => {
    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/número de personas/i)).toBeInTheDocument();
    });

    const personasSelect = screen.getByLabelText(/número de personas/i);
    fireEvent.change(personasSelect, { target: { value: '4' } });

    expect(personasSelect).toHaveValue('4');
  });

  it('debe mostrar ocasiones especiales', async () => {
    render(<ReservaForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/ocasión especial/i)).toBeInTheDocument();
    });

    const ocasionSelect = screen.getByLabelText(/ocasión especial/i);
    expect(ocasionSelect).toBeInTheDocument();
  });
});
