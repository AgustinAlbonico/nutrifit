/**
 * Página "Mi Plan" del socio (vista read-only).
 *
 * Refactor Packet 6 (plan-alimentacion-ia-v2):
 * - Usa TanStack Query para pedir los planes activos del socio
 * - Si 0 resultados → empty state con CTAs reales (#5)
 * - Si 1+ resultados → renderiza N `<PlanSocioCard>` (uno por nutricionista)
 * - Loading y error state inline (sin toast duplicado — #3)
 * - RF-010: backend retorna N planes activos (uno por nutricionista)
 *
 * Mejoras UX aplicadas (ver `iteracion 1/errores/`):
 * - Elimina toast en error para evitar duplicación con alert (#3).
 * - Empty state enseña CTAs reales (ver mis turnos / contactar) en vez
 *   de una promesa pasiva de "ya te avisaremos" (#5).
 * - PlanSocioCard ahora ofrece "Marcar leído" y "Contactar al NUT"
 *   directamente en lugar del botón "Descargar PDF" deshabilitado (#5).
 *
 * Endpoint: `GET /planes-alimentacion/socio/:id/activo`.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, MessageCircle, Sparkles } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

function EmptyStatePlanSocio() {
  return (
    <Card
      data-testid="empty-state-plan-en-preparacion"
      className="border-dashed border-orange-300/60 bg-gradient-to-br from-orange-50/40 via-amber-50/20 to-transparent dark:from-orange-950/20 dark:via-amber-950/10 dark:to-transparent"
    >
      <CardHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
          <Sparkles
            className="size-6 text-orange-600 dark:text-orange-400"
            aria-hidden="true"
          />
        </div>
        <CardTitle className="mt-3 text-lg">
          Aún no tenés un plan activo
        </CardTitle>
        <CardDescription>
          Tu nutricionista está diseñando un plan personalizado. Mientras
          tanto, podés ver tus turnos agendados o escribirle.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <a href="/turnos">
            <CalendarCheck className="mr-2 size-4" aria-hidden="true" />
            Ver mis turnos
          </a>
        </Button>
        <Button asChild className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white">
          <a href="/dashboard">
            <MessageCircle className="mr-2 size-4" aria-hidden="true" />
            Ir a mi perfil
          </a>
        </Button>
      </CardContent>
    </Card>
  );
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

  const planes = useMemo(
    () => consultaPlanes.data ?? [],
    [consultaPlanes.data],
  );
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
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles
                className="h-8 w-8 text-orange-500"
                aria-hidden="true"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Mis planes
              </h1>
            </div>
            <p className="text-muted-foreground">
              Consulta los planes de alimentación activos con tus
              nutricionistas.
            </p>
          </div>
        </div>
      </div>

      {/* Faltan datos de auth */}
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
            <div role="status" aria-live="polite">
              Cargando tus planes…
            </div>
          </CardContent>
        </Card>
      ) : huboError ? (
        // Antes: alert + toast.error → mismo error dos veces. Ahora solo
        // alert inline. El toast se reserva a errores fugaces/ambientales.
        <Alert
          variant="destructive"
          className="border-destructive/30 bg-destructive/5"
          data-testid="mi-plan-error"
        >
          <AlertTitle>No pudimos cargar tus planes</AlertTitle>
          <AlertDescription>
            {consultaPlanes.error instanceof Error
              ? consultaPlanes.error.message
              : 'Reintentá en unos minutos. Si persiste, contactanos.'}
          </AlertDescription>
        </Alert>
      ) : planes.length === 0 ? (
        <EmptyStatePlanSocio />
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
