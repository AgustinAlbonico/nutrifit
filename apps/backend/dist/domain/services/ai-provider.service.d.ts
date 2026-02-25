export declare const AI_PROVIDER_SERVICE: unique symbol;
export interface IAiProviderService {
    generarRecomendacion<T>(prompt: string, schema: object): Promise<T>;
    verificarConexion(): Promise<boolean>;
}
