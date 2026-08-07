# Problem 4 — Three ways to sum to n

> Provide 3 unique implementations of `sum_to_n(n: number): number` in TypeScript. Comment on the complexity or efficiency of each.

## Files

- [`implementations/`](./implementations) — one file per paradigm:
  - [`loop.ts`](./implementations/loop.ts) — `sum_to_n_a` (imperative).
  - [`functional.ts`](./implementations/functional.ts) — `sum_to_n_b` (functional reduce).
  - [`formula.ts`](./implementations/formula.ts) — `sum_to_n_c` (closed form).
  - [`index.ts`](./implementations/index.ts) — barrel that re-exports the three mandated names.
- [`sumToN.test.ts`](./sumToN.test.ts) — Vitest matrix test (27 cases).

## Approach summary

Three deliberately different paradigms, so the comparison is more than syntactic noise:

| Function | Paradigm | Time | Space | Notes |
|---|---|---|---|---|
| `sum_to_n_a` | imperative loop | **O(n)** | **O(1)** | Plain `for` loop with an accumulator. Easiest to read, no allocations, no math gotchas. |
| `sum_to_n_b` | functional reduction | **O(n)** | **O(n)** | `Array.from({ length: n }, (_, i) => i + 1).reduce(...)`. Materialises the [1..n] range, then folds. Idiomatic JS, but pays for clarity with linear allocation. |
| `sum_to_n_c` | closed-form (Gauss) | **O(1)** | **O(1)** | `n * (n + 1) / 2`. Exact while `n × (n+1) ≤ Number.MAX_SAFE_INTEGER` (≈ n ≤ 94_906); the brief's "result < MAX_SAFE_INTEGER" guarantee keeps us inside that range. |

All three return `0` for `n ≤ 0` — documented choice, since the brief says "any integer" but doesn't define the meaning of a negative summand.

## Trade-offs at a glance

- For small `n` (say n ≤ 1_000), all three are visually instant. Pick on **clarity**, not perf.
- For medium `n` (10⁴–10⁶), the formula and the loop are essentially tied; the reduce variant is measurably slower because of the allocation.
- For huge `n` approaching the safe-integer ceiling, only the formula stays exact in O(1); the others remain correct but linear-time.
- The formula has the smallest cognitive load **for someone who knows the identity** and the largest **for someone who doesn't** — readability is reader-relative.
- The reduce variant is the easiest to extend to "sum of a filtered range" (just chain `.filter()` before `.reduce()`); the loop and formula don't compose like that.

## Running

```bash
# from repo root
npm install
npm run test:p4             # 27 cases, ~150ms
npm run typecheck           # full repo TS check
```

## Test report

```
 ✓ src/problem4/sumToN.test.ts (27 tests) 3ms
   ✓ sum_to_n_a > for n=0 returns 0
   ✓ sum_to_n_a > for n=1 returns 1
   ✓ sum_to_n_a > for n=5 returns 15
   ✓ sum_to_n_a > for n=10 returns 55
   ✓ sum_to_n_a > for n=100 returns 5050
   ✓ sum_to_n_a > for n=10000 returns 50005000
   ✓ sum_to_n_a > for n=-3 returns 0
   ✓ sum_to_n_b > for n=0 returns 0
   ✓ sum_to_n_b > for n=1 returns 1
   ✓ sum_to_n_b > for n=5 returns 15
   ✓ sum_to_n_b > for n=10 returns 55
   ✓ sum_to_n_b > for n=100 returns 5050
   ✓ sum_to_n_b > for n=10000 returns 50005000
   ✓ sum_to_n_b > for n=-3 returns 0
   ✓ sum_to_n_c > for n=0 returns 0
   ✓ sum_to_n_c > for n=1 returns 1
   ✓ sum_to_n_c > for n=5 returns 15
   ✓ sum_to_n_c > for n=10 returns 55
   ✓ sum_to_n_c > for n=100 returns 5050
   ✓ sum_to_n_c > for n=10000 returns 50005000
   ✓ sum_to_n_c > for n=-3 returns 0
   ✓ cross-implementation consistency > all three implementations agree for n=0
   ✓ cross-implementation consistency > all three implementations agree for n=1
   ✓ cross-implementation consistency > all three implementations agree for n=2
   ✓ cross-implementation consistency > all three implementations agree for n=50
   ✓ cross-implementation consistency > all three implementations agree for n=1000
   ✓ cross-implementation consistency > all three implementations agree for n=9999

 Test Files  1 passed (1)
      Tests  27 passed (27)
   Duration  ~155ms
```

7 input values × 3 implementations = 21 happy/edge cases, plus 6 cross-implementation consistency checks = 27 total. All pass.

## Acceptance criteria status

- [x] **AC-P4-1** — `implementations/index.ts` exports the three named functions matching the brief's signature.
- [x] **AC-P4-2** — All three return identical correct sums for `n ∈ {0, 1, 5, 10, 100, 10_000}` (matrix test).
- [x] **AC-P4-3** — All three return `0` for `n ≤ 0` (matrix test covers `n=-3`).
- [x] **AC-P4-4** — Genuinely different algorithms: imperative loop / functional reduce / closed-form formula.
- [x] **AC-P4-5** — JSDoc on each function documents time + space complexity.
- [x] **AC-P4-6** — Vitest covers happy path + boundaries + cross-impl consistency. 27 cases, all green.
- [x] **AC-P4-7** — This README covers approach, complexity table, trade-offs, test report.
