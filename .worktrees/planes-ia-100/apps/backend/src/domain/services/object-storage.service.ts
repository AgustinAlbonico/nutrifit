export interface IObjectStorageService {
  /**
   * Sube un archivo al bucket de almacenamiento.
   * @param objectKey Clave única para identificar el archivo (ej: "perfiles/socio-123.jpg")
   * @param buffer Contenido del archivo
   * @param mimeType Tipo MIME del archivo (ej: "image/jpeg")
   * @returns Promise<void>
   */
  subirArchivo(
    objectKey: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void>;

  /**
   * Elimina un archivo del bucket de almacenamiento.
   * @param objectKey Clave del archivo a eliminar
   * @returns Promise<void>
   */
  eliminarArchivo(objectKey: string): Promise<void>;

  /**
   * Genera una URL firmada para acceder al archivo de forma temporal.
   * @param objectKey Clave del archivo
   * @param expirySeconds Tiempo de expiración en segundos (default: 3600 = 1 hora)
   * @returns Promise<string> URL firmada
   */
  obtenerUrlFirmada(objectKey: string, expirySeconds?: number): Promise<string>;

  /**
   * Verifica si un archivo existe en el bucket.
   * @param objectKey Clave del archivo
   * @returns Promise<boolean>
   */
  archivoExiste(objectKey: string): Promise<boolean>;

  /**
   * Obtiene el contenido de un archivo del bucket.
   * @param objectKey Clave del archivo
   * @returns Promise<{ buffer: Buffer; mimeType: string } | null>
   */
  obtenerArchivo(
    objectKey: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null>;
}

export const OBJECT_STORAGE_SERVICE = Symbol('IObjectStorageService');
