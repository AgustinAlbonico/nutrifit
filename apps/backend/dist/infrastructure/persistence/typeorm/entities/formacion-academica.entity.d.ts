import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
export declare class FormacionAcademicaOrmEntity {
    idFormacionAcademica: number;
    titulo: string;
    institucion: string;
    añoInicio: number;
    añoFin: number;
    nivel: string;
    nutricionista: NutricionistaEntity;
}
