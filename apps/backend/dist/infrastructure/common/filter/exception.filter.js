"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AppErrorFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppErrorFilter = void 0;
const common_1 = require("@nestjs/common");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const error_codes_1 = require("../../../domain/constants/error-codes");
let AppErrorFilter = AppErrorFilter_1 = class AppErrorFilter {
    logger = new common_1.Logger(AppErrorFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        let statusCode = 500;
        let message = 'Error interno del servidor';
        let errorCode = error_codes_1.ErrorCode.SERVER_ERROR;
        let details = undefined;
        if (exception instanceof custom_exceptions_1.AppError) {
            statusCode = exception.statusCode;
            message = exception.message;
            errorCode = exception.errorCode;
            if (statusCode >= 500) {
                this.logger.error(`[${errorCode}] ${message}`, exception.stack);
            }
        }
        else if (exception instanceof common_1.BadRequestException) {
            statusCode = 400;
            message = 'Error de validación';
            errorCode = error_codes_1.ErrorCode.VALIDATION_ERROR;
            const response = exception.getResponse();
            details = Array.isArray(response.message)
                ? response.message
                : [String(response.message)];
            this.logger.warn(`[${errorCode}] ${details.join(', ')}`);
        }
        else if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const response = exception.getResponse();
            if (typeof response === 'string') {
                message = response;
            }
            else if (Array.isArray(response?.message)) {
                details = response.message;
                message = response.message[0] ?? 'Error HTTP';
            }
            else if (typeof response?.message === 'string') {
                message = response.message;
            }
            else {
                message = exception.message;
            }
            if (statusCode === common_1.HttpStatus.UNAUTHORIZED) {
                errorCode = error_codes_1.ErrorCode.UNAUTHORIZED;
                message = 'Sesión inválida o vencida. Iniciá sesión nuevamente.';
            }
            else if (statusCode === common_1.HttpStatus.FORBIDDEN) {
                errorCode = error_codes_1.ErrorCode.FORBIDDEN;
                message = 'No tenés permisos para realizar esta acción.';
            }
            else if (statusCode === common_1.HttpStatus.NOT_FOUND) {
                errorCode = error_codes_1.ErrorCode.NOT_FOUND;
            }
            else if (statusCode === common_1.HttpStatus.CONFLICT) {
                errorCode = error_codes_1.ErrorCode.CONFLICT;
            }
            else if (statusCode === common_1.HttpStatus.BAD_REQUEST) {
                errorCode = error_codes_1.ErrorCode.BAD_REQUEST;
            }
            else {
                errorCode = error_codes_1.ErrorCode.SERVER_ERROR;
            }
            if (statusCode >= 500) {
                this.logger.error(`[${errorCode}] ${message}`, exception.stack);
            }
            else {
                this.logger.warn(`[${errorCode}] ${message}`);
            }
        }
        else {
            const e = exception;
            this.logger.error(`[UNHANDLED_EXCEPTION] ${e.message}`, e.stack);
        }
        res.status(statusCode).json({
            success: false,
            message,
            error: {
                code: errorCode,
                path: req.url,
                timestamp: new Date().toISOString(),
                ...(details ? { details } : {}),
            },
        });
    }
};
exports.AppErrorFilter = AppErrorFilter;
exports.AppErrorFilter = AppErrorFilter = AppErrorFilter_1 = __decorate([
    (0, common_1.Catch)()
], AppErrorFilter);
//# sourceMappingURL=exception.filter.js.map