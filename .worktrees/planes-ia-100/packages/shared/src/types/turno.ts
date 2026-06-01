// Estados de turno según el dominio
export type EstadoTurno =
  | 'PROGRAMADO'
  | 'PRESENTE'
  | 'EN_CURSO'
  | 'REALIZADO'
  | 'CANCELADO'
  | 'AUSENTE';

export interface InfoEstadoTurno {
  estado: EstadoTurno;
  nombre: string;
  color: string;
}

export const ESTADOS_TURNO: InfoEstadoTurno[] = [
  { estado: 'PROGRAMADO', nombre: 'Programado', color: 'bg-blue-100 text-blue-800' },
  { estado: 'PRESENTE', nombre: 'Presente', color: 'bg-green-100 text-green-800' },
  { estado: 'EN_CURSO', nombre: 'En curso', color: 'bg-yellow-100 text-yellow-800' },
  { estado: 'REALIZADO', nombre: 'Realizado', color: 'bg-green-600 text-white' },
  { estado: 'CANCELADO', nombre: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { estado: 'AUSENTE', nombre: 'Ausente', color: 'bg-orange-100 text-orange-800' },
];
