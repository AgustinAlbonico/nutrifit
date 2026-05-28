import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';
import { DiaPlanOrmEntity } from './dia-plan.entity';
export declare class PlanAlimentacionOrmEntity {
    idPlanAlimentacion: number;
    fechaCreacion: Date;
    objetivoNutricional: string;
    socio: SocioOrmEntity;
    nutricionista: NutricionistaOrmEntity;
    activo: boolean;
    eliminadoEn: Date | null;
    motivoEliminacion: string | null;
    motivoEdicion: string | null;
    ultimaEdicion: Date | null;
    dias: DiaPlanOrmEntity[];
}
