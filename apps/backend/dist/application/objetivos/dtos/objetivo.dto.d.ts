import { EstadoObjetivo, TipoMetrica } from 'src/domain/entities/Objetivo/objetivo.entity';
export declare class CrearObjetivoDto {
    socioId?: number;
    tipoMetrica: TipoMetrica;
    valorInicial: number;
    valorObjetivo: number;
    fechaObjetivo?: Date;
}
export declare class ActualizarObjetivoDto {
    valorActual: number;
}
export declare class ObjetivoResponseDto {
    idObjetivo: number;
    socioId: number;
    tipoMetrica: TipoMetrica;
    valorInicial: number;
    valorActual: number;
    valorObjetivo: number;
    estado: EstadoObjetivo;
    fechaInicio: Date;
    fechaObjetivo: Date | null;
    createdAt: Date;
    updatedAt: Date;
    progreso: number;
}
export declare class ListaObjetivosResponseDto {
    activos: ObjetivoResponseDto[];
    completados: ObjetivoResponseDto[];
}
