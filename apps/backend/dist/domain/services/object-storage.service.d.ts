export interface IObjectStorageService {
    subirArchivo(objectKey: string, buffer: Buffer, mimeType: string): Promise<void>;
    eliminarArchivo(objectKey: string): Promise<void>;
    obtenerUrlFirmada(objectKey: string, expirySeconds?: number): Promise<string>;
    archivoExiste(objectKey: string): Promise<boolean>;
    obtenerArchivo(objectKey: string): Promise<{
        buffer: Buffer;
        mimeType: string;
    } | null>;
}
export declare const OBJECT_STORAGE_SERVICE: unique symbol;
