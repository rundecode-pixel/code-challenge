// App factory — kept separate from server.ts so integration tests can
// build an instance without binding a port.
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { authRouter } from './features/auth/auth.routes.js';
import { cuesRouter } from './features/cues/cue.routes.js';

// Single source of truth for the versioned API prefix. Bump by adding a
// sibling constant (e.g. API_V2) and mounting both routers under it.
export const API_V1 = '/api/v1';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  // credentials:true lets cross-origin browsers store the auth cookie.
  // The cors package then reflects the request origin instead of `*`.
  app.use(cors({ credentials: true }));
  app.use(express.json({ limit: '128kb' }));
  app.use(cookieParser());

  app.get('/', (_req, res) => {
    res.json({
      name: 'Pool Cues API',
      version: '1.0.0',
      apiVersion: 'v1',
      description: 'CRUD service for the Cues resource (Problem 5)',
      endpoints: {
        'GET /': 'API information',
        'GET /api': 'Available API versions',
        'GET /health': 'Health check with timestamp',
        'POST /api/v1/auth/login': 'Authenticate and receive a JWT',
        'GET /api/v1/auth/me': 'Profile of the authenticated user',
        'POST /api/v1/auth/logout': 'Clear the access token (204)',
        'GET /api/v1/cues': 'List cues (status, condition, material, priceMin, priceMax, q, page, pageSize)',
        'POST /api/v1/cues': 'Create a cue',
        'GET /api/v1/cues/:id': 'Get a cue by id',
        'PATCH /api/v1/cues/:id': 'Partially update a cue',
        'DELETE /api/v1/cues/:id': 'Soft-delete a cue',
      },
    });
  });

  app.get('/api', (_req, res) => {
    res.json({
      name: 'Pool Cues API',
      versions: ['v1'],
      current: 'v1',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'cues-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(`${API_V1}/auth`, authRouter);
  app.use(`${API_V1}/cues`, cuesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
