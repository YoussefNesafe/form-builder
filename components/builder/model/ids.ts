let counter = 0;

/**
 * Monotonic node id. Avoids Date.now()/Math.random() so ordering is
 * deterministic within a session (and test runs are reproducible).
 */
export function newId(): string {
  counter += 1;
  return `n${counter}`;
}

/** Test hook: reset the id counter so ids are predictable per test. */
export function resetIds(): void {
  counter = 0;
}
