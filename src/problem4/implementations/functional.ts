/**
 * sum_to_n_b — functional reduction over a generated range.
 *
 * Time complexity:  O(n) — one addition per element.
 * Space complexity: O(n) — `Array.from` materialises the full [1..n] range
 *                   before reducing. Allocates roughly 8·n bytes for the
 *                   underlying numeric array.
 *
 * Tradeoffs: idiomatic, declarative JS — reads as "the sum of [1..n]" with
 * no manual index arithmetic. Pays for that clarity with linear allocation,
 * which makes it the slowest of the three for very large n (memory pressure
 * + GC). Useful when range generation and aggregation belong together
 * conceptually (e.g. when chaining .map().filter().reduce() pipelines).
 */
export const sum_to_n_b = (n: number): number => {
  if (n <= 0) return 0;
  return Array.from({ length: n }, (_, i) => i + 1).reduce(
    (acc, v) => acc + v,
    0,
  );
};
