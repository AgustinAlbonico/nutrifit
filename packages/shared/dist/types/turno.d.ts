export type EstadoTurno = 'PENDIENTE' | 'DISPONIBLE' | 'RESERVADO' | 'CONFIRMADO' | 'PRESENTE' | 'EN_CURSO' | 'REALIZADO' | 'CANCELADO' | 'AUSENTE' | 'REPROGRAMADO' | 'BLOQUEADO' | 'COMPLETADO';
export interface InfoEstadoTurno {
    estado: EstadoTurno;
    nombre: string;
    color: string;
}
export declare const ESTADOS_TURNO: InfoEstadoTurno[];
//# sourceMappingURL=turno.d.ts.map