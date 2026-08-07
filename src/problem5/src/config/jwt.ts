// Access-token helpers. HS256 signed, 24h lifetime. The token is a
// compact self-contained identity claim: `sub` is the user id, `email` is
// carried so authenticated handlers can render it without a DB round-trip.
import jwt from 'jsonwebtoken';
import { env } from './env.js';

export interface AccessTokenClaims {
  sub: string;
  email: string;
}

// Single source of truth: the JWT lifetime and the auth-cookie maxAge both
// derive from this, so a token can never outlive the cookie that carries it.
export const ACCESS_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const issueAccessToken = (claims: AccessTokenClaims): string =>
  jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

export const readAccessToken = (token: string): AccessTokenClaims => {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  }) as jwt.JwtPayload;
  if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
    throw new Error('Access token payload is malformed');
  }
  return { sub: decoded.sub, email: decoded.email };
};
