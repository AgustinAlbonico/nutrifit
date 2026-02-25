// src/common/errors/app.error.ts
import { ErrorCode } from '../constants/error-codes';
import { ErrorMessages } from '../constants/error-messages';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, customMessage?: string) {
    const { message, statusCode } = ErrorMessages[errorCode] ?? {
      message: 'Error desconocido',
      statusCode: 500,
    };

    super(customMessage ?? message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Recurso', id?: string) {
    const msg = id
      ? `${entity} no encontrado con ID ${id}`
      : `${entity} no encontrado`;
    super(ErrorCode.NOT_FOUND, msg);
  }
}

export class ValidationError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.VALIDATION_ERROR, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class ConflictError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.CONFLICT, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.BAD_REQUEST, message);
  }
}

export class ServerError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.SERVER_ERROR, message);
  }
}
