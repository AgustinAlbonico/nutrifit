import { TurnoEntity } from 'src/domain/entities/Turno/turno.entity';
export declare class ObservacionClinicaOrmEntity {
    idObservacion: number;
    comentario: string;
    peso: number;
    altura: number;
    imc: number;
    sugerencias: string | null;
    habitosSocio: string | null;
    objetivosSocio: string | null;
    turno: TurnoEntity;
}
