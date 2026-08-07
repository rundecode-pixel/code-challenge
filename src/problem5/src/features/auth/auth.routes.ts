import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { ApiError } from '../../common/errors.js';
import { authenticate, type AuthenticatedRequest } from '../../middleware/authenticate.js';
import { clearAccessTokenCookie, setAccessTokenCookie } from './auth.cookie.js';
import { loginSchema } from './auth.schema.js';
import { findProfileById, login } from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    setAccessTokenCookie(res, result.token);
    res.status(200).json({ data: result });
  }),
);

// The JWT is stateless, so logout only clears the cookie client-side.
// No authentication required: works even with an expired/invalid token,
// and repeated calls are harmless (idempotent 204).
authRouter.post('/logout', (_req, res) => {
  clearAccessTokenCookie(res);
  res.status(204).send();
});

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const profile = await findProfileById(user.id);
    if (!profile) {
      throw ApiError.unauthorized('User no longer exists');
    }
    res.status(200).json({ data: profile });
  }),
);
