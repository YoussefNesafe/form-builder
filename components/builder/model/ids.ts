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

/**
 * Advance the counter past every `n<number>` id in `ids`. Called on persist
 * rehydration so a fresh module (counter = 0) never re-issues an id that
 * already exists in the restored tree.
 */
export function syncCounterFromIds(ids: Iterable<string>): void {
  for (const id of ids) {
    const match = /^n(\d+)$/.exec(id);
    if (match) counter = Math.max(counter, Number(match[1]));
  }
}
