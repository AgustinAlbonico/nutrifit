import { useParams } from '@tanstack/react-router';

import { DashboardProgreso } from '@/components/progreso/DashboardProgreso';
import { useAuth } from '@/contexts/AuthContext';

export function ProgresoPacientePage() {
  const { personaId } = useAuth();
  const { socioId: socioIdParam } = useParams({
    from: '/auth/profesional/paciente/$socioId/progreso',
  });
  const socioId = Number(socioIdParam);

  const searchParams = new URLSearchParams(window.location.search);
  const consultaId = searchParams.get('consulta');
  const volverA = consultaId ? `/profesional/consulta/${consultaId}` : undefined;

  if (!socioId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">
          No se pudo identificar al paciente. Por favor, seleccioná un paciente válido.
        </p>
      </div>
    );
  }

  return (
    <DashboardProgreso
      socioId={socioId}
      nutricionistaId={personaId ?? undefined}
      esVistaNutricionista={true}
      backTo={volverA}
    />
  );
}
