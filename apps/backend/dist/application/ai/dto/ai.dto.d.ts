import { TipoComida } from '@nutrifit/shared';
export declare class GenerarRecomendacionDto {
    socioId: number;
    tipoComida?: TipoComida;
    preferenciasAdicionales?: string;
}
export declare class GenerarPlanSemanalDto {
    socioId: number;
    caloriasObjetivo?: number;
    diasAGenerar?: number;
}
export declare class SugerirSustitucionDto {
    alimento: string;
    razon?: string;
}
export declare class AnalizarPlanDto {
    planId: number;
}
