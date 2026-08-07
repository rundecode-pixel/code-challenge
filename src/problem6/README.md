# Problem 6 — Live Scoreboard Architecture

## Problem statement

We have a website with a scoreboard showing the top 10 users. A user performs
an action ("score event") and on completion the frontend calls a `POST` API to
update their score. We must define and design the architecture for this
feature so that:

- the **top 10 leaderboard updates live** as scores change (no page reload),
- the API is **not vulnerable to malicious score inflation**,
- the design is **production-ready, scalable, and testable**.

## Solution in one paragraph

Points are **server-decided** (baked into a short-lived signed proof token at
`start`) and can only become real through a **ledger-first settlement**: the
`complete` call inserts an immutable `score_events` row whose primary key is
the server-generated `action_id` — the one-shot anti-replay guard — and
increments the user's `scores` row **in the same Postgres transaction**. A
replayed `action_id` violates the primary key and is rejected with `409`.
Redis is deliberately demoted to a **disposable projection and fan-out layer**
(ZSET rankings, pub/sub deltas, SSE history) that is rebuilt from the ledger —
it holds no authoritative state and can never lose or double-credit points.

## Why this design

| Property | How it is achieved |
| -------- | ------------------ |
| No client-minted points | `start` computes points server-side and signs them into the token |
| No replay credit | `action_id` primary key in the ledger — atomic with the credit |
| No cross-store race | the guard and the credit are one Postgres transaction |
| Live updates | Redis pub/sub → SSE fan-out (snapshot-first, Last-Event-ID replay) |
| Redis loss is survivable | rebuild + reconciliation replay the ledger into the ZSET |
| Audit trail for free | `score_events` is both the guard and the immutable record |

## Requirements summary

- **F1** top 10 leaderboard, live · **F2** completing an action updates total ·
  **F3** real-time push, no polling on every render · **F4** reconnects neither
  miss updates nor double-count.
- **N1** no client-controlled inflation · **N2** no phantom scores ·
  **N3** end-to-end propagation well under a second ·
  **N4** 10k concurrent clients, 1k score events/s peak, 1M users.

## Documents

| Document | Contents |
| -------- | -------- |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | Core anti-cheat mechanism, architecture, API contract, data model, SSE protocol, failure handling, scale considerations, threat model, trade-offs |
| [`docs/DIAGRAMS.md`](./docs/DIAGRAMS.md) | ER diagram, deployment topology, testing strategy (unit / integration / adversarial / load) |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | Ticket breakdown T01–T09 with milestones |
| [`todo/`](./todo) | One file per ticket with acceptance criteria |

## Status

Specification complete. The design has been reviewed against the problem
statement and the candidate submissions; tickets T01–T09 are ready to
implement in order.
