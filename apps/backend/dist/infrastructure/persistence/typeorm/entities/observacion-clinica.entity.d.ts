import { TurnoOrmEntity } from './turno.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class ObservacionClinicaOrmEntity extends AuditableOrmEntity {
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
