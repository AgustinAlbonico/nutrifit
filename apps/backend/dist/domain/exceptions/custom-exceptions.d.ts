import { ErrorCode } from '../constants/error-codes';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly errorCode: ErrorCode;
    constructor(errorCode: ErrorCode, customMessage?: string);
}
export declare class NotFoundError extends AppError {
    constructor(entity?: string, id?: string);
}
export declare class ValidationError extends AppError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
export declare class ServerError extends AppError {
    constructor(message?: string);
}
