import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HistorialTurnosPaciente } from '../HistorialTurnosPaciente';
import type { HistorialTurnoPaciente } from '@/types/consulta';

const navegarMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navegarMock,
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a
      href={to + (params ? `?${JSON.stringify(params)}` : '')}
      data-testid="link-detalle"
    >
      {children}
    </a>
  ),
}));

const pacienteId = 273;
void pacienteId;

function makeTurno(
  overrides: Partial<HistorialTurnoPaciente>,
): HistorialTurnoPaciente {
  return {
    idTurno: 1,
    fechaTurno: '2026-06-15',
    horaTurno: '10:00',
    estadoTurno: 'CONFIRMADO',
    tieneMedicion: false,
    tieneObservacion: false,
    cantidadAdjuntos: 0,
    cantidadFotos: 0,
    ...overrides,
  };
}

function renderizar(
  turnos: HistorialTurnoPaciente[],
  opciones: {
    cargando?: boolean;
    clickProgramado?: (idTurno: number) => void;
  } = {},
) {
  return render(
    <HistorialTurnosPaciente
      turnos={turnos}
      cargando={opciones.cargando ?? false}
      onRetomarTurno={opciones.clickProgramado}
    />,
  );
}

describe('HistorialTurnosPaciente (TDD)', () => {
  beforeEach(() => {
    navegarMock.mockReset();
  });

  it('muestra empty state cuando no hay turnos', () => {
    renderizar([]);
    expect(
      screen.getByText(/todavía no hay turnos registrados/i),
    ).toBeInTheDocument();
  });

  it('muestra estado de carga cuando cargando=true', () => {
    renderizar([], { cargando: true });
    expect(screen.getByText(/cargando historial/i)).toBeInTheDocument();
  });

  it('muestra cada turno con fecha, hora y badge de estado', () => {
    renderizar([
      makeTurno({
        idTurno: 174,
        fechaTurno: '2026-06-17',
        horaTurno: '11:00',
        estadoTurno: 'CANCELADO',
      }),
      makeTurno({
        idTurno: 177,
        fechaTurno: '2026-06-15',
        horaTurno: '10:30',
        estadoTurno: 'CONFIRMADO',
      }),
      makeTurno({
        idTurno: 175,
        fechaTurno: '2026-06-11',
        horaTurno: '12:00',
        estadoTurno: 'AUSENTE',
        tieneMedicion: true,
        tieneObservacion: true,
        cantidadAdjuntos: 2,
        cantidadFotos: 3,
      }),
    ]);

    expect(screen.getByText('15/06/2026 · 10:30')).toBeInTheDocument();
    expect(screen.getByText('17/06/2026 · 11:00')).toBeInTheDocument();
    expect(screen.getByText('11/06/2026 · 12:00')).toBeInTheDocument();

    expect(screen.getByText('Confirmado')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
    expect(screen.getByText('Ausente')).toBeInTheDocument();

    const lista = screen.getByRole('list');
    const fila175 = lista.querySelector('[data-turno-id="175"]') as HTMLElement | null;
    expect(fila175).toBeTruthy();
    expect(within(fila175!).getByText(/medición/i)).toBeInTheDocument();
    expect(within(fila175!).getByText(/observación/i)).toBeInTheDocument();
    expect(within(fila175!).getByText(/2 adjuntos/i)).toBeInTheDocument();
    expect(within(fila175!).getByText(/3 fotos/i)).toBeInTheDocument();

    const fila177 = lista.querySelector('[data-turno-id="177"]') as HTMLElement | null;
    expect(within(fila177!).getByText(/sin datos clínicos cargados/i)).toBeInTheDocument();
  });

  it('muestra el boton de retomar solo en turnos activos o pendientes', () => {
    renderizar([
      makeTurno({ idTurno: 1, estadoTurno: 'CONFIRMADO' }),
      makeTurno({ idTurno: 2, estadoTurno: 'EN_CURSO' }),
      makeTurno({ idTurno: 3, estadoTurno: 'PRESENTE' }),
      makeTurno({ idTurno: 4, estadoTurno: 'REALIZADO' }),
      makeTurno({ idTurno: 5, estadoTurno: 'AUSENTE' }),
      makeTurno({ idTurno: 6, estadoTurno: 'CANCELADO' }),
    ]);

    const retomarButtons = screen.getAllByRole('button', { name: /retomar/i });
    expect(retomarButtons).toHaveLength(3);
    const detalleLinks = screen.getAllByText(/ver detalle/i);
    expect(detalleLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('ejecuta onRetomarTurno con el id del turno al click', async () => {
    const user = userEvent.setup();
    const clickProgramado = vi.fn();
    renderizar(
      [makeTurno({ idTurno: 177, estadoTurno: 'EN_CURSO' })],
      { clickProgramado },
    );

    await user.click(screen.getByRole('button', { name: /retomar/i }));

    expect(clickProgramado).toHaveBeenCalledWith(177);
  });

  it('sin onRetomarTurno navega a /profesional/consulta/:id', async () => {
    const user = userEvent.setup();
    renderizar([makeTurno({ idTurno: 177, estadoTurno: 'EN_CURSO' })]);

    await user.click(screen.getByRole('button', { name: /retomar/i }));

    expect(navegarMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/profesional/consulta/177' }),
    );
  });
});
