import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
export declare class CrearOpcionComidaDto {
    tipoComida: TipoComida;
    comentarios?: string;
    alimentosIds: number[];
}
export declare class CrearDiaPlanDto {
    dia: DiaSemana;
    orden: number;
    opcionesComida: CrearOpcionComidaDto[];
}
export declare class CrearPlanAlimentacionDto {
    socioId: number;
    objetivoNutricional: string;
    dias: CrearDiaPlanDto[];
}
