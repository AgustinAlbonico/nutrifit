import { DashboardProgreso } from '@/components/progreso/DashboardProgreso';
import { useAuth } from '@/contexts/AuthContext';

export function ProgresoPacientePage() {
  const { personaId } = useAuth();
  
  // Obtener socioId de la URL
  const pathParts = window.location.pathname.split('/');
  const socioIdIndex = pathParts.indexOf('paciente') + 1;
  const socioId = pathParts[socioIdIndex] ? Number(pathParts[socioIdIndex]) : 0;

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
    />
  );
}
