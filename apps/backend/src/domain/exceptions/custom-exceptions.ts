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

/**
 * 502 Bad Gateway — el servicio upstream (ej: Groq) devolvió una
 * respuesta inválida que no podemos procesar (JSON malformado, schema
 * desconocido, etc.). Mapea a HTTP 502 vía `AppErrorFilter`.
 *
 * Hotfix Packet 8 (plan-alimentacion-ia-v2): usado por
 * `GenerarPlanSemanalUseCase` y `RegenerarPlanSemanalUseCase` cuando
 * Groq devuelve JSON inválido 2 veces seguidas (código
 * `GROQ_INVALID_JSON`).
 */
export class BadGatewayError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.BAD_GATEWAY, message, context);
  }
}

/**
 * 503 Service Unavailable — el servicio upstream (ej: Groq) no está
 * disponible temporalmente (timeout, red caída, etc.). Mapea a HTTP 503
 * vía `AppErrorFilter`.
 *
 * Hotfix Packet 8 (plan-alimentacion-ia-v2): usado por
 * `GenerarPlanSemanalUseCase` y `RegenerarPlanSemanalUseCase` cuando
 * Groq no responde tras 2 reintentos (código `GROQ_TIMEOUT`).
 */
export class ServiceUnavailableError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, context);
  }
}

/**
 * 429 Too Many Requests — el proveedor de IA (Groq) rechazó la request
 * por haber alcanzado el límite diario de tokens o requests. El `context`
 * puede incluir `retryAfterSegundos` con el tiempo estimado de espera.
 */
export class AIRateLimitError extends AppError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.AI_RATE_LIMIT, message, context);
  }
}
