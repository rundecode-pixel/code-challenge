/**
 * sum_to_n_a — iterative loop.
 *
 * Time complexity:  O(n) — one addition per integer in [1, n].
 * Space complexity: O(1) — single accumulator.
 *
 * Tradeoffs: simplest to read, no stack risk, no math gotchas. The default
 * choice when readability beats cleverness.
 */
export const sum_to_n_a = (n: number): number => {
  if (n <= 0) return 0;
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
};
