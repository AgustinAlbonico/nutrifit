import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { NutricionistaEntity } from '../Persona/Nutricionista/nutricionista.entity';
export declare class PlanAlimentacionEntity {
    idPlanAlimentacion: number | null;
    fechaCreacion: Date;
    objetivoNutricional: string;
    opcionesAlimentarias: OpcionComidaEntity[];
    nutricionista: NutricionistaEntity;
    constructor(idPlanAlimentacion: number | null | undefined, fechaCreacion: Date, objetivoNutricional: string, opcionesAlimentarias: OpcionComidaEntity[] | undefined, nutricionista: NutricionistaEntity);
}
