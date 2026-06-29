/**
 * Hook de React Query para listar las versiones inmutables de un plan
 * de alimentación.
 *
 * Endpoint: GET /planes-alimentacion/:id/versiones
 * Cache key: ['planes-alimentacion', planId, 'versiones']
 * staleTime: 30s — la lista no cambia tan seguido.
 *
 * El endpoint devuelve el resumen (sin `datosJson` pesado) ordenado por
 * numeroVersion DESC. La activación/regeneración de una versión se hace
 * desde otros endpoints y se invalida esta query.
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import type { ApiResponse } from '@/types/api';
import type { MotivoCambio, RespuestaVersionesPlanFE, VersionPlanFE } from '@/types/ia';

const MOTIVOS_VALIDOS: MotivoCambio[] = [
  'creacion_inicial',
  'regeneracion_completa',
  'regeneracion_dia',
  'regeneracion_alternativa',
  'edicion_manual',
  'creacion_inicial_backfill',
];

type VersionPlanBackend = Partial<VersionPlanFE> & {
  id?: number;
  planAlimentacionId?: number;
};

type RespuestaVersionesBackend =
  | RespuestaVersionesPlanFE
  | VersionPlanBackend[]
  | { versiones?: VersionPlanBackend[] }
  | ApiResponse<VersionPlanBackend[] | { versiones?: VersionPlanBackend[] }>;

export function normalizarVersionesPlan(
  respuesta: RespuestaVersionesBackend,
  planId: number,
): VersionPlanFE[] {
  const data = desenvolverRespuestaApi(respuesta);
  const versionesRaw = Array.isArray(data)
    ? data
    : Array.isArray(data.versiones)
      ? data.versiones
      : [];

  return versionesRaw.flatMap((version) => {
    const versionBackend = version as VersionPlanBackend;
    const idPlanAlimentacionVersion =
      versionBackend.idPlanAlimentacionVersion ?? versionBackend.id;
    const idPlanAlimentacion =
      versionBackend.idPlanAlimentacion ?? versionBackend.planAlimentacionId ?? planId;

    if (
      typeof idPlanAlimentacionVersion !== 'number' ||
      typeof idPlanAlimentacion !== 'number' ||
      typeof version.numeroVersion !== 'number' ||
      typeof version.createdAt !== 'string'
    ) {
      return [];
    }

    const motivoCambio = MOTIVOS_VALIDOS.includes(version.motivoCambio as MotivoCambio)
      ? (version.motivoCambio as MotivoCambio)
      : null;

    return [
      {
        idPlanAlimentacionVersion,
        idPlanAlimentacion,
        numeroVersion: version.numeroVersion,
        motivoCambio,
        activa: version.activa === true,
        createdAt: version.createdAt,
        createdBy: typeof version.createdBy === 'number' ? version.createdBy : 0,
      },
    ];
  });
}

export function useVersionesPlan(planId: number) {
  return useQuery({
    queryKey: ['planes-alimentacion', planId, 'versiones'],
    queryFn: async (): Promise<VersionPlanFE[]> => {
      const respuesta = await apiRequest<RespuestaVersionesBackend>(
        `/planes-alimentacion/${planId}/versiones`,
        { method: 'GET' },
      );
      return normalizarVersionesPlan(respuesta, planId).filter(
        (v) => v.numeroVersion > 0,
      );
    },
    enabled: Number.isFinite(planId) && planId > 0,
    staleTime: 30_000,
  });
}
