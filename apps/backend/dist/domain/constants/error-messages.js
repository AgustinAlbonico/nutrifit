"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = void 0;
const error_codes_1 = require("./error-codes");
exports.ErrorMessages = {
    [error_codes_1.ErrorCode.NOT_FOUND]: {
        message: 'Recurso no encontrado',
        statusCode: 404,
    },
    [error_codes_1.ErrorCode.VALIDATION_ERROR]: {
        message: 'Datos inválidos',
        statusCode: 400,
    },
    [error_codes_1.ErrorCode.UNAUTHORIZED]: {
        message: 'No autorizado',
        statusCode: 401,
    },
    [error_codes_1.ErrorCode.FORBIDDEN]: {
        message: 'Acceso denegado',
        statusCode: 403,
    },
    [error_codes_1.ErrorCode.CONFLICT]: {
        message: 'Conflicto de datos',
        statusCode: 409,
    },
    [error_codes_1.ErrorCode.SERVER_ERROR]: {
        message: 'Error interno del servidor',
        statusCode: 500,
    },
    [error_codes_1.ErrorCode.BAD_REQUEST]: {
        message: 'Solicitud incorrecta',
        statusCode: 400,
    },
};
//# sourceMappingURL=error-messages.js.map