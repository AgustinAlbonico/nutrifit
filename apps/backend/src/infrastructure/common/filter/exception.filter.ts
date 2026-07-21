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
    let context: Record<string, unknown> | undefined = undefined;

    // ===== Errores custom del dominio =====
    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;
      context = exception.context;

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
      this.logger.error(
        `[UNHANDLED_EXCEPTION] ${e.name}: ${e.message}`,
        this.formatUnknownException(e),
      );
    }

    // ===== Respuesta JSON unificada =====
    res.status(statusCode).json({
      success: false,
      data: null,
      error: {
        code: errorCode,
        message,
        ...(details && details.length > 0 ? { details } : {}),
        ...(context ? { context } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  private formatUnknownException(e: Error): string {
    const lines: string[] = [];
    lines.push(e.stack ?? '<no stack>');

    const aggregateErrors = this.collectAggregateErrors(e);

    if (aggregateErrors.length > 0) {
      lines.push('');
      lines.push(
        `--- AggregateError contents (${aggregateErrors.length} inner error(s)) ---`,
      );

      aggregateErrors.forEach((inner, idx) => {
        const innerErr = inner as Error & {
          code?: string;
          errno?: number | string;
          syscall?: string;
          address?: string;
          port?: number;
          hostname?: string;
          host?: string;
          path?: string;
        };

        const parts: string[] = [];
        parts.push(`#${idx + 1} ${innerErr.name ?? 'Error'}`);
        parts.push(`message=${JSON.stringify(innerErr.message ?? '')}`);

        if (innerErr.code) parts.push(`code=${innerErr.code}`);
        if (innerErr.errno !== undefined) parts.push(`errno=${innerErr.errno}`);
        if (innerErr.syscall) parts.push(`syscall=${innerErr.syscall}`);
        if (innerErr.address) parts.push(`address=${innerErr.address}`);
        if (innerErr.port !== undefined) parts.push(`port=${innerErr.port}`);
        if (innerErr.hostname) parts.push(`hostname=${innerErr.hostname}`);
        if (innerErr.host) parts.push(`host=${innerErr.host}`);
        if (innerErr.path) parts.push(`path=${innerErr.path}`);

        lines.push(parts.join(' | '));
      });
    }

    if (e.cause !== undefined && e.cause !== e) {
      lines.push('');
      lines.push('--- cause ---');
      const cause = e.cause as Error;
      lines.push(`${cause.name ?? 'Error'}: ${cause.message ?? ''}`);
      if (cause.stack) {
        lines.push(cause.stack);
      }
    }

    return lines.join('\n');
  }

  private collectAggregateErrors(e: Error): unknown[] {
    const found: unknown[] = [];
    const direct = (e as { errors?: unknown }).errors;
    if (Array.isArray(direct)) {
      found.push(...direct);
    }

    let current: unknown = e;
    const seen = new Set<unknown>();
    while (
      current !== null &&
      typeof current === 'object' &&
      !seen.has(current)
    ) {
      seen.add(current);
      const next = (current as { cause?: unknown }).cause;
      if (
        next !== null &&
        typeof next === 'object' &&
        typeof (next as { errors?: unknown }).errors !== 'undefined'
      ) {
        const inner = (next as { errors?: unknown }).errors;
        if (Array.isArray(inner)) {
          found.push(...inner);
        }
        current = next;
      } else {
        current = next;
        if (current === null || typeof current !== 'object') break;
      }
    }

    return found;
  }
}
