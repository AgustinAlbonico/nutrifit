import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
export declare class EditarItemComidaDto {
    alimentoId: number;
    cantidad: number;
}
export declare class EditarOpcionComidaDto {
    tipoComida: TipoComida;
    comentarios?: string;
    items: EditarItemComidaDto[];
}
export declare class EditarDiaPlanDto {
    dia: DiaSemana;
    orden: number;
    opcionesComida: EditarOpcionComidaDto[];
}
export declare class EditarPlanAlimentacionDto {
    planId: number;
    objetivoNutricional?: string;
    motivoEdicion: string;
    dias?: EditarDiaPlanDto[];
}
