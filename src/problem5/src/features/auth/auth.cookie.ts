import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env.js';
import { ACCESS_TOKEN_TTL_SECONDS } from '../../config/jwt.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
});

export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...cookieOptions(),
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
};

// clearCookie must reuse the exact same path/attributes or the browser
// will keep the original cookie and logout silently fails.
export const clearAccessTokenCookie = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions());
};
