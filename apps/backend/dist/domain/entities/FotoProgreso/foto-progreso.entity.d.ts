export type TipoFoto = 'FRENTE' | 'PERFIL' | 'ESPALDA';
export declare class FotoProgresoEntity {
    idFoto: number | null;
    socioId: number;
    tipoFoto: TipoFoto;
    fecha: Date;
    objectKey: string;
    notas: string | null;
    createdAt: Date;
    constructor(idFoto: number | null | undefined, socioId: number, tipoFoto: TipoFoto, fecha: Date, objectKey: string, notas?: string | null, createdAt?: Date);
}
