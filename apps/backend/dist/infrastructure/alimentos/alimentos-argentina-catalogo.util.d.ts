import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
export interface AlimentoCatalogoArgentina {
    nombre: string;
    cantidad: number;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    unidadMedida: UnidadMedida;
}
export interface OpenFoodFactsProducto {
    product_name?: string;
    quantity?: string;
    nutriments?: Record<string, unknown>;
}
export interface OpenFoodFactsBusqueda {
    products?: OpenFoodFactsProducto[];
    count?: number;
    page?: number;
}
export declare const ALIMENTOS_BASE_ARGENTINA: AlimentoCatalogoArgentina[];
export declare function normalizarNombreAlimento(nombre: string): string;
export declare function limpiarNombreAlimento(nombre: string): string;
export declare function esNombreRuidoso(nombre: string): boolean;
export declare function mapearProductoOpenFoodFacts(producto: OpenFoodFactsProducto): AlimentoCatalogoArgentina | null;
