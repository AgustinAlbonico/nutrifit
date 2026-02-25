// src/common/errors/error-messages.ts
import { ErrorCode } from './error-codes';

export const ErrorMessages: Record<
  ErrorCode,
  { message: string; statusCode: number }
> = {
  [ErrorCode.NOT_FOUND]: {
    message: 'Recurso no encontrado',
    statusCode: 404,
  },
  [ErrorCode.VALIDATION_ERROR]: {
    message: 'Datos inválidos',
    statusCode: 400,
  },
  [ErrorCode.UNAUTHORIZED]: {
    message: 'No autorizado',
    statusCode: 401,
  },
  [ErrorCode.FORBIDDEN]: {
    message: 'Acceso denegado',
    statusCode: 403,
  },
  [ErrorCode.CONFLICT]: {
    message: 'Conflicto de datos',
    statusCode: 409,
  },
  [ErrorCode.SERVER_ERROR]: {
    message: 'Error interno del servidor',
    statusCode: 500,
  },
  [ErrorCode.BAD_REQUEST]: {
    message: 'Solicitud incorrecta',
    statusCode: 400,
  },
};
