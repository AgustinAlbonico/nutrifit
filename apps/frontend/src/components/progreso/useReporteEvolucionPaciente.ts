import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { ReporteEvolucionPaciente } from '@/components/progreso/types';

interface ParametrosReporteEvolucionPaciente {
  socioId: number;
  nutricionistaId?: number;
  token: string | null;
}

export function useReporteEvolucionPaciente({
  socioId,
  nutricionistaId,
  token,
}: ParametrosReporteEvolucionPaciente) {
  return useQuery({
    queryKey: ['progreso', 'reporte-evolucion', nutricionistaId, socioId],
    queryFn: async () => {
      const respuesta = await apiRequest<{ data: ReporteEvolucionPaciente }>(
        `/turnos/profesional/${nutricionistaId}/pacientes/${socioId}/reporte-evolucion`,
        { token },
      );
      return respuesta.data;
    },
    enabled: Boolean(socioId && nutricionistaId && token),
  });
}
