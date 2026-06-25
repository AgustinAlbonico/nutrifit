/**
 * Página "Mi Plan" del socio (vista read-only).
 *
 * Refactor Packet 6 (plan-alimentacion-ia-v2):
 * - Usa TanStack Query para pedir los planes activos del socio
 * - Si 0 resultados → `<EmptyStatePlanEnPreparacion />`
 * - Si 1+ resultados → renderiza N `<PlanSocioCard>` (uno por nutricionista)
 * - Loading state mientras fetchea
 * - Error state con toast de sonner si falla
 *
 * Endpoint: `GET /planes-alimentacion/socio/:id/activo`.
 *
 * NOTA sobre RF-010: El backend actual retorna UN solo plan activo (vía
 * `ObtenerPlanActivoSocioUseCase`). La query del frontend normaliza la
 * respuesta (null, objeto único o array) a `PlanSocioActivo[]` para ser
 * defensivo: cuando el backend evolucione a "N planes por nutricionista",
 * el frontend ya soporta N cards sin cambios.
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Salad } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyStatePlanEnPreparacion } from '@/components/plan/EmptyStatePlanEnPreparacion';
import { PlanSocioCard } from '@/components/plan/PlanSocioCard';
import type {
  PlanSocioActivo,
  RespuestaPlanesSocioRaw,
} from '@/types/ia';

const CLAVE_QUERIES_PLANES_SOCIO_ACTIVOS = (
  socioId: number,
): readonly [string, string, string, number] => [
  'planes-alimentacion',
  'socio',
  'activos',
  socioId,
];

const STALE_TIME_PLANES_SOCIO_MS = 60_000;

/**
 * Normaliza la respuesta cruda del endpoint a `PlanSocioActivo[]`.
 *
 * Acepta: null, objeto único, array, o `{ data: ... }`. Esto es defensivo
 * contra cambios futuros del backend.
 */
function normalizarPlanesSocio(
  respuesta: RespuestaPlanesSocioRaw,
): PlanSocioActivo[] {
  if (respuesta === null || respuesta === undefined) {
    return [];
  }

  // Caso: { data: ... } (algunos endpoints wrappean en `data`)
  if (!Array.isArray(respuesta) && 'data' in respuesta) {
    return normalizarPlanesSocio(respuesta.data);
  }

  // Caso: array de planes
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  // Caso: objeto único
  return [respuesta];
}

export function MiPlanPage() {
  const { token, personaId } = useAuth();

  // Query: planes activos del socio autenticado.
  // Habilitada solo cuando tenemos token y personaId.
  // Nota: `apiRequest` lee el token del storage si no se pasa, así que
  // evitamos meter `token` en queryKey (cambiaría la key cada vez que el
  // token rota y haría refetch innecesario).
  const consultaPlanes = useQuery({
    queryKey: CLAVE_QUERIES_PLANES_SOCIO_ACTIVOS(personaId ?? -1),
    queryFn: async (): Promise<PlanSocioActivo[]> => {
      if (!personaId) return [];
      const respuestaCruda = await apiRequest<RespuestaPlanesSocioRaw>(
        `/planes-alimentacion/socio/${personaId}/activo`,
      );
      return normalizarPlanesSocio(respuestaCruda);
    },
    enabled: Boolean(token && personaId),
    staleTime: STALE_TIME_PLANES_SOCIO_MS,
  });

  // Toast de error: side effect, no render condicional.
  useEffect(() => {
    if (consultaPlanes.isError) {
      const mensaje =
        consultaPlanes.error instanceof Error
          ? consultaPlanes.error.message
          : 'No se pudieron cargar tus planes.';
      toast.error('Error al cargar tus planes', {
        description: mensaje,
      });
    }
  }, [consultaPlanes.isError, consultaPlanes.error]);

  const planes: PlanSocioActivo[] = consultaPlanes.data ?? [];
  const estaCargando = consultaPlanes.isLoading;
  const huboError = consultaPlanes.isError;

  return (
    <div className="space-y-6">
      {/* Hero header con gradiente — coherente con el resto de la app */}
      <div
        className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-2"
        data-testid="mi-plan-hero"
      >
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Salad className="h-8 w-8 text-orange-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Mis planes
            </h1>
          </div>
          <p className="text-muted-foreground">
            Consulta los planes de alimentación activos con tus nutricionistas.
          </p>
        </div>
      </div>

      {/* Faltan datos de auth — bloqueamos el render */}
      {!token || !personaId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No se pudo identificar al socio. Vuelve a iniciar sesión.
          </CardContent>
        </Card>
      ) : estaCargando ? (
        <Card>
          <CardContent
            className="py-10 text-center text-muted-foreground"
            data-testid="mi-plan-loading"
          >
            Cargando tus planes...
          </CardContent>
        </Card>
      ) : huboError ? (
        <Alert
          variant="destructive"
          className="border-destructive/30 bg-destructive/5"
          data-testid="mi-plan-error"
        >
          <AlertTitle>No se pudieron cargar tus planes</AlertTitle>
          <AlertDescription>
            {consultaPlanes.error instanceof Error
              ? consultaPlanes.error.message
              : 'Error desconocido al pedir tus planes activos.'}
          </AlertDescription>
        </Alert>
      ) : planes.length === 0 ? (
        <EmptyStatePlanEnPreparacion
          diasDesdeAsignacion={undefined}
          nombreNutricionista={undefined}
        />
      ) : (
        <div
          className="grid gap-5 lg:grid-cols-1 xl:grid-cols-2"
          data-testid="mi-plan-cards-container"
        >
          {planes.map((plan) => (
            <PlanSocioCard
              key={plan.idPlanAlimentacion}
              plan={plan}
            />
          ))}
        </div>
      )}
    </div>
  );
}