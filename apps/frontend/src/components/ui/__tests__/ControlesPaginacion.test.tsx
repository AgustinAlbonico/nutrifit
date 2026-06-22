import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ControlesPaginacion } from '../ControlesPaginacion';

describe('ControlesPaginacion', () => {
  const defaultProps = {
    pagina: 1,
    totalPaginas: 10,
    total: 100,
    limite: 10,
    onCambiarPagina: vi.fn(),
    onCambiarLimite: vi.fn(),
  };

  it('no renderiza nada si total es 0', () => {
    const { container } = render(<ControlesPaginacion {...defaultProps} total={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('muestra texto de resultados', () => {
    render(<ControlesPaginacion {...defaultProps} />);
    expect(screen.getByText('Mostrando 1-10 de 100 resultados')).toBeInTheDocument();
  });

  it('muestra páginas correctamente cuando totalPaginas <= 7', () => {
    render(<ControlesPaginacion {...defaultProps} totalPaginas={3} total={25} />);
    expect(screen.getByRole('button', { name: 'Ir a página 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a página 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a página 3' })).toBeInTheDocument();
  });

  it('deshabilita botón Anterior en página 1', () => {
    render(<ControlesPaginacion {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('deshabilita botón Siguiente en última página', () => {
    render(
      <ControlesPaginacion
        {...defaultProps}
        pagina={10}
        totalPaginas={10}
        total={100}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('llama onCambiarPagina al hacer clic en una página', async () => {
    const onPagina = vi.fn();
    render(
      <ControlesPaginacion
        {...defaultProps}
        pagina={3}
        totalPaginas={5}
        total={50}
        onCambiarPagina={onPagina}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ir a página 2' }));
    expect(onPagina).toHaveBeenCalledWith(2);
  });

  it('renderiza el select con el límite actual', () => {
    render(<ControlesPaginacion {...defaultProps} limite={25} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('muestra texto correcto para diferentes páginas', () => {
    const { rerender } = render(
      <ControlesPaginacion {...defaultProps} pagina={3} total={100} />,
    );
    expect(screen.getByText('Mostrando 21-30 de 100 resultados')).toBeInTheDocument();

    rerender(<ControlesPaginacion {...defaultProps} pagina={10} total={100} />);
    expect(screen.getByText('Mostrando 91-100 de 100 resultados')).toBeInTheDocument();
  });
});
