import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
export declare class TurnoOperacionResponseDto {
    idTurno: number;
    fechaTurno: string;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    socioId: number;
    nutricionistaId: number;
    gimnasioId?: number;
    motivoCancelacion?: string;
    fechaOriginal?: string;
}
