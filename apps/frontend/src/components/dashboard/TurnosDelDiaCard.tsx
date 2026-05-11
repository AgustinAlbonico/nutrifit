import type { EstadoTurno } from '@nutrifit/shared';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import {
  obtenerClasesEstadoTurno,
  obtenerEtiquetaEstadoTurno,
} from '@/lib/turnos/estadoTurno';
import { useAuth } from '@/contexts/AuthContext';

interface TurnoDelDia {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  tipoConsulta: string;
  socio: {
    idPersona: number;
    nombreCompleto: string;
    dni: string;
    objetivo: string | null;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function TurnosDelDiaCard() {
  const { token, personaId } = useAuth();

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ['turnos-del-dia', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<TurnoDelDia[]>>(
        `/turnos/profesional/${personaId}/hoy`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Turnos de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando turnos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-orange-500" />
          Turnos de Hoy
          {turnos.length > 0 && (
            <Badge className="ml-auto bg-orange-100 text-orange-700">
              {turnos.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {turnos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tienes turnos programados para hoy
          </p>
        ) : (
          <div className="space-y-3">
            {turnos.slice(0, 5).map((turno) => (
              <div
                key={turno.idTurno}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {turno.horaTurno}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{turno.socio.nombreCompleto}</span>
                  </div>
                </div>
                <Badge className={obtenerClasesEstadoTurno(turno.estadoTurno)}>
                  {obtenerEtiquetaEstadoTurno(turno.estadoTurno)}
                </Badge>
              </div>
            ))}
            {turnos.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                +{turnos.length - 5} turnos mas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
