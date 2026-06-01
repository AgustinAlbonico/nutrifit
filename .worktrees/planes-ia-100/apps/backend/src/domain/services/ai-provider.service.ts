/**
 * Interfaz del servicio de proveedor de IA.
 * Define la funcionalidad mínima para interacciones con modelos de lenguaje.
 */
export const AI_PROVIDER_SERVICE = Symbol('AI_PROVIDER_SERVICE');

export interface IAiProviderService {
  /**
   * Genera una recomendación estructurada usando el modelo de IA.
   * @param prompt - Instrucción para el modelo
   * @param schema - Esquema JSON para validar la salida
   * @returns Promesa con los datos estructurados generados
   */
  generarRecomendacion<T>(prompt: string, schema: object): Promise<T>;

  /**
   * Verifica si el proveedor de IA está correctamente configurado.
   * @returns Promesa con true si está disponible, false en caso contrario
   */
  verificarConexion(): Promise<boolean>;
}
