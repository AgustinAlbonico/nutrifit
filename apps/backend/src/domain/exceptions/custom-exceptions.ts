// src/common/errors/app.error.ts
import { ErrorCode } from '../constants/error-codes';
import { ErrorMessages } from '../constants/error-messages';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly context?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCode,
    customMessage?: string,
    context?: Record<string, unknown>,
  ) {
    const { message, statusCode } = ErrorMessages[errorCode] ?? {
      message: 'Error desconocido',
      statusCode: 500,
    };

    super(customMessage ?? message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
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
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.UNAUTHORIZED, message, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, context);
  }
}

export class ConflictError extends AppError {
  public readonly data?: Record<string, unknown>;

  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, context);
    this.data = context;
  }
}

export class BadRequestError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.BAD_REQUEST, message, context);
  }
}

export class ServerError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.SERVER_ERROR, message, context);
  }
}
