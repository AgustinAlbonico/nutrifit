import { Calendar, Camera, FileText, Stethoscope, History } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  EstadoTurnoHistorial,
  HistorialTurnoPaciente,
} from '@/types/consulta';

interface PropiedadesHistorialTurnosPaciente {
  turnos: HistorialTurnoPaciente[];
  cargando: boolean;
  onRetomarTurno?: (idTurno: number) => void;
}

const etiquetasEstado: Record<EstadoTurnoHistorial, string> = {
  PROGRAMADO: 'Programado',
  CONFIRMADO: 'Confirmado',
  PRESENTE: 'Presente',
  EN_CURSO: 'En curso',
  REALIZADO: 'Realizado',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado',
};

const estilosEstado: Record<EstadoTurnoHistorial, string> = {
  PROGRAMADO: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMADO: 'bg-sky-100 text-sky-800 border-sky-200',
  PRESENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  EN_CURSO: 'bg-violet-100 text-violet-800 border-violet-200',
  REALIZADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  AUSENTE: 'bg-rose-100 text-rose-800 border-rose-200',
  CANCELADO: 'bg-slate-200 text-slate-700 border-slate-300',
};

const estadosEditables: EstadoTurnoHistorial[] = [
  'PROGRAMADO',
  'CONFIRMADO',
  'PRESENTE',
  'EN_CURSO',
];

function formatearFechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function HistorialTurnosPaciente({
  turnos,
  cargando,
  onRetomarTurno,
}: PropiedadesHistorialTurnosPaciente) {
  const navigate = useNavigate();

  if (cargando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Historial de turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  if (turnos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Historial de turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todavía no hay turnos registrados con este profesional.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historial de turnos
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'} con este
          profesional, del más reciente al más antiguo.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {turnos.map((turno) => {
            const esEditable = estadosEditables.includes(turno.estadoTurno);
            const onClickRetomar = () => {
              if (onRetomarTurno) {
                onRetomarTurno(turno.idTurno);
              } else {
                void navigate({ to: `/profesional/consulta/${turno.idTurno}` });
              }
            };

            return (
              <li
                key={turno.idTurno}
                data-turno-id={turno.idTurno}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {formatearFechaCorta(turno.fechaTurno)} · {turno.horaTurno}
                      </p>
                      <Badge
                        variant="outline"
                        className={estilosEstado[turno.estadoTurno]}
                      >
                        {etiquetasEstado[turno.estadoTurno]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {turno.tieneMedicion && (
                        <span className="inline-flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" /> Medición
                        </span>
                      )}
                      {turno.tieneObservacion && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Observación
                        </span>
                      )}
                      {turno.cantidadAdjuntos > 0 && (
                        <span>
                          {turno.cantidadAdjuntos} adjunto
                          {turno.cantidadAdjuntos === 1 ? '' : 's'}
                        </span>
                      )}
                      {turno.cantidadFotos > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          {turno.cantidadFotos} foto
                          {turno.cantidadFotos === 1 ? '' : 's'}
                        </span>
                      )}
                      {!turno.tieneMedicion &&
                        !turno.tieneObservacion &&
                        turno.cantidadAdjuntos === 0 &&
                        turno.cantidadFotos === 0 && (
                          <span>Sin datos clínicos cargados</span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className="text-xs text-muted-foreground">
                    Turno #{turno.idTurno}
                  </span>
                  {esEditable ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={onClickRetomar}
                    >
                      Retomar
                    </Button>
                  ) : (
                    <Link
                      to="/profesional/consulta/$turnoId"
                      params={{ turnoId: String(turno.idTurno) }}
                    >
                      <Button type="button" size="sm" variant="outline">
                        Ver detalle
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
