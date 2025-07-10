// src/domain/errors/app.errors.ts

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly details?: string;

    constructor(message: string, statusCode: number = 500, errorCode: string = 'SERVER_ERROR', details?: string) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class InvalidMatrixError extends AppError {
    constructor(details?: string) {
        super('Invalid matrix provided.', 400, 'INVALID_MATRIX', details);
    }
}

export class GoApiError extends AppError {
    constructor(message: string = 'Error communicating with Go API.', details?: string, statusCode: number = 500) {
        super(message, statusCode, 'GO_API_ERROR', details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(details?: string) {
        super('Authentication required or invalid token.', 401, 'UNAUTHORIZED', details);
    }
}

export class InternalServerError extends AppError {
    constructor(details?: string) {
        super('An unexpected internal server error occurred.', 500, 'INTERNAL_SERVER_ERROR', details);
    }
}