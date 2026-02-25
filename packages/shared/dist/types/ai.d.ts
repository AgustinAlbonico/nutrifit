/**
 * Tipos para la integración de IA en recomendaciones nutricionales.
 * Proveedor-agnóstico - no depende de Groq u otro proveedor específico.
 */
export type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';
export interface ContextoPaciente {
    socioId: number;
    peso: number | null;
    altura: number | null;
    alergias: string[];
    patologias: string[];
    restriccionesAlimentarias: string | null;
    objetivoPersonal: string;
    nivelActividadFisica: string;
    frecuenciaComidas: string | null;
    consumoAguaDiario: number | null;
    medicamentosActuales: string | null;
    suplementosActuales: string | null;
    consumoAlcohol: string | null;
    fumaTabaco: boolean;
    horasSueno: number | null;
    cirugiasPrevias: string | null;
    antecedentesFamiliares: string | null;
}
export interface RecomendacionComida {
    nombre: string;
    descripcion: string;
    ingredientes: string[];
    caloriasEstimadas: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    tipoComida: TipoComida;
}
export interface DiaPlanSemanal {
    dia: number;
    comidas: RecomendacionComida[];
}
export interface PlanSemanalIA {
    dias: DiaPlanSemanal[];
    caloriasTotalesDiarias: number;
    disclaimer: string;
}
export interface SustitucionAlimento {
    alimentoOriginal: string;
    alimentoSugerido: string;
    razon: string;
    caloriasEquivalentes: boolean;
}
export interface AnalisisNutricional {
    caloriasDiarias: number;
    proteinasGramos: number;
    carbohidratosGramos: number;
    grasasGramos: number;
    fibraGramos: number | null;
    sodioMg: number | null;
    azucaresGramos: number | null;
    distribucionMacros: {
        proteinas: number;
        carbohidratos: number;
        grasas: number;
    };
    advertencias: string[];
}
export interface RespuestaIA<T> {
    exito: boolean;
    datos: T | null;
    error: string | null;
    disclaimer: string;
}
export interface SolicitudRecomendacion {
    socioId: number;
    tipoComida?: TipoComida;
    preferenciasAdicionales?: string;
}
export interface SolicitudPlanSemanal {
    socioId: number;
    caloriasObjetivo?: number;
    diasAGenerar?: number;
}
export interface SolicitudSustitucion {
    alimento: string;
    razon?: string;
}
export interface SolicitudAnalisis {
    planId: number;
}
//# sourceMappingURL=ai.d.ts.map