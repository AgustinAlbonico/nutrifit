import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Objetivo {
  id: number;
  descripcion: string;
  valorObjetivo: number;
  valorActual: number;
  unidad: string;
  completado: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function ObjetivosCard() {
  const { token, personaId } = useAuth();

  const { data: response, isLoading } = useQuery({
    queryKey: ['objetivos', personaId, token],
    queryFn: async () => {
      const resp = await apiRequest<ApiResponse<Objetivo[]>>(
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
    : Array.isArray(response)
      ? response
      : [];

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
            No tienes objetivos configurados. Habla con tu nutricionista.
          </p>
        </CardContent>
      </Card>
    );
  }

  const calcularProgreso = (objetivo: Objetivo): number => {
    if (objetivo.completado) return 100;
    const progreso = (objetivo.valorActual / objetivo.valorObjetivo) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

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
              <div key={objetivo.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {objetivo.completado && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {objetivo.descripcion}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {objetivo.valorActual} / {objetivo.valorObjetivo} {objetivo.unidad}
                  </span>
                </div>
                <Progress
                  value={progreso}
                  className={`h-2 ${objetivo.completado ? '[&>div]:bg-green-500' : ''}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
