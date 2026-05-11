// src/common/filters/app-error.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from 'src/domain/exceptions/custom-exceptions';
import { ErrorCode } from 'src/domain/constants/error-codes';

// Tipado seguro para BadRequestException de class-validator
interface ValidationResponse {
  statusCode: number;
  message: string[] | string;
  error: string;
}

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let statusCode = 500;
    let message = 'Error interno del servidor';
    let errorCode = ErrorCode.SERVER_ERROR;
    let details: string[] | undefined = undefined;

    // ===== Errores custom del dominio =====
    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;

      if (statusCode >= 500) {
        this.logger.error(`[${errorCode}] ${message}`, exception.stack);
      }
    }
    // ===== Errores de validación =====
    else if (exception instanceof BadRequestException) {
      statusCode = 400;
      message = 'Error de validación';
      errorCode = ErrorCode.VALIDATION_ERROR;

      const response = exception.getResponse() as ValidationResponse;

      // Normalizamos message siempre a array de strings
      details = Array.isArray(response.message)
        ? response.message
        : [String(response.message)];

      this.logger.warn(`[${errorCode}] ${details.join(', ')}`);
    }
    // ===== Errores HTTP estándar (Unauthorized, Forbidden, NotFound, etc.) =====
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const response = exception.getResponse() as
        | string
        | { message?: string | string[]; error?: string };

      if (typeof response === 'string') {
        message = response;
      } else if (Array.isArray(response?.message)) {
        details = response.message;
        message = response.message[0] ?? 'Error HTTP';
      } else if (typeof response?.message === 'string') {
        message = response.message;
      } else {
        message = exception.message;
      }

      if (statusCode === 401) {
        errorCode = ErrorCode.UNAUTHORIZED;
        message = 'Sesión inválida o vencida. Iniciá sesión nuevamente.';
      } else if (statusCode === 403) {
        errorCode = ErrorCode.FORBIDDEN;
        message = 'No tenés permisos para realizar esta acción.';
      } else if (statusCode === 404) {
        errorCode = ErrorCode.NOT_FOUND;
      } else if (statusCode === 409) {
        errorCode = ErrorCode.CONFLICT;
      } else if (statusCode === 400) {
        errorCode = ErrorCode.BAD_REQUEST;
      } else {
        errorCode = ErrorCode.SERVER_ERROR;
      }

      if (statusCode >= 500) {
        this.logger.error(`[${errorCode}] ${message}`, exception.stack);
      } else {
        this.logger.warn(`[${errorCode}] ${message}`);
      }
    }
    // ===== Errores genéricos =====
    else {
      const e = exception as Error;
      this.logger.error(`[UNHANDLED_EXCEPTION] ${e.message}`, e.stack);
    }

    // ===== Respuesta JSON unificada =====
    res.status(statusCode).json({
      success: false,
      message,
      error: {
        code: errorCode,
        path: req.url,
        timestamp: new Date().toISOString(),
        ...(details ? { details } : {}), // solo agregamos details si existen
      },
    });
  }
}
