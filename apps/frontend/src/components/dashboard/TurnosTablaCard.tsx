import type { EstadoTurno } from '@nutrifit/shared';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, User, CheckCircle, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  obtenerClasesEstadoTurno,
  obtenerEtiquetaEstadoTurno,
  puedeHacerCheckInTurno,
} from '@/lib/turnos/estadoTurno';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TurnoRecepcion {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  nombreSocio: string;
  nombreNutricionista: string;
  dniSocio: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

const ESTADOS_TURNO: Array<{ valor: EstadoTurno | 'TODOS'; etiqueta: string }> = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'PROGRAMADO', etiqueta: 'Programado' },
  { valor: 'PRESENTE', etiqueta: 'Presente' },
  { valor: 'EN_CURSO', etiqueta: 'En curso' },
];

export function TurnosTablaCard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState<EstadoTurno | 'TODOS'>('TODOS');

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ['turnos-recepcion-dia', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<TurnoRecepcion[]>>(
        '/turnos/recepcion/dia',
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  const marcarCheckInMutation = useMutation({
    mutationFn: async (idTurno: number) => {
      const response = await apiRequest<ApiResponse<{ success: boolean; estado: string }>>(
        `/turnos/${idTurno}/check-in`,
        {
          method: 'POST',
          token,
        },
      );
      return response;
    },
    onSuccess: () => {
      toast.success('Check-in realizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['turnos-recepcion-dia'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al realizar check-in');
    },
  });

  const turnosFiltrados =
    filtroEstado === 'TODOS'
      ? turnos
      : turnos.filter((t) => t.estadoTurno === filtroEstado);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Turnos del Día
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Turnos del Día
            <Badge variant="secondary" className="ml-2">
              {turnos.length}
            </Badge>
          </CardTitle>
          <Select
            value={filtroEstado}
            onValueChange={(valor) =>
              setFiltroEstado(valor as EstadoTurno | 'TODOS')
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_TURNO.map((estado) => (
                <SelectItem key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {turnosFiltrados.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay turnos para mostrar
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead className="w-28">Estado</TableHead>
                  <TableHead className="w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnosFiltrados.slice(0, 8).map((turno) => (
                  <TableRow key={turno.idTurno}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {turno.horaTurno}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {turno.nombreSocio}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            DNI: {turno.dniSocio}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {turno.nombreNutricionista}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${obtenerClasesEstadoTurno(turno.estadoTurno)} border`}
                      >
                        {obtenerEtiquetaEstadoTurno(turno.estadoTurno)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {puedeHacerCheckInTurno(turno.estadoTurno) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => marcarCheckInMutation.mutate(turno.idTurno)}
                            disabled={marcarCheckInMutation.isPending}
                            title="Realizar check-in"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {turnosFiltrados.length > 8 && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            +{turnosFiltrados.length - 8} turnos más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
