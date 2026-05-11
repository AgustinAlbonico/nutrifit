export declare const CODIGOS_ERROR: {
    readonly CREDENCIALES_INVALIDAS: "AUTH_001";
    readonly TOKEN_EXPIRADO: "AUTH_002";
    readonly TOKEN_INVALIDO: "AUTH_003";
    readonly SIN_PERMISOS: "AUTH_004";
    readonly RECURSO_NO_ENCONTRADO: "RES_001";
    readonly RECURSO_DUPLICADO: "RES_002";
    readonly VALIDACION_FALLIDA: "VAL_001";
    readonly CAMPO_REQUERIDO: "VAL_002";
    readonly FORMATO_INVALIDO: "VAL_003";
    readonly TURNO_NO_DISPONIBLE: "NEG_001";
    readonly SOCIO_SIN_PROFESIONAL: "NEG_002";
    readonly FECHA_INVALIDA: "NEG_003";
    readonly PLAN_SIN_ITEMS: "PLAN_001";
    readonly RESTRICCIONES_VIOLADAS: "PLAN_002";
    readonly IA_SIN_RESULTADOS: "PLAN_003";
};
export type CodigoError = (typeof CODIGOS_ERROR)[keyof typeof CODIGOS_ERROR];
//# sourceMappingURL=error-codes.d.ts.map