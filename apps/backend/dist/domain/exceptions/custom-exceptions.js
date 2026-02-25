"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = exports.BadRequestError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
const error_codes_1 = require("../constants/error-codes");
const error_messages_1 = require("../constants/error-messages");
class AppError extends Error {
    statusCode;
    errorCode;
    constructor(errorCode, customMessage) {
        const { message, statusCode } = error_messages_1.ErrorMessages[errorCode] ?? {
            message: 'Error desconocido',
            statusCode: 500,
        };
        super(customMessage ?? message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(entity = 'Recurso', id) {
        const msg = id
            ? `${entity} no encontrado con ID ${id}`
            : `${entity} no encontrado`;
        super(error_codes_1.ErrorCode.NOT_FOUND, msg);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message) {
        super(error_codes_1.ErrorCode.VALIDATION_ERROR, message);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message) {
        super(error_codes_1.ErrorCode.UNAUTHORIZED, message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message) {
        super(error_codes_1.ErrorCode.FORBIDDEN, message);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message) {
        super(error_codes_1.ErrorCode.CONFLICT, message);
    }
}
exports.ConflictError = ConflictError;
class BadRequestError extends AppError {
    constructor(message) {
        super(error_codes_1.ErrorCode.BAD_REQUEST, message);
    }
}
exports.BadRequestError = BadRequestError;
class ServerError extends AppError {
    constructor(message) {
        super(error_codes_1.ErrorCode.SERVER_ERROR, message);
    }
}
exports.ServerError = ServerError;
//# sourceMappingURL=custom-exceptions.js.map