import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import { AuthLayoutComponent } from '@/components/auth/AuthLayoutComponent';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Nutricionistas } from '@/pages/Nutricionistas';
import { PerfilNutricionista } from '@/pages/PerfilNutricionista';
import { Permisos } from '@/pages/Permisos';
import { Agenda } from '@/pages/Agenda';
import { Turnos } from '@/pages/Turnos';
import { AgendarTurno } from '@/pages/AgendarTurno';
import { FichaSaludSocio } from '@/pages/FichaSaludSocio';
import { TurnosProfesional } from '@/pages/TurnosProfesional';
import { Configuracion } from '@/pages/Configuracion';
import { Socios } from '@/pages/Socios';
import { RecepcionTurnosPage } from '@/pages/RecepcionTurnosPage';
import { ConsultaProfesionalPage } from '@/pages/ConsultaProfesionalPage';
import { PlanSocioPage } from '@/pages/PlanSocioPage';
import { PlanEditorPage } from '@/pages/PlanEditorPage';
import { MiPlanPage } from '@/pages/MiPlanPage';
import { ProgresoSocioPage } from '@/pages/ProgresoSocioPage';
import { ProgresoPacientePage } from '@/pages/ProgresoPacientePage';
import { PacientesPage } from '@/pages/PacientesPage';
import { GestionPlanesPage } from '@/pages/GestionPlanesPage';
import { GestionAlimentosPage } from '@/pages/GestionAlimentosPage';
import { AdminAuditoriaPage } from '@/pages/AdminAuditoriaPage';
import { NotificacionesPage } from '@/features/notificaciones/pages/NotificacionesPage';

// Definir el tipo del context del router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Tipo del context
interface RouterContextType {
  auth?: {
    token: string | null;
    rol: string | null;
    permissions: string[];
    isAuthenticated: boolean;
  };
}

// Función para leer autenticación del localStorage (mismo que AuthContext)
function readStoredAuth(): { isAuthenticated: boolean } {
  const AUTH_STORAGE_KEY = 'nutrifit.auth';
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return { isAuthenticated: false };
  }

  try {
    const parsed = JSON.parse(raw) as {
      token: string;
      rol: string;
      permissions: string[];
    };
    return { isAuthenticated: !!parsed.token };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { isAuthenticated: false };
  }
}

// Root route with auth check context
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (Public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

// Authenticated layout route con beforeLoad para validación
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayoutComponent,
  beforeLoad: ({ location }) => {
    // Leer autenticación directamente del localStorage
    const auth = readStoredAuth();

    // Solo redirigir si NO estamos en login y NO estamos autenticados
    const isNavigatingToLogin = location.pathname === '/login';

    if (!isNavigatingToLogin && !auth.isAuthenticated) {
      throw redirect({ to: '/login', replace: true });
    }
  },
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/dashboard',
  component: Dashboard,
});

// Nutricionistas route
const nutricionistasRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/nutricionistas',
  component: Nutricionistas,
});

// Perfil nutricionista route (para socios)
const perfilNutricionistaRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/nutricionistas/$id/perfil',
  component: PerfilNutricionista,
});

// Socios route
const sociosRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/socios',
  component: Socios,
});

// Permisos route
const permisosRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/permisos',
  component: Permisos,
});

// Agenda route
const agendaRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/agenda',
  component: Agenda,
});

// Turnos route (Socios)
const turnosRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/turnos',
  component: Turnos,
});

const agendarTurnoRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/turnos/agendar',
  component: AgendarTurno,
});

const fichaSaludSocioRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/turnos/ficha-salud',
  component: FichaSaludSocio,
});

// Turnos Profesional route (Nutricionistas)
const turnosProfesionalRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/turnos-profesional',
  component: TurnosProfesional,
});

// Configuracion route
const configuracionRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/configuracion',
  component: Configuracion,
});

// Recepcion Turnos route
const recepcionTurnosRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/recepcion/turnos',
  component: RecepcionTurnosPage,
});

// Consulta Profesional route
const consultaProfesionalRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profesional/consulta/$turnoId',
  component: ConsultaProfesionalPage,
});

// Plan de alimentación del socio route
const planSocioRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profesional/plan/$socioId',
  component: PlanSocioPage,
});

// Mi plan (vista del socio)
const miPlanRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/mi-plan',
  component: MiPlanPage,
});

// Editor del plan de alimentación route
const planEditorRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profesional/plan/$socioId/editar',
  component: PlanEditorPage,
});

// Mi progreso (vista del socio)
const miProgresoRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/mi-progreso',
  component: ProgresoSocioPage,
});

// Progreso del paciente (vista del profesional)
const progresoPacienteRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profesional/paciente/$socioId/progreso',
  component: ProgresoPacientePage,
});

// Pacientes del nutricionista
const pacientesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/pacientes',
  component: PacientesPage,
});

// Gestión de planes del nutricionista
const planesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/planes',
  component: GestionPlanesPage,
});

// Gestión de alimentos (nutricionista y admin)
const alimentosRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/alimentos',
  component: GestionAlimentosPage,
});

// Auditoría del sistema (solo admin)
const auditoriaRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/admin/auditoria',
  component: AdminAuditoriaPage,
});

const notificacionesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/notificaciones',
  component: NotificacionesPage,
});

// Default redirect to dashboard or login
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    // Leer autenticación directamente del localStorage
    const auth = readStoredAuth();
    const to = auth?.isAuthenticated ? '/dashboard' : '/login';
    throw redirect({ to, replace: true });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authLayoutRoute.addChildren([
    dashboardRoute,
    nutricionistasRoute,
    perfilNutricionistaRoute,
    sociosRoute,
    permisosRoute,
    agendaRoute,
    turnosRoute,
    agendarTurnoRoute,
    fichaSaludSocioRoute,
    turnosProfesionalRoute,
    configuracionRoute,
    recepcionTurnosRoute,
    consultaProfesionalRoute,
    planSocioRoute,
    miPlanRoute,
    planEditorRoute,
    miProgresoRoute,
    progresoPacienteRoute,
    pacientesRoute,
    planesRoute,
    alimentosRoute,
    auditoriaRoute,
    notificacionesRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: {} as RouterContextType,
});
