// The one error type that matters. Handlers and services throw ApiError;
// the central error middleware serialises it into the documented
// `{ error: { code, message, details? } }` contract. Nothing else should
// need a bespoke error path.

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static invalidCredentials(): ApiError {
    // One message for both "wrong password" and "unknown email" — the
    // response must not confirm which case actually happened.
    return new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }
}
