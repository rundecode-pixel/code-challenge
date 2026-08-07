# Problem 5 — Pool Cues API

A production-shaped Express + TypeScript REST API for a pool-cue inventory:
JWT authentication, paginated/filtered listing, and soft-delete CRUD backed by
PostgreSQL via TypeORM.

## Stack

| Layer      | Choice                                  |
| ---------- | --------------------------------------- |
| Runtime    | Node.js ≥ 20 (ESM, TypeScript strict)   |
| HTTP       | Express 4.21                           |
| ORM        | TypeORM 0.3 (decorators) + PostgreSQL 16 |
| Auth       | JWT (HS256, 24h) + bcrypt password hash |
| Validation | Zod schemas on every input              |
| Security   | helmet, CORS, JSON body size limit      |
| Tests      | Vitest + Supertest (integration)        |

## Quickstart

```bash
npm install
cp .env.example .env

# 1. Postgres
docker compose up -d db

# 2. Schema + seed in one shot (drops, migrates, seeds)
npm run p5:db:reset

# 3. Run
npm run p5:dev
```

Server listens on `http://localhost:4000`.

### Seeded users

All share the password `P@ssword123`:

| Email                 | Role in the demo data              |
| --------------------- | ---------------------------------- |
| `demo@example.com`    | reviewer login; owns the 5 cues    |
| `alice@example.com`   | can log in like any user           |
| `bob@example.com`     | can log in like any user           |

## Layout

```
problem5/
├── data-source.ts      # TypeORM DataSource (entities + migrations)
├── migrations/         # SQL migrations (hand-written, versioned)
├── seed.ts             # idempotent seed (runs standalone via npm script)
├── reset.ts            # drop schema → migrate → seed
└── src/
    ├── config/         # env validation + JWT helpers
    ├── common/         # db.ts (DataSource singleton), errors, async-handler
    ├── middleware/     # authenticate, error-handler, not-found
    ├── features/
    │   ├── auth/       # schema → service → routes (+ user.entity)
    │   └── cues/       # schema → repository → service → routes (+ cue.entity)
    ├── app.ts          # createApp() factory (port-free, testable)
    └── server.ts       # boot script
```

Every feature is a vertical slice: Zod schema for the wire boundary, an entity
with TypeORM decorators, and a service over a repository that owns every
query — including the central `deletedAt: IsNull()` predicate so a
soft-deleted cue can never resurface.

## API walkthrough (curl)

```bash
BASE=http://localhost:4000

# 1. Login → sets the httpOnly access_token cookie (saved to cookies.txt);
#    the body still carries data.token/data.user for non-browser clients
curl -s -c cookies.txt $BASE/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"P@ssword123"}'
# → {"data":{"token":"eyJ...","user":{"id":"...","email":"demo@example.com","name":"Demo User"}}}

# 2. Profile of the current user — the cookie alone is enough
curl -s -b cookies.txt $BASE/api/v1/auth/me
# → {"data":{"id":"...","email":"demo@example.com","name":"Demo User"}}

# 3. List cues → { data: { items, pagination } }
curl -s -b cookies.txt "$BASE/api/v1/cues?page=1&pageSize=2"

# 4. Filters: status | condition | material | priceMin/priceMax | q
curl -s -b cookies.txt "$BASE/api/v1/cues?status=available"
curl -s -b cookies.txt "$BASE/api/v1/cues?condition=new"
curl -s -b cookies.txt "$BASE/api/v1/cues?material=carbon"
curl -s -b cookies.txt "$BASE/api/v1/cues?priceMin=300&priceMax=500"
curl -s -b cookies.txt "$BASE/api/v1/cues?q=Predator"

# 5. Create
curl -s -b cookies.txt $BASE/api/v1/cues \
  -H 'Content-Type: application/json' \
  -d '{"brand":"Predator","model":"P3","material":"carbon","tipSizeMm":12.4,"weightOz":19,"lengthIn":58,"priceUsd":899.99,"condition":"new"}'

# 6. Get / Update / Soft-delete
curl -s -b cookies.txt $BASE/api/v1/cues/<id>
curl -s -b cookies.txt -X PATCH $BASE/api/v1/cues/<id> \
  -H 'Content-Type: application/json' -d '{"status":"reserved"}'
curl -s -b cookies.txt -X DELETE $BASE/api/v1/cues/<id>   # → 204

# 7. Logout — clears the access_token cookie (idempotent, no auth required)
curl -s -b cookies.txt -X POST $BASE/api/v1/auth/logout   # → 204
curl -s -b cookies.txt $BASE/api/v1/auth/me               # → 401 (cookie gone)

# 8. Meta endpoints
curl -s $BASE/            # API info (lists the /api/v1 routes)
curl -s $BASE/api         # available API versions (v1)
curl -s $BASE/health      # { ok, service, timestamp }
```

## API reference

All `/api/v1/*` routes accept the access token either from the httpOnly
`access_token` cookie (browser flow, set on login) or from an
`Authorization: Bearer <token>` header (API-client flow).

The cookie is `HttpOnly` (invisible to JavaScript), `SameSite=Lax` (blocks
cross-site writes), `Secure` when `NODE_ENV=production`, and its lifetime is
locked to the JWT's 24h TTL.

### POST `/api/v1/auth/login`

Request:

```json
{ "email": "demo@example.com", "password": "P@ssword123" }
```

Response (also sets the `access_token` cookie):

```json
{
  "data": {
    "token": "eyJ...",
    "user": { "id": "...", "email": "demo@example.com", "name": "Demo User" }
  }
}
```

### GET `/api/v1/auth/me`

Returns the profile encoded in the access token (cookie or bearer), resolved
against the DB for the current name.

### POST `/api/v1/auth/logout`

Clears the `access_token` cookie. The JWT itself is stateless and simply
expires, so there is nothing to revoke server-side. Returns `204`; requires no
authentication and is safe to call repeatedly.

### Cues

| Method | Path               | Body / Query                                                       |
| ------ | ------------------ | ------------------------------------------------------------------ |
| GET    | `/api/v1/cues`        | `page`, `pageSize` (≤ 100), `status`, `condition`, `material`, `priceMin`, `priceMax`, `q` |
| POST   | `/api/v1/cues`        | `brand`, `model`, `material`, `tipSizeMm`, `weightOz`, `lengthIn`, `priceUsd`, `condition`, `status?` |
| GET    | `/api/v1/cues/:id`    | —                                                                  |
| PATCH  | `/api/v1/cues/:id`    | any subset of the POST fields (partial update)                     |
| DELETE | `/api/v1/cues/:id`    | — (soft delete; 204; 404 if already deleted)                       |

Enum values validated by Zod: `material` ∈ `ash | maple | carbon`,
`condition` ∈ `new | used`, `status` ∈ `available | reserved | in_restoration | retired`.

Cue shape (camelCase on the wire; `deletedAt` is exposed and `null` while
active; money/measurements are plain JSON numbers):

```json
{
  "id": "uuid",
  "brand": "Predator",
  "model": "P3",
  "material": "carbon",
  "tipSizeMm": 12.4,
  "weightOz": 19.0,
  "lengthIn": 58,
  "priceUsd": 899.99,
  "condition": "new",
  "status": "available",
  "createdBy": "uuid",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "deletedAt": null
}
```

`GET /api/v1/cues` list response:

```json
{
  "data": {
    "items": [ /* cue objects */ ],
    "pagination": {
      "page": 1,
      "pageSize": 2,
      "total": 5,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Errors

Uniform error contract — the body is `{ "error": { "code", "message", "details?" } }`:

| Code                  | Status | Meaning                                    |
| --------------------- | ------ | ------------------------------------------ |
| `VALIDATION_ERROR`    | 400    | Zod rejected the input (or malformed JSON) |
| `UNAUTHORIZED`        | 401    | missing/malformed/expired/invalid token    |
| `INVALID_CREDENTIALS` | 401    | wrong email or password (same text for both) |
| `NOT_FOUND`           | 404    | cue does not exist or is soft-deleted      |
| `INTERNAL_ERROR`      | 500    | unexpected failure                         |

## Tests

```bash
npm run p5:db:reset   # clean slate before the suite
npm run test:p5
```

34 integration tests:

- **Auth (15)**: valid login + JWT payload in cookies, generic credential errors for
  wrong password AND unknown email, body validation, malformed JSON → 400,
  `/me` profile, and missing/expired/forged tokens → 401.
- **Cues (19)**: list + rich pagination, every filter (status, condition,
  material, price range, `q`), create/get/patch, body validation, soft delete
  with 204, 404-on-second-delete, and no leakage of deleted cues.

## Design notes

- **Soft delete**: `DELETE` stamps `deletedAt` and returns `204`. Every read
  path filters `deletedAt: IsNull()` at the repository level, so a deleted
  cue is invisible everywhere; a second delete of the same cue is a `404`,
  consistent with `GET`/`PATCH` on deleted rows.
- **Filtering is index-backed**: composite `(created_by, deleted_at)` for the
  owner + non-deleted scan, plus `status`, `condition`, `brand`, and
  `price_usd` indexes.
- **Auth**: when the email is unknown, bcrypt compare still runs against a
  dummy hash so response time doesn't reveal whether the account exists; the
  login error is identical for unknown email vs wrong password (no account
  enumeration). Tokens are HS256 with 24h expiry, verified on every request.
- **Atomic updates**: `UPDATE ... WHERE id AND created_by AND deleted_at IS
  NULL` avoids the read-then-write race that could resurrect a soft-deleted
  cue; zero affected rows becomes a `404`.
- **No ID-existence oracle**: unknown ids, foreign-owned rows, and deleted
  rows all produce the same `404`.
- **TypeORM numbers**: Postgres `numeric` columns come back as strings; a
  value transformer converts them to JS numbers so the wire DTO stays plain
  JSON.
- **Factory pattern**: `createApp()` builds a port-free Express instance;
  `server.ts` only connects the DataSource and wires the listener.
  Integration tests hit the factory directly.

## Acceptance criteria

- [x] `POST /api/v1/auth/login` returns a JWT for seeded credentials
- [x] `GET /api/v1/auth/me` resolves the token to a profile
- [x] `GET /api/v1/cues` (auth) paginated list with filters + rich pagination
- [x] `POST /api/v1/cues` create with Zod validation
- [x] `GET/PATCH/DELETE /api/v1/cues/:id` with 404 for missing/deleted
- [x] Soft delete: invisible after deletion, 204 on delete, 404 on re-delete
- [x] Uniform error contract, helmet + CORS + body size limit
- [x] `npm run typecheck` clean, 34/34 integration tests green
