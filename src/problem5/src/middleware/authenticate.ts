// Token gate. Accepts the access token from the auth cookie (browser
// flow) or an Authorization: Bearer header (API-client flow), then hands
// the identity downstream as `req.user`. Deliberately does not hit the
// database: there is no register/delete-user flow in this service, so a
// signed token can only reference a real seeded user. If that ever
// changes, add a user lookup plus a revocation strategy here.
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../common/errors.js';
import { readAccessToken } from '../config/jwt.js';
import { ACCESS_TOKEN_COOKIE } from '../features/auth/auth.cookie.js';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.header('authorization');
  const token =
    header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : (req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined);
  if (!token) {
    return next(
      ApiError.unauthorized('Missing token (access_token cookie or Authorization header)'),
    );
  }
  try {
    const claims = readAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: claims.sub,
      email: claims.email,
    };
    next();
  } catch {
    // Expired, forged, or malformed — all of them look identical to the
    // client, and all of them get the same response.
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};
