let counter = 0;

export function newId(): string {
  counter += 1;
  return `n${counter}`;
}

export function resetIds(): void {
  counter = 0;
}

export function syncCounterFromIds(ids: Iterable<string>): void {
  for (const id of ids) {
    const match = /^n(\d+)$/.exec(id);
    if (match) counter = Math.max(counter, Number(match[1]));
  }
}
