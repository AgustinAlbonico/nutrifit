import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
export declare class EditarOpcionComidaDto {
    tipoComida: TipoComida;
    comentarios?: string;
    alimentosIds: number[];
}
export declare class EditarDiaPlanDto {
    dia: DiaSemana;
    orden: number;
    opcionesComida: EditarOpcionComidaDto[];
}
export declare class EditarPlanAlimentacionDto {
    planId: number;
    objetivoNutricional?: string;
    motivoEdicion?: string;
    dias?: EditarDiaPlanDto[];
}
