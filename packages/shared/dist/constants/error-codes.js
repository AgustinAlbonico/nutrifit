// Códigos de error del sistema
export const CODIGOS_ERROR = {
    // Errores de autenticación
    CREDENCIALES_INVALIDAS: 'AUTH_001',
    TOKEN_EXPIRADO: 'AUTH_002',
    TOKEN_INVALIDO: 'AUTH_003',
    SIN_PERMISOS: 'AUTH_004',
    // Errores de recursos
    RECURSO_NO_ENCONTRADO: 'RES_001',
    RECURSO_DUPLICADO: 'RES_002',
    // Errores de validación
    VALIDACION_FALLIDA: 'VAL_001',
    CAMPO_REQUERIDO: 'VAL_002',
    FORMATO_INVALIDO: 'VAL_003',
    // Errores de negocio
    TURNO_NO_DISPONIBLE: 'NEG_001',
    SOCIO_SIN_PROFESIONAL: 'NEG_002',
    FECHA_INVALIDA: 'NEG_003',
};
//# sourceMappingURL=error-codes.js.map