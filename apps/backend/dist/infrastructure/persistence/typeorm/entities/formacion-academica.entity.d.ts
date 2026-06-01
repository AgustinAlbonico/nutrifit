import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class FormacionAcademicaOrmEntity extends AuditableOrmEntity {
    idFormacionAcademica: number;
    titulo: string;
    institucion: string;
    añoInicio: number;
    añoFin: number;
    nivel: string;
    nutricionista: NutricionistaEntity;
}
