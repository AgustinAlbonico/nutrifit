import { TurnoOrmEntity } from './turno.entity';
export declare class ObservacionClinicaOrmEntity {
    idObservacion: number;
    comentario: string;
    peso: number;
    altura: number;
    imc: number;
    sugerencias: string | null;
    habitosSocio: string | null;
    objetivosSocio: string | null;
    esPublica: boolean;
    turno: TurnoOrmEntity;
}
