import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { ensureDemoUser, disconnect } from './helpers/db.js';

const app = createApp();

let demoUser: Awaited<ReturnType<typeof ensureDemoUser>>;
let token: string;

beforeAll(async () => {
  demoUser = await ensureDemoUser();
});

afterAll(async () => {
  await disconnect();
});

describe('POST /api/v1/auth/login', () => {
  it('returns a JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@example.com', password: 'P@ssword123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: demoUser.id,
      email: 'demo@example.com',
      name: 'Demo User',
    });
    expect(typeof res.body.data.token).toBe('string');
    const payload = jwt.verify(res.body.data.token, env.JWT_SECRET) as jwt.JwtPayload;
    expect(payload).toMatchObject({ sub: demoUser.id, email: 'demo@example.com' });
    token = res.body.data.token;
  });

  it('sets an httpOnly access_token cookie on login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@example.com', password: 'P@ssword123' });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    const cookie = cookies![0];
    expect(cookie).toMatch(/^access_token=[^;]+/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//i);
  });

  it('rejects a wrong password with a generic error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('rejects an unknown email with the same generic error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'P@ssword123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('validates the request body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fieldErrors.password).toBeDefined();
  });

  it('handles malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "demo@example.com",');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the authenticated user profile', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: demoUser.id,
      email: 'demo@example.com',
      name: 'Demo User',
    });
  });

  it('requires a valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('cookie-based auth', () => {
  it('authenticates subsequent requests via the cookie only', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'demo@example.com', password: 'P@ssword123' })
      .expect(200);

    const me = await agent.get('/api/v1/auth/me').expect(200);
    expect(me.body.data).toEqual({
      id: demoUser.id,
      email: 'demo@example.com',
      name: 'Demo User',
    });

    const cues = await agent.get('/api/v1/cues').expect(200);
    expect(Array.isArray(cues.body.data.items)).toBe(true);
    expect(cues.body.data.items.length).toBeGreaterThan(0);
  });

  it('rejects a forged token sent in the cookie', async () => {
    const forged = jwt.sign(
      { sub: demoUser.id, email: demoUser.email },
      'wrong-secret-that-is-also-long-enough-for-the-signer',
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `access_token=${forged}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('logout', () => {
  it('clears the access_token cookie and de-authenticates', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'demo@example.com', password: 'P@ssword123' })
      .expect(200);
    await agent.get('/api/v1/auth/me').expect(200);

    const logout = await agent.post('/api/v1/auth/logout').expect(204);
    const cookie = (logout.headers['set-cookie'] as unknown as string[])[0];
    expect(cookie).toMatch(/^access_token=;/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\//i);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe('UNAUTHORIZED');
  });

  it('is idempotent without a prior login', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('bearer token enforcement', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/cues');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign(
      { sub: demoUser.id, email: demoUser.email },
      env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '-1s' },
    );

    const res = await request(app).get('/api/v1/cues').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign(
      { sub: demoUser.id, email: demoUser.email },
      'wrong-secret-that-is-also-long-enough-for-the-signer',
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    const res = await request(app).get('/api/v1/cues').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
