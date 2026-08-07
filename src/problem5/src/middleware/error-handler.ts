// Terminal error middleware. Everything that bubbles out of the app is
// normalised here into the `{ error: { code, message, details? } }` shape.
// Stack traces are development-only.
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../common/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body or query',
        details: err.flatten(),
      },
    });
    return;
  }

  // express.json() reports unparseable payloads as a SyntaxError carrying a
  // 400 status — without this branch they'd wrongly surface as a 500.
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' },
    });
    return;
  }

  if (env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[unhandled]', err);
  }
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};
