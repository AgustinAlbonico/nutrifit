import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { FichaPacientePage } from '../FichaPacientePage';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token-nutricionista',
    rol: 'NUTRICIONISTA',
    permissions: [],
    personaId: 5,
    email: 'nutri@test.com',
    nombre: 'Nutri',
    apellido: 'Central',
    fotoPerfilUrl: null,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshPermissions: vi.fn(),
    hasPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

const routerConfig = { socioId: '9' };

vi.mock('@tanstack/react-router', () => ({
  useParams: () => routerConfig,
  useNavigate: () => vi.fn(() => {}),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

const handlerFicha = http.get('/turnos/profesional/5/pacientes/9/ficha-salud', () =>
  HttpResponse.json({
    success: true,
    data: {
      fichaSaludId: 1,
      altura: 180,
      peso: 150,
      nivelActividadFisica: 'MODERADO',
      alergias: [],
      patologias: [],
      objetivoPersonal: 'cacaacacaca',
      medicacionActual: null,
      suplementosActuales: null,
      restriccionesAlimentarias: null,
      horasSueno: null,
    },
  }),
);

const handlerMediciones = http.get(
  '/turnos/profesional/5/pacientes/9/historial-mediciones',
  () =>
    HttpResponse.json({
      success: true,
      data: {
        socioId: 9,
        nombreSocio: 'Socio2',
        apellidoSocio: 'Central',
        altura: 190,
        mediciones: [
          {
            idMedicion: 1,
            idTurno: 1,
            fecha: '2026-06-15T10:00:00.000Z',
            peso: 81,
            altura: 190,
            imc: 22.4,
            perimetroCintura: 86,
            perimetroCadera: 99,
            perimetroBrazo: 31,
            perimetroMuslo: 56,
            perimetroPecho: 96,
            pliegueTriceps: 14,
            pliegueAbdominal: 18,
            pliegueMuslo: 18,
            porcentajeGrasa: 23,
            masaMagra: 62.4,
            frecuenciaCardiaca: 68,
            tensionSistolica: 116,
            tensionDiastolica: 76,
            notasMedicion: 'Manteniendo adherencia',
            profesional: { id: 5, nombre: 'Nutri', apellido: 'Central' },
          },
        ],
      },
    }),
);

const handlerConsultas = http.get(
  '/turnos/profesional/5/pacientes/9/historial-consultas',
  () => HttpResponse.json({ success: true, data: [] }),
);

const handlerTurnos = http.get(
  '/turnos/profesional/5/pacientes/9/historial-turnos',
  () => HttpResponse.json({ success: true, data: [] }),
);

const handlerFotos = http.get('/progreso/9/fotos', () =>
  HttpResponse.json({ success: true, data: { fotos: [], sesiones: [] } }),
);

const handlerObjetivos = http.get('/progreso/9/objetivos', () =>
  HttpResponse.json({ success: true, data: { activos: [], completados: [] } }),
);

describe('FichaPacientePage', () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(
      handlerFicha,
      handlerMediciones,
      handlerConsultas,
      handlerTurnos,
      handlerFotos,
      handlerObjetivos,
    );
  });

  it('no muestra el peso estatico de la ficha de salud como peso de referencia', async () => {
    render(
      <QueryClientProvider client={buildQueryClient()}>
        <FichaPacientePage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Ficha longitudinal de Socio2 Central'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/Peso de referencia/i)).not.toBeInTheDocument();
    expect(screen.queryByText('150 kg')).not.toBeInTheDocument();
    expect(screen.getByText('Ultimo peso registrado')).toBeInTheDocument();
    expect(screen.getAllByText('81 kg').length).toBeGreaterThan(0);
  });
});

