import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Target, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ResumenProgreso {
  pesoActual: number | null;
  pesoObjetivo: number | null;
  imc: number | null;
  clasificacionImc: string | null;
  ultimaMedicion: string | null;
}

export function ProgresoResumenCard() {
  const { token } = useAuth();

  const { data: progreso, isLoading } = useQuery({
    queryKey: ['mi-progreso', token],
    queryFn: () =>
      apiRequest<ResumenProgreso>('/turnos/socio/mi-progreso', { token }),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Mi Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  const pesoRestante =
    progreso?.pesoActual && progreso?.pesoObjetivo
      ? Math.abs(progreso.pesoActual - progreso.pesoObjetivo)
      : null;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Mi Progreso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!progreso?.pesoActual ? (
          <p className="text-muted-foreground text-sm">
            Aun no tienes mediciones registradas
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Peso actual</p>
                <p className="text-xl font-bold">{progreso.pesoActual} kg</p>
              </div>
            </div>

            {progreso.imc && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-sm font-bold text-orange-500">
                  IMC
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {progreso.imc.toFixed(1)} - {progreso.clasificacionImc || 'Sin clasificar'}
                  </p>
                </div>
              </div>
            )}

            {progreso.pesoObjetivo && pesoRestante !== null && (
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Objetivo: {progreso.pesoObjetivo} kg
                  </p>
                  <p className="text-sm font-medium text-orange-600">
                    {pesoRestante > 0
                      ? `Faltan ${pesoRestante.toFixed(1)} kg`
                      : 'Objetivo alcanzado'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
