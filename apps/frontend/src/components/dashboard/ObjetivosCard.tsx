import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiResponse } from '@/types/api';

interface Objetivo {
  idObjetivo: number;
  tipoMetrica: string;
  valorObjetivo: number;
  valorActual: number;
  estado: 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO';
  progreso: number;
}

interface ListaObjetivos {
  activos: Objetivo[];
  completados: Objetivo[];
}

const UNIDADES_OBJETIVO: Record<string, string> = {
  PESO: 'kg',
  CINTURA: 'cm',
  CADERA: 'cm',
  BRAZO: 'cm',
  MUSLO: 'cm',
  PECHO: 'cm',
};

const ETIQUETAS_OBJETIVO: Record<string, string> = {
  PESO: 'Peso',
  CINTURA: 'Cintura',
  CADERA: 'Cadera',
  BRAZO: 'Brazo',
  MUSLO: 'Muslo',
  PECHO: 'Pecho',
};

const calcularProgreso = (objetivo: Objetivo): number => {
  if (objetivo.estado === 'COMPLETADO') return 100;
  return Math.min(Math.max(objetivo.progreso, 0), 100);
};

export function ObjetivosCard() {
  const { token, personaId } = useAuth();

  const { data: response, isLoading } = useQuery({
    queryKey: ['objetivos', personaId, token],
    queryFn: async () => {
      const resp = await apiRequest<ApiResponse<ListaObjetivos | Objetivo[]>>(
        `/progreso/${personaId}/objetivos`,
        { token }
      );
      return resp;
    },
    enabled: !!token && !!personaId,
  });

  // Asegurar que objetivos sea siempre un array
  const objetivos = Array.isArray(response?.data)
    ? response.data
    : response?.data?.activos ?? [];

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-orange-500" />
            Mis Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (objetivos.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-orange-500" />
            Mis Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Tu nutricionista todavía no configuró objetivos para este seguimiento.
            Cuando los cargue, los vas a ver acá.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-orange-500" />
          Mis Objetivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objetivos.slice(0, 4).map((objetivo) => {
            const progreso = calcularProgreso(objetivo);
            return (
              <div key={objetivo.idObjetivo} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {objetivo.estado === 'COMPLETADO' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {ETIQUETAS_OBJETIVO[objetivo.tipoMetrica] ?? objetivo.tipoMetrica}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {objetivo.valorActual} / {objetivo.valorObjetivo}{' '}
                    {UNIDADES_OBJETIVO[objetivo.tipoMetrica] ?? ''}
                  </span>
                </div>
                <Progress
                  value={progreso}
                  className={`h-2 ${objetivo.estado === 'COMPLETADO' ? '[&>div]:bg-green-500' : ''}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
