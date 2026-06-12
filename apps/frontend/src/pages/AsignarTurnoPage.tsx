import { useState } from 'react';
import { CalendarCheck2, CalendarPlus, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { AsignarTurnoForm } from '@/components/turnos/asignar-turno-staff/AsignarTurnoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Pagina `/turnos/nuevo`. Es el entry point del wizard para que
 * RECEPCION, ADMIN y NUTRICIONISTA agenden un turno en nombre de
 * un socio. Cierra el bug 404 que devuelve hoy el boton "Asignar
 * Turno" del dashboard de recepcion.
 *
 * Permission gating:
 *  - `SOCIO` -> card "Acceso denegado" (no se renderiza el form).
 *  - `RECEPCION` / `ADMIN` / `NUTRICIONISTA` -> wizard completo.
 *
 * Despues de crear el turno exitosamente se mantiene una confirmacion
 * visible en la misma pagina (el redirect inmediato escondia el
 * feedback pedido por el spec y Playwright no tenia ground truth del
 * resultado final).
 */
export function AsignarTurnoPage() {
  const { rol } = useAuth();
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [turnoCreado, setTurnoCreado] = useState<{
    idTurno: number;
    socioNombre: string;
    fechaTurno: string;
    horaTurno: string;
    warning?: 'socio_sin_ficha';
  } | null>(null);

  if (rol === 'SOCIO' || !rol) {
    return (
      <Card data-testid="acceso-denegado-socio">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-rose-500" />
            Acceso denegado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta pantalla es solo para personal interno del gimnasio
            (recepcion, administracion o profesionales). Si sos socio,
            podes agendar turnos desde tu panel principal.
          </p>
        </CardContent>
      </Card>
    );
  }

  const manejarExito = (resultado: {
    idTurno: number;
    socioId: number;
    socioNombre: string;
    fechaTurno: string;
    horaTurno: string;
    warning?: 'socio_sin_ficha';
  }) => {
    toast.success('Turno agendado correctamente');
    if (resultado.warning === 'socio_sin_ficha') {
      toast.warning(
        'Recorda pedirle al socio que complete su ficha antes de la consulta',
        {
          duration: 8000,
        },
      );
    }

    setTurnoCreado({
      idTurno: resultado.idTurno,
      socioNombre: resultado.socioNombre,
      fechaTurno: resultado.fechaTurno,
      horaTurno: resultado.horaTurno,
      warning: resultado.warning,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              <CalendarPlus className="h-8 w-8 text-orange-500" />
              Asignar turno a un socio
            </h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Busca al socio, elige el profesional y reserva un
              horario disponible. El socio recibira la notificacion y
              un recordatorio 24 horas antes del turno.
            </p>
          </div>

          <Button asChild variant="outline">
            <a href="/dashboard">Volver al panel</a>
          </Button>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {turnoCreado ? (
        <Card data-testid="resumen-turno-creado">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CalendarCheck2 className="h-5 w-5" />
              Turno creado correctamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">
              Turno creado para <strong>{turnoCreado.socioNombre}</strong> el{' '}
              <strong>{turnoCreado.fechaTurno}</strong> a las{' '}
              <strong>{turnoCreado.horaTurno}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              El socio recibirá un recordatorio 24 horas antes del turno.
            </p>
            {turnoCreado.warning === 'socio_sin_ficha' && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                El socio no tiene ficha completa. El turno se creó igual, pero el profesional verá esta alerta al abrirlo.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setTurnoCreado(null);
                  setClaveFormulario((valorActual) => valorActual + 1);
                }}
              >
                Crear otro turno
              </Button>
              <Button asChild variant="outline">
                <a href={rol === 'NUTRICIONISTA' ? '/agenda' : '/recepcion/turnos'}>
                  {rol === 'NUTRICIONISTA' ? 'Ir a agenda' : 'Ir a turnos del día'}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AsignarTurnoForm key={claveFormulario} onExito={manejarExito} />
      )}
    </div>
  );
}
