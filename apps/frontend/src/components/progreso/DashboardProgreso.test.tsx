import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { DashboardProgreso } from './DashboardProgreso';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
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

vi.mock('@/components/progreso/useFotosProgreso', () => ({
  useFotosProgreso: () => ({ data: { fotos: [], sesiones: [] }, isLoading: false }),
  useSubirFoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEliminarFoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/components/progreso/useObjetivos', () => ({
  useObjetivos: () => ({ data: { activos: [], completados: [] }, isLoading: false, refetch: vi.fn() }),
  useCrearObjetivo: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useActualizarObjetivo: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMarcarObjetivo: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/utils/imagen', () => ({
  esFormatoHeic: () => false,
  convertirHeicSiEsNecesario: vi.fn(async (file: File) => file),
}));

vi.mock('@/components/progreso/ExportProgresoPDFButton', () => ({
  ExportProgresoPDFButton: () => <button>Exportar PDF</button>,
}));

function buildQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const handlerResumen = http.get(
  '/turnos/profesional/5/pacientes/9/progreso',
  () =>
    HttpResponse.json({
      success: true,
      data: {
        peso: { inicial: 92, actual: 81, diferencia: -11, tendencia: 'bajando' },
        imc: { inicial: 25.5, actual: 22.4, diferencia: -3.1, categoriaActual: 'normal' },
        perimetros: {
          cintura: { inicial: 96, actual: 86, diferencia: -10, tendencia: 'bajando' },
          cadera: { inicial: 108, actual: 99, diferencia: -9, tendencia: 'bajando' },
          brazo: { inicial: 33, actual: 31, diferencia: -2, tendencia: 'bajando' },
          muslo: { inicial: 60, actual: 56, diferencia: -4, tendencia: 'bajando' },
        },
        relacionCinturaCadera: { inicial: 0.889, actual: 0.869, riesgoCardiovascular: 'bajo' },
        rangoSaludable: { pesoMinimo: 66.78, pesoMaximo: 89.89 },
        totalMediciones: 4,
        primeraMedicion: '2026-01-10T10:00:00.000Z',
        ultimaMedicion: '2026-06-15T10:00:00.000Z',
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

const handlerObjetivos = http.get('/progreso/9/objetivos', () =>
  HttpResponse.json({ success: true, data: { activos: [], completados: [] } }),
);

describe('DashboardProgreso', () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(handlerResumen, handlerMediciones, handlerObjetivos);
  });

  it('no muestra las tarjetas viejas de resumen ni el bloque de info del paciente', async () => {
    render(
      <QueryClientProvider client={buildQueryClient()}>
        <DashboardProgreso socioId={9} nutricionistaId={5} esVistaNutricionista />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Progreso de Socio2 Central')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Rango saludable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /graficos/i })).not.toBeInTheDocument();
  });
});
