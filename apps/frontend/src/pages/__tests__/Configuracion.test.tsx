import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Configuracion } from '@/pages/Configuracion';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    esSuperadmin: false,
    token: 'mock-token',
  }),
}));

// Mock apiRequest
const mockApiRequest = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  apiRequest: mockApiRequest,
}));

describe('Configuracion - Cambio de contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = () => {
    return render(<Configuracion />);
  };

  const fillPasswordForm = async (user: ReturnType<typeof userEvent.setup>, currentPassword: string, newPassword: string, confirmPassword: string) => {
    const currentInput = screen.getByLabelText(/^contraseña actual$/i);
    const newInput = screen.getByLabelText(/^nueva contraseña$/i);
    const confirmInput = screen.getByLabelText(/^confirmar nueva contraseña$/i);

    await user.type(currentInput, currentPassword);
    await user.type(newInput, newPassword);
    await user.type(confirmInput, confirmPassword);
  };

  it('debe renderizar el formulario de cambio de contraseña', () => {
    renderForm();

    expect(screen.getByLabelText(/^contraseña actual$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nueva contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirmar nueva contraseña$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('debe mostrar errores cuando los campos están vacíos', async () => {
    const user = userEvent.setup();
    renderForm();

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(submitButton);

    expect(await screen.findByText(/ingresá tu contraseña actual/i)).toBeInTheDocument();
  });

  it('debe mostrar error cuando las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillPasswordForm(user, 'Current123!', 'NewPass123!', 'Different123!');

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(submitButton);

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  it('debe hacer request exitoso cuando todos los campos son válidos', async () => {
    const user = userEvent.setup();
    mockApiRequest.mockResolvedValueOnce({ success: true, data: { mensaje: 'Contraseña actualizada correctamente.' } });

    renderForm();

    await fillPasswordForm(user, 'Current123!', 'NewPass123!', 'NewPass123!');

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/auth/cambiar-contrasena',
        expect.objectContaining({
          method: 'PUT',
          token: 'mock-token',
          body: {
            contrasenaActual: 'Current123!',
            nuevaContrasena: 'NewPass123!',
          },
        }),
      );
    });
  });

  it('debe mostrar error cuando la nueva contraseña no cumple los requisitos', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillPasswordForm(user, 'Current123!', 'weak', 'weak');

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(submitButton);

    expect(await screen.findByText(/la nueva contraseña no cumple los requisitos mínimos/i)).toBeInTheDocument();
  });

  it('debe limpiar el formulario tras un cambio exitoso', async () => {
    const user = userEvent.setup();
    mockApiRequest.mockResolvedValueOnce({ success: true, data: { mensaje: 'Contraseña actualizada correctamente.' } });

    renderForm();

    await fillPasswordForm(user, 'Current123!', 'NewPass123!', 'NewPass123!');

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(submitButton);

    await waitFor(() => {
      const currentInput = screen.getByLabelText(/contraseña actual/i);
      expect(currentInput).toHaveValue('');
    });
  });

  it('debe deshabilitar el botón mientras guarda', async () => {
    const user = userEvent.setup();
    mockApiRequest.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { mensaje: 'OK' } }), 100)));

    renderForm();

    await fillPasswordForm(user, 'Current123!', 'NewPass123!', 'NewPass123!');

    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(submitButton);

    expect(await screen.findByText(/guardando/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
