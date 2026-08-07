import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { AppDataSource } from '../data-source.js';
import { Cue } from '../src/features/cues/cue.entity.js';
import { createApp } from '../src/app.js';
import { ensureDemoUser, disconnect } from './helpers/db.js';

const app = createApp();

let demoUser: Awaited<ReturnType<typeof ensureDemoUser>>;
let token: string;

const createdCueIds: string[] = [];

beforeAll(async () => {
  demoUser = await ensureDemoUser();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'demo@example.com', password: 'P@ssword123' });
  token = res.body.data.token;
});

afterAll(async () => {
  // Created cues are not deleted by the tests that use them; hard-delete
  // them so a later run still sees only the 5 seeded cues.
  if (createdCueIds.length > 0) {
    await AppDataSource.getRepository(Cue).delete(createdCueIds);
  }
  await disconnect();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

const makeCue = (overrides: Record<string, unknown> = {}) => ({
  brand: 'Test Brand',
  model: 'Test Model',
  material: 'maple',
  tipSizeMm: 13.0,
  weightOz: 19.0,
  lengthIn: 58,
  priceUsd: 199.99,
  condition: 'new',
  ...overrides,
});

const createCue = async (overrides: Record<string, unknown> = {}) => {
  const res = await request(app)
    .post('/api/v1/cues')
    .set(auth())
    .send(makeCue(overrides));
  const id = res.body.data?.id as string | undefined;
  if (id) {
    createdCueIds.push(id);
  }
  return res;
};

describe('GET /api/v1/cues', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/cues');
    expect(res.status).toBe(401);
  });

  it('lists cues with default pagination', async () => {
    const res = await request(app).get('/api/v1/cues').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(5);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 5,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('paginates with rich metadata', async () => {
    const res = await request(app).get('/api/v1/cues?page=1&pageSize=2').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const last = await request(app).get('/api/v1/cues?page=3&pageSize=2').set(auth());
    expect(last.body.data.items).toHaveLength(1);
    expect(last.body.data.pagination).toMatchObject({
      page: 3,
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/v1/cues?status=reserved').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(
      res.body.data.items.every((c: { status: string }) => c.status === 'reserved'),
    ).toBe(true);
  });

  it('filters by condition', async () => {
    const res = await request(app).get('/api/v1/cues?condition=new').set(auth());

    expect(res.status).toBe(200);
    expect(
      res.body.data.items.every((c: { condition: string }) => c.condition === 'new'),
    ).toBe(true);
  });

  it('filters by material', async () => {
    const res = await request(app).get('/api/v1/cues?material=carbon').set(auth());

    expect(res.status).toBe(200);
    expect(
      res.body.data.items.every((c: { material: string }) => c.material === 'carbon'),
    ).toBe(true);
  });

  it('filters by price range', async () => {
    const res = await request(app)
      .get('/api/v1/cues?priceMin=300&priceMax=500')
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(
      res.body.data.items.every(
        (c: { priceUsd: number }) => c.priceUsd >= 300 && c.priceUsd <= 500,
      ),
    ).toBe(true);
  });

  it('searches brand/model by q', async () => {
    const res = await request(app).get('/api/v1/cues?q=Predator').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].brand).toBe('Predator');
  });

  it('validates query params', async () => {
    const res = await request(app).get('/api/v1/cues?material=bogus').set(auth());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/cues', () => {
  it('creates a cue', async () => {
    const res = await createCue({ brand: 'Fresh Brand', model: 'Fresh Model' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      brand: 'Fresh Brand',
      model: 'Fresh Model',
      material: 'maple',
      condition: 'new',
      status: 'available',
      createdBy: demoUser.id,
      deletedAt: null,
    });
    expect(res.body.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('validates the body', async () => {
    const res = await request(app).post('/api/v1/cues').set(auth()).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/cues/:id', () => {
  it('returns a cue by id', async () => {
    const created = await createCue({ brand: 'Get me' });

    const res = await request(app).get(`/api/v1/cues/${created.body.data.id}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.brand).toBe('Get me');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app)
      .get('/api/v1/cues/00000000-0000-4000-8000-000000000000')
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/v1/cues/:id', () => {
  it('updates a cue', async () => {
    const created = await createCue({ brand: 'Before update' });

    const res = await request(app)
      .patch(`/api/v1/cues/${created.body.data.id}`)
      .set(auth())
      .send({ status: 'reserved' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('reserved');
    expect(res.body.data.brand).toBe('Before update');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app)
      .patch('/api/v1/cues/00000000-0000-4000-8000-000000000000')
      .set(auth())
      .send({ brand: 'nope' });

    expect(res.status).toBe(404);
  });

  it('validates the body', async () => {
    const created = await createCue({ brand: 'Validate me' });

    const res = await request(app)
      .patch(`/api/v1/cues/${created.body.data.id}`)
      .set(auth())
      .send({ status: 'bogus' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/v1/cues/:id', () => {
  it('soft-deletes a cue with 204', async () => {
    const created = await createCue({ brand: 'Delete me' });

    const res = await request(app).delete(`/api/v1/cues/${created.body.data.id}`).set(auth());

    expect(res.status).toBe(204);
  });

  it('returns 404 for an already-deleted cue', async () => {
    const created = await createCue({ brand: 'Delete me twice' });

    await request(app).delete(`/api/v1/cues/${created.body.data.id}`).set(auth());
    const res = await request(app).delete(`/api/v1/cues/${created.body.data.id}`).set(auth());

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('does not leak deleted cues to the list', async () => {
    const created = await createCue({ brand: 'Should vanish' });

    await request(app).delete(`/api/v1/cues/${created.body.data.id}`).set(auth());

    const res = await request(app).get('/api/v1/cues').set(auth());
    const ids = res.body.data.items.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(created.body.data.id);
  });
});
