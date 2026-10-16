export interface MusicContactCandidate {
  id: string;
  overlap: number;
}

/** Contact ends on physical separation, never on an elapsed-time cooldown. */
export class MusicContactEpisodes {
  private readonly active = new Set<string>();
  private serial = 0;

  constructor(private readonly prefix: string) {}

  isActive(id: string): boolean { return this.active.has(id); }

  releaseSeparated(stillTouching: ReadonlySet<string>): void {
    for (const id of this.active) {
      if (!stillTouching.has(id)) this.active.delete(id);
    }
  }

  accept(candidates: readonly MusicContactCandidate[]): { id: string; episodeId: string } | null {
    return this.acceptDetailed(candidates).contact;
  }

  acceptDetailed(candidates: readonly MusicContactCandidate[]): {
    contact: { id: string; episodeId: string } | null;
    ambiguous: boolean;
  } {
    const unique = new Map<string, MusicContactCandidate>();
    for (const candidate of candidates) {
      if (!this.active.has(candidate.id)) unique.set(candidate.id, candidate);
    }
    const ranked = [...unique.values()].sort((a, b) => b.overlap - a.overlap);
    // Two equally supported contacts must not fill two learning slots.
    if (!ranked.length) return { contact: null, ambiguous: false };
    if (ranked[1] && Math.abs(ranked[0].overlap - ranked[1].overlap) < 0.5) {
      for (const candidate of candidates) this.active.add(candidate.id);
      return { contact: null, ambiguous: true };
    }
    for (const candidate of candidates) this.active.add(candidate.id);
    this.serial += 1;
    return { contact: { id: ranked[0].id, episodeId: `${this.prefix}:${this.serial}:${ranked[0].id}` }, ambiguous: false };
  }

  clear(): void {
    this.active.clear();
  }
}
