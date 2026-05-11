import type { EstadoTurno } from '@nutrifit/shared';

export type EstadoSlotAgenda = EstadoTurno | 'LIBRE' | 'OCUPADO' | 'BLOQUEADO';

export interface SlotAgendaVisualizable {
  estado: EstadoTurno | 'LIBRE' | 'OCUPADO';
  socio?: {
    nombre: string;
    dni: string;
  } | null;
}

export function obtenerEstadoVisualSlotAgenda(
  slot: SlotAgendaVisualizable,
): EstadoSlotAgenda {
  if (slot.estado === 'LIBRE' || slot.estado === 'OCUPADO') {
    return slot.estado;
  }

  if (slot.estado === 'PROGRAMADO' && !slot.socio) {
    return 'BLOQUEADO';
  }

  return slot.estado;
}

export function puedeHacerCheckInTurno(estado: EstadoTurno): boolean {
  return estado === 'PROGRAMADO';
}

export function esEstadoTurnoVigente(estado: EstadoTurno): boolean {
  return (
    estado === 'PROGRAMADO' ||
    estado === 'PRESENTE' ||
    estado === 'EN_CURSO'
  );
}

export function obtenerEtiquetaEstadoTurno(estado: EstadoSlotAgenda): string {
  switch (estado) {
    case 'PROGRAMADO':
      return 'Programado';
    case 'PRESENTE':
      return 'Presente';
    case 'EN_CURSO':
      return 'En curso';
    case 'REALIZADO':
      return 'Realizado';
    case 'CANCELADO':
      return 'Cancelado';
    case 'AUSENTE':
      return 'Ausente';
    case 'LIBRE':
      return 'Libre';
    case 'OCUPADO':
      return 'Ocupado';
    case 'BLOQUEADO':
      return 'Bloqueado';
    default:
      return estado;
  }
}

export function obtenerClasesEstadoTurno(estado: EstadoSlotAgenda): string {
  switch (estado) {
    case 'PROGRAMADO':
      return 'border-amber-200 bg-amber-100 text-amber-800';
    case 'PRESENTE':
      return 'border-blue-200 bg-blue-100 text-blue-800';
    case 'EN_CURSO':
      return 'border-violet-200 bg-violet-100 text-violet-800';
    case 'REALIZADO':
      return 'border-emerald-200 bg-emerald-100 text-emerald-800';
    case 'CANCELADO':
      return 'border-rose-200 bg-rose-100 text-rose-800';
    case 'AUSENTE':
      return 'border-slate-300 bg-slate-100 text-slate-700';
    case 'BLOQUEADO':
      return 'border-rose-200 bg-rose-100 text-rose-800';
    case 'OCUPADO':
      return 'border-slate-300 bg-slate-100 text-slate-700';
    case 'LIBRE':
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export function obtenerVarianteEstadoTurno(
  estado: EstadoTurno,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'PROGRAMADO':
      return 'secondary';
    case 'PRESENTE':
    case 'EN_CURSO':
    case 'REALIZADO':
      return 'default';
    case 'CANCELADO':
      return 'destructive';
    case 'AUSENTE':
    default:
      return 'outline';
  }
}
