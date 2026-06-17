export interface AgendaItemDisponibilidad {
  idAgenda: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export interface BloqueAgendaFormulario {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

export interface AdvertenciaDisponibilidad {
  requiereConfirmacion: boolean;
  turnosFueraDeAgenda: number;
  turnosConDuracionActual: number;
}

interface ErrorDisponibilidad extends Error {
  status?: number;
  context?: Record<string, unknown>;
}

interface CrearPayloadDisponibilidadArgs {
  duracionTurno: number;
  agendas: BloqueAgendaFormulario[];
  confirmarCambiosConTurnos?: boolean;
}

export function obtenerDuracionGlobalAgenda(
  agendas: AgendaItemDisponibilidad[],
  duracionPorDefecto: number = 30,
): number {
  return agendas[0]?.duracionTurno ?? duracionPorDefecto;
}

export function crearPayloadDisponibilidad({
  duracionTurno,
  agendas,
  confirmarCambiosConTurnos = false,
}: CrearPayloadDisponibilidadArgs) {
  return {
    duracionTurno,
    confirmarCambiosConTurnos,
    agendas: agendas.map((agenda) => ({
      dia: agenda.dia,
      horaInicio: agenda.horaInicio.slice(0, 5),
      horaFin: agenda.horaFin.slice(0, 5),
    })),
  };
}

export function extraerAdvertenciaDisponibilidad(
  error: unknown,
): AdvertenciaDisponibilidad | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const errorDisponibilidad = error as ErrorDisponibilidad;
  const context = errorDisponibilidad.context;

  if (
    errorDisponibilidad.status !== 409 ||
    !context ||
    context.requiereConfirmacion !== true
  ) {
    return null;
  }

  return {
    requiereConfirmacion: true,
    turnosFueraDeAgenda: Number(context.turnosFueraDeAgenda ?? 0),
    turnosConDuracionActual: Number(context.turnosConDuracionActual ?? 0),
  };
}

export function construirMensajeConfirmacionDisponibilidad(
  advertencia: AdvertenciaDisponibilidad,
): string {
  const mensajes: string[] = [];

  if (advertencia.turnosFueraDeAgenda > 0) {
    mensajes.push(
      `Este rango tiene ${advertencia.turnosFueraDeAgenda} turnos reservados. Si lo eliminás, esos turnos quedarán fuera de la agenda configurada. ¿Continuar?`,
    );
  }

  if (advertencia.turnosConDuracionActual > 0) {
    mensajes.push(
      `Hay ${advertencia.turnosConDuracionActual} turnos futuros con la duración actual. Los nuevos slots se calcularán con la nueva duración. Los turnos existentes NO se modifican. ¿Continuar?`,
    );
  }

  return mensajes.join('\n\n');
}
