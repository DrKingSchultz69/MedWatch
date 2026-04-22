import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Centralized error handler middleware.
 * All errors flow through here and return consistent JSON responses.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      message,
      code,
    },
  });
};

/**
 * Helper to create operational errors with status codes.
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.name = 'ApiError';
  }
}

export default errorHandler;
