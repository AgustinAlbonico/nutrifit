import { DiaPlanOrmEntity } from './dia-plan.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
export declare class PlanAlimentacionOrmEntity {
    idPlanAlimentacion: number;
    fechaCreacion: Date;
    objetivoNutricional: string;
    socio: SocioEntity;
    nutricionista: NutricionistaEntity;
    activo: boolean;
    eliminadoEn: Date | null;
    motivoEliminacion: string | null;
    motivoEdicion: string | null;
    ultimaEdicion: Date | null;
    dias: DiaPlanOrmEntity[];
}
