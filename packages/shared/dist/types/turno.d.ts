export type EstadoTurno = 'PROGRAMADO' | 'PRESENTE' | 'EN_CURSO' | 'REALIZADO' | 'CANCELADO' | 'AUSENTE';
export interface InfoEstadoTurno {
    estado: EstadoTurno;
    nombre: string;
    color: string;
}
export declare const ESTADOS_TURNO: InfoEstadoTurno[];
//# sourceMappingURL=turno.d.ts.map