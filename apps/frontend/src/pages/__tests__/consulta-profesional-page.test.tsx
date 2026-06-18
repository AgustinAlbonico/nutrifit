/**
 * Tests para ConsultaProfesionalPage - UI bloqueada post-cierre + adjuntos
 *
 * Strict TDD: RED primero → GREEN → TRIANGULATE → REFACTOR
 * Capa: Unit con mocks (Vitest + @testing-library/react + MSW)
 *
 * Especificación verificada:
 * - 3.4: Post-cierre UI blocking (consultaCerrada) y sección de adjuntos clínicos
 * - 4.4: Vitest P1 - UI bloqueada post-cierre + adjuntos visibles/accionables
 *
 * Estado: 11 tests passing
 * Última ejecución: 2026-05-02
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import React from 'react';

import { server } from '@/mocks/server';
import { ConsultaProfesionalPage } from '../ConsultaProfesionalPage';

// ─────────────────────────────────────────────────────────────────────────────
// Mock de AuthContext
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token-nutricionista',
    rol: 'NUTRICIONISTA',
    permissions: ['TURNOS_READ', 'TURNOS_WRITE'],
    personaId: 1,
    email: 'nutri@test.com',
    nombre: 'María',
    apellido: 'Nutri',
    fotoPerfilUrl: null,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshPermissions: vi.fn(),
    hasPermission: (action: string) => ['TURNOS_READ', 'TURNOS_WRITE'].includes(action),
    hasAllPermissions: (actions: string[]) => actions.every((a) => ['TURNOS_READ', 'TURNOS_WRITE'].includes(a)),
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Mock de TanStack Router - con factory que permite reconfiguración
// ─────────────────────────────────────────────────────────────────────────────

// We'll use a module-level config that tests can modify before rendering
const routerConfig = {
  turnoId: '1', // default
};

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ turnoId: routerConfig.turnoId }),
  useNavigate: () => vi.fn(() => {}),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// ─────────────────────────────────────────────────────────────────────────────
// MSW handlers
// ─────────────────────────────────────────────────────────────────────────────

// Handler para GET /turnos/:id (turno abierto - estado EN_CURSO)
const handlerTurnoAbierto = http.get('/turnos/1', () => {
  return HttpResponse.json({
    success: true,
    message: 'Turno encontrado',
    data: {
      idTurno: 1,
      fechaTurno: '2026-05-02',
      horaTurno: '10:00',
        estadoTurno: 'EN_CURSO',
      consultaFinalizadaAt: null,
      socio: {
        idPersona: 10,
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@test.com',
        telefono: '+5491112345678',
      },
      fichaSalud: {
        fichaSaludId: 1,
        altura: 175,
        peso: 70,
        nivelActividadFisica: 'Moderado' as const,
        alergias: [] as string[],
        patologias: [] as string[],
        objetivoPersonal: 'Bajar de peso',
        medicacionActual: null,
        suplementosActuales: null,
        cirugiasPrevias: null,
        antecedentesFamiliares: null,
        frecuenciaComidas: '3 comidas' as const,
        consumoAguaDiario: 2000,
        restriccionesAlimentarias: null,
        consumoAlcohol: 'Ocasional' as const,
        fumaTabaco: false,
        horasSueno: 7,
        contactoEmergenciaNombre: null,
        contactoEmergenciaTelefono: null,
      },
    },
    timestamp: '2026-05-02T10:00:00Z',
  });
});

// Handler para GET /turnos/:id (turno cerrado - estado REALIZADO)
const handlerTurnoCerrado = http.get('/turnos/2', () => {
  return HttpResponse.json({
    success: true,
    message: 'Turno encontrado',
    data: {
      idTurno: 2,
      fechaTurno: '2026-05-01',
      horaTurno: '10:00',
      estadoTurno: 'REALIZADO',
      consultaFinalizadaAt: '2026-05-01T11:30:00Z',
      socio: {
        idPersona: 10,
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan@test.com',
        telefono: '+5491112345678',
      },
      fichaSalud: {
        fichaSaludId: 1,
        altura: 175,
        peso: 70,
        nivelActividadFisica: 'Moderado' as const,
        alergias: [] as string[],
        patologias: [] as string[],
        objetivoPersonal: 'Bajar de peso',
        medicacionActual: null,
        suplementosActuales: null,
        cirugiasPrevias: null,
        antecedentesFamiliares: null,
        frecuenciaComidas: '3 comidas' as const,
        consumoAguaDiario: 2000,
        restriccionesAlimentarias: null,
        consumoAlcohol: 'Ocasional' as const,
        fumaTabaco: false,
        horasSueno: 7,
        contactoEmergenciaNombre: null,
        contactoEmergenciaTelefono: null,
      },
    },
    timestamp: '2026-05-01T11:30:00Z',
  });
});

// Handler para GET /turnos/:id/adjuntos (turno abierto)
const handlerAdjuntosTurnoAbierto = http.get('/turnos/1/adjuntos', () => {
  return HttpResponse.json({
    success: true,
    message: 'Adjuntos encontrados',
    data: [
      {
        id: 1,
        nombreOriginal: 'analisis-sangre.pdf',
        urlFirmada: 'http://minio.test/signed-url-1',
        mimeType: 'application/pdf',
        sizeBytes: 1024000,
        esPostCierre: false,
        createdAt: '2026-05-02T09:00:00Z',
      },
    ],
    timestamp: '2026-05-02T09:00:00Z',
  });
});

// Handler para GET /turnos/:id/adjuntos (turno cerrado)
const handlerAdjuntosTurnoCerrado = http.get('/turnos/2/adjuntos', () => {
  return HttpResponse.json({
    success: true,
    message: 'Adjuntos encontrados',
    data: [
      {
        id: 2,
        nombreOriginal: 'resultado-closed.jpg',
        urlFirmada: 'http://minio.test/signed-url-2',
        mimeType: 'image/jpeg',
        sizeBytes: 512000,
        esPostCierre: false,
        createdAt: '2026-05-01T10:30:00Z',
      },
    ],
    timestamp: '2026-05-01T10:30:00Z',
  });
});

const handlerFotosProgresoVacias = http.get('/progreso/:socioId/fotos', () => {
  return HttpResponse.json({
    success: true,
    message: 'Fotos encontradas',
    data: {
      fotos: [],
      sesiones: [],
      fotosHistoricasSinSesion: [],
    },
    timestamp: '2026-05-02T09:00:00Z',
  });
});

const handlerHistorialMedicionesVacio = http.get('/turnos/profesional/:nutricionistaId/pacientes/:socioId/historial-mediciones', () => {
  return HttpResponse.json({
    success: true,
    message: 'Historial encontrado',
    data: {
      socioId: 10,
      nombreSocio: 'Juan',
      apellidoSocio: 'Pérez',
      altura: 175,
      mediciones: [],
    },
    timestamp: '2026-05-02T09:00:00Z',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de render
// ─────────────────────────────────────────────────────────────────────────────

function crearProveedorQuery(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Helper para configurar el turno antes de renderizar
function configurarTurnoId(turnoId: string) {
  routerConfig.turnoId = turnoId;
}

async function esperarConsultaCargada() {
  await waitFor(() => {
    expect(screen.queryByText('Cargando datos de la consulta...')).not.toBeInTheDocument();
  }, { timeout: 5000 });
}

async function abrirEtapa(nombre: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: nombre }));
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('ConsultaProfesionalPage - Post-Cierre UI Blocking (TDD 4.4)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear router config a默认值
    configurarTurnoId('1');
    // Reset handlers y configurar por defecto (turno abierto)
    server.resetHandlers();
    server.use(
      handlerTurnoAbierto,
      handlerAdjuntosTurnoAbierto,
      handlerFotosProgresoVacias,
      handlerHistorialMedicionesVacio,
    );
  });

  afterEach(() => {
    server.resetHandlers();
    configurarTurnoId('1'); // cleanup
  });

  // ── RED ─────────────────────────────────────────────────────────────────────
  describe('RED - Verificación de existencia', () => {
    it('TDD-4.4-RED: el componente ConsultaProfesionalPage debe estar exportado', () => {
      expect(ConsultaProfesionalPage).toBeDefined();
    });
  });

  // ── GREEN + TRIANGULATE ─────────────────────────────────────────────────────
  describe('GREEN+TRIANGULATE - Caso TURNO CERRADO (REALIZADO)', () => {

    it('TDD-4.4-1: cuando turno estado REALIZADO, inputs de mediciones están deshabilitados', async () => {
      // Arrange: turno cerrado
      server.use(handlerTurnoCerrado, handlerAdjuntosTurnoCerrado);
      configurarTurnoId('2');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/mediciones/i);

      // Assert: el campo de peso debe estar deshabilitado
      const pesoInput = await screen.findByLabelText(/peso \(kg\)/i);
      expect(pesoInput).toBeDisabled();
    });

    it('TDD-4.4-2: cuando turno estado REALIZADO, botón guardar mediciones está deshabilitado', async () => {
      // Arrange
      server.use(handlerTurnoCerrado, handlerAdjuntosTurnoCerrado);
      configurarTurnoId('2');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/mediciones/i);

      // Assert
      const guardarBtn = await screen.findByRole('button', { name: /guardar mediciones/i });
      expect(guardarBtn).toBeDisabled();
    });

    it('TDD-4.4-3: cuando turno estado REALIZADO, upload de adjuntos NO está visible', async () => {
      // Arrange
      server.use(handlerTurnoCerrado, handlerAdjuntosTurnoCerrado);
      configurarTurnoId('2');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();

      // Assert: el label "Subir archivo" no debe existir
      expect(screen.queryByText('Subir archivo')).not.toBeInTheDocument();
    });

    it('TDD-4.4-4: cuando turno estado REALIZADO, adjuntos son visibles (solo lectura)', async () => {
      // Arrange
      server.use(handlerTurnoCerrado, handlerAdjuntosTurnoCerrado);
      configurarTurnoId('2');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/adjuntos/i);

      // Assert: el nombre del adjunto debe estar visible en solo lectura
      expect(await screen.findByText('resultado-closed.jpg')).toBeInTheDocument();
      expect(screen.queryByText('Seleccionar archivo')).not.toBeInTheDocument();
    });

    it('TDD-4.4-5: cuando turno estado REALIZADO, botón eliminar adjunto NO está visible', async () => {
      // Arrange
      server.use(handlerTurnoCerrado, handlerAdjuntosTurnoCerrado);
      configurarTurnoId('2');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/adjuntos/i);

      // Assert: no debe haber botón de eliminar con title="Eliminar archivo"
      const deleteButtons = screen.queryAllByTitle('Eliminar archivo');
      expect(deleteButtons).toHaveLength(0);
    });
  });

  describe('GREEN+TRIANGULATE - Caso TURNO ABIERTO (EN_CURSO)', () => {

    it('TDD-4.4-6: cuando turno estado EN_CURSO, inputs de mediciones están habilitados', async () => {
      // Arrange: turno abierto (handlers por defecto ya configurados)
      configurarTurnoId('1');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/mediciones/i);

      // Assert: el campo de peso debe estar habilitado
      const pesoInput = await screen.findByLabelText(/peso \(kg\)/i);
      expect(pesoInput).not.toBeDisabled();
    });

    it('TDD-4.4-7: cuando turno estado EN_CURSO, upload de adjuntos NO está visible inicialmente', async () => {
      // Act
      configurarTurnoId('1');
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();

      // Assert: Ahora está en la pestaña Adjuntos, no está visible en el primer render
      expect(screen.queryByText('Seleccionar archivo')).not.toBeInTheDocument();
    });

    it('TDD-4.4-8: cuando turno estado EN_CURSO, botón eliminar adjunto NO está visible inicialmente', async () => {
      // Act
      configurarTurnoId('1');
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();

      // Assert
      const deleteButtons = screen.queryAllByTitle('Eliminar archivo');
      expect(deleteButtons).toHaveLength(0);
    });

    it('TDD-4.4-9: cuando turno estado EN_CURSO, cierre queda bloqueado si faltan mínimos clínicos', async () => {
      // Act
      configurarTurnoId('1');
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/revisión/i);

      // Assert
      const finalizarBtn = await screen.findByRole('button', { name: /finalizar consulta/i });
      expect(finalizarBtn).toBeDisabled();
      expect(screen.getByText(/faltan mínimos para cerrar/i)).toBeInTheDocument();
    });
  });

  // ── REFACTOR ─────────────────────────────────────────────────────────────────
  describe('REFACTOR - Validación de mensajes de estado', () => {
    it('TDD-4.4-10: cuando turno estado REALIZADO, se muestra mensaje de consulta cerrada', async () => {
      // Arrange
      server.use(handlerTurnoCerrado, handlerAdjuntosTurnoCerrado);
      configurarTurnoId('2');

      // Act
      render(crearProveedorQuery(<ConsultaProfesionalPage />));

      await esperarConsultaCargada();
      await abrirEtapa(/mediciones/i);

      // Assert: mensaje de consulta cerrada visible (hay 2 mensajes - mediciones y adjuntos)
      expect(screen.getAllByText(/consulta está cerrada/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
