let idCounter = 0;

export function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function createStableId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(2, '0')}`;
}
