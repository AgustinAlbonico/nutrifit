export type TipoMetrica = 'PESO' | 'CINTURA' | 'CADERA' | 'BRAZO' | 'MUSLO' | 'PECHO';
export type EstadoObjetivo = 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO';
export declare class ObjetivoEntity {
    idObjetivo: number | null;
    socioId: number;
    tipoMetrica: TipoMetrica;
    valorInicial: number;
    valorObjetivo: number;
    valorActual: number;
    estado: EstadoObjetivo;
    fechaInicio: Date;
    fechaObjetivo: Date | null;
    createdAt: Date;
    updatedAt: Date;
    constructor(idObjetivo: number | null | undefined, socioId: number, tipoMetrica: TipoMetrica, valorInicial: number, valorObjetivo: number, valorActual: number, estado: EstadoObjetivo, fechaInicio: Date, fechaObjetivo?: Date | null, createdAt?: Date, updatedAt?: Date);
    calcularProgreso(): number;
}
