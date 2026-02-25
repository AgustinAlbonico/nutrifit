import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface MiTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  profesionalId: number;
  profesionalNombreCompleto: string;
  especialidad: string;
}

export function ProximoTurnoCard() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['mis-turnos', token],
    queryFn: () =>
      apiRequest<MiTurno[]>('/turnos/socio/mis-turnos', { token }),
    enabled: !!token,
  });

  // Asegurar que turnos sea siempre un array (la API puede devolver null u objeto)
  const turnos = Array.isArray(data) ? data : [];

  const proximoTurno = turnos
    .filter((t) => t.estadoTurno !== 'CANCELADO' && t.estadoTurno !== 'COMPLETADO')
    .sort((a, b) => {
      const fechaA = new Date(`${a.fechaTurno}T${a.horaTurno}`);
      const fechaB = new Date(`${b.fechaTurno}T${b.horaTurno}`);
      return fechaA.getTime() - fechaB.getTime();
    })[0];

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Proximo Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-orange-500" />
          Proximo Turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!proximoTurno ? (
          <p className="text-muted-foreground text-sm">
            No tienes turnos programados
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{proximoTurno.fechaTurno}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{proximoTurno.horaTurno} hs</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{proximoTurno.profesionalNombreCompleto}</span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 mt-2">
              {proximoTurno.estadoTurno}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
