# Problem 6 — Implementation Plan

Nine tickets, ordered so every milestone leaves the system runnable. Each
ticket has a detail file in [`../todo`](../todo) with acceptance criteria.

## Tickets

| Ticket | Deliverable | Detail |
| ------ | ----------- | ------ |
| T01 | Postgres schema (`score_events` ledger + `scores`) + migrations | [`../todo/T01.md`](../todo/T01.md) |
| T02 | Proof-token issuance (`start`): scoring registry, sign, inflight cap | [`../todo/T02.md`](../todo/T02.md) |
| T03 | Redis projection layer: ZSET, pub/sub, SSE history, rebuild + reconciliation sweep | [`../todo/T03.md`](../todo/T03.md) |
| T04 | Settlement (`complete`): verify → ledger-first transaction → publish | [`../todo/T04.md`](../todo/T04.md) |
| T05 | Leaderboard read API (`GET /api/leaderboard`) | [`../todo/T05.md`](../todo/T05.md) |
| T06 | SSE stream endpoint + fan-out + Last-Event-ID replay | [`../todo/T06.md`](../todo/T06.md) |
| T07 | Client SDK (start/complete/SSE/polling fallback) | [`../todo/T07.md`](../todo/T07.md) |
| T08 | Security tests: forgery, replay, race, flood | [`../todo/T08.md`](../todo/T08.md) |
| T09 | Deployment: compose + env + observability + load test + partitioning | [`../todo/T09.md`](../todo/T09.md) |

## Milestones

| Milestone | Tickets | Runnable state |
| --------- | ------- | -------------- |
| M1 — Data + trust boundary | T01, T02 | `start` issues unforgeable, server-decided proof tokens against a real schema |
| M2 — The settlement | T03, T04 | `complete` credits points exactly once (ledger guard) and publishes deltas |
| M3 — Live scoreboard | T05, T06 | Leaderboard renders instantly (snapshot) and updates live (SSE) |
| M4 — Client + hardening | T07, T08 | SDK ships; adversarial suite gates the whole feature |
| M5 — Operations | T09 | Full stack in compose, observable, load-tested |

## Cross-cutting rules

- Every endpoint validates input with Zod at the boundary (same convention as
  the Problem 5 service).
- No `any` / `as any` / `@ts-ignore` — the repo runs `tsc --noEmit` clean.
- The settlement transaction is the **only** code path that writes
  `score_events` or mutates `scores`.
- Redis modules consume interfaces, never the raw client — unit tests inject
  fakes.
