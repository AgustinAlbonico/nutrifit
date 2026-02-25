import { useAuth } from '@/contexts/AuthContext';
import { DashboardProgreso } from '@/components/progreso/DashboardProgreso';

export function ProgresoSocioPage() {
  const { personaId } = useAuth();

  if (!personaId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">
          No se pudo identificar tu cuenta. Por favor, iniciá sesión nuevamente.
        </p>
      </div>
    );
  }

  return (
    <DashboardProgreso
      socioId={personaId}
      esVistaNutricionista={false}
    />
  );
}
