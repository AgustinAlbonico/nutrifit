import type { EstadoTurno } from '@nutrifit/shared';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Clock, User, PlayCircle, Eye, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import {
  obtenerClasesEstadoTurno,
  obtenerEtiquetaEstadoTurno,
} from '@/lib/turnos/estadoTurno';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiResponse } from '@/types/api';

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



export function TurnosDelDiaCard() {
  const { token, personaId } = useAuth();
  const navigate = useNavigate();

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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground w-16">
                    <Clock className="h-4 w-4" />
                    {turno.horaTurno}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      <span className="font-medium">{turno.socio.nombreCompleto}</span>
                    </div>
                    <div className="sm:hidden mt-1">
                      <Badge className={obtenerClasesEstadoTurno(turno.estadoTurno)}>
                        {obtenerEtiquetaEstadoTurno(turno.estadoTurno)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 justify-end">
                  <div className="hidden sm:block">
                    <Badge className={obtenerClasesEstadoTurno(turno.estadoTurno)}>
                      {obtenerEtiquetaEstadoTurno(turno.estadoTurno)}
                    </Badge>
                  </div>
                  
                  {turno.estadoTurno === 'PRESENTE' && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 h-8 px-2"
                      onClick={() => navigate({ to: `/profesional/consulta/${turno.idTurno}` })}
                    >
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                      Iniciar
                    </Button>
                  )}
                  {turno.estadoTurno === 'EN_CURSO' && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 h-8 px-2"
                      onClick={() => navigate({ to: `/profesional/consulta/${turno.idTurno}` })}
                    >
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                      Continuar
                    </Button>
                  )}
                  {turno.estadoTurno === 'REALIZADO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 px-2"
                      onClick={() => navigate({ to: `/profesional/consulta/${turno.idTurno}` })}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Ver
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {turnos.length > 5 && (
              <a
                href="/turnos"
                className="flex items-center justify-center gap-1 w-full text-sm text-primary hover:underline pt-2"
              >
                Ver todos los turnos
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
