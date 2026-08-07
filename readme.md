# Code Challenge — Solution

Monorepo-style TypeScript solution for the backend code-challenge (problems 4–6).

| Problem | Topic | Where |
| ------- | ----- | ----- |
| 4 | Three ways to sum to `n` | [`src/problem4/`](./src/problem4) |
| 5 | Pool Cues API (Express + TypeORM) | [`src/problem5/`](./src/problem5) |
| 6 | Live scoreboard architecture (design) | [`src/problem6/`](./src/problem6) |

## Quickstart

Requires Node.js ≥ 20 and Docker.

```bash
npm install
cp .env.example .env

# Postgres (16) in Docker
docker compose up -d db

# Problem 5: schema + seed in one shot (drops, migrates, seeds)
npm run p5:db:reset

# Run the API (http://localhost:4000)
npm run p5:dev
```

## Scripts

| Script | What it does |
| ------ | ------------ |
| `typecheck` | `tsc --noEmit` over `src/` |
| `test` | full Vitest run (P4 + P5) |
| `test:p4` | P4 matrix tests |
| `test:p5` | P5 integration tests (Vitest + Supertest) |
| `p5:dev` | run the API with watch mode |
| `p5:start` | run the API once |
| `p5:db:migrate` | apply pending TypeORM migrations |
| `p5:db:migrate:dev` | generate a new migration from entity changes |
| `p5:db:seed` | idempotent seed (users + 5 cues) |
| `p5:db:reset` | drop schema → migrate → seed |

## Problems

- **Problem 4** — pure functions, no runtime needed. See its [README](./src/problem4/README.md).
- **Problem 5** — production-shaped REST API: JWT auth (httpOnly cookie + Bearer fallback),
  paginated/filtered CRUD with soft delete, Zod validation, Postgres via TypeORM.
  See its [README](./src/problem5/README.md).
- **Problem 6** — design-only: architecture docs, mermaid diagrams, and an
  implementation plan for a live scoreboard. See its [README](./src/problem6/README.md)
  and [docs](./src/problem6/docs/DESIGN.md).

## Config

- `docker-compose.yml` — Postgres 16 (service `db`, port `5432`, database `cues`).
- `.env` — `DATABASE_URL`, `JWT_SECRET` (≥ 32 chars), `PORT`, `NODE_ENV`.
- `vitest.config.ts` — forks pool with a `tsx` loader so TypeORM migration files
  load inside vitest workers.
