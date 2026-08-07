/**
 * sum_to_n_c — closed-form Gauss formula n(n+1)/2.
 *
 * Time complexity:  O(1).
 * Space complexity: O(1).
 *
 * Tradeoffs: dramatically faster than the other two for large n, but only
 * works because the reader recognises the identity. Precision is exact
 * while n × (n + 1) ≤ Number.MAX_SAFE_INTEGER (n ≤ ~94_906); past that the
 * IEEE-754 representation silently loses precision. The brief's safety
 * guarantee on the input puts us well inside that range.
 */
export const sum_to_n_c = (n: number): number =>
  n <= 0 ? 0 : (n * (n + 1)) / 2;
